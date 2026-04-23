from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import date, datetime
from typing import List, Optional

from app.database import get_db
from app.auth import get_current_admin

from app.models.job_order import JobOrder, JobOrderStatus
from app.models.job_order_additional_charges import SubletWorkType
from app.models.job_order_sublet_orders import JobOrderSubletOrder, JobOrderSubletOrderStatus
from app.schemas.job_order_sublet_orders import (
    JobOrderSubletOrderCreate,
    JobOrderSubletOrderUpdate,
    JobOrderSubletOrderDecision,
    JobOrderSubletOrderReceive,
    JobOrderSubletOrderResponse,
)

router = APIRouter()


def _clean_text(text: Optional[str]) -> Optional[str]:
    if text is None:
        return None
    value = str(text).strip()
    return value or None


def _generate_sublet_order_number(db: Session) -> str:
    today = date.today()
    date_part = today.strftime("%Y%m%d")

    last = (
        db.query(JobOrderSubletOrder)
        .filter(JobOrderSubletOrder.sublet_order_number.like(f"SO-{date_part}-%"))
        .order_by(JobOrderSubletOrder.sublet_order_id.desc())
        .first()
    )

    if last and last.sublet_order_number:
        try:
            seq = int(last.sublet_order_number.split("-")[-1]) + 1
        except (ValueError, IndexError):
            seq = 1
    else:
        seq = 1

    return f"SO-{date_part}-{seq:04d}"


def _ensure_job_open(job: JobOrder):
    if getattr(job, "is_blocked", False):
        raise HTTPException(status_code=400, detail="Job order is blocked")
    if job.status in (JobOrderStatus.CLOSED, JobOrderStatus.CANCELLED):
        raise HTTPException(status_code=400, detail=f"Cannot process sublet orders for a {job.status} job order")


def _get_employee_id(current_user) -> Optional[int]:
    employee_id = getattr(current_user, "employee_id", None)
    return int(employee_id) if employee_id is not None else None


