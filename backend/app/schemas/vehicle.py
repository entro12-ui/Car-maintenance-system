from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from decimal import Decimal

class VehicleBase(BaseModel):
    license_plate: str
    vin: Optional[str] = None
    make: str
    model: str
    year: int
    color: Optional[str] = None
    engine_type: Optional[str] = None
    transmission_type: Optional[str] = None
    fuel_type: Optional[str] = None
    current_mileage: Decimal = Decimal("0.00")
    purchase_date: Optional[date] = None

class VehicleCreate(VehicleBase):
    customer_id: Optional[int] = None  # Optional for customer self-registration

class VehicleUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    current_mileage: Optional[Decimal] = None
    next_service_mileage: Optional[Decimal] = None

class VehicleResponse(VehicleBase):
    vehicle_id: int
    customer_id: int
    last_service_mileage: Decimal
    next_service_mileage: Decimal
    created_at: datetime

    class Config:
        from_attributes = True



