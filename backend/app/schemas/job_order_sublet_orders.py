from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class JobOrderSubletOrderCreate(BaseModel):
    sublet_work_type_id: int
    quantity: float = 1
    remark: Optional[str] = None
    requested_by_employee_id: Optional[int] = None


class JobOrderSubletOrderUpdate(BaseModel):
    sublet_work_type_id: int
    quantity: float = 1
    remark: Optional[str] = None


class JobOrderSubletOrderDecision(BaseModel):
    decision_remark: Optional[str] = None


class JobOrderSubletOrderReceive(BaseModel):
    delivery_order_number: str


class JobOrderSubletOrderResponse(BaseModel):
    sublet_order_id: int
    sublet_order_number: str

    job_order_id: int
    sublet_work_type_id: int
    supplier_id: Optional[int] = None

    quantity: float
    unit_price: float
    unit_cost: float

    remark: Optional[str] = None

    status: str

    requested_by_employee_id: Optional[int] = None

    created_at: datetime
    finalized_at: Optional[datetime] = None

    decided_at: Optional[datetime] = None
    decided_by_employee_id: Optional[int] = None
    decision_remark: Optional[str] = None

    delivery_order_number: Optional[str] = None
    received_at: Optional[datetime] = None
    received_by_employee_id: Optional[int] = None

    class Config:
        from_attributes = True