@router.post("/{job_order_id}/sublet-orders", response_model=JobOrderSubletOrderResponse)
def create_sublet_order(
    job_order_id: int,
    payload: JobOrderSubletOrderCreate,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    job = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job order not found")

    _ensure_job_open(job)

    if payload.quantity is None or float(payload.quantity) <= 0:
        raise HTTPException(status_code=400, detail="quantity must be > 0")

    work_type = db.query(SubletWorkType).filter(SubletWorkType.sublet_work_type_id == payload.sublet_work_type_id).first()
    if not work_type:
        raise HTTPException(status_code=404, detail="Sublet work type not found")

    requested_by_employee_id = payload.requested_by_employee_id
    if requested_by_employee_id is None:
        requested_by_employee_id = _get_employee_id(current_user)

    row = JobOrderSubletOrder(
        sublet_order_number=_generate_sublet_order_number(db),
        job_order_id=job_order_id,
        sublet_work_type_id=work_type.sublet_work_type_id,
        supplier_id=work_type.supplier_id,
        quantity=payload.quantity,
        unit_price=work_type.unit_price,
        unit_cost=work_type.unit_cost,
        remark=_clean_text(payload.remark),
        status=JobOrderSubletOrderStatus.DRAFT,
        requested_by_employee_id=requested_by_employee_id,
    )

    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/{job_order_id}/sublet-orders", response_model=List[JobOrderSubletOrderResponse])
def list_job_sublet_orders(
    job_order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    return (
        db.query(JobOrderSubletOrder)
        .filter(JobOrderSubletOrder.job_order_id == job_order_id)
        .order_by(JobOrderSubletOrder.created_at.desc())
        .all()
    )


@router.put("/sublet-orders/{sublet_order_id}", response_model=JobOrderSubletOrderResponse)
def update_sublet_order(
    sublet_order_id: int,
    payload: JobOrderSubletOrderUpdate,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    row = db.query(JobOrderSubletOrder).filter(JobOrderSubletOrder.sublet_order_id == sublet_order_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Sublet order not found")

    if row.status != JobOrderSubletOrderStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only Draft sublet orders can be edited")

    if payload.quantity is None or float(payload.quantity) <= 0:
        raise HTTPException(status_code=400, detail="quantity must be > 0")

    work_type = db.query(SubletWorkType).filter(SubletWorkType.sublet_work_type_id == payload.sublet_work_type_id).first()
    if not work_type:
        raise HTTPException(status_code=404, detail="Sublet work type not found")

    row.sublet_work_type_id = work_type.sublet_work_type_id
    row.supplier_id = work_type.supplier_id
    row.quantity = payload.quantity
    row.unit_price = work_type.unit_price
    row.unit_cost = work_type.unit_cost
    row.remark = _clean_text(payload.remark)

    db.commit()
    db.refresh(row)
    return row


@router.post("/{job_order_id}/sublet-orders/finish", response_model=List[JobOrderSubletOrderResponse])
def finish_sublet_orders_for_job(
    job_order_id: int,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    job = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job order not found")

    _ensure_job_open(job)

    rows = (
        db.query(JobOrderSubletOrder)
        .filter(
            JobOrderSubletOrder.job_order_id == job_order_id,
            JobOrderSubletOrder.status == JobOrderSubletOrderStatus.DRAFT,
        )
        .order_by(JobOrderSubletOrder.created_at.asc())
        .all()
    )

    if not rows:
        raise HTTPException(status_code=400, detail="No Draft sublet orders to finish")

    now = datetime.utcnow()
    for row in rows:
        row.status = JobOrderSubletOrderStatus.FINALIZED
        row.finalized_at = now
        row.decided_at = None
        row.decided_by_employee_id = None
        row.decision_remark = None

    db.commit()

    return (
        db.query(JobOrderSubletOrder)
        .filter(JobOrderSubletOrder.job_order_id == job_order_id)
        .order_by(JobOrderSubletOrder.created_at.desc())
        .all()
    )


@router.get("/sublet-orders", response_model=List[JobOrderSubletOrderResponse])
def list_sublet_orders(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    q = db.query(JobOrderSubletOrder).options(joinedload(JobOrderSubletOrder.sublet_work_type)).order_by(JobOrderSubletOrder.created_at.desc())
    if status:
        q = q.filter(JobOrderSubletOrder.status == status)
    return q.all()


@router.get("/sublet-orders/{sublet_order_id}", response_model=JobOrderSubletOrderResponse)
def get_sublet_order(
    sublet_order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = (
        db.query(JobOrderSubletOrder)
        .options(joinedload(JobOrderSubletOrder.sublet_work_type))
        .filter(JobOrderSubletOrder.sublet_order_id == sublet_order_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Sublet order not found")
    return row


def _decide(
    db: Session,
    row: JobOrderSubletOrder,
    next_status: str,
    current_user,
    payload: JobOrderSubletOrderDecision,
) -> JobOrderSubletOrder:
    if row.status != JobOrderSubletOrderStatus.FINALIZED:
        raise HTTPException(status_code=400, detail="Only Finalized sublet orders can be decided")

    row.status = next_status
    row.decided_at = datetime.utcnow()
    row.decided_by_employee_id = _get_employee_id(current_user)
    row.decision_remark = _clean_text(payload.decision_remark)

    db.commit()
    db.refresh(row)
    return row


@router.post("/sublet-orders/{sublet_order_id}/approve", response_model=JobOrderSubletOrderResponse)
def approve_sublet_order(
    sublet_order_id: int,
    payload: JobOrderSubletOrderDecision,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    row = db.query(JobOrderSubletOrder).filter(JobOrderSubletOrder.sublet_order_id == sublet_order_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Sublet order not found")
    return _decide(db, row, JobOrderSubletOrderStatus.APPROVED, current_user, payload)


@router.post("/sublet-orders/{sublet_order_id}/return", response_model=JobOrderSubletOrderResponse)
def return_sublet_order(
    sublet_order_id: int,
    payload: JobOrderSubletOrderDecision,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    row = db.query(JobOrderSubletOrder).filter(JobOrderSubletOrder.sublet_order_id == sublet_order_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Sublet order not found")

    if row.status != JobOrderSubletOrderStatus.FINALIZED:
        raise HTTPException(status_code=400, detail="Only Finalized sublet orders can be returned")

    row.status = JobOrderSubletOrderStatus.DRAFT
    row.finalized_at = None
    row.decided_at = datetime.utcnow()
    row.decided_by_employee_id = _get_employee_id(current_user)
    row.decision_remark = _clean_text(payload.decision_remark)

    db.commit()
    db.refresh(row)
    return row


@router.post("/sublet-orders/{sublet_order_id}/reject", response_model=JobOrderSubletOrderResponse)
def reject_sublet_order(
    sublet_order_id: int,
    payload: JobOrderSubletOrderDecision,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    row = db.query(JobOrderSubletOrder).filter(JobOrderSubletOrder.sublet_order_id == sublet_order_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Sublet order not found")
    return _decide(db, row, JobOrderSubletOrderStatus.REJECTED, current_user, payload)


@router.post("/sublet-orders/{sublet_order_id}/cancel", response_model=JobOrderSubletOrderResponse)
def cancel_sublet_order(
    sublet_order_id: int,
    payload: JobOrderSubletOrderDecision,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    row = db.query(JobOrderSubletOrder).filter(JobOrderSubletOrder.sublet_order_id == sublet_order_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Sublet order not found")

    if row.status not in (JobOrderSubletOrderStatus.DRAFT, JobOrderSubletOrderStatus.FINALIZED):
        raise HTTPException(status_code=400, detail="Cannot cancel this sublet order")

    row.status = JobOrderSubletOrderStatus.CANCELLED
    row.decided_at = datetime.utcnow()
    row.decided_by_employee_id = _get_employee_id(current_user)
    row.decision_remark = _clean_text(payload.decision_remark)

    db.commit()
    db.refresh(row)
    return row


@router.post("/sublet-orders/{sublet_order_id}/receive", response_model=JobOrderSubletOrderResponse)
def receive_sublet_order(
    sublet_order_id: int,
    payload: JobOrderSubletOrderReceive,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    row = db.query(JobOrderSubletOrder).filter(JobOrderSubletOrder.sublet_order_id == sublet_order_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Sublet order not found")

    if row.status != JobOrderSubletOrderStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Only Approved sublet orders can be received")

    delivery_no = _clean_text(payload.delivery_order_number)
    if not delivery_no:
        raise HTTPException(status_code=400, detail="delivery_order_number is required")

    row.delivery_order_number = delivery_no
    row.received_at = datetime.utcnow()
    row.received_by_employee_id = _get_employee_id(current_user)
    row.status = JobOrderSubletOrderStatus.RECEIVED

    db.commit()
    db.refresh(row)
    return row
