from __future__ import annotations

from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import date, datetime


# Tasks
class JobOrderTaskCreate(BaseModel):
    task_name: str
    task_description: Optional[str] = None


class JobOrderTaskResponse(BaseModel):
    task_id: int
    job_order_id: int
    task_name: str
    task_description: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Job Order
class JobOrderCreate(BaseModel):
    vehicle_id: int
    customer_id: Optional[int] = None
    service_type_id: Optional[int] = None

    invoice_type: str = "Cash"  # Cash | Credit | ITM

    mileage_in_km: Optional[str] = None
    remarks: Optional[str] = None

    opened_date: Optional[date] = None
    expected_finish_date: Optional[date] = None

    notify_client: Optional[Dict[str, Any]] = None

    tasks: Optional[List[JobOrderTaskCreate]] = []


class JobOrderUpdate(BaseModel):
    invoice_type: Optional[str] = None
    customer_id: Optional[int] = None
    service_type_id: Optional[int] = None
    mileage_in_km: Optional[str] = None
    remarks: Optional[str] = None
    expected_finish_date: Optional[date] = None
    notify_client: Optional[Dict[str, Any]] = None


class JobOrderCloseRequest(BaseModel):
    """Close Job Order utility: tester, test method, and remarks (HillMaster § workflow)."""

    tested_by_employee_id: int
    tested_on_road: bool = False
    tested_on_test_lane: bool = False
    detail_work_description: Optional[str] = None
    close_remark: Optional[str] = None
    send_email: bool = False
    close_date: Optional[date] = None


class JobOrderCopyRequest(BaseModel):
    customer_id: Optional[int] = None
    copy_tasks: bool = True


class AssemblyLineReceiveCreate(BaseModel):
    reference_no: str
    receive_date: date
    requesting_unit: str
    job_order_ids: List[int]


class AssemblyLineReceiveResponse(BaseModel):
    assembly_receive_id: int
    reference_no: str
    receive_date: date
    requesting_unit: str
    job_order_ids: List[int]
    created_at: datetime

    class Config:
        from_attributes = True


class JobOrderPairRequest(BaseModel):
    job_order_id_1: int
    job_order_id_2: int


class JobOrderPairingResponse(BaseModel):
    pairing_id: int
    job_order_id_a: int
    job_order_id_b: int
    paired_at: datetime
    paired_by_employee_id: Optional[int] = None
    unpaired_at: Optional[datetime] = None
    unpaired_by_employee_id: Optional[int] = None

    class Config:
        from_attributes = True


class JobOrderDispatchRequest(BaseModel):
    dispatched_section: str


class JobOrderReceiveRequest(BaseModel):
    received_section: str
    received_vehicle_location: Optional[str] = None


class JobOrderResponse(BaseModel):
    job_order_id: int
    job_order_number: str
    vehicle_id: int
    customer_id: Optional[int] = None
    service_type_id: Optional[int] = None

    invoice_type: str
    status: str

    mileage_in_km: Optional[str] = None
    remarks: Optional[str] = None
    notify_client: Optional[Dict[str, Any]] = None

    opened_date: Optional[date] = None
    expected_finish_date: Optional[date] = None

    dispatched_section: Optional[str] = None
    dispatched_at: Optional[datetime] = None

    received_section: Optional[str] = None
    received_vehicle_location: Optional[str] = None
    received_at: Optional[datetime] = None

    closed_at: Optional[datetime] = None

    is_blocked: bool = False
    blocked_reason: Optional[str] = None
    blocked_at: Optional[datetime] = None
    blocked_by_employee_id: Optional[int] = None

    delivered_at: Optional[datetime] = None
    delivered_by_employee_id: Optional[int] = None
    delivered_to_name: Optional[str] = None
    delivered_to_phone: Optional[str] = None

    vrv_number: Optional[str] = None
    vrv_printed_at: Optional[datetime] = None

    opened_by_employee_id: Optional[int] = None

    close_tested_by_employee_id: Optional[int] = None
    close_tested_on_road: bool = False
    close_tested_on_test_lane: bool = False
    close_work_description: Optional[str] = None
    close_send_email: bool = False
    close_process_remark: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    tasks: List[JobOrderTaskResponse] = []

    class Config:
        from_attributes = True


