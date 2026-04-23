from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from decimal import Decimal

from app.database import get_db
from app.auth import get_current_admin

from app.models.job_order import JobOrder, JobOrderStatus
from app.models.employee import Employee
from app.models.labor import LaborType, JobOrderLaborCharge
from app.schemas.labor import (
    LaborTypeCreate,
    LaborTypeUpdate,
    LaborTypeResponse,
    JobOrderLaborChargeCreate,
    JobOrderLaborChargeResponse,
)

router = APIRouter()


@router.get("/labor-types", response_model=List[LaborTypeResponse])
def list_labor_types(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    query = db.query(LaborType)
    if active_only:
        query = query.filter(LaborType.is_active == True)
    return query.order_by(func.lower(LaborType.labor_type_name).asc()).all()


@router.post("/labor-types", response_model=LaborTypeResponse)
def create_labor_type(
    payload: LaborTypeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    name = (payload.labor_type_name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="labor_type_name is required")

    if payload.hourly_rate is None or float(payload.hourly_rate) < 0:
        raise HTTPException(status_code=400, detail="hourly_rate must be >= 0")

    existing = (
        db.query(LaborType)
        .filter(func.lower(LaborType.labor_type_name) == func.lower(name))
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Labor type already exists")

    row = LaborType(labor_type_name=name, hourly_rate=payload.hourly_rate, is_active=True)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/labor-types/{labor_type_id}", response_model=LaborTypeResponse)
def update_labor_type(
    labor_type_id: int,
    payload: LaborTypeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = db.query(LaborType).filter(LaborType.labor_type_id == labor_type_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Labor type not found")

    update_data = payload.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "labor_type_name" in update_data and update_data["labor_type_name"] is not None:
        name = (update_data["labor_type_name"] or "").strip()
        if not name:
            raise HTTPException(status_code=400, detail="labor_type_name cannot be empty")

        existing = (
            db.query(LaborType)
            .filter(func.lower(LaborType.labor_type_name) == func.lower(name))
            .filter(LaborType.labor_type_id != labor_type_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Labor type already exists")
        row.labor_type_name = name

    if "hourly_rate" in update_data and update_data["hourly_rate"] is not None:
        if float(update_data["hourly_rate"]) < 0:
            raise HTTPException(status_code=400, detail="hourly_rate must be >= 0")
        row.hourly_rate = update_data["hourly_rate"]

    if "is_active" in update_data and update_data["is_active"] is not None:
        row.is_active = bool(update_data["is_active"])

    db.commit()
    db.refresh(row)
    return row


@router.get("/{job_order_id}/labor-charges", response_model=List[JobOrderLaborChargeResponse])
def list_job_order_labor_charges(
    job_order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    job = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job order not found")

    return (
        db.query(JobOrderLaborCharge)
        .filter(JobOrderLaborCharge.job_order_id == job_order_id)
        .order_by(JobOrderLaborCharge.created_at.asc())
        .all()
    )


@router.post("/{job_order_id}/labor-charges", response_model=JobOrderLaborChargeResponse)
def create_job_order_labor_charge(
    job_order_id: int,
    payload: JobOrderLaborChargeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    job = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job order not found")
    if getattr(job, "is_blocked", False):
        raise HTTPException(status_code=400, detail="Job order is blocked")
    if job.status == JobOrderStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Cannot add labor charges to a cancelled job order")

    if payload.hours_worked is None or float(payload.hours_worked) <= 0:
        raise HTTPException(status_code=400, detail="hours_worked must be > 0")

    labor_type = (
        db.query(LaborType)
        .filter(LaborType.labor_type_id == payload.labor_type_id)
        .first()
    )
    if not labor_type:
        raise HTTPException(status_code=404, detail="Labor type not found")
    if not labor_type.is_active:
        raise HTTPException(status_code=400, detail="Labor type is not active")

    technician_employee_id = payload.technician_employee_id
    if technician_employee_id is not None:
        tech = db.query(Employee).filter(Employee.employee_id == technician_employee_id).first()
        if not tech:
            raise HTTPException(status_code=404, detail="Technician employee not found")

    hourly_rate = Decimal(str(labor_type.hourly_rate))
    hours_worked = Decimal(str(payload.hours_worked))
    amount = hours_worked * hourly_rate

    row = JobOrderLaborCharge(
        job_order_id=job_order_id,
        labor_type_id=labor_type.labor_type_id,
        technician_employee_id=technician_employee_id,
        hours_worked=hours_worked,
        hourly_rate=hourly_rate,
        amount=amount,
        remark=(payload.remark or "").strip() or None,
        recorded_by_employee_id=getattr(current_user, "employee_id", None),
    )

    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{job_order_id}/labor-charges/{labor_charge_id}")
def delete_job_order_labor_charge(
    job_order_id: int,
    labor_charge_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    job = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job order not found")

    row = (
        db.query(JobOrderLaborCharge)
        .filter(JobOrderLaborCharge.labor_charge_id == labor_charge_id)
        .filter(JobOrderLaborCharge.job_order_id == job_order_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Labor charge not found")

    db.delete(row)
    db.commit()
    return {"message": "Deleted"}
