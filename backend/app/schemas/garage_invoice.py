from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


class EligibleJobOrderResponse(BaseModel):
    job_order_id: int
    job_order_number: str
    invoice_type: str

    customer_id: Optional[int] = None
    customer_name: Optional[str] = None

    vehicle_id: int
    plate_number: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None


class GarageInvoiceCreate(BaseModel):
    job_order_id: int
    invoice_type: str  # Cash | Credit | ITM


class GarageInvoiceResponse(BaseModel):
    invoice_id: int
    invoice_number: str

    job_order_id: int
    invoice_type: str
    status: str

    subtotal: float
    labor_total: float
    parts_total: float
    charges_total: float

    discount_rate: float
    discount_amount: float
    total_amount: float

    is_collected: bool
    collected_at: Optional[datetime] = None

    issued_by_employee_id: Optional[int] = None

    cancel_reason: Optional[str] = None
    cancel_letter_reference: Optional[str] = None
    cancelled_at: Optional[datetime] = None

    return_reason: Optional[str] = None
    return_letter_reference: Optional[str] = None
    returned_at: Optional[datetime] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GarageInvoiceCancelReturnRequest(BaseModel):
    reason: str
    letter_reference: Optional[str] = None


class UncollectedInvoicesResponse(BaseModel):
    invoice_id: int
    invoice_number: str
    invoice_type: str
    job_order_id: int
    job_order_number: str
    customer_name: Optional[str] = None
    total_amount: float
    created_at: datetime


class ClearUncollectedRequest(BaseModel):
    invoice_ids: Optional[List[int]] = None


class DiscountRateEntryCreate(BaseModel):
    scope: str  # JobOrder | Customer
    job_order_id: Optional[int] = None
    customer_id: Optional[int] = None

    discount_rate: float
    remark: Optional[str] = None
    authority_name: Optional[str] = None

    valid_from: Optional[date] = None
    valid_to: Optional[date] = None


class DiscountRateEntryResponse(BaseModel):
    discount_entry_id: int
    scope: str
    job_order_id: Optional[int] = None
    customer_id: Optional[int] = None

    discount_rate: float
    remark: Optional[str] = None
    authority_name: Optional[str] = None

    valid_from: Optional[date] = None
    valid_to: Optional[date] = None

    recorded_by_employee_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InvoiceLineLabor(BaseModel):
    labor_type_name: str
    hours_worked: float
    hourly_rate: float
    amount: float
    technician_name: Optional[str] = None
    remark: Optional[str] = None


class InvoiceLinePart(BaseModel):
    part_id: int
    part_name: str
    quantity: int
    unit_price: float
    amount: float


class InvoiceLineCharge(BaseModel):
    category: str
    code: str
    description: str
    quantity: float
    unit_price: float
    amount: float
    remark: Optional[str] = None


class GarageInvoicePrintResponse(BaseModel):
    invoice: GarageInvoiceResponse

    job_order_number: str
    job_order_status: str
    closed_at: Optional[datetime] = None

    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None

    vehicle_plate: Optional[str] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None

    labor_lines: List[InvoiceLineLabor] = []
    part_lines: List[InvoiceLinePart] = []
    charge_lines: List[InvoiceLineCharge] = []
