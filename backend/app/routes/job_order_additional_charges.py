from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from decimal import Decimal

from app.database import get_db
from app.auth import get_current_admin

from app.models.job_order import JobOrder, JobOrderStatus
from app.models.job_order_additional_charges import (
    OtherChargeType,
    FuelLubricantItem,
    MiscChargeType,
    SubletWorkSupplier,
    SubletWorkType,
    JobOrderMiscCharge,
    JobOrderFuelLubricantCharge,
    JobOrderSubletWorkCharge,
    JobOrderOtherCharge,
)
from app.schemas.job_order_additional_charges import (
    OtherChargeTypeCreate,
    OtherChargeTypeUpdate,
    OtherChargeTypeResponse,
    FuelLubricantItemCreate,
    FuelLubricantItemUpdate,
    FuelLubricantItemResponse,
    MiscChargeTypeCreate,
    MiscChargeTypeUpdate,
    MiscChargeTypeResponse,
    SubletWorkSupplierCreate,
    SubletWorkSupplierUpdate,
    SubletWorkSupplierResponse,
    SubletWorkTypeCreate,
    SubletWorkTypeUpdate,
    SubletWorkTypeResponse,
    JobOrderMiscChargeCreate,
    JobOrderMiscChargeResponse,
    JobOrderFuelLubricantChargeCreate,
    JobOrderFuelLubricantChargeResponse,
    JobOrderFuelLubricantChargeOdometerPatch,
    JobOrderSubletWorkChargeCreate,
    JobOrderSubletWorkChargeResponse,
    JobOrderOtherChargeCreate,
    JobOrderOtherChargeResponse,
)

router = APIRouter()


def _clean_code(code: str) -> str:
    return (code or "").strip()


def _clean_text(text: str) -> str:
    return (text or "").strip()


def _ensure_job_open_for_charges(job: JobOrder):
    if getattr(job, "is_blocked", False):
        raise HTTPException(status_code=400, detail="Job order is blocked")
    if job.status == JobOrderStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Cannot add charges to a cancelled job order")


# --- Maintenance: Other Charge Types ---


