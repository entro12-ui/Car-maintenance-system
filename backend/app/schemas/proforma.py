from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal

# Market Price Schemas
class MarketPriceCreate(BaseModel):
    organization_name: str
    unit_price: Decimal
    notes: Optional[str] = None

class MarketPriceUpdate(BaseModel):
    organization_name: Optional[str] = None
    unit_price: Optional[Decimal] = None
    notes: Optional[str] = None

class MarketPriceResponse(BaseModel):
    market_price_id: int
    proforma_item_id: int
    organization_name: str
    unit_price: Decimal
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Proforma Item Schemas
class ProformaItemCreate(BaseModel):
    part_id: Optional[int] = None
    item_type: Optional[str] = "Other"  # Service, Part, or Other
    item_name: str
    item_description: Optional[str] = None
    quantity: Decimal = Decimal("1.00")
    unit_price: Decimal
    notes: Optional[str] = None
    market_prices: Optional[List[MarketPriceCreate]] = []  # Market prices from other organizations

class ProformaItemUpdate(BaseModel):
    item_type: Optional[str] = None
    item_name: Optional[str] = None
    item_description: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None
    notes: Optional[str] = None

class ProformaItemResponse(BaseModel):
    proforma_item_id: int
    proforma_id: int
    part_id: Optional[int] = None
    item_type: str  # Service, Part, or Other
    item_name: str
    item_description: Optional[str] = None
    quantity: Decimal
    unit_price: Decimal
    total_price: Decimal
    notes: Optional[str] = None
    # Part details if linked
    part_code: Optional[str] = None
    part_name: Optional[str] = None
    
    # Market prices from other organizations
    market_prices: List[MarketPriceResponse] = []

    class Config:
        from_attributes = True

# Proforma Schemas
class ProformaCreate(BaseModel):
    customer_id: Optional[int] = None  # Optional - proformas can be standalone
    vehicle_id: Optional[int] = None
    service_type_id: Optional[int] = None
    organization_name: Optional[str] = None  # Insurance company or organization name (required for insurance proformas)
    customer_name: Optional[str] = None  # External customer name (not in car service system - required for insurance proformas)
    car_model: Optional[str] = None  # Car model (e.g., "Toyota Corolla 2020") - required for insurance proformas
    description: Optional[str] = None
    notes: Optional[str] = None
    tax_rate: Optional[Decimal] = Decimal("15.00")
    discount_amount: Optional[Decimal] = Decimal("0.00")
    valid_until: Optional[date] = None
    items: Optional[List[ProformaItemCreate]] = []

class ProformaUpdate(BaseModel):
    vehicle_id: Optional[int] = None
    service_type_id: Optional[int] = None
    organization_name: Optional[str] = None
    customer_name: Optional[str] = None
    car_model: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    tax_rate: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    status: Optional[str] = None
    valid_until: Optional[date] = None

class ProformaResponse(BaseModel):
    proforma_id: int
    proforma_number: str
    customer_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    service_type_id: Optional[int] = None
    organization_name: Optional[str] = None
    customer_name: Optional[str] = None
    car_model: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    subtotal: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    grand_total: Decimal
    status: str
    valid_until: Optional[date] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    printed_at: Optional[datetime] = None
    converted_to_service_id: Optional[int] = None
    
    # Related data
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    vehicle_info: Optional[str] = None  # e.g., "Toyota Corolla - ABC-1234"
    service_type_name: Optional[str] = None
    creator_name: Optional[str] = None
    
    # Items
    items: List[ProformaItemResponse] = []

    class Config:
        from_attributes = True

class ProformaListResponse(BaseModel):
    proforma_id: int
    proforma_number: str
    customer_id: Optional[int] = None
    organization_name: Optional[str] = None  # Insurance company or organization name
    customer_name: Optional[str] = None  # External customer name or linked customer name
    car_model: Optional[str] = None  # External car model
    vehicle_info: Optional[str] = None  # Vehicle info (car_model or linked vehicle)
    grand_total: Decimal
    status: str
    created_at: datetime
    valid_until: Optional[date] = None

    class Config:
        from_attributes = True
