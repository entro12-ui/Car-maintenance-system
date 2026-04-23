from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import date, datetime
from typing import List, Optional

from app.database import get_db
from app.auth import get_current_admin

from app.models.job_order import JobOrder, JobClock, JobOrderStatus
from app.models.part import PartInventory
from app.models.job_order_inventory import (
    JobOrderItemIssue,
    JobOrderItemIssueLine,
    JobOrderReturnRequest,
    JobOrderReturnRequestLine,
    JobOrderItemIssueStatus,
    JobOrderReturnRequestStatus,
)
from app.schemas.job_order_inventory import (
    JobOrderItemIssueCreate,
    JobOrderItemIssueLineAdd,
    JobOrderItemIssueResponse,
    JobOrderReturnRequestCreate,
    JobOrderReturnRequestResponse,
)

router = APIRouter()


def _generate_issue_number(db: Session) -> str:
    today = date.today()
    date_part = today.strftime("%Y%m%d")

    last = db.query(JobOrderItemIssue).filter(
        JobOrderItemIssue.issue_number.like(f"MRV-{date_part}-%")
    ).order_by(JobOrderItemIssue.issue_id.desc()).first()

    if last and last.issue_number:
        try:
            seq = int(last.issue_number.split("-")[-1]) + 1
        except (ValueError, IndexError):
            seq = 1
    else:
        seq = 1

    return f"MRV-{date_part}-{seq:04d}"


def _generate_return_number(db: Session) -> str:
    today = date.today()
    date_part = today.strftime("%Y%m%d")

    last = db.query(JobOrderReturnRequest).filter(
        JobOrderReturnRequest.return_number.like(f"RR-{date_part}-%")
    ).order_by(JobOrderReturnRequest.return_request_id.desc()).first()

    if last and last.return_number:
        try:
            seq = int(last.return_number.split("-")[-1]) + 1
        except (ValueError, IndexError):
            seq = 1
    else:
        seq = 1

    return f"RR-{date_part}-{seq:04d}"


def _ensure_job_active_and_clocked_in(db: Session, job: JobOrder):
    if job.status in (JobOrderStatus.CLOSED, JobOrderStatus.CANCELLED):
        raise HTTPException(status_code=400, detail=f"Cannot process inventory for a {job.status} job order")

    if getattr(job, "is_blocked", False):
        raise HTTPException(status_code=400, detail="Job order is blocked")

    # In this system clock-in is only possible after Received, so enforce Received here.
    if job.status != JobOrderStatus.RECEIVED:
        raise HTTPException(status_code=400, detail="Job must be received before item issue")

    active_clock_exists = db.query(JobClock).filter(
        JobClock.job_order_id == job.job_order_id,
        JobClock.clock_out_at.is_(None),
    ).count() > 0

    if not active_clock_exists:
        raise HTTPException(status_code=400, detail="Job must be clocked-in for a technician before item issue")