class JobOrderSplitRequest(BaseModel):
    task_ids: List[int]
    customer_id: Optional[int] = None


class JobOrderSplitResponse(BaseModel):
    original_job_order: JobOrderResponse
    new_job_order: JobOrderResponse


# Clock
class JobClockInRequest(BaseModel):
    task_id: Optional[int] = None
    technician_employee_id: int
    clock_in_remark: Optional[str] = None


class JobClockOutRequest(BaseModel):
    clock_out_reason: str
    clock_out_remark: Optional[str] = None


class JobClockOutReasonUpdateRequest(BaseModel):
    clock_out_reason: str


class JobClockResponse(BaseModel):
    job_clock_id: int
    job_order_id: int
    task_id: Optional[int] = None
    technician_employee_id: Optional[int] = None
    clock_in_at: datetime
    clock_in_remark: Optional[str] = None
    clock_out_at: Optional[datetime] = None
    clock_out_reason: Optional[str] = None
    clock_out_remark: Optional[str] = None

    class Config:
        from_attributes = True


class JobOrderBlockRequest(BaseModel):
    blocked_reason: Optional[str] = None


class JobOrderDeliverRequest(BaseModel):
    delivered_to_name: Optional[str] = None
    delivered_to_phone: Optional[str] = None


class JobOrderVrvCancelRequest(BaseModel):
    reason: Optional[str] = None


class JobOrderQCItemUpsert(BaseModel):
    item_name: str
    passed: Optional[bool] = None
    remark: Optional[str] = None
    sort_order: int = 0
    is_mandatory: bool = True


class JobOrderQCUpsertRequest(BaseModel):
    remarks: Optional[str] = None
    items: List[JobOrderQCItemUpsert] = []
    replace_all: bool = False
    checked_by_employee_id: Optional[int] = None


class JobOrderQCItemResponse(BaseModel):
    qc_item_id: int
    qc_sheet_id: int
    item_name: str
    passed: Optional[bool] = None
    remark: Optional[str] = None
    sort_order: int
    is_mandatory: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class JobOrderQCSheetResponse(BaseModel):
    qc_sheet_id: int
    job_order_id: int
    overall_status: str
    remarks: Optional[str] = None
    checked_by_employee_id: Optional[int] = None
    checked_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    items: List[JobOrderQCItemResponse] = []

    class Config:
        from_attributes = True

# Enquiry
class TechnicianBriefResponse(BaseModel):
    employee_id: int
    employee_code: str
    first_name: str
    last_name: str
    role: str
    specialization: Optional[str] = None


class FreeTechnicianResponse(TechnicianBriefResponse):
    pass


class ClockedInJobResponse(BaseModel):
    job_clock_id: int
    job_order_id: int
    job_order_number: str
    received_section: Optional[str] = None
    technician_employee_id: Optional[int] = None
    technician_name: Optional[str] = None
    task_id: Optional[int] = None
    clock_in_at: datetime


class DispatchedJobResponse(BaseModel):
    job_order_id: int
    job_order_number: str
    vehicle_id: int
    customer_id: Optional[int] = None
    dispatched_section: Optional[str] = None
    dispatched_at: Optional[datetime] = None


class InOutEntryResponse(BaseModel):
    job_clock_id: int
    job_order_id: int
    job_order_number: str
    technician_employee_id: Optional[int] = None
    technician_name: Optional[str] = None
    task_id: Optional[int] = None
    clock_in_at: datetime
    clock_out_at: Optional[datetime] = None
    clock_out_reason: Optional[str] = None


class EndOfDayCheckoutRequest(BaseModel):
    section: Optional[str] = None
    clock_out_reason: str = "End of working day"
    clock_out_remark: Optional[str] = None


class EndOfDayCheckoutResponse(BaseModel):
    clocked_out_count: int
    clocks: List[JobClockResponse] = []
