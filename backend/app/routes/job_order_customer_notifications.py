from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from typing import List

from app.database import get_db
from app.auth import get_current_admin

from app.models.job_order import JobOrder
from app.models.job_order_customer_notification import JobOrderCustomerNotificationEntry
from app.models.job_order_notice_type import JobOrderNoticeType
from app.schemas.job_order_customer_notification import (
    JobOrderCustomerNotificationCreate,
    JobOrderCustomerNotificationResponse,
)

router = APIRouter()


@router.post("/{job_order_id}/customer-notifications", response_model=JobOrderCustomerNotificationResponse)
def create_customer_notification_entry(
    job_order_id: int,
    payload: JobOrderCustomerNotificationCreate,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    job_order = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job_order:
        raise HTTPException(status_code=404, detail="Job order not found")

    notice_type = (payload.notice_type or "").strip()
    if not notice_type:
        raise HTTPException(status_code=400, detail="notice_type is required")

    notice_type_row = (
        db.query(JobOrderNoticeType)
        .filter(JobOrderNoticeType.notice_type_name.ilike(notice_type))
        .filter(JobOrderNoticeType.is_active == True)
        .first()
    )
    if not notice_type_row:
        raise HTTPException(status_code=400, detail="Invalid or inactive notice_type")

    if payload.notice_date is None:
        raise HTTPException(status_code=400, detail="notice_date is required")

    entry = JobOrderCustomerNotificationEntry(
        job_order_id=job_order_id,
        customer_id=job_order.customer_id,
        notice_date=payload.notice_date,
        contact_name=payload.contact_name,
        contact_phone=payload.contact_phone,
        notice_type=notice_type_row.notice_type_name,
        remark=payload.remark,
        recorded_by_employee_id=getattr(current_user, "employee_id", None),
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/{job_order_id}/customer-notifications", response_model=List[JobOrderCustomerNotificationResponse])
def list_customer_notification_entries(job_order_id: int, db: Session = Depends(get_db)):
    job_order = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job_order:
        raise HTTPException(status_code=404, detail="Job order not found")

    return (
        db.query(JobOrderCustomerNotificationEntry)
        .filter(JobOrderCustomerNotificationEntry.job_order_id == job_order_id)
        .order_by(JobOrderCustomerNotificationEntry.notice_date.desc(), JobOrderCustomerNotificationEntry.created_at.desc())
        .all()
    )
