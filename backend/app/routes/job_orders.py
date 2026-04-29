from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import date, datetime
from typing import List, Optional

from app.database import get_db
from app.auth import get_current_admin
from app.models.job_order import (
    JobOrder, JobOrderTask, JobClock,
    JobOrderQCSheet, JobOrderQCItem,
    JobOrderStatus, JobOrderInvoiceType, JobOrderQCStatus,
)
from app.models.job_order_pairing import JobOrderPairing
from app.models.assembly_line_receive import AssemblyLineReceive
from app.models.job_order_inventory import JobOrderItemIssue
from app.models.vehicle import Vehicle
from app.models.customer import Customer
from app.models.service import ServiceType
from app.models.employee import Employee
from app.schemas.job_order import (
    JobOrderCreate, JobOrderUpdate, JobOrderResponse, JobOrderCloseRequest,
    JobOrderCopyRequest,
    JobOrderTaskCreate, JobOrderTaskResponse,
    JobOrderDispatchRequest, JobOrderReceiveRequest,
    JobClockInRequest, JobClockOutRequest, JobClockResponse,
    JobClockOutReasonUpdateRequest,
    JobOrderBlockRequest, JobOrderDeliverRequest,
    JobOrderVrvCancelRequest,
    JobOrderQCUpsertRequest, JobOrderQCSheetResponse,
    FreeTechnicianResponse, ClockedInJobResponse, DispatchedJobResponse, InOutEntryResponse,
    EndOfDayCheckoutRequest, EndOfDayCheckoutResponse,
    JobOrderPairRequest, JobOrderPairingResponse,
    JobOrderSplitRequest, JobOrderSplitResponse,
    AssemblyLineReceiveCreate, AssemblyLineReceiveResponse,
)

router = APIRouter()


def generate_job_order_number(db: Session) -> str:
    today = date.today()
    date_part = today.strftime("%Y%m%d")

    last_job = db.query(JobOrder).filter(
        JobOrder.job_order_number.like(f"JO-{date_part}-%")
    ).order_by(JobOrder.job_order_id.desc()).first()

    if last_job and last_job.job_order_number:
        try:
            seq = int(last_job.job_order_number.split("-")[-1]) + 1
        except (ValueError, IndexError):
            seq = 1
    else:
        seq = 1

    return f"JO-{date_part}-{seq:04d}"


def generate_vrv_number(db: Session) -> str:
    today = date.today()
    date_part = today.strftime("%Y%m%d")

    last = db.query(JobOrder).filter(
        JobOrder.vrv_number.like(f"VRV-{date_part}-%")
    ).order_by(JobOrder.job_order_id.desc()).first()

    if last and last.vrv_number:
        try:
            seq = int(last.vrv_number.split("-")[-1]) + 1
        except (ValueError, IndexError):
            seq = 1
    else:
        seq = 1

    return f"VRV-{date_part}-{seq:04d}"


def _generate_copy_job_order_number(db: Session, original_number: str) -> str:
    base = (original_number or "").strip()
    if not base:
        return generate_job_order_number(db)

    # Try appending a suffix letter like the manual describes.
    # Keep within VARCHAR(30).
    max_len = 30
    trimmed_base = base[:max_len]

    for code in range(ord('A'), ord('Z') + 1):
        candidate = f"{trimmed_base}{chr(code)}"
        if len(candidate) > max_len:
            candidate = f"{trimmed_base[: max_len - 1]}{chr(code)}"
        exists = db.query(JobOrder).filter(JobOrder.job_order_number == candidate).first()
        if not exists:
            return candidate

    # Fallback: generate a fresh number.
    return generate_job_order_number(db)


def _ensure_not_blocked(job_order: JobOrder):
    if getattr(job_order, "is_blocked", False):
        raise HTTPException(status_code=400, detail="Job order is blocked")


def _recalculate_qc_status(sheet: JobOrderQCSheet) -> str:
    if not sheet.items:
        return JobOrderQCStatus.PENDING
    # Explicit fail on any line
    for item in sheet.items:
        if item.passed is False:
            return JobOrderQCStatus.FAILED
    # Mandatory lines must be checked (passed True) to pass overall
    for item in sheet.items:
        mandatory = getattr(item, "is_mandatory", True)
        if mandatory and item.passed is not True:
            return JobOrderQCStatus.PENDING
    return JobOrderQCStatus.PASSED


