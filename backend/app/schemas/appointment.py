from pydantic import BaseModel
from datetime import date, time, datetime
from typing import Optional

class AppointmentBase(BaseModel):
    vehicle_id: int
    service_type_id: int
    scheduled_date: date
    scheduled_time: time
    notes: Optional[str] = None
    estimated_duration_minutes: int = 60

class AppointmentCreate(AppointmentBase):
    assigned_mechanic_id: Optional[int] = None

class AppointmentUpdate(BaseModel):
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    assigned_mechanic_id: Optional[int] = None
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None

class AppointmentResponse(AppointmentBase):
    appointment_id: int
    status: str
    assigned_mechanic_id: Optional[int] = None
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True



