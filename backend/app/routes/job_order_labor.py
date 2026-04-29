from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from decimal import Decimal

from app.database import get_db
from app.auth import get_current_admin

from app.models.job_order import JobOrder, JobOrderStatus
from app.models.employee import Employee
from app.models.settings import SystemSetting
from app.models.labor import LaborType, LaborPriceList, LaborTypeModelGroupRate, JobOrderLaborCharge
from app.schemas.labor import (
    LaborTypeCreate,
    LaborTypeUpdate,
    LaborTypeResponse,
    LaborPriceListCreate,
    LaborPriceListUpdate,
    LaborPriceListResponse,
    LaborTypeModelGroupRateCreate,
    LaborTypeModelGroupRateUpdate,
    LaborTypeModelGroupRateResponse,
    JobOrderLaborChargeCreate,
    JobOrderLaborChargeResponse,
)

router = APIRouter()


def _labor_charge_response(row: JobOrderLaborCharge, labor_type_name: Optional[str]) -> JobOrderLaborChargeResponse:
    return JobOrderLaborChargeResponse(
        labor_charge_id=row.labor_charge_id,
        job_order_id=row.job_order_id,
        labor_type_id=row.labor_type_id,
        labor_type_name=labor_type_name,
        technician_employee_id=row.technician_employee_id,
        hours_worked=float(row.hours_worked or 0),
        hourly_rate=float(row.hourly_rate or 0),
        amount=float(row.amount or 0),
        mfc_hours=float(getattr(row, "mfc_hours", 0) or 0),
        repair_option=getattr(row, "repair_option", None),
        price_list_type=getattr(row, "price_list_type", None),
        is_charged=bool(getattr(row, "is_charged", False)),
        charge_code=getattr(row, "charge_code", None),
        remark=row.remark,
        recorded_by_employee_id=row.recorded_by_employee_id,
        created_at=row.created_at,
    )