@router.post("/{job_order_id}/item-issues", response_model=JobOrderItemIssueResponse)
def create_item_issue(
    job_order_id: int,
    payload: JobOrderItemIssueCreate,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    job = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job order not found")

    _ensure_job_active_and_clocked_in(db, job)

    issue = JobOrderItemIssue(
        issue_number=_generate_issue_number(db),
        job_order_id=job_order_id,
        status=JobOrderItemIssueStatus.DRAFT,
        issued_by_employee_id=payload.issued_by_employee_id,
        remarks=payload.remarks,
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return issue


@router.get("/{job_order_id}/item-issues", response_model=List[JobOrderItemIssueResponse])
def list_item_issues(
    job_order_id: int,
    db: Session = Depends(get_db),
):
    return (
        db.query(JobOrderItemIssue)
        .options(joinedload(JobOrderItemIssue.lines))
        .filter(JobOrderItemIssue.job_order_id == job_order_id)
        .order_by(JobOrderItemIssue.created_at.desc())
        .all()
    )


@router.get("/item-issues/{issue_id}", response_model=JobOrderItemIssueResponse)
def get_item_issue(issue_id: int, db: Session = Depends(get_db)):
    issue = (
        db.query(JobOrderItemIssue)
        .options(joinedload(JobOrderItemIssue.lines))
        .filter(JobOrderItemIssue.issue_id == issue_id)
        .first()
    )
    if not issue:
        raise HTTPException(status_code=404, detail="Item issue not found")
    return issue


@router.post("/item-issues/{issue_id}/lines", response_model=JobOrderItemIssueResponse)
def add_issue_line(
    issue_id: int,
    payload: JobOrderItemIssueLineAdd,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="quantity must be > 0")

    issue = db.query(JobOrderItemIssue).filter(JobOrderItemIssue.issue_id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Item issue not found")

    if issue.status != JobOrderItemIssueStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Can only add lines to Draft item issues")

    part = db.query(PartInventory).filter(PartInventory.part_id == payload.part_id).first()
    if not part or not part.is_active:
        raise HTTPException(status_code=404, detail="Part not found")

    existing = db.query(JobOrderItemIssueLine).filter(
        JobOrderItemIssueLine.issue_id == issue_id,
        JobOrderItemIssueLine.part_id == payload.part_id,
    ).first()

    unit_price = part.unit_price

    if existing:
        existing.quantity = int(existing.quantity) + int(payload.quantity)
        existing.unit_price = unit_price
    else:
        db.add(JobOrderItemIssueLine(
            issue_id=issue_id,
            part_id=payload.part_id,
            quantity=payload.quantity,
            unit_price=unit_price,
        ))

    db.commit()

    issue = (
        db.query(JobOrderItemIssue)
        .options(joinedload(JobOrderItemIssue.lines))
        .filter(JobOrderItemIssue.issue_id == issue_id)
        .first()
    )
    return issue


@router.post("/item-issues/{issue_id}/finalize", response_model=JobOrderItemIssueResponse)
def finalize_item_issue(
    issue_id: int,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    issue = (
        db.query(JobOrderItemIssue)
        .options(joinedload(JobOrderItemIssue.lines))
        .filter(JobOrderItemIssue.issue_id == issue_id)
        .first()
    )
    if not issue:
        raise HTTPException(status_code=404, detail="Item issue not found")

    if issue.status != JobOrderItemIssueStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only Draft item issues can be finalized")

    job = db.query(JobOrder).filter(JobOrder.job_order_id == issue.job_order_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job order not found")

    _ensure_job_active_and_clocked_in(db, job)

    if not issue.lines:
        raise HTTPException(status_code=400, detail="Cannot finalize an empty item issue")

    # Validate stock then deduct.
    part_ids = [line.part_id for line in issue.lines]
    parts = db.query(PartInventory).filter(PartInventory.part_id.in_(part_ids)).all()
    parts_by_id = {p.part_id: p for p in parts}

    for line in issue.lines:
        part = parts_by_id.get(line.part_id)
        if not part or not part.is_active:
            raise HTTPException(status_code=400, detail=f"Part {line.part_id} is not available")
        if int(part.stock_quantity) < int(line.quantity):
            raise HTTPException(status_code=400, detail=f"Insufficient stock for part {part.part_code}")

    for line in issue.lines:
        part = parts_by_id[line.part_id]
        part.stock_quantity = int(part.stock_quantity) - int(line.quantity)

    issue.status = JobOrderItemIssueStatus.FINALIZED
    issue.finalized_at = datetime.utcnow()

    db.commit()
    db.refresh(issue)
    return issue


@router.post("/item-issues/{issue_id}/cancel", response_model=JobOrderItemIssueResponse)
def cancel_item_issue(
    issue_id: int,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    issue = db.query(JobOrderItemIssue).filter(JobOrderItemIssue.issue_id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Item issue not found")

    if issue.status != JobOrderItemIssueStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only Draft item issues can be cancelled")

    issue.status = JobOrderItemIssueStatus.CANCELLED
    issue.cancelled_at = datetime.utcnow()

    db.commit()
    db.refresh(issue)
    return issue


def _approved_returned_qty(db: Session, issue_id: int, part_id: int) -> int:
    qty = (
        db.query(func.coalesce(func.sum(JobOrderReturnRequestLine.quantity), 0))
        .join(JobOrderReturnRequest, JobOrderReturnRequest.return_request_id == JobOrderReturnRequestLine.return_request_id)
        .filter(
            JobOrderReturnRequest.issue_id == issue_id,
            JobOrderReturnRequest.status == JobOrderReturnRequestStatus.APPROVED,
            JobOrderReturnRequestLine.part_id == part_id,
        )
        .scalar()
    )
    return int(qty or 0)


@router.post("/item-issues/{issue_id}/return-requests", response_model=JobOrderReturnRequestResponse)
def create_return_request(
    issue_id: int,
    payload: JobOrderReturnRequestCreate,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    issue = (
        db.query(JobOrderItemIssue)
        .options(joinedload(JobOrderItemIssue.lines))
        .filter(JobOrderItemIssue.issue_id == issue_id)
        .first()
    )
    if not issue:
        raise HTTPException(status_code=404, detail="Item issue not found")

    if issue.status != JobOrderItemIssueStatus.FINALIZED:
        raise HTTPException(status_code=400, detail="Return requests can only be created for Finalized item issues")

    if not payload.items:
        raise HTTPException(status_code=400, detail="items is required")

    issued_qty_by_part = {line.part_id: int(line.quantity) for line in issue.lines}

    for item in payload.items:
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail="Return item quantity must be > 0")
        if item.part_id not in issued_qty_by_part:
            raise HTTPException(status_code=400, detail=f"Part {item.part_id} was not issued on this MRV")

        approved_returned = _approved_returned_qty(db, issue_id, item.part_id)
        remaining = int(issued_qty_by_part[item.part_id]) - int(approved_returned)
        if item.quantity > remaining:
            raise HTTPException(
                status_code=400,
                detail=f"Return quantity exceeds remaining for part {item.part_id} (remaining {remaining})",
            )

    req = JobOrderReturnRequest(
        return_number=_generate_return_number(db),
        issue_id=issue_id,
        job_order_id=issue.job_order_id,
        status=JobOrderReturnRequestStatus.PENDING,
        reason=payload.reason,
        authority_name=payload.authority_name,
        requested_by_employee_id=payload.requested_by_employee_id,
    )
    db.add(req)
    db.flush()

    for item in payload.items:
        db.add(JobOrderReturnRequestLine(
            return_request_id=req.return_request_id,
            part_id=item.part_id,
            quantity=item.quantity,
            remark=item.remark,
        ))

    db.commit()
    db.refresh(req)
    return (
        db.query(JobOrderReturnRequest)
        .options(joinedload(JobOrderReturnRequest.lines))
        .filter(JobOrderReturnRequest.return_request_id == req.return_request_id)
        .first()
    )


@router.get("/return-requests", response_model=List[JobOrderReturnRequestResponse])
def list_return_requests(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(JobOrderReturnRequest).options(joinedload(JobOrderReturnRequest.lines)).order_by(JobOrderReturnRequest.created_at.desc())
    if status:
        q = q.filter(JobOrderReturnRequest.status == status)
    return q.all()


@router.get("/return-requests/{return_request_id}", response_model=JobOrderReturnRequestResponse)
def get_return_request(return_request_id: int, db: Session = Depends(get_db)):
    req = (
        db.query(JobOrderReturnRequest)
        .options(joinedload(JobOrderReturnRequest.lines))
        .filter(JobOrderReturnRequest.return_request_id == return_request_id)
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Return request not found")
    return req


@router.post("/return-requests/{return_request_id}/approve", response_model=JobOrderReturnRequestResponse)
def approve_return_request(
    return_request_id: int,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    req = (
        db.query(JobOrderReturnRequest)
        .options(joinedload(JobOrderReturnRequest.lines))
        .filter(JobOrderReturnRequest.return_request_id == return_request_id)
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Return request not found")

    if req.status != JobOrderReturnRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only Pending return requests can be approved")

    issue = (
        db.query(JobOrderItemIssue)
        .options(joinedload(JobOrderItemIssue.lines))
        .filter(JobOrderItemIssue.issue_id == req.issue_id)
        .first()
    )
    if not issue:
        raise HTTPException(status_code=404, detail="Item issue not found")

    issued_qty_by_part = {line.part_id: int(line.quantity) for line in issue.lines}

    # Re-validate remaining quantities at approval time.
    for line in req.lines:
        approved_returned = _approved_returned_qty(db, req.issue_id, line.part_id)
        # approved_returned includes this request only if already approved, which it isn't.
        remaining = int(issued_qty_by_part.get(line.part_id, 0)) - int(approved_returned)
        if int(line.quantity) > int(remaining):
            raise HTTPException(
                status_code=400,
                detail=f"Return quantity exceeds remaining for part {line.part_id} (remaining {remaining})",
            )

    part_ids = [l.part_id for l in req.lines]
    parts = db.query(PartInventory).filter(PartInventory.part_id.in_(part_ids)).all()
    parts_by_id = {p.part_id: p for p in parts}

    for line in req.lines:
        part = parts_by_id.get(line.part_id)
        if not part:
            raise HTTPException(status_code=400, detail=f"Part {line.part_id} not found")
        part.stock_quantity = int(part.stock_quantity) + int(line.quantity)

    req.status = JobOrderReturnRequestStatus.APPROVED
    req.decided_at = datetime.utcnow()
    req.decided_by_employee_id = getattr(current_user, "employee_id", None)

    db.commit()
    db.refresh(req)
    return req


@router.post("/return-requests/{return_request_id}/reject", response_model=JobOrderReturnRequestResponse)
def reject_return_request(
    return_request_id: int,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    req = db.query(JobOrderReturnRequest).filter(JobOrderReturnRequest.return_request_id == return_request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Return request not found")

    if req.status != JobOrderReturnRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only Pending return requests can be rejected")

    req.status = JobOrderReturnRequestStatus.REJECTED
    req.decided_at = datetime.utcnow()
    req.decided_by_employee_id = getattr(current_user, "employee_id", None)

    db.commit()
    db.refresh(req)
    return req
