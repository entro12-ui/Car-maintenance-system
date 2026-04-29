from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth import get_current_admin
from app.database import get_db
from app.models.gl import GLAccount
from app.models.gl_account_setup import GLAccountSetup, GLAccountSetupType
from app.models.job_order_additional_charges import (
    FuelLubricantItem,
    MiscChargeType,
    OtherChargeType,
    SubletWorkType,
)
from app.models.labor import LaborType
from app.models.part import PartInventory
from app.models.service import ServiceType
from app.models.settings import SystemSetting

router = APIRouter()


VALID_TYPES = {
    GLAccountSetupType.PARTS,
    GLAccountSetupType.FUEL_LUB,
    GLAccountSetupType.LABOUR,
    GLAccountSetupType.MISCELLANEOUS,
    GLAccountSetupType.OTHER_CHARGE,
    GLAccountSetupType.SUB_LET,
}


class GLAccountSetupBase(BaseModel):
    material_type: str = Field(..., max_length=30)
    parts_group_code: Optional[str] = Field(default=None, max_length=80)
    service_type_id: Optional[int] = None
    maintenance_section: Optional[str] = Field(default=None, max_length=120)
    job_type: Optional[str] = Field(default=None, max_length=120)
    garage_location: Optional[str] = Field(default=None, max_length=120)

    stock_account_id: Optional[int] = None
    wip_account_id: Optional[int] = None
    cgs_account_id: Optional[int] = None
    sales_account_id: Optional[int] = None
    discount_account_id: Optional[int] = None
    vat_account_id: Optional[int] = None


class GLAccountSetupUpdate(BaseModel):
    parts_group_code: Optional[str] = None
    service_type_id: Optional[int] = None
    maintenance_section: Optional[str] = None
    job_type: Optional[str] = None
    garage_location: Optional[str] = None

    stock_account_id: Optional[int] = None
    wip_account_id: Optional[int] = None
    cgs_account_id: Optional[int] = None
    sales_account_id: Optional[int] = None
    discount_account_id: Optional[int] = None
    vat_account_id: Optional[int] = None


class GLAccountSetupResponse(GLAccountSetupBase):
    setup_id: int
    created_by_user_id: Optional[int] = None
    updated_by_user_id: Optional[int] = None

    class Config:
        from_attributes = True


class SetupOption(BaseModel):
    value: str
    label: str


class SetupOptionsResponse(BaseModel):
    part_groups: List[SetupOption] = []
    fuel_lub_types: List[SetupOption] = []
    labour_types: List[SetupOption] = []
    miscellaneous_types: List[SetupOption] = []
    other_charge_types: List[SetupOption] = []
    sub_let_types: List[SetupOption] = []
    service_types: List[SetupOption] = []
    maintenance_sections: List[SetupOption] = []
    job_types: List[SetupOption] = []
    locations: List[SetupOption] = []


def _validate_type(material_type: str) -> str:
    t = (material_type or "").strip().upper()
    if t not in VALID_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid material_type. Allowed: {sorted(VALID_TYPES)}")
    return t


def _validate_account_ids(db: Session, payload: GLAccountSetupBase):
    for account_id in [
        payload.stock_account_id,
        payload.wip_account_id,
        payload.cgs_account_id,
        payload.sales_account_id,
        payload.discount_account_id,
        payload.vat_account_id,
    ]:
        if account_id is None:
            continue
        row = db.query(GLAccount).filter(GLAccount.account_id == account_id).first()
        if not row:
            raise HTTPException(status_code=400, detail=f"Invalid account id: {account_id}")


