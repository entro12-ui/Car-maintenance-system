from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class LaborTypeCreate(BaseModel):
    labor_type_name: str
    hourly_rate: float = 0


class LaborTypeUpdate(BaseModel):
    labor_type_name: Optional[str] = None
    hourly_rate: Optional[float] = None
    is_active: Optional[bool] = None


class LaborTypeResponse(BaseModel):
    labor_type_id: int
    labor_type_name: str
    hourly_rate: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class JobOrderLaborChargeCreate(BaseModel):
    labor_type_id: int
    hours_worked: float
    technician_employee_id: Optional[int] = None
    remark: Optional[str] = None


class JobOrderLaborChargeResponse(BaseModel):
    labor_charge_id: int
    job_order_id: int
    labor_type_id: int
    technician_employee_id: Optional[int] = None
    hours_worked: float
    hourly_rate: float
    amount: float
    remark: Optional[str] = None
    recorded_by_employee_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
