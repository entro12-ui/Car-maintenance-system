from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
from typing import Optional, List
from decimal import Decimal


class CustomerBase(BaseModel):
    national_id: Optional[str] = None
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    address: Optional[str] = None
    city: Optional[str] = None

    sub_ledger: Optional[str] = None
    tin: Optional[str] = None
    contact_name: Optional[str] = None
    alt_phone: Optional[str] = None
    fax_no: Optional[str] = None
    po_box: Optional[str] = None
    tax_rate: Optional[str] = None
    credit_limit: Optional[Decimal] = None
    invoice_due_days: Optional[int] = None
    price_list_code: Optional[str] = None
    status_label: Optional[str] = None
    gl_coa_code: Optional[str] = None
    gl_coa_name: Optional[str] = None
    gl_category: Optional[str] = None
    gl_customer_type: Optional[str] = None
    allow_credit: Optional[bool] = True
    on_hold: Optional[bool] = False
    is_dealer: Optional[bool] = False
    notes_other: Optional[str] = None
    address_local: Optional[str] = None
    address_foreign: Optional[str] = None


class CustomerCreate(CustomerBase):
    password: Optional[str] = None
    is_active: bool = Field(default=True, description="Admin-created customers are active by default")

    @validator("password")
    def validate_password(cls, v):
        if v is None or v == "":
            return None
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        if len(v) > 72:
            raise ValueError("Password cannot exceed 72 characters (bcrypt limitation)")
        return v


class CustomerUpdate(BaseModel):
    national_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    is_active: Optional[bool] = None

    sub_ledger: Optional[str] = None
    tin: Optional[str] = None
    contact_name: Optional[str] = None
    alt_phone: Optional[str] = None
    fax_no: Optional[str] = None
    po_box: Optional[str] = None
    tax_rate: Optional[str] = None
    credit_limit: Optional[Decimal] = None
    invoice_due_days: Optional[int] = None
    price_list_code: Optional[str] = None
    status_label: Optional[str] = None
    gl_coa_code: Optional[str] = None
    gl_coa_name: Optional[str] = None
    gl_category: Optional[str] = None
    gl_customer_type: Optional[str] = None
    allow_credit: Optional[bool] = None
    on_hold: Optional[bool] = None
    is_dealer: Optional[bool] = None
    notes_other: Optional[str] = None
    address_local: Optional[str] = None
    address_foreign: Optional[str] = None
    password: Optional[str] = None

    @validator("password")
    def validate_password_update(cls, v):
        if v is None or v == "":
            return None
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        if len(v) > 72:
            raise ValueError("Password cannot exceed 72 characters (bcrypt limitation)")
        return v


class CustomerResponse(CustomerBase):
    customer_id: int
    registration_date: datetime
    is_active: bool
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class GLAccountLookupMatch(BaseModel):
    account_id: int
    account_code: str
    account_name: str
    category: Optional[str] = None


class GLAccountLookupResponse(BaseModel):
    matches: List[GLAccountLookupMatch] = []
