from pydantic import BaseModel
from datetime import date
from decimal import Decimal
from typing import Optional

class LoyaltyProgramResponse(BaseModel):
    program_id: int
    program_name: str
    services_required: int
    free_labor_hours: Decimal
    free_parts_discount: Decimal
    valid_days: int
    is_active: bool

    class Config:
        from_attributes = True

class LoyaltyStatusResponse(BaseModel):
    customer_id: int
    loyalty_id: Optional[int] = None
    consecutive_count: int
    total_services: int = 0
    total_services_count: int = 0
    services_required: int
    services_needed: int
    free_service_available: bool
    free_service_expiry: Optional[date] = None
    free_services_earned: int = 0
    free_services_used: int = 0
    last_service_date: Optional[date] = None
    next_service_expected: Optional[date] = None
    eligibility_status: str

    class Config:
        from_attributes = True



