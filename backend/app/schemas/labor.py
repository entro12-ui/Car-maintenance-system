from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class LaborTypeCreate(BaseModel):
    labor_code: Optional[str] = None
    labor_type_name: str
    taxable: bool = True
    section: Optional[str] = None
    allowed_for: Optional[str] = None
    sub_category: Optional[str] = None
    price_list_type: Optional[str] = None
    hourly_rate: float = 0
    consumable_charge_code: Optional[str] = None
    unit_cost: float = 0
    department: Optional[str] = None
    start_station: Optional[str] = None
    end_station: Optional[str] = None
    transfer_all_sections: bool = False
    hold_section: bool = False
    take_from_third_party: bool = False


class LaborTypeUpdate(BaseModel):
    labor_code: Optional[str] = None
    labor_type_name: Optional[str] = None
    taxable: Optional[bool] = None
    section: Optional[str] = None
    allowed_for: Optional[str] = None
    sub_category: Optional[str] = None
    price_list_type: Optional[str] = None
    hourly_rate: Optional[float] = None
    consumable_charge_code: Optional[str] = None
    unit_cost: Optional[float] = None
    department: Optional[str] = None
    start_station: Optional[str] = None
    end_station: Optional[str] = None
    transfer_all_sections: Optional[bool] = None
    hold_section: Optional[bool] = None
    take_from_third_party: Optional[bool] = None
    is_active: Optional[bool] = None


class LaborTypeResponse(BaseModel):
    labor_type_id: int
    labor_code: Optional[str] = None
    labor_type_name: str
    taxable: bool = True
    section: Optional[str] = None
    allowed_for: Optional[str] = None
    sub_category: Optional[str] = None
    price_list_type: Optional[str] = None
    hourly_rate: float
    consumable_charge_code: Optional[str] = None
    unit_cost: float = 0
    department: Optional[str] = None
    start_station: Optional[str] = None
    end_station: Optional[str] = None
    transfer_all_sections: bool = False
    hold_section: bool = False
    take_from_third_party: bool = False
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LaborPriceListCreate(BaseModel):
    pl_id: int
    description: str
    rate_per_hour: float
    created_by: Optional[str] = None


class LaborPriceListUpdate(BaseModel):
    pl_id: Optional[int] = None
    description: Optional[str] = None
    rate_per_hour: Optional[float] = None
    created_by: Optional[str] = None
    is_active: Optional[bool] = None


class LaborPriceListResponse(BaseModel):
    labor_price_list_id: int
    pl_id: int
    description: str
    rate_per_hour: float
    created_by: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LaborTypeModelGroupRateCreate(BaseModel):
    model_group_type: str
    std_hours: float = 0
    charge_amount: float = 0
    mfc_hours: float = 0
    job_comp_hours: float = 0


class LaborTypeModelGroupRateUpdate(BaseModel):
    model_group_type: Optional[str] = None
    std_hours: Optional[float] = None
    charge_amount: Optional[float] = None
    mfc_hours: Optional[float] = None
    job_comp_hours: Optional[float] = None


class LaborTypeModelGroupRateResponse(BaseModel):
    labor_type_model_group_rate_id: int
    labor_type_id: int
    model_group_type: str
    std_hours: float
    charge_amount: float
    mfc_hours: float
    job_comp_hours: float
    created_at: datetime

    class Config:
        from_attributes = True


class JobOrderLaborChargeCreate(BaseModel):
    labor_type_id: int
    hours_worked: float
    technician_employee_id: Optional[int] = None
    remark: Optional[str] = None
    mfc_hours: Optional[float] = 0
    repair_option: Optional[str] = None
    price_list_type: Optional[str] = None
    is_charged: bool = False
    charge_code: Optional[str] = None


class JobOrderLaborChargeResponse(BaseModel):
    labor_charge_id: int
    job_order_id: int
    labor_type_id: int
    labor_type_name: Optional[str] = None
    technician_employee_id: Optional[int] = None
    hours_worked: float
    hourly_rate: float
    amount: float
    mfc_hours: float = 0
    repair_option: Optional[str] = None
    price_list_type: Optional[str] = None
    is_charged: bool = False
    charge_code: Optional[str] = None
    remark: Optional[str] = None
    recorded_by_employee_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
