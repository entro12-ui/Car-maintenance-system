from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.auth import get_current_admin

from app.models.job_order_notice_type import JobOrderNoticeType
from app.schemas.job_order_notice_type import (
    JobOrderNoticeTypeCreate,
    JobOrderNoticeTypeUpdate,
    JobOrderNoticeTypeResponse,
)

router = APIRouter()


@router.get("/notice-types", response_model=List[JobOrderNoticeTypeResponse])
def list_notice_types(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    query = db.query(JobOrderNoticeType)
    if active_only:
        query = query.filter(JobOrderNoticeType.is_active == True)
    return query.order_by(func.lower(JobOrderNoticeType.notice_type_name).asc()).all()


@router.post("/notice-types", response_model=JobOrderNoticeTypeResponse)
def create_notice_type(
    payload: JobOrderNoticeTypeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    name = (payload.notice_type_name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="notice_type_name is required")

    existing = (
        db.query(JobOrderNoticeType)
        .filter(func.lower(JobOrderNoticeType.notice_type_name) == func.lower(name))
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Notice type already exists")

    row = JobOrderNoticeType(notice_type_name=name, is_active=True)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/notice-types/{notice_type_id}", response_model=JobOrderNoticeTypeResponse)
def update_notice_type(
    notice_type_id: int,
    payload: JobOrderNoticeTypeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = db.query(JobOrderNoticeType).filter(JobOrderNoticeType.notice_type_id == notice_type_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Notice type not found")

    update_data = payload.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "notice_type_name" in update_data and update_data["notice_type_name"] is not None:
        name = (update_data["notice_type_name"] or "").strip()
        if not name:
            raise HTTPException(status_code=400, detail="notice_type_name cannot be empty")

        existing = (
            db.query(JobOrderNoticeType)
            .filter(func.lower(JobOrderNoticeType.notice_type_name) == func.lower(name))
            .filter(JobOrderNoticeType.notice_type_id != notice_type_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Notice type already exists")
        row.notice_type_name = name

    if "is_active" in update_data and update_data["is_active"] is not None:
        row.is_active = bool(update_data["is_active"])

    db.commit()
    db.refresh(row)
    return row