@router.post("/", response_model=JobOrderResponse)
def create_job_order(
    payload: JobOrderCreate,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == payload.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    if payload.customer_id is not None:
        customer = db.query(Customer).filter(Customer.customer_id == payload.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

    if payload.service_type_id is not None:
        service_type = db.query(ServiceType).filter(ServiceType.service_type_id == payload.service_type_id).first()
        if not service_type:
            raise HTTPException(status_code=404, detail="Service type not found")

    invoice_type = payload.invoice_type or JobOrderInvoiceType.CASH
    if invoice_type not in (JobOrderInvoiceType.CASH, JobOrderInvoiceType.CREDIT, JobOrderInvoiceType.ITM):
        raise HTTPException(status_code=400, detail="Invalid invoice_type (Cash|Credit|ITM)")

    if invoice_type == JobOrderInvoiceType.CREDIT and not payload.customer_id:
        raise HTTPException(status_code=400, detail="customer_id is required for Credit invoice_type")

    job_order = JobOrder(
        job_order_number=generate_job_order_number(db),
        vehicle_id=payload.vehicle_id,
        customer_id=payload.customer_id,
        service_type_id=payload.service_type_id,
        invoice_type=invoice_type,
        status=JobOrderStatus.OPEN,
        mileage_in_km=payload.mileage_in_km,
        remarks=payload.remarks,
        notify_client=payload.notify_client,
        opened_date=payload.opened_date or date.today(),
        expected_finish_date=payload.expected_finish_date,
        opened_by_employee_id=getattr(current_user, "employee_id", None),
    )
    db.add(job_order)
    db.flush()

    if payload.tasks:
        for task in payload.tasks:
            db.add(JobOrderTask(
                job_order_id=job_order.job_order_id,
                task_name=task.task_name,
                task_description=task.task_description,
            ))

    db.commit()
    db.refresh(job_order)

    return job_order


@router.get("/", response_model=List[JobOrderResponse])
def list_job_orders(
    status: Optional[str] = None,
    vehicle_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    job_order_number: Optional[str] = None,
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(JobOrder).options(joinedload(JobOrder.tasks)).order_by(JobOrder.created_at.desc())

    if status:
        query = query.filter(JobOrder.status == status)
    if vehicle_id:
        query = query.filter(JobOrder.vehicle_id == vehicle_id)
    if customer_id:
        query = query.filter(JobOrder.customer_id == customer_id)
    if job_order_number:
        qn = job_order_number.strip()
        if qn:
            query = query.filter(JobOrder.job_order_number == qn)

    return query.limit(limit).all()


@router.post("/assembly-line-receive", response_model=AssemblyLineReceiveResponse)
def save_assembly_line_receive(
    payload: AssemblyLineReceiveCreate,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """HillMaster §8.5 — record which closed jobs were received under a reference / unit."""
    ids = list(dict.fromkeys(payload.job_order_ids or []))
    if not ids:
        raise HTTPException(status_code=400, detail="Select at least one job order")

    jobs = db.query(JobOrder).filter(JobOrder.job_order_id.in_(ids)).all()
    if len(jobs) != len(ids):
        raise HTTPException(status_code=404, detail="One or more job orders not found")

    for j in jobs:
        if j.status != JobOrderStatus.CLOSED:
            raise HTTPException(
                status_code=400,
                detail=f"Job {j.job_order_number} is not closed; assembly receive is for closed jobs only.",
            )

    row = AssemblyLineReceive(
        reference_no=payload.reference_no.strip(),
        receive_date=payload.receive_date,
        requesting_unit=payload.requesting_unit.strip(),
        job_order_ids=ids,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/{job_order_id:int}", response_model=JobOrderResponse)
def get_job_order(job_order_id: int, db: Session = Depends(get_db)):
    job_order = db.query(JobOrder).options(joinedload(JobOrder.tasks)).filter(JobOrder.job_order_id == job_order_id).first()
    if not job_order:
        raise HTTPException(status_code=404, detail="Job order not found")
    return job_order


@router.put("/{job_order_id:int}", response_model=JobOrderResponse)
def update_job_order(
    job_order_id: int,
    payload: JobOrderUpdate,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    job_order = db.query(JobOrder).options(joinedload(JobOrder.tasks)).filter(JobOrder.job_order_id == job_order_id).first()
    if not job_order:
        raise HTTPException(status_code=404, detail="Job order not found")

    _ensure_not_blocked(job_order)

    if job_order.status in (JobOrderStatus.CLOSED, JobOrderStatus.CANCELLED):
        raise HTTPException(status_code=400, detail=f"Cannot update a {job_order.status} job order")

    update_data = payload.dict(exclude_unset=True)

    if "invoice_type" in update_data and update_data["invoice_type"] is not None:
        if update_data["invoice_type"] not in (JobOrderInvoiceType.CASH, JobOrderInvoiceType.CREDIT, JobOrderInvoiceType.ITM):
            raise HTTPException(status_code=400, detail="Invalid invoice_type (Cash|Credit|ITM)")

    if "customer_id" in update_data and update_data["customer_id"] is not None:
        customer = db.query(Customer).filter(Customer.customer_id == update_data["customer_id"]).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

    if "service_type_id" in update_data and update_data["service_type_id"] is not None:
        service_type = db.query(ServiceType).filter(ServiceType.service_type_id == update_data["service_type_id"]).first()
        if not service_type:
            raise HTTPException(status_code=404, detail="Service type not found")

    for field, value in update_data.items():
        setattr(job_order, field, value)

    if job_order.invoice_type == JobOrderInvoiceType.CREDIT and not job_order.customer_id:
        raise HTTPException(status_code=400, detail="customer_id is required for Credit invoice_type")

    db.commit()
    db.refresh(job_order)
    return job_order


@router.post("/{job_order_id}/tasks", response_model=List[JobOrderTaskResponse])
def add_tasks(
    job_order_id: int,
    tasks: List[JobOrderTaskCreate],
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    job_order = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job_order:
        raise HTTPException(status_code=404, detail="Job order not found")

    if job_order.status in (JobOrderStatus.CLOSED, JobOrderStatus.CANCELLED):
        raise HTTPException(status_code=400, detail=f"Cannot add tasks to a {job_order.status} job order")

    created = []
    for task in tasks:
        db_task = JobOrderTask(
            job_order_id=job_order_id,
            task_name=task.task_name,
            task_description=task.task_description,
        )
        db.add(db_task)
        db.flush()
        created.append(db_task)

    db.commit()
    return created


@router.post("/{job_order_id}/copy", response_model=JobOrderResponse)
def copy_job_order(
    job_order_id: int,
    payload: JobOrderCopyRequest,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    original = db.query(JobOrder).options(joinedload(JobOrder.tasks)).filter(JobOrder.job_order_id == job_order_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Job order not found")

    # "Copy invoiced job" in the manual; we treat Closed/Delivered as eligible.
    if original.status != JobOrderStatus.CLOSED and original.delivered_at is None:
        raise HTTPException(status_code=400, detail="Only Closed/Delivered job orders can be copied")

    customer_id = payload.customer_id if payload.customer_id is not None else original.customer_id
    if customer_id is not None:
        customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

    new_job = JobOrder(
        job_order_number=_generate_copy_job_order_number(db, original.job_order_number),
        vehicle_id=original.vehicle_id,
        customer_id=customer_id,
        service_type_id=original.service_type_id,
        invoice_type=original.invoice_type,
        status=JobOrderStatus.OPEN,
        mileage_in_km=original.mileage_in_km,
        remarks=original.remarks,
        opened_date=date.today(),
        expected_finish_date=original.expected_finish_date,
        opened_by_employee_id=getattr(current_user, "employee_id", None),
    )
    db.add(new_job)
    db.flush()

    if payload.copy_tasks and original.tasks:
        for t in original.tasks:
            db.add(JobOrderTask(
                job_order_id=new_job.job_order_id,
                task_name=t.task_name,
                task_description=t.task_description,
                is_active=t.is_active,
            ))

    db.commit()
    db.refresh(new_job)
    return db.query(JobOrder).options(joinedload(JobOrder.tasks)).filter(JobOrder.job_order_id == new_job.job_order_id).first()


@router.post("/{job_order_id}/split", response_model=JobOrderSplitResponse)
def split_job_order(
    job_order_id: int,
    payload: JobOrderSplitRequest,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    original = db.query(JobOrder).options(joinedload(JobOrder.tasks)).filter(JobOrder.job_order_id == job_order_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Job order not found")

    _ensure_not_blocked(original)

    if original.delivered_at is not None:
        raise HTTPException(status_code=400, detail="Cannot split a delivered job order")
    if original.status in (JobOrderStatus.CLOSED, JobOrderStatus.CANCELLED):
        raise HTTPException(status_code=400, detail=f"Cannot split a {original.status} job order")

    task_ids = list(dict.fromkeys(payload.task_ids or []))
    if not task_ids:
        raise HTTPException(status_code=400, detail="task_ids is required")

    active_clocks = db.query(JobClock).filter(
        JobClock.job_order_id == job_order_id,
        JobClock.clock_out_at.is_(None),
    ).count()
    if active_clocks > 0:
        raise HTTPException(status_code=400, detail="Cannot split job order with active clock-ins")

    issue_count = db.query(JobOrderItemIssue).filter(JobOrderItemIssue.job_order_id == job_order_id).count()
    if issue_count > 0:
        raise HTTPException(status_code=400, detail="Cannot split job order with item issues recorded")

    tasks_to_move = db.query(JobOrderTask).filter(
        JobOrderTask.job_order_id == job_order_id,
        JobOrderTask.task_id.in_(task_ids),
    ).all()

    if len(tasks_to_move) != len(task_ids):
        found = {t.task_id for t in tasks_to_move}
        missing = [tid for tid in task_ids if tid not in found]
        raise HTTPException(status_code=404, detail={"message": "Some tasks not found for this job order", "missing_task_ids": missing})

    customer_id = payload.customer_id if payload.customer_id is not None else original.customer_id
    if customer_id is not None:
        customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

    new_job = JobOrder(
        job_order_number=_generate_copy_job_order_number(db, original.job_order_number),
        vehicle_id=original.vehicle_id,
        customer_id=customer_id,
        service_type_id=original.service_type_id,
        invoice_type=original.invoice_type,
        status=JobOrderStatus.OPEN,
        mileage_in_km=original.mileage_in_km,
        remarks=original.remarks,
        opened_date=date.today(),
        expected_finish_date=original.expected_finish_date,
        opened_by_employee_id=getattr(current_user, "employee_id", None),
    )
    db.add(new_job)
    db.flush()

    moved_task_ids = [t.task_id for t in tasks_to_move]
    for t in tasks_to_move:
        t.job_order_id = new_job.job_order_id

    # Move clocks linked to moved tasks (keeps referential integrity).
    db.query(JobClock).filter(
        JobClock.job_order_id == job_order_id,
        JobClock.task_id.in_(moved_task_ids),
    ).update({JobClock.job_order_id: new_job.job_order_id}, synchronize_session=False)

    db.commit()

    refreshed_original = db.query(JobOrder).options(joinedload(JobOrder.tasks)).filter(JobOrder.job_order_id == job_order_id).first()
    refreshed_new = db.query(JobOrder).options(joinedload(JobOrder.tasks)).filter(JobOrder.job_order_id == new_job.job_order_id).first()

    return {"original_job_order": refreshed_original, "new_job_order": refreshed_new}


@router.post("/pair", response_model=JobOrderPairingResponse)
def pair_job_orders(
    payload: JobOrderPairRequest,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if payload.job_order_id_1 == payload.job_order_id_2:
        raise HTTPException(status_code=400, detail="Cannot pair a job order with itself")

    a = min(payload.job_order_id_1, payload.job_order_id_2)
    b = max(payload.job_order_id_1, payload.job_order_id_2)

    job_a = db.query(JobOrder).filter(JobOrder.job_order_id == a).first()
    job_b = db.query(JobOrder).filter(JobOrder.job_order_id == b).first()
    if not job_a or not job_b:
        raise HTTPException(status_code=404, detail="One or both job orders not found")

    if job_a.status == JobOrderStatus.CANCELLED or job_b.status == JobOrderStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Cannot pair Cancelled job orders")

    existing = db.query(JobOrderPairing).filter(
        JobOrderPairing.job_order_id_a == a,
        JobOrderPairing.job_order_id_b == b,
        JobOrderPairing.unpaired_at.is_(None),
    ).first()
    if existing:
        return existing

    pairing = JobOrderPairing(
        job_order_id_a=a,
        job_order_id_b=b,
        paired_by_employee_id=getattr(current_user, "employee_id", None),
    )
    db.add(pairing)
    db.commit()
    db.refresh(pairing)
    return pairing


@router.post("/unpair/{pairing_id}", response_model=JobOrderPairingResponse)
def unpair_job_orders(
    pairing_id: int,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    pairing = db.query(JobOrderPairing).filter(JobOrderPairing.pairing_id == pairing_id).first()
    if not pairing:
        raise HTTPException(status_code=404, detail="Pairing not found")

    if pairing.unpaired_at is not None:
        return pairing

    pairing.unpaired_at = datetime.utcnow()
    pairing.unpaired_by_employee_id = getattr(current_user, "employee_id", None)
    db.commit()
    db.refresh(pairing)
    return pairing


@router.get("/{job_order_id}/pairings", response_model=List[JobOrderPairingResponse])
def list_job_order_pairings(job_order_id: int, db: Session = Depends(get_db)):
    job_order = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job_order:
        raise HTTPException(status_code=404, detail="Job order not found")

    return (
        db.query(JobOrderPairing)
        .filter(
            JobOrderPairing.unpaired_at.is_(None),
            (JobOrderPairing.job_order_id_a == job_order_id) | (JobOrderPairing.job_order_id_b == job_order_id),
        )
        .order_by(JobOrderPairing.paired_at.desc())
        .all()
    )


@router.post("/{job_order_id}/dispatch", response_model=JobOrderResponse)
def dispatch_job_order(
    job_order_id: int,
    payload: JobOrderDispatchRequest,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    job_order = db.query(JobOrder).options(joinedload(JobOrder.tasks)).filter(JobOrder.job_order_id == job_order_id).first()
    if not job_order:
        raise HTTPException(status_code=404, detail="Job order not found")

    _ensure_not_blocked(job_order)

    if job_order.status != JobOrderStatus.OPEN:
        raise HTTPException(status_code=400, detail="Only Open job orders can be dispatched")

    job_order.status = JobOrderStatus.DISPATCHED
    job_order.dispatched_section = payload.dispatched_section
    job_order.dispatched_at = datetime.utcnow()

    db.commit()
    db.refresh(job_order)
    return job_order


@router.post("/{job_order_id}/receive", response_model=JobOrderResponse)
def receive_dispatched_job(
    job_order_id: int,
    payload: JobOrderReceiveRequest,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    job_order = db.query(JobOrder).options(joinedload(JobOrder.tasks)).filter(JobOrder.job_order_id == job_order_id).first()
    if not job_order:
        raise HTTPException(status_code=404, detail="Job order not found")

    _ensure_not_blocked(job_order)

    if job_order.status != JobOrderStatus.DISPATCHED:
        raise HTTPException(status_code=400, detail="Only Dispatched job orders can be received")

    job_order.status = JobOrderStatus.RECEIVED
    job_order.received_section = payload.received_section
    job_order.received_vehicle_location = payload.received_vehicle_location
    job_order.received_at = datetime.utcnow()

    db.commit()
    db.refresh(job_order)
    return job_order


@router.post("/{job_order_id}/clock-in", response_model=JobClockResponse)
def clock_in(
    job_order_id: int,
    payload: JobClockInRequest,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    job_order = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job_order:
        raise HTTPException(status_code=404, detail="Job order not found")

    _ensure_not_blocked(job_order)

    if job_order.status != JobOrderStatus.RECEIVED:
        raise HTTPException(status_code=400, detail="Job must be received by section before clock-in")

    active_tasks_count = db.query(JobOrderTask).filter(
        JobOrderTask.job_order_id == job_order_id,
        JobOrderTask.is_active.is_(True),
    ).count()
    if active_tasks_count > 0 and payload.task_id is None:
        raise HTTPException(status_code=400, detail="task_id is required for clock-in when job order has tasks")

    tech = db.query(Employee).filter(Employee.employee_id == payload.technician_employee_id).first()
    if not tech:
        raise HTTPException(status_code=404, detail="Technician not found")

    # Enforce: a technician can't be clocked-in on another job at the same time
    existing_active = db.query(JobClock).filter(
        JobClock.technician_employee_id == payload.technician_employee_id,
        JobClock.clock_out_at.is_(None),
    ).first()
    if existing_active:
        raise HTTPException(
            status_code=400,
            detail=f"Technician is already clocked-in (job_clock_id={existing_active.job_clock_id})",
        )

    if payload.task_id is not None:
        task = db.query(JobOrderTask).filter(
            JobOrderTask.task_id == payload.task_id,
            JobOrderTask.job_order_id == job_order_id,
            JobOrderTask.is_active.is_(True),
        ).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found for this job order")

    clock = JobClock(
        job_order_id=job_order_id,
        task_id=payload.task_id,
        technician_employee_id=payload.technician_employee_id,
        clock_in_remark=payload.clock_in_remark,
    )

    db.add(clock)
    db.commit()
    db.refresh(clock)
    return clock


@router.post("/{job_order_id}/clock-out/{job_clock_id}", response_model=JobClockResponse)
def clock_out(
    job_order_id: int,
    job_clock_id: int,
    payload: JobClockOutRequest,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    clock = db.query(JobClock).filter(
        JobClock.job_clock_id == job_clock_id,
        JobClock.job_order_id == job_order_id,
    ).first()
    if not clock:
        raise HTTPException(status_code=404, detail="Job clock entry not found")

    if clock.clock_out_at is not None:
        raise HTTPException(status_code=400, detail="This clock entry is already clocked-out")

    clock.clock_out_at = datetime.utcnow()
    clock.clock_out_reason = payload.clock_out_reason
    clock.clock_out_remark = payload.clock_out_remark

    db.commit()
    db.refresh(clock)
    return clock


@router.post("/{job_order_id}/clocks/last/reason", response_model=JobClockResponse)
def update_last_clock_out_reason(
    job_order_id: int,
    payload: JobClockOutReasonUpdateRequest,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    job_order = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job_order:
        raise HTTPException(status_code=404, detail="Job order not found")

    _ensure_not_blocked(job_order)

    new_reason = (payload.clock_out_reason or "").strip()
    if not new_reason:
        raise HTTPException(status_code=400, detail="clock_out_reason is required")

    last_clock = db.query(JobClock).filter(
        JobClock.job_order_id == job_order_id,
        JobClock.clock_out_at.isnot(None),
    ).order_by(JobClock.clock_out_at.desc(), JobClock.job_clock_id.desc()).first()

    if not last_clock:
        raise HTTPException(status_code=400, detail="No clocked-out entry found to update")

    last_clock.clock_out_reason = new_reason
    db.commit()
    db.refresh(last_clock)
    return last_clock


@router.get("/enquiry/free-technicians", response_model=List[FreeTechnicianResponse])
def enquiry_free_technicians(
    db: Session = Depends(get_db),
):
    mechanics = db.query(Employee).filter(
        Employee.is_active.is_(True),
        Employee.role == "Mechanic",
    ).order_by(Employee.first_name.asc(), Employee.last_name.asc()).all()

    active_tech_ids = {
        row[0]
        for row in db.query(JobClock.technician_employee_id)
        .filter(
            JobClock.clock_out_at.is_(None),
            JobClock.technician_employee_id.isnot(None),
        )
        .distinct()
        .all()
    }

    free = [m for m in mechanics if m.employee_id not in active_tech_ids]
    return free


@router.get("/enquiry/clocked-in-jobs", response_model=List[ClockedInJobResponse])
def enquiry_clocked_in_jobs(
    section: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(JobClock).options(joinedload(JobClock.job_order), joinedload(JobClock.technician)).join(
        JobOrder, JobOrder.job_order_id == JobClock.job_order_id
    ).filter(
        JobClock.clock_out_at.is_(None),
        JobOrder.status == JobOrderStatus.RECEIVED,
    )
    if section:
        q = q.filter(JobOrder.received_section == section)

    clocks = q.order_by(JobClock.clock_in_at.desc()).all()

    results: List[dict] = []
    for c in clocks:
        tech = getattr(c, "technician", None)
        tech_name = None
        if tech:
            tech_name = f"{tech.first_name} {tech.last_name}".strip()
        job = getattr(c, "job_order", None)
        results.append({
            "job_clock_id": c.job_clock_id,
            "job_order_id": c.job_order_id,
            "job_order_number": job.job_order_number if job else "",
            "received_section": job.received_section if job else None,
            "technician_employee_id": c.technician_employee_id,
            "technician_name": tech_name,
            "task_id": c.task_id,
            "clock_in_at": c.clock_in_at,
        })
    return results


@router.get("/enquiry/dispatched-jobs", response_model=List[DispatchedJobResponse])
def enquiry_dispatched_jobs(
    section: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(JobOrder).filter(JobOrder.status == JobOrderStatus.DISPATCHED)
    if section:
        q = q.filter(JobOrder.dispatched_section == section)
    return q.order_by(JobOrder.dispatched_at.desc().nullslast(), JobOrder.created_at.desc()).all()


@router.get("/enquiry/in-out", response_model=List[InOutEntryResponse])
def enquiry_in_out(
    from_date: date,
    to_date: date,
    technician_employee_id: Optional[int] = None,
    job_order_id: Optional[int] = None,
    include_closed: bool = False,
    db: Session = Depends(get_db),
):
    if to_date < from_date:
        raise HTTPException(status_code=400, detail="to_date must be >= from_date")

    start_dt = datetime.combine(from_date, datetime.min.time())
    end_dt = datetime.combine(to_date, datetime.max.time())

    q = db.query(JobClock).options(joinedload(JobClock.job_order), joinedload(JobClock.technician)).join(
        JobOrder, JobOrder.job_order_id == JobClock.job_order_id
    ).filter(
        JobClock.clock_in_at >= start_dt,
        JobClock.clock_in_at <= end_dt,
    )

    if technician_employee_id is not None:
        q = q.filter(JobClock.technician_employee_id == technician_employee_id)
    if job_order_id is not None:
        q = q.filter(JobClock.job_order_id == job_order_id)
    if not include_closed:
        q = q.filter(JobOrder.status.notin_([JobOrderStatus.CLOSED, JobOrderStatus.CANCELLED]))

    clocks = q.order_by(JobClock.clock_in_at.desc()).all()

    results: List[dict] = []
    for c in clocks:
        tech = getattr(c, "technician", None)
        tech_name = None
        if tech:
            tech_name = f"{tech.first_name} {tech.last_name}".strip()
        job = getattr(c, "job_order", None)
        results.append({
            "job_clock_id": c.job_clock_id,
            "job_order_id": c.job_order_id,
            "job_order_number": job.job_order_number if job else "",
            "technician_employee_id": c.technician_employee_id,
            "technician_name": tech_name,
            "task_id": c.task_id,
            "clock_in_at": c.clock_in_at,
            "clock_out_at": c.clock_out_at,
            "clock_out_reason": c.clock_out_reason,
        })
    return results


@router.post("/enquiry/end-of-day-checkout", response_model=EndOfDayCheckoutResponse)
def end_of_day_checkout(
    payload: EndOfDayCheckoutRequest,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    reason = (payload.clock_out_reason or "").strip()
    if not reason:
        raise HTTPException(status_code=400, detail="clock_out_reason is required")

    q = db.query(JobClock).join(JobOrder, JobOrder.job_order_id == JobClock.job_order_id).filter(
        JobClock.clock_out_at.is_(None),
    )
    if payload.section:
        q = q.filter(JobOrder.received_section == payload.section)

    clocks = q.order_by(JobClock.clock_in_at.asc()).all()
    now = datetime.utcnow()

    for c in clocks:
        c.clock_out_at = now
        c.clock_out_reason = reason
        c.clock_out_remark = payload.clock_out_remark

    db.commit()

    return {
        "clocked_out_count": len(clocks),
        "clocks": clocks,
    }


@router.get("/{job_order_id}/clocks", response_model=List[JobClockResponse])
def list_job_clocks(job_order_id: int, db: Session = Depends(get_db)):
    job_order = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job_order:
        raise HTTPException(status_code=404, detail="Job order not found")

    clocks = db.query(JobClock).filter(
        JobClock.job_order_id == job_order_id
    ).order_by(JobClock.clock_in_at.desc()).all()
    return clocks


@router.post("/{job_order_id}/cancel", response_model=JobOrderResponse)
def cancel_job_order(
    job_order_id: int,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    job_order = db.query(JobOrder).options(joinedload(JobOrder.tasks)).filter(JobOrder.job_order_id == job_order_id).first()
    if not job_order:
        raise HTTPException(status_code=404, detail="Job order not found")

    if job_order.status == JobOrderStatus.CANCELLED:
        return job_order

    if job_order.status == JobOrderStatus.CLOSED:
        # HillMaster-style cancelled jobs registry: closed jobs may be formally cancelled for reporting.
        job_order.status = JobOrderStatus.CANCELLED
        db.commit()
        db.refresh(job_order)
        return job_order

    active_clocks = db.query(JobClock).filter(
        JobClock.job_order_id == job_order_id,
        JobClock.clock_out_at.is_(None),
    ).count()
    if active_clocks > 0:
        raise HTTPException(status_code=400, detail="Cannot cancel job order with active clock-ins")

    job_order.status = JobOrderStatus.CANCELLED
    job_order.closed_at = datetime.utcnow()

    db.commit()
    db.refresh(job_order)
    return job_order


@router.post("/{job_order_id}/reopen", response_model=JobOrderResponse)
def reopen_job_order(
    job_order_id: int,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    job_order = db.query(JobOrder).options(joinedload(JobOrder.tasks)).filter(JobOrder.job_order_id == job_order_id).first()
    if not job_order:
        raise HTTPException(status_code=404, detail="Job order not found")

    if job_order.status not in (JobOrderStatus.CLOSED, JobOrderStatus.CANCELLED):
        raise HTTPException(status_code=400, detail=f"Only Closed/Cancelled job orders can be reopened (current: {job_order.status})")

    job_order.status = JobOrderStatus.OPEN
    job_order.closed_at = None
    job_order.close_tested_by_employee_id = None
    job_order.close_tested_on_road = False
    job_order.close_tested_on_test_lane = False
    job_order.close_work_description = None
    job_order.close_send_email = False
    job_order.close_process_remark = None

    db.commit()
    db.refresh(job_order)
    return job_order


@router.post("/{job_order_id}/close", response_model=JobOrderResponse)
def close_job_order(
    job_order_id: int,
    payload: Optional[JobOrderCloseRequest] = None,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    job_order = db.query(JobOrder).options(joinedload(JobOrder.tasks)).filter(JobOrder.job_order_id == job_order_id).first()
    if not job_order:
        raise HTTPException(status_code=404, detail="Job order not found")

    _ensure_not_blocked(job_order)

    if job_order.status == JobOrderStatus.DISPATCHED:
        raise HTTPException(
            status_code=400,
            detail="Job order must be received back from the section before it can be closed. Use Receive on Task Operations or job detail.",
        )

    if job_order.status not in (JobOrderStatus.RECEIVED, JobOrderStatus.OPEN):
        raise HTTPException(status_code=400, detail=f"Cannot close a {job_order.status} job order")

    active_clocks = db.query(JobClock).filter(
        JobClock.job_order_id == job_order_id,
        JobClock.clock_out_at.is_(None),
    ).count()
    if active_clocks > 0:
        raise HTTPException(status_code=400, detail="Cannot close job order with active clock-ins")

    active_tasks = db.query(JobOrderTask).filter(
        JobOrderTask.job_order_id == job_order_id,
        JobOrderTask.is_active.is_(True),
    ).all()
    if active_tasks:
        incomplete = []
        for task in active_tasks:
            completed_count = db.query(JobClock).filter(
                JobClock.job_order_id == job_order_id,
                JobClock.task_id == task.task_id,
                JobClock.clock_out_at.isnot(None),
            ).count()
            if completed_count == 0:
                incomplete.append({"task_id": task.task_id, "task_name": task.task_name})

        if incomplete:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Cannot close job order: not all tasks are clocked-out",
                    "incomplete_tasks": incomplete,
                },
            )

    if payload is not None:
        if not payload.tested_on_road and not payload.tested_on_test_lane:
            raise HTTPException(status_code=400, detail="Select at least one test method (On Road or On Test Lane).")
        tech = db.query(Employee).filter(Employee.employee_id == payload.tested_by_employee_id).first()
        if not tech:
            raise HTTPException(status_code=404, detail="Tested By employee not found")
        job_order.close_tested_by_employee_id = payload.tested_by_employee_id
        job_order.close_tested_on_road = payload.tested_on_road
        job_order.close_tested_on_test_lane = payload.tested_on_test_lane
        job_order.close_work_description = payload.detail_work_description
        job_order.close_send_email = payload.send_email
        job_order.close_process_remark = payload.close_remark

    job_order.status = JobOrderStatus.CLOSED
    if payload is not None and payload.close_date:
        job_order.closed_at = datetime.combine(payload.close_date, datetime.min.time())
    else:
        job_order.closed_at = datetime.utcnow()

    db.commit()
    db.refresh(job_order)
    return job_order


@router.post("/{job_order_id}/block", response_model=JobOrderResponse)
def block_job_order(
    job_order_id: int,
    payload: JobOrderBlockRequest,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    job_order = db.query(JobOrder).options(joinedload(JobOrder.tasks)).filter(JobOrder.job_order_id == job_order_id).first()
    if not job_order:
        raise HTTPException(status_code=404, detail="Job order not found")

    if job_order.delivered_at is not None:
        raise HTTPException(status_code=400, detail="Cannot block a delivered job order")

    active_clocks = db.query(JobClock).filter(
        JobClock.job_order_id == job_order_id,
        JobClock.clock_out_at.is_(None),
    ).count()
    if active_clocks > 0:
        raise HTTPException(status_code=400, detail="Cannot block job order with active clock-ins")

    job_order.is_blocked = True
    job_order.blocked_reason = payload.blocked_reason
    job_order.blocked_at = datetime.utcnow()
    job_order.blocked_by_employee_id = getattr(current_user, "employee_id", None)

    db.commit()
    db.refresh(job_order)
    return job_order


@router.post("/{job_order_id}/release", response_model=JobOrderResponse)
def release_job_order(
    job_order_id: int,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    job_order = db.query(JobOrder).options(joinedload(JobOrder.tasks)).filter(JobOrder.job_order_id == job_order_id).first()
    if not job_order:
        raise HTTPException(status_code=404, detail="Job order not found")

    job_order.is_blocked = False
    db.commit()
    db.refresh(job_order)
    return job_order


@router.post("/{job_order_id}/deliver", response_model=JobOrderResponse)
def deliver_job_order(
    job_order_id: int,
    payload: JobOrderDeliverRequest,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    job_order = db.query(JobOrder).options(joinedload(JobOrder.tasks)).filter(JobOrder.job_order_id == job_order_id).first()
    if not job_order:
        raise HTTPException(status_code=404, detail="Job order not found")

    _ensure_not_blocked(job_order)

    if job_order.delivered_at is not None:
        return job_order

    if job_order.status != JobOrderStatus.CLOSED:
        raise HTTPException(status_code=400, detail="Only Closed job orders can be delivered")

    # Require QC Passed before delivery
    qc_sheet = db.query(JobOrderQCSheet).options(joinedload(JobOrderQCSheet.items)).filter(
        JobOrderQCSheet.job_order_id == job_order_id
    ).first()
    if not qc_sheet:
        raise HTTPException(status_code=400, detail="QC sheet is required before delivery")
    if qc_sheet.overall_status != JobOrderQCStatus.PASSED:
        raise HTTPException(status_code=400, detail="QC sheet must be Passed before delivery")

    job_order.delivered_at = datetime.utcnow()
    job_order.delivered_by_employee_id = getattr(current_user, "employee_id", None)
    job_order.delivered_to_name = payload.delivered_to_name
    job_order.delivered_to_phone = payload.delivered_to_phone

    if getattr(job_order, "vrv_number", None) is None:
        job_order.vrv_number = generate_vrv_number(db)

    db.commit()
    db.refresh(job_order)
    return job_order


@router.post("/{job_order_id}/vrv/print", response_model=JobOrderResponse)
def mark_vrv_printed(
    job_order_id: int,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    job_order = db.query(JobOrder).options(joinedload(JobOrder.tasks)).filter(JobOrder.job_order_id == job_order_id).first()
    if not job_order:
        raise HTTPException(status_code=404, detail="Job order not found")

    if job_order.delivered_at is None:
        raise HTTPException(status_code=400, detail="Job order must be delivered before printing VRV")

    if getattr(job_order, "vrv_number", None) is None:
        job_order.vrv_number = generate_vrv_number(db)

    if job_order.vrv_printed_at is None:
        job_order.vrv_printed_at = datetime.utcnow()

    db.commit()
    db.refresh(job_order)
    return job_order


@router.post("/{job_order_id}/vrv/cancel", response_model=JobOrderResponse)
def cancel_vrv_entry(
    job_order_id: int,
    payload: JobOrderVrvCancelRequest,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    job_order = db.query(JobOrder).options(joinedload(JobOrder.tasks)).filter(JobOrder.job_order_id == job_order_id).first()
    if not job_order:
        raise HTTPException(status_code=404, detail="Job order not found")

    _ensure_not_blocked(job_order)

    if job_order.status != JobOrderStatus.CLOSED:
        raise HTTPException(status_code=400, detail="Only Closed job orders can cancel VRV entry")

    if job_order.delivered_at is None and getattr(job_order, "vrv_number", None) is None:
        raise HTTPException(status_code=400, detail="No delivery/VRV entry to cancel")

    # Cancel delivery and VRV print state so VRV can be reprocessed later
    job_order.delivered_at = None
    job_order.delivered_by_employee_id = None
    job_order.delivered_to_name = None
    job_order.delivered_to_phone = None

    job_order.vrv_printed_at = None
    job_order.vrv_number = None

    db.commit()
    db.refresh(job_order)
    return job_order


@router.get("/{job_order_id}/qc", response_model=JobOrderQCSheetResponse)
def get_qc_sheet(job_order_id: int, db: Session = Depends(get_db)):
    job_order = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job_order:
        raise HTTPException(status_code=404, detail="Job order not found")

    sheet = db.query(JobOrderQCSheet).options(joinedload(JobOrderQCSheet.items)).filter(
        JobOrderQCSheet.job_order_id == job_order_id
    ).first()

    if not sheet:
        sheet = JobOrderQCSheet(job_order_id=job_order_id, overall_status=JobOrderQCStatus.PENDING)
        db.add(sheet)
        db.commit()
        db.refresh(sheet)

    return sheet


@router.put("/{job_order_id}/qc", response_model=JobOrderQCSheetResponse)
def upsert_qc_sheet(
    job_order_id: int,
    payload: JobOrderQCUpsertRequest,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    job_order = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job_order:
        raise HTTPException(status_code=404, detail="Job order not found")

    _ensure_not_blocked(job_order)

    sheet = db.query(JobOrderQCSheet).options(joinedload(JobOrderQCSheet.items)).filter(
        JobOrderQCSheet.job_order_id == job_order_id
    ).first()

    if not sheet:
        sheet = JobOrderQCSheet(job_order_id=job_order_id, overall_status=JobOrderQCStatus.PENDING)
        db.add(sheet)
        db.flush()

    if payload.remarks is not None:
        sheet.remarks = payload.remarks

    if payload.checked_by_employee_id is not None:
        tech = db.query(Employee).filter(Employee.employee_id == payload.checked_by_employee_id).first()
        if not tech:
            raise HTTPException(status_code=404, detail="checked_by_employee_id not found")
        sheet.checked_by_employee_id = payload.checked_by_employee_id
    elif getattr(current_user, "employee_id", None):
        sheet.checked_by_employee_id = current_user.employee_id

    incoming_names = {i.item_name for i in payload.items}
    if payload.replace_all and payload.items:
        for db_item in list(sheet.items):
            if db_item.item_name not in incoming_names:
                db.delete(db_item)
        db.flush()

    existing_by_name = {i.item_name: i for i in sheet.items}
    for item in payload.items:
        if item.item_name in existing_by_name:
            db_item = existing_by_name[item.item_name]
            db_item.passed = item.passed
            db_item.remark = item.remark
            db_item.sort_order = item.sort_order
            db_item.is_mandatory = item.is_mandatory
        else:
            db.add(JobOrderQCItem(
                qc_sheet_id=sheet.qc_sheet_id,
                item_name=item.item_name,
                passed=item.passed,
                remark=item.remark,
                sort_order=item.sort_order,
                is_mandatory=item.is_mandatory,
            ))

    db.flush()
    db.refresh(sheet)
    sheet.overall_status = _recalculate_qc_status(sheet)
    sheet.checked_at = datetime.utcnow()

    db.commit()
    db.refresh(sheet)
    return sheet
