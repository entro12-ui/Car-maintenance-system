from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class PartInventory(Base):
    __tablename__ = "parts_inventory"

    part_id = Column(Integer, primary_key=True, index=True)
    part_code = Column(String(50), unique=True, nullable=False, index=True)
    part_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(20), nullable=True, index=True)
    unit_price = Column(Numeric(10, 2), nullable=False)
    cost_price = Column(Numeric(10, 2), nullable=False)
    stock_quantity = Column(Integer, default=0, index=True)
    min_stock_level = Column(Integer, default=5)
    supplier_id = Column(Integer, nullable=True)
    compatible_models = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    service_parts = relationship("ServicePart", back_populates="part")



