from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class JobOrderNoticeTypeCreate(BaseModel):
    notice_type_name: str


class JobOrderNoticeTypeUpdate(BaseModel):
    notice_type_name: Optional[str] = None
    is_active: Optional[bool] = None


class JobOrderNoticeTypeResponse(BaseModel):
    notice_type_id: int
    notice_type_name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
