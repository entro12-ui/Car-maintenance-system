from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
from typing import Optional

class PartBase(BaseModel):
    part_code: str
    part_name: str
    description: Optional[str] = None
    category: Optional[str] = None
    unit_price: Decimal
    cost_price: Decimal
    stock_quantity: int = 0
    min_stock_level: int = 5

class PartCreate(PartBase):
    supplier_id: Optional[int] = None
    compatible_models: Optional[str] = None

class PartUpdate(BaseModel):
    part_name: Optional[str] = None
    description: Optional[str] = None
    unit_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    min_stock_level: Optional[int] = None
    is_active: Optional[bool] = None

class PartResponse(PartBase):
    part_id: int
    supplier_id: Optional[int] = None
    compatible_models: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True



