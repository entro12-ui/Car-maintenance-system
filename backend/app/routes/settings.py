from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.settings import SystemSetting

from pydantic import BaseModel, Field


router = APIRouter()


class SystemSettingBase(BaseModel):
    setting_key: str = Field(..., max_length=100)
    setting_value: Optional[str] = None
    setting_type: Optional[str] = Field(
        default=None, description="Optional type hint: string, int, json, etc."
    )
    category: Optional[str] = Field(
        default=None,
        max_length=50,
        description="Logical group, e.g. garage_location, vehicle_class, job_type",
    )
    description: Optional[str] = None


class SystemSettingCreate(SystemSettingBase):
    pass


class SystemSettingUpdate(BaseModel):
    setting_value: Optional[str] = None
    setting_type: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None


class SystemSettingResponse(SystemSettingBase):
    setting_id: int

    class Config:
        orm_mode = True


@router.get("/", response_model=List[SystemSettingResponse])
def list_settings(
    category: Optional[str] = Query(
        default=None,
        description="Filter by category, e.g. garage_location, vehicle_class, job_type",
    ),
    search: Optional[str] = Query(
        default=None,
        description="Search by key or description (case-insensitive, contains)",
    ),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    List system settings for admin setup pages.
    Can be filtered by category and searched by key/description.
    """
    query = db.query(SystemSetting)

    if category:
        query = query.filter(SystemSetting.category == category)

    if search:
        like = f"%{search}%"
        query = query.filter(
            (SystemSetting.setting_key.ilike(like))
            | (SystemSetting.description.ilike(like))
        )

    query = query.order_by(SystemSetting.setting_key.asc())
    return query.offset(skip).limit(limit).all()


@router.post("/", response_model=SystemSettingResponse)
def create_setting(
    payload: SystemSettingCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new system setting row.
    Used for admin-maintained lookups like garage locations, vehicle classes, etc.
    """
    existing = (
        db.query(SystemSetting)
        .filter(SystemSetting.setting_key == payload.setting_key)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A setting with this key already exists.",
        )

    setting = SystemSetting(
        setting_key=payload.setting_key,
        setting_value=payload.setting_value,
        setting_type=payload.setting_type,
        category=payload.category,
        description=payload.description,
    )
    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


@router.put("/{setting_id}", response_model=SystemSettingResponse)
def update_setting(
    setting_id: int,
    payload: SystemSettingUpdate,
    db: Session = Depends(get_db),
):
    """
    Update a system setting's mutable fields.
    """
    setting = (
        db.query(SystemSetting)
        .filter(SystemSetting.setting_id == setting_id)
        .first()
    )
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found.")

    if payload.setting_value is not None:
        setting.setting_value = payload.setting_value
    if payload.setting_type is not None:
        setting.setting_type = payload.setting_type
    if payload.category is not None:
        setting.category = payload.category
    if payload.description is not None:
        setting.description = payload.description

    db.commit()
    db.refresh(setting)
    return setting


@router.delete("/{setting_id}")
def delete_setting(
    setting_id: int,
    db: Session = Depends(get_db),
):
    """
    Delete a system setting row.
    """
    setting = (
        db.query(SystemSetting)
        .filter(SystemSetting.setting_id == setting_id)
        .first()
    )
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found.")

    db.delete(setting)
    db.commit()
    return {"detail": "Setting deleted successfully."}

