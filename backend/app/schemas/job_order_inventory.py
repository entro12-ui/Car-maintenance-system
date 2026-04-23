from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# Item Issues (MRV)
class JobOrderItemIssueCreate(BaseModel):
    issued_by_employee_id: Optional[int] = None
    remarks: Optional[str] = None


class JobOrderItemIssueLineAdd(BaseModel):
    part_id: int
    quantity: int


class JobOrderItemIssueLineResponse(BaseModel):
    issue_line_id: int
    issue_id: int
    part_id: int
    quantity: int
    unit_price: float
    created_at: datetime

    class Config:
        from_attributes = True


class JobOrderItemIssueResponse(BaseModel):
    issue_id: int
    issue_number: str
    job_order_id: int
    status: str
    issued_by_employee_id: Optional[int] = None
    remarks: Optional[str] = None
    created_at: datetime
    finalized_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    lines: List[JobOrderItemIssueLineResponse] = []

    class Config:
        from_attributes = True


# Returns
class JobOrderReturnRequestLineCreate(BaseModel):
    part_id: int
    quantity: int
    remark: Optional[str] = None


class JobOrderReturnRequestCreate(BaseModel):
    reason: Optional[str] = None
    authority_name: Optional[str] = None
    requested_by_employee_id: Optional[int] = None
    items: List[JobOrderReturnRequestLineCreate] = []


class JobOrderReturnRequestLineResponse(BaseModel):
    return_line_id: int
    return_request_id: int
    part_id: int
    quantity: int
    remark: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class JobOrderReturnRequestResponse(BaseModel):
    return_request_id: int
    return_number: str
    issue_id: int
    job_order_id: int
    status: str
    reason: Optional[str] = None
    authority_name: Optional[str] = None
    requested_by_employee_id: Optional[int] = None
    created_at: datetime
    decided_at: Optional[datetime] = None
    decided_by_employee_id: Optional[int] = None
    lines: List[JobOrderReturnRequestLineResponse] = []

    class Config:
        from_attributes = True