@router.get("/other-charge-types", response_model=List[OtherChargeTypeResponse])
def list_other_charge_types(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    query = db.query(OtherChargeType)
    if active_only:
        query = query.filter(OtherChargeType.is_active == True)
    return query.order_by(func.lower(OtherChargeType.charge_code).asc()).all()


@router.post("/other-charge-types", response_model=OtherChargeTypeResponse)
def create_other_charge_type(
    payload: OtherChargeTypeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    code = _clean_code(payload.charge_code)
    desc = _clean_text(payload.description)
    if not code:
        raise HTTPException(status_code=400, detail="charge_code is required")
    if not desc:
        raise HTTPException(status_code=400, detail="description is required")

    existing = db.query(OtherChargeType).filter(func.lower(OtherChargeType.charge_code) == func.lower(code)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Charge code already exists")

    if float(payload.unit_price) < 0 or float(payload.unit_cost) < 0:
        raise HTTPException(status_code=400, detail="unit_price and unit_cost must be >= 0")

    row = OtherChargeType(
        charge_code=code,
        charge_category_code=_clean_text(payload.charge_category_code) or None,
        description=desc,
        discount_charge_code=_clean_text(payload.discount_charge_code) or None,
        allow_to_journalize=bool(payload.allow_to_journalize),
        auto_create_journal=bool(payload.auto_create_journal),
        taxable=bool(payload.taxable),
        job_type=_clean_text(payload.job_type) or None,
        section=_clean_text(payload.section) or None,
        unit_of_measure=_clean_text(payload.unit_of_measure) or None,
        unit_price=payload.unit_price,
        unit_cost=payload.unit_cost,
        sub_category=_clean_text(payload.sub_category) or None,
        is_active=True,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/other-charge-types/{other_charge_type_id}", response_model=OtherChargeTypeResponse)
def update_other_charge_type(
    other_charge_type_id: int,
    payload: OtherChargeTypeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = db.query(OtherChargeType).filter(OtherChargeType.other_charge_type_id == other_charge_type_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Other charge type not found")

    update_data = payload.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "charge_code" in update_data and update_data["charge_code"] is not None:
        code = _clean_code(update_data["charge_code"])
        if not code:
            raise HTTPException(status_code=400, detail="charge_code cannot be empty")
        existing = (
            db.query(OtherChargeType)
            .filter(func.lower(OtherChargeType.charge_code) == func.lower(code))
            .filter(OtherChargeType.other_charge_type_id != other_charge_type_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Charge code already exists")
        row.charge_code = code

    if "description" in update_data and update_data["description"] is not None:
        desc = _clean_text(update_data["description"])
        if not desc:
            raise HTTPException(status_code=400, detail="description cannot be empty")
        row.description = desc

    if "taxable" in update_data and update_data["taxable"] is not None:
        row.taxable = bool(update_data["taxable"])

    for key in (
        "charge_category_code",
        "discount_charge_code",
        "job_type",
        "section",
        "unit_of_measure",
        "sub_category",
    ):
        if key in update_data:
            val = update_data[key]
            setattr(row, key, _clean_text(val) or None)

    for key in ("allow_to_journalize", "auto_create_journal"):
        if key in update_data and update_data[key] is not None:
            setattr(row, key, bool(update_data[key]))

    if "unit_price" in update_data and update_data["unit_price"] is not None:
        if float(update_data["unit_price"]) < 0:
            raise HTTPException(status_code=400, detail="unit_price must be >= 0")
        row.unit_price = update_data["unit_price"]

    if "unit_cost" in update_data and update_data["unit_cost"] is not None:
        if float(update_data["unit_cost"]) < 0:
            raise HTTPException(status_code=400, detail="unit_cost must be >= 0")
        row.unit_cost = update_data["unit_cost"]

    if "is_active" in update_data and update_data["is_active"] is not None:
        row.is_active = bool(update_data["is_active"])

    db.commit()
    db.refresh(row)
    return row


# --- Maintenance: Fuel & Lubricants ---


@router.get("/fuel-lubricants", response_model=List[FuelLubricantItemResponse])
def list_fuel_lubricants(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    query = db.query(FuelLubricantItem)
    if active_only:
        query = query.filter(FuelLubricantItem.is_active == True)
    return query.order_by(func.lower(FuelLubricantItem.item_code).asc()).all()


@router.post("/fuel-lubricants", response_model=FuelLubricantItemResponse)
def create_fuel_lubricant(
    payload: FuelLubricantItemCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    code = _clean_code(payload.item_code)
    desc = _clean_text(payload.description)
    if not code:
        raise HTTPException(status_code=400, detail="item_code is required")
    if not desc:
        raise HTTPException(status_code=400, detail="description is required")

    existing = db.query(FuelLubricantItem).filter(func.lower(FuelLubricantItem.item_code) == func.lower(code)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Item code already exists")

    if float(payload.unit_price) < 0 or float(payload.unit_cost) < 0:
        raise HTTPException(status_code=400, detail="unit_price and unit_cost must be >= 0")

    row = FuelLubricantItem(
        item_code=code,
        description=desc,
        taxable=bool(payload.taxable),
        section=_clean_text(payload.section) or None,
        unit_of_measure=_clean_text(payload.unit_of_measure) or None,
        unit_price=payload.unit_price,
        unit_cost=payload.unit_cost,
        is_active=True,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/fuel-lubricants/{fuel_lubricant_id}", response_model=FuelLubricantItemResponse)
def update_fuel_lubricant(
    fuel_lubricant_id: int,
    payload: FuelLubricantItemUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = db.query(FuelLubricantItem).filter(FuelLubricantItem.fuel_lubricant_id == fuel_lubricant_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Fuel/lubricant item not found")

    update_data = payload.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "item_code" in update_data and update_data["item_code"] is not None:
        code = _clean_code(update_data["item_code"])
        if not code:
            raise HTTPException(status_code=400, detail="item_code cannot be empty")
        existing = (
            db.query(FuelLubricantItem)
            .filter(func.lower(FuelLubricantItem.item_code) == func.lower(code))
            .filter(FuelLubricantItem.fuel_lubricant_id != fuel_lubricant_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Item code already exists")
        row.item_code = code

    if "description" in update_data and update_data["description"] is not None:
        desc = _clean_text(update_data["description"])
        if not desc:
            raise HTTPException(status_code=400, detail="description cannot be empty")
        row.description = desc

    if "taxable" in update_data and update_data["taxable"] is not None:
        row.taxable = bool(update_data["taxable"])

    for key in ("section", "unit_of_measure"):
        if key in update_data:
            setattr(row, key, _clean_text(update_data[key]) or None)

    if "unit_price" in update_data and update_data["unit_price"] is not None:
        if float(update_data["unit_price"]) < 0:
            raise HTTPException(status_code=400, detail="unit_price must be >= 0")
        row.unit_price = update_data["unit_price"]

    if "unit_cost" in update_data and update_data["unit_cost"] is not None:
        if float(update_data["unit_cost"]) < 0:
            raise HTTPException(status_code=400, detail="unit_cost must be >= 0")
        row.unit_cost = update_data["unit_cost"]

    if "is_active" in update_data and update_data["is_active"] is not None:
        row.is_active = bool(update_data["is_active"])

    db.commit()
    db.refresh(row)
    return row


# --- Maintenance: Misc Charge Types ---


@router.get("/misc-charge-types", response_model=List[MiscChargeTypeResponse])
def list_misc_charge_types(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    query = db.query(MiscChargeType)
    if active_only:
        query = query.filter(MiscChargeType.is_active == True)
    return query.order_by(func.lower(MiscChargeType.charge_code).asc()).all()


@router.post("/misc-charge-types", response_model=MiscChargeTypeResponse)
def create_misc_charge_type(
    payload: MiscChargeTypeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    code = _clean_code(payload.charge_code)
    desc = _clean_text(payload.description)
    if not code:
        raise HTTPException(status_code=400, detail="charge_code is required")
    if not desc:
        raise HTTPException(status_code=400, detail="description is required")

    existing = db.query(MiscChargeType).filter(func.lower(MiscChargeType.charge_code) == func.lower(code)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Charge code already exists")

    if float(payload.unit_price) < 0 or float(payload.unit_cost) < 0:
        raise HTTPException(status_code=400, detail="unit_price and unit_cost must be >= 0")

    row = MiscChargeType(
        charge_code=code,
        description=desc,
        taxable=bool(payload.taxable),
        job_type=_clean_text(payload.job_type) or None,
        section=_clean_text(payload.section) or None,
        unit_of_measure=_clean_text(payload.unit_of_measure) or None,
        unit_price=payload.unit_price,
        unit_cost=payload.unit_cost,
        sub_category=_clean_text(payload.sub_category) or None,
        is_active=True,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/misc-charge-types/{misc_charge_type_id}", response_model=MiscChargeTypeResponse)
def update_misc_charge_type(
    misc_charge_type_id: int,
    payload: MiscChargeTypeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = db.query(MiscChargeType).filter(MiscChargeType.misc_charge_type_id == misc_charge_type_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Misc charge type not found")

    update_data = payload.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "charge_code" in update_data and update_data["charge_code"] is not None:
        code = _clean_code(update_data["charge_code"])
        if not code:
            raise HTTPException(status_code=400, detail="charge_code cannot be empty")
        existing = (
            db.query(MiscChargeType)
            .filter(func.lower(MiscChargeType.charge_code) == func.lower(code))
            .filter(MiscChargeType.misc_charge_type_id != misc_charge_type_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Charge code already exists")
        row.charge_code = code

    if "description" in update_data and update_data["description"] is not None:
        desc = _clean_text(update_data["description"])
        if not desc:
            raise HTTPException(status_code=400, detail="description cannot be empty")
        row.description = desc

    if "taxable" in update_data and update_data["taxable"] is not None:
        row.taxable = bool(update_data["taxable"])

    for key in ("job_type", "section", "unit_of_measure", "sub_category"):
        if key in update_data:
            val = update_data[key]
            setattr(row, key, _clean_text(val) or None)

    if "unit_price" in update_data and update_data["unit_price"] is not None:
        if float(update_data["unit_price"]) < 0:
            raise HTTPException(status_code=400, detail="unit_price must be >= 0")
        row.unit_price = update_data["unit_price"]

    if "unit_cost" in update_data and update_data["unit_cost"] is not None:
        if float(update_data["unit_cost"]) < 0:
            raise HTTPException(status_code=400, detail="unit_cost must be >= 0")
        row.unit_cost = update_data["unit_cost"]

    if "is_active" in update_data and update_data["is_active"] is not None:
        row.is_active = bool(update_data["is_active"])

    db.commit()
    db.refresh(row)
    return row


# --- Maintenance: Sublet Work Suppliers ---


@router.get("/sublet-work-suppliers", response_model=List[SubletWorkSupplierResponse])
def list_sublet_work_suppliers(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    query = db.query(SubletWorkSupplier)
    if active_only:
        query = query.filter(SubletWorkSupplier.is_active == True)
    return query.order_by(func.lower(SubletWorkSupplier.supplier_name).asc()).all()


@router.post("/sublet-work-suppliers", response_model=SubletWorkSupplierResponse)
def create_sublet_work_supplier(
    payload: SubletWorkSupplierCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    name = _clean_text(payload.supplier_name)
    if not name:
        raise HTTPException(status_code=400, detail="supplier_name is required")

    existing = db.query(SubletWorkSupplier).filter(func.lower(SubletWorkSupplier.supplier_name) == func.lower(name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Supplier already exists")

    row = SubletWorkSupplier(
        supplier_name=name,
        contact_person=_clean_text(payload.contact_person) or None,
        phone=_clean_text(payload.phone) or None,
        fax_no=_clean_text(payload.fax_no) or None,
        email=_clean_text(payload.email) or None,
        address=_clean_text(payload.address) or None,
        address_line1=_clean_text(payload.address_line1) or None,
        address_line2=_clean_text(payload.address_line2) or None,
        address_line3=_clean_text(payload.address_line3) or None,
        po_box=_clean_text(payload.po_box) or None,
        supplier_coa_1=_clean_text(payload.supplier_coa_1) or None,
        supplier_coa_2=_clean_text(payload.supplier_coa_2) or None,
        auto_approve_orders=bool(payload.auto_approve_orders),
        account_description=_clean_text(payload.account_description) or None,
        is_active=True,
    )

    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/sublet-work-suppliers/{supplier_id}", response_model=SubletWorkSupplierResponse)
def update_sublet_work_supplier(
    supplier_id: int,
    payload: SubletWorkSupplierUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = db.query(SubletWorkSupplier).filter(SubletWorkSupplier.supplier_id == supplier_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Supplier not found")

    update_data = payload.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "supplier_name" in update_data and update_data["supplier_name"] is not None:
        name = _clean_text(update_data["supplier_name"])
        if not name:
            raise HTTPException(status_code=400, detail="supplier_name cannot be empty")

        existing = (
            db.query(SubletWorkSupplier)
            .filter(func.lower(SubletWorkSupplier.supplier_name) == func.lower(name))
            .filter(SubletWorkSupplier.supplier_id != supplier_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Supplier already exists")
        row.supplier_name = name

    for key in (
        "contact_person",
        "phone",
        "fax_no",
        "email",
        "address",
        "address_line1",
        "address_line2",
        "address_line3",
        "po_box",
        "supplier_coa_1",
        "supplier_coa_2",
        "account_description",
    ):
        if key in update_data:
            setattr(row, key, _clean_text(update_data[key]) or None)

    if "auto_approve_orders" in update_data and update_data["auto_approve_orders"] is not None:
        row.auto_approve_orders = bool(update_data["auto_approve_orders"])

    if "is_active" in update_data and update_data["is_active"] is not None:
        row.is_active = bool(update_data["is_active"])

    db.commit()
    db.refresh(row)
    return row


# --- Maintenance: Sublet Work Types ---


@router.get("/sublet-work-types", response_model=List[SubletWorkTypeResponse])
def list_sublet_work_types(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    query = db.query(SubletWorkType)
    if active_only:
        query = query.filter(SubletWorkType.is_active == True)
    return query.order_by(func.lower(SubletWorkType.work_code).asc()).all()


@router.post("/sublet-work-types", response_model=SubletWorkTypeResponse)
def create_sublet_work_type(
    payload: SubletWorkTypeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    code = _clean_code(payload.work_code)
    desc = _clean_text(payload.description)
    if not code:
        raise HTTPException(status_code=400, detail="work_code is required")
    if not desc:
        raise HTTPException(status_code=400, detail="description is required")

    existing = db.query(SubletWorkType).filter(func.lower(SubletWorkType.work_code) == func.lower(code)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Work code already exists")

    if float(payload.unit_price) < 0 or float(payload.unit_cost) < 0:
        raise HTTPException(status_code=400, detail="unit_price and unit_cost must be >= 0")

    supplier_id = payload.supplier_id
    if supplier_id is not None:
        supplier = db.query(SubletWorkSupplier).filter(SubletWorkSupplier.supplier_id == supplier_id).first()
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")

    row = SubletWorkType(
        work_code=code,
        description=desc,
        taxable=bool(payload.taxable),
        job_type=_clean_text(payload.job_type) or None,
        section=_clean_text(payload.section) or None,
        unit_of_measure=_clean_text(payload.unit_of_measure) or None,
        unit_price=payload.unit_price,
        unit_cost=payload.unit_cost,
        sub_category=_clean_text(payload.sub_category) or None,
        supplier_id=supplier_id,
        is_active=True,
    )

    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/sublet-work-types/{sublet_work_type_id}", response_model=SubletWorkTypeResponse)
def update_sublet_work_type(
    sublet_work_type_id: int,
    payload: SubletWorkTypeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = db.query(SubletWorkType).filter(SubletWorkType.sublet_work_type_id == sublet_work_type_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Sublet work type not found")

    update_data = payload.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "work_code" in update_data and update_data["work_code"] is not None:
        code = _clean_code(update_data["work_code"])
        if not code:
            raise HTTPException(status_code=400, detail="work_code cannot be empty")
        existing = (
            db.query(SubletWorkType)
            .filter(func.lower(SubletWorkType.work_code) == func.lower(code))
            .filter(SubletWorkType.sublet_work_type_id != sublet_work_type_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Work code already exists")
        row.work_code = code

    if "description" in update_data and update_data["description"] is not None:
        desc = _clean_text(update_data["description"])
        if not desc:
            raise HTTPException(status_code=400, detail="description cannot be empty")
        row.description = desc

    if "taxable" in update_data and update_data["taxable"] is not None:
        row.taxable = bool(update_data["taxable"])

    for key in ("job_type", "section", "unit_of_measure", "sub_category"):
        if key in update_data:
            val = update_data[key]
            setattr(row, key, _clean_text(val) or None)

    if "unit_price" in update_data and update_data["unit_price"] is not None:
        if float(update_data["unit_price"]) < 0:
            raise HTTPException(status_code=400, detail="unit_price must be >= 0")
        row.unit_price = update_data["unit_price"]

    if "unit_cost" in update_data and update_data["unit_cost"] is not None:
        if float(update_data["unit_cost"]) < 0:
            raise HTTPException(status_code=400, detail="unit_cost must be >= 0")
        row.unit_cost = update_data["unit_cost"]

    if "supplier_id" in update_data and update_data["supplier_id"] is not None:
        supplier_id = update_data["supplier_id"]
        if supplier_id is not None:
            supplier = db.query(SubletWorkSupplier).filter(SubletWorkSupplier.supplier_id == supplier_id).first()
            if not supplier:
                raise HTTPException(status_code=404, detail="Supplier not found")
        row.supplier_id = supplier_id

    if "is_active" in update_data and update_data["is_active"] is not None:
        row.is_active = bool(update_data["is_active"])

    db.commit()
    db.refresh(row)
    return row


# --- Job Order Entry: Misc Charges ---


@router.get("/{job_order_id}/misc-charges", response_model=List[JobOrderMiscChargeResponse])
def list_job_order_misc_charges(
    job_order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    job = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job order not found")

    return (
        db.query(JobOrderMiscCharge)
        .filter(JobOrderMiscCharge.job_order_id == job_order_id)
        .order_by(JobOrderMiscCharge.created_at.asc())
        .all()
    )


@router.post("/{job_order_id}/misc-charges", response_model=JobOrderMiscChargeResponse)
def create_job_order_misc_charge(
    job_order_id: int,
    payload: JobOrderMiscChargeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    job = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job order not found")
    _ensure_job_open_for_charges(job)

    charge_type = db.query(MiscChargeType).filter(MiscChargeType.misc_charge_type_id == payload.misc_charge_type_id).first()
    if not charge_type:
        raise HTTPException(status_code=404, detail="Misc charge type not found")
    if not charge_type.is_active:
        raise HTTPException(status_code=400, detail="Misc charge type is not active")

    unit_price = Decimal(str(charge_type.unit_price))
    amount = unit_price

    row = JobOrderMiscCharge(
        job_order_id=job_order_id,
        misc_charge_type_id=charge_type.misc_charge_type_id,
        unit_price=unit_price,
        amount=amount,
        remark=_clean_text(payload.remark) or None,
        recorded_by_employee_id=getattr(current_user, "employee_id", None),
    )

    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{job_order_id}/misc-charges/{misc_charge_entry_id}")
def delete_job_order_misc_charge(
    job_order_id: int,
    misc_charge_entry_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = (
        db.query(JobOrderMiscCharge)
        .filter(JobOrderMiscCharge.job_order_id == job_order_id)
        .filter(JobOrderMiscCharge.misc_charge_entry_id == misc_charge_entry_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Misc charge entry not found")

    db.delete(row)
    db.commit()
    return {"message": "Deleted"}


# --- Job Order Entry: Fuel & Lubricant Charges ---


@router.get("/{job_order_id}/fuel-lubricant-charges", response_model=List[JobOrderFuelLubricantChargeResponse])
def list_job_order_fuel_lubricant_charges(
    job_order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    job = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job order not found")

    return (
        db.query(JobOrderFuelLubricantCharge)
        .filter(JobOrderFuelLubricantCharge.job_order_id == job_order_id)
        .order_by(JobOrderFuelLubricantCharge.created_at.asc())
        .all()
    )


@router.post("/{job_order_id}/fuel-lubricant-charges", response_model=JobOrderFuelLubricantChargeResponse)
def create_job_order_fuel_lubricant_charge(
    job_order_id: int,
    payload: JobOrderFuelLubricantChargeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    job = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job order not found")
    _ensure_job_open_for_charges(job)

    if payload.quantity is None or float(payload.quantity) <= 0:
        raise HTTPException(status_code=400, detail="quantity must be > 0")

    item = db.query(FuelLubricantItem).filter(FuelLubricantItem.fuel_lubricant_id == payload.fuel_lubricant_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Fuel/lubricant item not found")
    if not item.is_active:
        raise HTTPException(status_code=400, detail="Fuel/lubricant item is not active")

    unit_price = Decimal(str(item.unit_price))
    qty = Decimal(str(payload.quantity))
    amount = qty * unit_price

    odometer_dec: Optional[Decimal] = None
    if payload.odometer_km is not None:
        if float(payload.odometer_km) < 0:
            raise HTTPException(status_code=400, detail="odometer_km must be >= 0")
        odometer_dec = Decimal(str(payload.odometer_km))

    row = JobOrderFuelLubricantCharge(
        job_order_id=job_order_id,
        fuel_lubricant_id=item.fuel_lubricant_id,
        quantity=qty,
        unit_price=unit_price,
        amount=amount,
        remark=_clean_text(payload.remark) or None,
        odometer_km=odometer_dec,
        recorded_by_employee_id=getattr(current_user, "employee_id", None),
    )

    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put(
    "/{job_order_id}/fuel-lubricant-charges/{fuel_lubricant_entry_id}",
    response_model=JobOrderFuelLubricantChargeResponse,
)
def patch_job_order_fuel_lubricant_charge_odometer(
    job_order_id: int,
    fuel_lubricant_entry_id: int,
    payload: JobOrderFuelLubricantChargeOdometerPatch,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Correct odometer / KM stored on a fuel & lubricant charge line."""
    job = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job order not found")
    _ensure_job_open_for_charges(job)

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields supplied")

    row = (
        db.query(JobOrderFuelLubricantCharge)
        .filter(JobOrderFuelLubricantCharge.job_order_id == job_order_id)
        .filter(JobOrderFuelLubricantCharge.fuel_lubricant_entry_id == fuel_lubricant_entry_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Fuel/lubricant charge entry not found")

    if "odometer_km" in updates:
        v = updates["odometer_km"]
        if v is not None and float(v) < 0:
            raise HTTPException(status_code=400, detail="odometer_km must be >= 0")
        row.odometer_km = Decimal(str(v)) if v is not None else None

    db.commit()
    db.refresh(row)
    return row


@router.delete("/{job_order_id}/fuel-lubricant-charges/{fuel_lubricant_entry_id}")
def delete_job_order_fuel_lubricant_charge(
    job_order_id: int,
    fuel_lubricant_entry_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = (
        db.query(JobOrderFuelLubricantCharge)
        .filter(JobOrderFuelLubricantCharge.job_order_id == job_order_id)
        .filter(JobOrderFuelLubricantCharge.fuel_lubricant_entry_id == fuel_lubricant_entry_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Fuel/lubricant charge entry not found")

    db.delete(row)
    db.commit()
    return {"message": "Deleted"}


# --- Job Order Entry: Sublet Work Charges ---


@router.get("/{job_order_id}/sublet-work-charges", response_model=List[JobOrderSubletWorkChargeResponse])
def list_job_order_sublet_work_charges(
    job_order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    job = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job order not found")

    return (
        db.query(JobOrderSubletWorkCharge)
        .filter(JobOrderSubletWorkCharge.job_order_id == job_order_id)
        .order_by(JobOrderSubletWorkCharge.created_at.asc())
        .all()
    )


@router.post("/{job_order_id}/sublet-work-charges", response_model=JobOrderSubletWorkChargeResponse)
def create_job_order_sublet_work_charge(
    job_order_id: int,
    payload: JobOrderSubletWorkChargeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    job = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job order not found")
    _ensure_job_open_for_charges(job)

    if payload.quantity is None or float(payload.quantity) <= 0:
        raise HTTPException(status_code=400, detail="quantity must be > 0")

    work = db.query(SubletWorkType).filter(SubletWorkType.sublet_work_type_id == payload.sublet_work_type_id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Sublet work type not found")
    if not work.is_active:
        raise HTTPException(status_code=400, detail="Sublet work type is not active")

    unit_price = Decimal(str(work.unit_price))
    qty = Decimal(str(payload.quantity))
    amount = qty * unit_price

    row = JobOrderSubletWorkCharge(
        job_order_id=job_order_id,
        sublet_work_type_id=work.sublet_work_type_id,
        quantity=qty,
        unit_price=unit_price,
        amount=amount,
        remark=_clean_text(payload.remark) or None,
        recorded_by_employee_id=getattr(current_user, "employee_id", None),
    )

    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{job_order_id}/sublet-work-charges/{sublet_work_entry_id}")
def delete_job_order_sublet_work_charge(
    job_order_id: int,
    sublet_work_entry_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = (
        db.query(JobOrderSubletWorkCharge)
        .filter(JobOrderSubletWorkCharge.job_order_id == job_order_id)
        .filter(JobOrderSubletWorkCharge.sublet_work_entry_id == sublet_work_entry_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Sublet work charge entry not found")

    db.delete(row)
    db.commit()
    return {"message": "Deleted"}


# --- Job Order Entry: Other Charges ---


@router.get("/{job_order_id}/other-charges", response_model=List[JobOrderOtherChargeResponse])
def list_job_order_other_charges(
    job_order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    job = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job order not found")

    return (
        db.query(JobOrderOtherCharge)
        .filter(JobOrderOtherCharge.job_order_id == job_order_id)
        .order_by(JobOrderOtherCharge.created_at.asc())
        .all()
    )


@router.post("/{job_order_id}/other-charges", response_model=JobOrderOtherChargeResponse)
def create_job_order_other_charge(
    job_order_id: int,
    payload: JobOrderOtherChargeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    job = db.query(JobOrder).filter(JobOrder.job_order_id == job_order_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job order not found")
    _ensure_job_open_for_charges(job)

    if payload.quantity is None or float(payload.quantity) <= 0:
        raise HTTPException(status_code=400, detail="quantity must be > 0")

    charge_type = db.query(OtherChargeType).filter(OtherChargeType.other_charge_type_id == payload.other_charge_type_id).first()
    if not charge_type:
        raise HTTPException(status_code=404, detail="Other charge type not found")
    if not charge_type.is_active:
        raise HTTPException(status_code=400, detail="Other charge type is not active")

    unit_price = Decimal(str(charge_type.unit_price))
    qty = Decimal(str(payload.quantity))
    amount = qty * unit_price

    row = JobOrderOtherCharge(
        job_order_id=job_order_id,
        other_charge_type_id=charge_type.other_charge_type_id,
        quantity=qty,
        unit_price=unit_price,
        amount=amount,
        remark=_clean_text(payload.remark) or None,
        recorded_by_employee_id=getattr(current_user, "employee_id", None),
    )

    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{job_order_id}/other-charges/{other_charge_entry_id}")
def delete_job_order_other_charge(
    job_order_id: int,
    other_charge_entry_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = (
        db.query(JobOrderOtherCharge)
        .filter(JobOrderOtherCharge.job_order_id == job_order_id)
        .filter(JobOrderOtherCharge.other_charge_entry_id == other_charge_entry_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Other charge entry not found")

    db.delete(row)
    db.commit()
    return {"message": "Deleted"}
