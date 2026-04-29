from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class OtherChargeTypeCreate(BaseModel):
    charge_code: str
    charge_category_code: Optional[str] = None
    description: str
    discount_charge_code: Optional[str] = None
    allow_to_journalize: bool = False
    auto_create_journal: bool = False
    taxable: bool = True
    job_type: Optional[str] = None
    section: Optional[str] = None
    unit_of_measure: Optional[str] = None
    unit_price: float = 0
    unit_cost: float = 0
    sub_category: Optional[str] = None


class OtherChargeTypeUpdate(BaseModel):
    charge_code: Optional[str] = None
    charge_category_code: Optional[str] = None
    description: Optional[str] = None
    discount_charge_code: Optional[str] = None
    allow_to_journalize: Optional[bool] = None
    auto_create_journal: Optional[bool] = None
    taxable: Optional[bool] = None
    job_type: Optional[str] = None
    section: Optional[str] = None
    unit_of_measure: Optional[str] = None
    unit_price: Optional[float] = None
    unit_cost: Optional[float] = None
    sub_category: Optional[str] = None
    is_active: Optional[bool] = None


class OtherChargeTypeResponse(BaseModel):
    other_charge_type_id: int
    charge_code: str
    charge_category_code: Optional[str] = None
    description: str
    discount_charge_code: Optional[str] = None
    allow_to_journalize: bool = False
    auto_create_journal: bool = False
    taxable: bool
    job_type: Optional[str] = None
    section: Optional[str] = None
    unit_of_measure: Optional[str] = None
    unit_price: float
    unit_cost: float
    sub_category: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class FuelLubricantItemCreate(BaseModel):
    item_code: str
    description: str
    taxable: bool = True
    section: Optional[str] = None
    unit_of_measure: Optional[str] = None
    unit_price: float = 0
    unit_cost: float = 0


class FuelLubricantItemUpdate(BaseModel):
    item_code: Optional[str] = None
    description: Optional[str] = None
    taxable: Optional[bool] = None
    section: Optional[str] = None
    unit_of_measure: Optional[str] = None
    unit_price: Optional[float] = None
    unit_cost: Optional[float] = None
    is_active: Optional[bool] = None


class FuelLubricantItemResponse(BaseModel):
    fuel_lubricant_id: int
    item_code: str
    description: str
    taxable: bool
    section: Optional[str] = None
    unit_of_measure: Optional[str] = None
    unit_price: float
    unit_cost: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MiscChargeTypeCreate(BaseModel):
    charge_code: str
    description: str
    taxable: bool = True
    job_type: Optional[str] = None
    section: Optional[str] = None
    unit_of_measure: Optional[str] = None
    unit_price: float = 0
    unit_cost: float = 0
    sub_category: Optional[str] = None


class MiscChargeTypeUpdate(BaseModel):
    charge_code: Optional[str] = None
    description: Optional[str] = None
    taxable: Optional[bool] = None
    job_type: Optional[str] = None
    section: Optional[str] = None
    unit_of_measure: Optional[str] = None
    unit_price: Optional[float] = None
    unit_cost: Optional[float] = None
    sub_category: Optional[str] = None
    is_active: Optional[bool] = None


class MiscChargeTypeResponse(BaseModel):
    misc_charge_type_id: int
    charge_code: str
    description: str
    taxable: bool
    job_type: Optional[str] = None
    section: Optional[str] = None
    unit_of_measure: Optional[str] = None
    unit_price: float
    unit_cost: float
    sub_category: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SubletWorkSupplierCreate(BaseModel):
    supplier_name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    fax_no: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    address_line3: Optional[str] = None
    po_box: Optional[str] = None
    supplier_coa_1: Optional[str] = None
    supplier_coa_2: Optional[str] = None
    auto_approve_orders: bool = False
    account_description: Optional[str] = None


class SubletWorkSupplierUpdate(BaseModel):
    supplier_name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    fax_no: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    address_line3: Optional[str] = None
    po_box: Optional[str] = None
    supplier_coa_1: Optional[str] = None
    supplier_coa_2: Optional[str] = None
    auto_approve_orders: Optional[bool] = None
    account_description: Optional[str] = None
    is_active: Optional[bool] = None


class SubletWorkSupplierResponse(BaseModel):
    supplier_id: int
    supplier_name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    fax_no: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    address_line3: Optional[str] = None
    po_box: Optional[str] = None
    supplier_coa_1: Optional[str] = None
    supplier_coa_2: Optional[str] = None
    auto_approve_orders: bool = False
    account_description: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SubletWorkTypeCreate(BaseModel):
    work_code: str
    description: str
    taxable: bool = True
    job_type: Optional[str] = None
    section: Optional[str] = None
    unit_of_measure: Optional[str] = None
    unit_price: float = 0
    unit_cost: float = 0
    sub_category: Optional[str] = None
    supplier_id: Optional[int] = None


class SubletWorkTypeUpdate(BaseModel):
    work_code: Optional[str] = None
    description: Optional[str] = None
    taxable: Optional[bool] = None
    job_type: Optional[str] = None
    section: Optional[str] = None
    unit_of_measure: Optional[str] = None
    unit_price: Optional[float] = None
    unit_cost: Optional[float] = None
    sub_category: Optional[str] = None
    supplier_id: Optional[int] = None
    is_active: Optional[bool] = None


class SubletWorkTypeResponse(BaseModel):
    sublet_work_type_id: int
    work_code: str
    description: str
    taxable: bool
    job_type: Optional[str] = None
    section: Optional[str] = None
    unit_of_measure: Optional[str] = None
    unit_price: float
    unit_cost: float
    sub_category: Optional[str] = None
    supplier_id: Optional[int] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class JobOrderMiscChargeCreate(BaseModel):
    misc_charge_type_id: int
    remark: Optional[str] = None


class JobOrderMiscChargeResponse(BaseModel):
    misc_charge_entry_id: int
    job_order_id: int
    misc_charge_type_id: int
    unit_price: float
    amount: float
    remark: Optional[str] = None
    recorded_by_employee_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class JobOrderFuelLubricantChargeCreate(BaseModel):
    fuel_lubricant_id: int
    quantity: float
    remark: Optional[str] = None


class JobOrderFuelLubricantChargeResponse(BaseModel):
    fuel_lubricant_entry_id: int
    job_order_id: int
    fuel_lubricant_id: int
    quantity: float
    unit_price: float
    amount: float
    remark: Optional[str] = None
    recorded_by_employee_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class JobOrderSubletWorkChargeCreate(BaseModel):
    sublet_work_type_id: int
    quantity: float
    remark: Optional[str] = None


class JobOrderSubletWorkChargeResponse(BaseModel):
    sublet_work_entry_id: int
    job_order_id: int
    sublet_work_type_id: int
    quantity: float
    unit_price: float
    amount: float
    remark: Optional[str] = None
    recorded_by_employee_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class JobOrderOtherChargeCreate(BaseModel):
    other_charge_type_id: int
    quantity: float
    remark: Optional[str] = None


class JobOrderOtherChargeResponse(BaseModel):
    other_charge_entry_id: int
    job_order_id: int
    other_charge_type_id: int
    quantity: float
    unit_price: float
    amount: float
    remark: Optional[str] = None
    recorded_by_employee_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
