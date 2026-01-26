from sqlalchemy import Column, Integer, String, Text, Numeric, Date, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base

class ProformaStatus(str, enum.Enum):
    DRAFT = "Draft"
    SENT = "Sent"
    APPROVED = "Approved"
    CONVERTED = "Converted"
    CANCELLED = "Cancelled"

class Proforma(Base):
    __tablename__ = "proformas"

    proforma_id = Column(Integer, primary_key=True, index=True)
    proforma_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id", ondelete="SET NULL"), nullable=True, index=True)  # Optional - proformas can be standalone
    vehicle_id = Column(Integer, ForeignKey("vehicles.vehicle_id", ondelete="SET NULL"), nullable=True, index=True)
    service_type_id = Column(Integer, ForeignKey("service_types.service_type_id", ondelete="SET NULL"), nullable=True)
    
    # Organization and Customer Info (for insurance proformas)
    organization_name = Column(String(200), nullable=True)  # Insurance company or organization name
    customer_name = Column(String(200), nullable=True)  # External customer name (not in system - for insurance proformas)
    car_model = Column(String(200), nullable=True)  # Car model (e.g., "Toyota Corolla 2020")
    
    # Description fields
    description = Column(Text, nullable=True)  # Custom description of work/services
    notes = Column(Text, nullable=True)  # Additional notes
    
    # Pricing
    subtotal = Column(Numeric(10, 2), default=0.00)
    tax_rate = Column(Numeric(5, 2), default=15.00)
    tax_amount = Column(Numeric(10, 2), default=0.00)
    discount_amount = Column(Numeric(10, 2), default=0.00)
    grand_total = Column(Numeric(10, 2), default=0.00)
    
    # Status and workflow
    status = Column(String(20), default="Draft", index=True)
    valid_until = Column(Date, nullable=True)  # Quote validity period
    
    # Tracking
    created_by = Column(Integer, ForeignKey("employees.employee_id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    printed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Conversion tracking
    converted_to_service_id = Column(Integer, ForeignKey("services.service_id", ondelete="SET NULL"), nullable=True, unique=True)
    
    # Relationships
    customer = relationship("Customer", back_populates="proformas")
    vehicle = relationship("Vehicle", back_populates="proformas")
    service_type = relationship("ServiceType")
    creator = relationship("Employee", foreign_keys=[created_by])
    converted_service = relationship("Service", foreign_keys=[converted_to_service_id], uselist=False)
    items = relationship("ProformaItem", back_populates="proforma", cascade="all, delete-orphan", order_by="ProformaItem.proforma_item_id")

class ProformaItemType(str, enum.Enum):
    SERVICE = "Service"  # Labor/maintenance work
    PART = "Part"  # Replacement parts/materials
    OTHER = "Other"  # Other maintenance costs

class ProformaItem(Base):
    __tablename__ = "proforma_items"

    proforma_item_id = Column(Integer, primary_key=True, index=True)
    proforma_id = Column(Integer, ForeignKey("proformas.proforma_id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Item type - categorizes the item
    item_type = Column(String(20), default="Other", index=True)  # Service, Part, or Other
    
    # Item details - can be from inventory or custom
    part_id = Column(Integer, ForeignKey("parts_inventory.part_id", ondelete="SET NULL"), nullable=True)
    item_name = Column(String(200), nullable=False)  # Description/name of item
    item_description = Column(Text, nullable=True)  # Additional details
    
    # Pricing
    quantity = Column(Numeric(10, 2), default=1.00)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)  # Calculated: quantity * unit_price
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Relationships
    proforma = relationship("Proforma", back_populates="items")
    part = relationship("PartInventory")
    market_prices = relationship("MarketPrice", back_populates="proforma_item", cascade="all, delete-orphan", order_by="MarketPrice.market_price_id")

class MarketPrice(Base):
    __tablename__ = "market_prices"

    market_price_id = Column(Integer, primary_key=True, index=True)
    proforma_item_id = Column(Integer, ForeignKey("proforma_items.proforma_item_id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Organization/competitor information
    organization_name = Column(String(200), nullable=False)  # Name of the organization/supplier
    unit_price = Column(Numeric(10, 2), nullable=False)  # Price from this organization
    notes = Column(Text, nullable=True)  # Additional notes about this price
    
    # Tracking
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    proforma_item = relationship("ProformaItem", back_populates="market_prices")
