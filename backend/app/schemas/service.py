from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal

class ServicePartCreate(BaseModel):
    part_id: int
    quantity: int = 1
    was_replaced: bool = False
    replacement_reason: Optional[str] = None
    checklist_item_id: Optional[int] = None

class ChecklistItemStatus(BaseModel):
    checklist_item_id: int
    checked: bool = False
    changed: bool = False

class ServiceCreate(BaseModel):
    appointment_id: Optional[int] = None
    vehicle_id: int
    service_type_id: int
    service_date: date
    mileage_at_service: Decimal
    mechanic_notes: Optional[str] = None
    parts: Optional[List[ServicePartCreate]] = []
    checklist_items: Optional[List[int]] = []  # Deprecated: use checklist_status instead
    checklist_status: Optional[List[ChecklistItemStatus]] = []  # Checklist items with checked/changed status
    oil_type: Optional[str] = None  # e.g., "10 Tul 9000"
    service_note: Optional[str] = None  # e.g., "1st Service completed"
    reference_number: Optional[str] = None  # e.g., "0006601"
    branch: Optional[str] = None  # e.g., "YEKA BRANCH"
    serviced_by_name: Optional[str] = None  # Mechanic name

class ServiceUpdate(BaseModel):
    total_labor_hours: Optional[Decimal] = None
    mechanic_notes: Optional[str] = None
    customer_feedback: Optional[str] = None
    rating: Optional[int] = None
    payment_status: Optional[str] = None
    payment_method: Optional[str] = None

class ServiceResponse(BaseModel):
    service_id: int
    appointment_id: Optional[int] = None
    vehicle_id: int
    service_type_id: int
    service_date: date
    mileage_at_service: Decimal
    next_service_mileage: Decimal
    next_service_date: Optional[date] = None
    total_labor_hours: Decimal
    total_labor_cost: Decimal
    total_parts_cost: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    grand_total: Decimal
    payment_status: str
    payment_method: Optional[str] = None
    mechanic_notes: Optional[str] = None
    customer_feedback: Optional[str] = None
    rating: Optional[int] = None
    oil_type: Optional[str] = None
    service_note: Optional[str] = None
    reference_number: Optional[str] = None
    branch: Optional[str] = None
    serviced_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