@router.get("/options", response_model=SetupOptionsResponse)
def get_gl_account_setup_options(
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_admin),
):
    part_rows = (
        db.query(PartInventory.category)
        .filter(PartInventory.category.isnot(None))
        .distinct()
        .all()
    )
    part_groups = [
        SetupOption(value=str(r.category), label=str(r.category))
        for r in part_rows
        if str(r.category).strip()
    ]
    part_groups = sorted(part_groups, key=lambda x: x.label.lower())

    fuel_lub_types = [
        SetupOption(value=str(r.item_code), label=f"{r.item_code} - {r.description}")
        for r in db.query(FuelLubricantItem)
        .filter(FuelLubricantItem.is_active == True)  # noqa: E712
        .order_by(FuelLubricantItem.item_code.asc())
        .all()
    ]
    labour_types = [
        SetupOption(value=str(r.labor_type_name), label=str(r.labor_type_name))
        for r in db.query(LaborType)
        .filter(LaborType.is_active == True)  # noqa: E712
        .order_by(LaborType.labor_type_name.asc())
        .all()
    ]
    miscellaneous_types = [
        SetupOption(value=str(r.charge_code), label=f"{r.charge_code} - {r.description}")
        for r in db.query(MiscChargeType)
        .filter(MiscChargeType.is_active == True)  # noqa: E712
        .order_by(MiscChargeType.charge_code.asc())
        .all()
    ]
    other_charge_types = [
        SetupOption(value=str(r.charge_code), label=f"{r.charge_code} - {r.description}")
        for r in db.query(OtherChargeType)
        .filter(OtherChargeType.is_active == True)  # noqa: E712
        .order_by(OtherChargeType.charge_code.asc())
        .all()
    ]
    sub_let_types = [
        SetupOption(value=str(r.work_code), label=f"{r.work_code} - {r.description}")
        for r in db.query(SubletWorkType)
        .filter(SubletWorkType.is_active == True)  # noqa: E712
        .order_by(SubletWorkType.work_code.asc())
        .all()
    ]

    service_types = [
        SetupOption(value=str(r.service_type_id), label=f"{r.type_name} - {r.service_type_id}")
        for r in db.query(ServiceType).order_by(ServiceType.type_name.asc()).all()
    ]

    def settings_opts(category: str) -> List[SetupOption]:
        rows = (
            db.query(SystemSetting)
            .filter(SystemSetting.category == category)
            .order_by(SystemSetting.setting_key.asc())
            .all()
        )
        return [
            SetupOption(
                value=(r.setting_value or r.setting_key),
                label=(r.setting_value or r.setting_key),
            )
            for r in rows
            if (r.setting_value or r.setting_key)
        ]

    return SetupOptionsResponse(
        part_groups=part_groups,
        fuel_lub_types=fuel_lub_types,
        labour_types=labour_types,
        miscellaneous_types=miscellaneous_types,
        other_charge_types=other_charge_types,
        sub_let_types=sub_let_types,
        service_types=service_types,
        maintenance_sections=settings_opts("repair_section"),
        job_types=settings_opts("job_type"),
        locations=settings_opts("garage_location"),
    )


@router.get("/", response_model=List[GLAccountSetupResponse])
def list_gl_account_setups(
    material_type: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_admin),
):
    q = db.query(GLAccountSetup).order_by(GLAccountSetup.created_at.desc())
    if material_type:
        q = q.filter(GLAccountSetup.material_type == _validate_type(material_type))
    return q.all()


@router.post("/", response_model=GLAccountSetupResponse)
def create_gl_account_setup(
    payload: GLAccountSetupBase,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    payload.material_type = _validate_type(payload.material_type)
    _validate_account_ids(db, payload)

    row = GLAccountSetup(
        **payload.dict(),
        created_by_user_id=getattr(current_user, "user_id", None),
        updated_by_user_id=getattr(current_user, "user_id", None),
    )
    db.add(row)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Duplicate setup scope already exists.")
    db.refresh(row)
    return row


@router.put("/{setup_id}", response_model=GLAccountSetupResponse)
def update_gl_account_setup(
    setup_id: int,
    payload: GLAccountSetupUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = db.query(GLAccountSetup).filter(GLAccountSetup.setup_id == setup_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="GL account setup row not found.")

    data = payload.dict(exclude_unset=True)
    for account_field in [
        "stock_account_id",
        "wip_account_id",
        "cgs_account_id",
        "sales_account_id",
        "discount_account_id",
        "vat_account_id",
    ]:
        if account_field in data and data[account_field] is not None:
            account_id = data[account_field]
            acc = db.query(GLAccount).filter(GLAccount.account_id == account_id).first()
            if not acc:
                raise HTTPException(status_code=400, detail=f"Invalid account id: {account_id}")

    for k, v in data.items():
        setattr(row, k, v)
    row.updated_by_user_id = getattr(current_user, "user_id", None)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Duplicate setup scope already exists.")
    db.refresh(row)
    return row