@router.get("/labor-types", response_model=List[LaborTypeResponse])
def list_labor_types(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    query = db.query(LaborType)
    if active_only:
        query = query.filter(LaborType.is_active == True)
    return query.order_by(
        func.lower(func.coalesce(LaborType.labor_code, "")),
        func.lower(LaborType.labor_type_name).asc(),
    ).all()


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
    for val, name_ in (
        (payload.unit_cost, "unit_cost"),
    ):
        if val is not None and float(val) < 0:
            raise HTTPException(status_code=400, detail=f"{name_} must be >= 0")

    code = (payload.labor_code or "").strip() or None
    if code:
        exists_code = (
            db.query(LaborType)
            .filter(func.lower(LaborType.labor_code) == func.lower(code))
            .first()
        )
        if exists_code:
            raise HTTPException(status_code=400, detail="labor_code already exists")

    existing = (
        db.query(LaborType)
        .filter(func.lower(LaborType.labor_type_name) == func.lower(name))
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Labor type already exists")

    row = LaborType(
        labor_code=code,
        labor_type_name=name,
        taxable=bool(payload.taxable),
        section=(payload.section or "").strip() or None,
        allowed_for=(payload.allowed_for or "").strip() or None,
        sub_category=(payload.sub_category or "").strip() or None,
        price_list_type=(payload.price_list_type or "").strip() or None,
        hourly_rate=payload.hourly_rate,
        consumable_charge_code=(payload.consumable_charge_code or "").strip() or None,
        unit_cost=payload.unit_cost if payload.unit_cost is not None else Decimal("0"),
        department=(payload.department or "").strip() or None,
        start_station=(payload.start_station or "").strip() or None,
        end_station=(payload.end_station or "").strip() or None,
        transfer_all_sections=bool(payload.transfer_all_sections),
        hold_section=bool(payload.hold_section),
        take_from_third_party=bool(payload.take_from_third_party),
        is_active=True,
    )
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

    if "labor_code" in update_data:
        code = (update_data.get("labor_code") or "").strip() or None
        if code:
            exists_code = (
                db.query(LaborType)
                .filter(func.lower(LaborType.labor_code) == func.lower(code))
                .filter(LaborType.labor_type_id != labor_type_id)
                .first()
            )
            if exists_code:
                raise HTTPException(status_code=400, detail="labor_code already exists")
        row.labor_code = code

    if "taxable" in update_data and update_data["taxable"] is not None:
        row.taxable = bool(update_data["taxable"])

    for key in ("section", "allowed_for", "sub_category", "price_list_type"):
        if key in update_data:
            v = update_data.get(key)
            setattr(row, key, (v or "").strip() or None)

    if "hourly_rate" in update_data and update_data["hourly_rate"] is not None:
        if float(update_data["hourly_rate"]) < 0:
            raise HTTPException(status_code=400, detail="hourly_rate must be >= 0")
        row.hourly_rate = update_data["hourly_rate"]

    if "consumable_charge_code" in update_data:
        v = update_data.get("consumable_charge_code")
        row.consumable_charge_code = (v or "").strip() or None

    if "unit_cost" in update_data and update_data["unit_cost"] is not None:
        if float(update_data["unit_cost"]) < 0:
            raise HTTPException(status_code=400, detail="unit_cost must be >= 0")
        row.unit_cost = update_data["unit_cost"]

    for key in ("department", "start_station", "end_station"):
        if key in update_data:
            v = update_data.get(key)
            setattr(row, key, (v or "").strip() or None)

    for key in ("transfer_all_sections", "hold_section", "take_from_third_party"):
        if key in update_data and update_data[key] is not None:
            setattr(row, key, bool(update_data[key]))

    if "is_active" in update_data and update_data["is_active"] is not None:
        row.is_active = bool(update_data["is_active"])

    db.commit()
    db.refresh(row)
    return row


@router.get("/labor-types/{labor_type_id}/model-group-rates", response_model=List[LaborTypeModelGroupRateResponse])
def list_labor_type_model_group_rates(
    labor_type_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = db.query(LaborType).filter(LaborType.labor_type_id == labor_type_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Labor type not found")
    rates = (
        db.query(LaborTypeModelGroupRate)
        .filter(LaborTypeModelGroupRate.labor_type_id == labor_type_id)
        .order_by(func.lower(LaborTypeModelGroupRate.model_group_type).asc())
        .all()
    )
    return rates


@router.post("/labor-types/{labor_type_id}/model-group-rates", response_model=LaborTypeModelGroupRateResponse)
def create_labor_type_model_group_rate(
    labor_type_id: int,
    payload: LaborTypeModelGroupRateCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = db.query(LaborType).filter(LaborType.labor_type_id == labor_type_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Labor type not found")

    model_group_type = (payload.model_group_type or "").strip()
    if not model_group_type:
        raise HTTPException(status_code=400, detail="model_group_type is required")
    for val, name_ in (
        (payload.std_hours, "std_hours"),
        (payload.charge_amount, "charge_amount"),
        (payload.mfc_hours, "mfc_hours"),
        (payload.job_comp_hours, "job_comp_hours"),
    ):
        if val is None or float(val) < 0:
            raise HTTPException(status_code=400, detail=f"{name_} must be >= 0")

    exists = (
        db.query(LaborTypeModelGroupRate)
        .filter(LaborTypeModelGroupRate.labor_type_id == labor_type_id)
        .filter(func.lower(LaborTypeModelGroupRate.model_group_type) == func.lower(model_group_type))
        .first()
    )
    if exists:
        raise HTTPException(status_code=400, detail="Model group already exists for this labor type")

    new_row = LaborTypeModelGroupRate(
        labor_type_id=labor_type_id,
        model_group_type=model_group_type,
        std_hours=payload.std_hours,
        charge_amount=payload.charge_amount,
        mfc_hours=payload.mfc_hours,
        job_comp_hours=payload.job_comp_hours,
    )
    db.add(new_row)
    db.commit()
    db.refresh(new_row)
    return new_row


@router.put(
    "/labor-types/{labor_type_id}/model-group-rates/{labor_type_model_group_rate_id}",
    response_model=LaborTypeModelGroupRateResponse,
)
def update_labor_type_model_group_rate(
    labor_type_id: int,
    labor_type_model_group_rate_id: int,
    payload: LaborTypeModelGroupRateUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = (
        db.query(LaborTypeModelGroupRate)
        .filter(LaborTypeModelGroupRate.labor_type_model_group_rate_id == labor_type_model_group_rate_id)
        .filter(LaborTypeModelGroupRate.labor_type_id == labor_type_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Model group rate not found")

    update_data = payload.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "model_group_type" in update_data and update_data["model_group_type"] is not None:
        v = (update_data["model_group_type"] or "").strip()
        if not v:
            raise HTTPException(status_code=400, detail="model_group_type cannot be empty")
        exists = (
            db.query(LaborTypeModelGroupRate)
            .filter(LaborTypeModelGroupRate.labor_type_id == labor_type_id)
            .filter(func.lower(LaborTypeModelGroupRate.model_group_type) == func.lower(v))
            .filter(LaborTypeModelGroupRate.labor_type_model_group_rate_id != labor_type_model_group_rate_id)
            .first()
        )
        if exists:
            raise HTTPException(status_code=400, detail="Model group already exists for this labor type")
        row.model_group_type = v

    for key in ("std_hours", "charge_amount", "mfc_hours", "job_comp_hours"):
        if key in update_data and update_data[key] is not None:
            if float(update_data[key]) < 0:
                raise HTTPException(status_code=400, detail=f"{key} must be >= 0")
            setattr(row, key, update_data[key])

    db.commit()
    db.refresh(row)
    return row


@router.delete("/labor-types/{labor_type_id}/model-group-rates/{labor_type_model_group_rate_id}")
def delete_labor_type_model_group_rate(
    labor_type_id: int,
    labor_type_model_group_rate_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = (
        db.query(LaborTypeModelGroupRate)
        .filter(LaborTypeModelGroupRate.labor_type_model_group_rate_id == labor_type_model_group_rate_id)
        .filter(LaborTypeModelGroupRate.labor_type_id == labor_type_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Model group rate not found")
    db.delete(row)
    db.commit()
    return {"message": "Deleted"}


@router.post("/labor-types/{labor_type_id}/model-group-rates/apply-all", response_model=List[LaborTypeModelGroupRateResponse])
def apply_model_group_rate_to_all_groups(
    labor_type_id: int,
    payload: LaborTypeModelGroupRateCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = db.query(LaborType).filter(LaborType.labor_type_id == labor_type_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Labor type not found")

    groups = db.query(SystemSetting).filter(SystemSetting.category == "vehicle_model_group").all()
    if not groups:
        raise HTTPException(status_code=400, detail="No model groups found in settings category vehicle_model_group")

    created = []
    for g in groups:
        group_name = (g.setting_value or g.setting_key or "").strip()
        if not group_name:
            continue
        exists = (
            db.query(LaborTypeModelGroupRate)
            .filter(LaborTypeModelGroupRate.labor_type_id == labor_type_id)
            .filter(func.lower(LaborTypeModelGroupRate.model_group_type) == func.lower(group_name))
            .first()
        )
        if exists:
            continue
        new_row = LaborTypeModelGroupRate(
            labor_type_id=labor_type_id,
            model_group_type=group_name,
            std_hours=payload.std_hours,
            charge_amount=payload.charge_amount,
            mfc_hours=payload.mfc_hours,
            job_comp_hours=payload.job_comp_hours,
        )
        db.add(new_row)
        created.append(new_row)

    db.commit()
    return created


@router.get("/labor-price-lists", response_model=List[LaborPriceListResponse])
def list_labor_price_lists(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    query = db.query(LaborPriceList)
    if active_only:
        query = query.filter(LaborPriceList.is_active == True)
    return query.order_by(LaborPriceList.pl_id.asc()).all()


@router.post("/labor-price-lists", response_model=LaborPriceListResponse)
def create_labor_price_list(
    payload: LaborPriceListCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    desc = (payload.description or "").strip()
    if payload.pl_id is None:
        raise HTTPException(status_code=400, detail="pl_id is required")
    if not desc:
        raise HTTPException(status_code=400, detail="description is required")
    if payload.rate_per_hour is None or float(payload.rate_per_hour) < 0:
        raise HTTPException(status_code=400, detail="rate_per_hour must be >= 0")

    exists_pl = db.query(LaborPriceList).filter(LaborPriceList.pl_id == payload.pl_id).first()
    if exists_pl:
        raise HTTPException(status_code=400, detail="PL Id already exists")

    row = LaborPriceList(
        pl_id=payload.pl_id,
        description=desc,
        rate_per_hour=payload.rate_per_hour,
        created_by=(payload.created_by or "").strip() or getattr(current_user, "username", None),
        is_active=True,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/labor-price-lists/{labor_price_list_id}", response_model=LaborPriceListResponse)
def update_labor_price_list(
    labor_price_list_id: int,
    payload: LaborPriceListUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = db.query(LaborPriceList).filter(LaborPriceList.labor_price_list_id == labor_price_list_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Labor price list not found")

    update_data = payload.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "pl_id" in update_data and update_data["pl_id"] is not None:
        exists_pl = (
            db.query(LaborPriceList)
            .filter(LaborPriceList.pl_id == update_data["pl_id"])
            .filter(LaborPriceList.labor_price_list_id != labor_price_list_id)
            .first()
        )
        if exists_pl:
            raise HTTPException(status_code=400, detail="PL Id already exists")
        row.pl_id = update_data["pl_id"]

    if "description" in update_data and update_data["description"] is not None:
        desc = (update_data["description"] or "").strip()
        if not desc:
            raise HTTPException(status_code=400, detail="description cannot be empty")
        row.description = desc

    if "rate_per_hour" in update_data and update_data["rate_per_hour"] is not None:
        if float(update_data["rate_per_hour"]) < 0:
            raise HTTPException(status_code=400, detail="rate_per_hour must be >= 0")
        row.rate_per_hour = update_data["rate_per_hour"]

    if "created_by" in update_data:
        row.created_by = (update_data["created_by"] or "").strip() or None

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

    rows = (
        db.query(JobOrderLaborCharge, LaborType.labor_type_name)
        .join(LaborType, LaborType.labor_type_id == JobOrderLaborCharge.labor_type_id)
        .filter(JobOrderLaborCharge.job_order_id == job_order_id)
        .order_by(JobOrderLaborCharge.created_at.asc())
        .all()
    )
    return [_labor_charge_response(lc, name) for lc, name in rows]


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

    if payload.hours_worked is None or float(payload.hours_worked) < 0:
        raise HTTPException(status_code=400, detail="hours_worked must be >= 0")

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
    mfc_hours = Decimal(str(payload.mfc_hours if payload.mfc_hours is not None else 0))

    row = JobOrderLaborCharge(
        job_order_id=job_order_id,
        labor_type_id=labor_type.labor_type_id,
        technician_employee_id=technician_employee_id,
        hours_worked=hours_worked,
        hourly_rate=hourly_rate,
        amount=amount,
        mfc_hours=mfc_hours,
        repair_option=(payload.repair_option or "").strip() or None,
        price_list_type=(payload.price_list_type or "").strip() or None,
        is_charged=bool(payload.is_charged),
        charge_code=(payload.charge_code or "").strip() or None,
        remark=(payload.remark or "").strip() or None,
        recorded_by_employee_id=getattr(current_user, "employee_id", None),
    )

    db.add(row)
    db.commit()
    db.refresh(row)
    return _labor_charge_response(row, labor_type.labor_type_name)


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
