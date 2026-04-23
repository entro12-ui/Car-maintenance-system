from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class JobOrderCustomerNotificationCreate(BaseModel):
    notice_date: date
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    notice_type: str
    remark: Optional[str] = None


class JobOrderCustomerNotificationResponse(BaseModel):
    notification_entry_id: int
    job_order_id: int
    customer_id: Optional[int] = None
    notice_date: date
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    notice_type: str
    remark: Optional[str] = None
    recorded_by_employee_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class JobOrderCustomerNotificationListResponse(BaseModel):
    items: List[JobOrderCustomerNotificationResponse] = []
