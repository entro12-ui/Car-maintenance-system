from sqlalchemy import Column, Integer, String, Numeric, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class LoyaltyProgram(Base):
    __tablename__ = "loyalty_programs"

    program_id = Column(Integer, primary_key=True, index=True)
    program_name = Column(String(100), unique=True, nullable=False)
    services_required = Column(Integer, default=3)
    free_service_type_id = Column(Integer, ForeignKey("service_types.service_type_id"), nullable=True)
    free_labor_hours = Column(Numeric(5, 2), default=3.00)
    free_parts_discount = Column(Numeric(5, 2), default=0.00)
    valid_days = Column(Integer, default=365)
    is_active = Column(Boolean, default=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    customer_loyalties = relationship("CustomerLoyalty", back_populates="program")
    free_service_type = relationship("ServiceType", foreign_keys=[free_service_type_id])

class CustomerLoyalty(Base):
    __tablename__ = "customer_loyalty"

    loyalty_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id", ondelete="CASCADE"), nullable=False)
    program_id = Column(Integer, ForeignKey("loyalty_programs.program_id"), nullable=False)
    consecutive_count = Column(Integer, default=0)
    total_services = Column(Integer, default=0)
    free_services_earned = Column(Integer, default=0)
    free_services_used = Column(Integer, default=0)
    last_service_date = Column(Date, nullable=True)
    next_service_expected = Column(Date, nullable=True)
    current_streak_start = Column(Date, nullable=True)
    free_service_available = Column(Boolean, default=False, index=True)
    free_service_expiry = Column(Date, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    customer = relationship("Customer", back_populates="loyalty")
    program = relationship("LoyaltyProgram", back_populates="customer_loyalties")
    history = relationship("LoyaltyServiceHistory", back_populates="loyalty", cascade="all, delete-orphan")

class LoyaltyServiceHistory(Base):
    __tablename__ = "loyalty_service_history"

    history_id = Column(Integer, primary_key=True, index=True)
    loyalty_id = Column(Integer, ForeignKey("customer_loyalty.loyalty_id", ondelete="CASCADE"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.service_id"), nullable=False)
    counted_for_loyalty = Column(String(5), default="TRUE")
    earned_free_service = Column(String(5), default="FALSE")
    free_service_applied = Column(String(5), default="FALSE")
    discount_amount = Column(Numeric(10, 2), default=0.00)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    loyalty = relationship("CustomerLoyalty", back_populates="history")
    service = relationship("Service", back_populates="loyalty_history")



