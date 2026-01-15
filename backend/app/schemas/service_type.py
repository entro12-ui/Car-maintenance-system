from pydantic import BaseModel
from decimal import Decimal
from typing import Optional, List

class ServiceTypeResponse(BaseModel):
    service_type_id: int
    type_name: str
    description: str
    base_labor_hours: Decimal
    mileage_interval: int
    time_interval_months: int
    is_active: bool

    class Config:
        from_attributes = True

class ServiceChecklistItemCreate(BaseModel):
    item_name: str
    item_description: Optional[str] = None
    is_mandatory: bool = True
    estimated_duration_minutes: int = 15
    sort_order: int = 0

class ServiceChecklistItemUpdate(BaseModel):
    item_name: Optional[str] = None
    item_description: Optional[str] = None
    is_mandatory: Optional[bool] = None
    estimated_duration_minutes: Optional[int] = None
    sort_order: Optional[int] = None

class ServiceChecklistItemResponse(BaseModel):
    checklist_id: int
    service_type_id: int
    item_name: str
    item_description: Optional[str] = None
    is_mandatory: bool
    estimated_duration_minutes: int
    sort_order: int

    class Config:
        from_attributes = True

class ServiceTypeWithChecklist(ServiceTypeResponse):
    checklists: List[ServiceChecklistItemResponse] = []



