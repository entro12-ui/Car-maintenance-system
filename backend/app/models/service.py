from sqlalchemy import Column, Integer, String, Text, Numeric, Date, DateTime, Time, ForeignKey, Enum, CheckConstraint, Boolean, Computed
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base

class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "Scheduled"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    NO_SHOW = "No Show"

class PaymentStatus(str, enum.Enum):
    PENDING = "Pending"
    PARTIAL = "Partial"
    PAID = "Paid"
    FREE_SERVICE = "Free Service"

class PaymentMethod(str, enum.Enum):
    CASH = "Cash"
    CARD = "Card"
    MOBILE_PAYMENT = "Mobile Payment"
    BANK_TRANSFER = "Bank Transfer"

class ServiceType(Base):
    __tablename__ = "service_types"

    service_type_id = Column(Integer, primary_key=True, index=True)
    type_name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    base_labor_hours = Column(Numeric(4, 2), default=1.00)
    base_labor_cost = Column(Numeric(10, 2), default=0.00)
    mileage_interval = Column(Integer, default=5000)
    time_interval_months = Column(Integer, default=6)
    is_active = Column(Boolean, default=True)

    # Relationships
    checklists = relationship("ServiceChecklist", back_populates="service_type", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="service_type")
    services = relationship("Service", back_populates="service_type")

class ServiceChecklist(Base):
    __tablename__ = "service_checklists"

    checklist_id = Column(Integer, primary_key=True, index=True)
    service_type_id = Column(Integer, ForeignKey("service_types.service_type_id", ondelete="CASCADE"), nullable=False)
    item_name = Column(String(100), nullable=False)
    item_description = Column(Text, nullable=True)
    is_mandatory = Column(Boolean, default=True)
    estimated_duration_minutes = Column(Integer, default=15)
    sort_order = Column(Integer, default=0)

    # Relationships
    service_type = relationship("ServiceType", back_populates="checklists")
    service_parts = relationship("ServicePart", back_populates="checklist_item")

class Appointment(Base):
    __tablename__ = "appointments"

    appointment_id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.vehicle_id", ondelete="CASCADE"), nullable=False)
    service_type_id = Column(Integer, ForeignKey("service_types.service_type_id"), nullable=False)
    scheduled_date = Column(Date, nullable=False, index=True)
    scheduled_time = Column(Time, nullable=False)
    actual_start_time = Column(DateTime(timezone=True), nullable=True)
    actual_end_time = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), default="Scheduled", index=True)
    notes = Column(Text, nullable=True)
    estimated_duration_minutes = Column(Integer, default=60)
    assigned_mechanic_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    # Relationships
    vehicle = relationship("Vehicle", back_populates="appointments")
    service_type = relationship("ServiceType", back_populates="appointments")
    mechanic = relationship("Employee", foreign_keys=[assigned_mechanic_id])
    service = relationship("Service", back_populates="appointment", uselist=False)

class Service(Base):
    __tablename__ = "services"

    service_id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.appointment_id"), unique=True, nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.vehicle_id"), nullable=False, index=True)
    service_type_id = Column(Integer, ForeignKey("service_types.service_type_id"), nullable=False)
    service_date = Column(Date, nullable=False, index=True)
    mileage_at_service = Column(Numeric(10, 2), nullable=False)
    next_service_mileage = Column(Numeric(10, 2), nullable=False)
    next_service_date = Column(Date, nullable=True)
    total_labor_hours = Column(Numeric(5, 2), default=0.00)
    labor_cost_per_hour = Column(Numeric(10, 2), default=1000.00)
    total_labor_cost = Column(Numeric(10, 2), default=0.00)
    total_parts_cost = Column(Numeric(10, 2), default=0.00)
    discount_amount = Column(Numeric(10, 2), default=0.00)
    tax_rate = Column(Numeric(5, 2), default=15.00)
    tax_amount = Column(Numeric(10, 2), default=0.00)
    grand_total = Column(Numeric(10, 2), default=0.00)
    payment_status = Column(String(20), default="Pending")
    payment_method = Column(String(20), nullable=True)
    service_advisor_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=True)
    mechanic_notes = Column(Text, nullable=True)
    customer_feedback = Column(Text, nullable=True)
    rating = Column(Integer, CheckConstraint("rating >= 1 AND rating <= 5"), nullable=True)
    oil_type = Column(String(50), nullable=True)  # e.g., "10 Tul 9000"
    service_note = Column(Text, nullable=True)  # e.g., "1st Service completed"
    reference_number = Column(String(50), nullable=True, index=True)  # e.g., "0006601"
    branch = Column(String(100), nullable=True)  # e.g., "YEKA BRANCH"
    serviced_by_name = Column(String(100), nullable=True)  # Mechanic name
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Relationships
    appointment = relationship("Appointment", back_populates="service")
    vehicle = relationship("Vehicle", back_populates="services")
    service_type = relationship("ServiceType", back_populates="services")
    advisor = relationship("Employee", foreign_keys=[service_advisor_id])
    service_parts = relationship("ServicePart", back_populates="service", cascade="all, delete-orphan")
    loyalty_history = relationship("LoyaltyServiceHistory", back_populates="service")

class ServicePart(Base):
    __tablename__ = "service_parts"

    service_part_id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.service_id", ondelete="CASCADE"), nullable=False, index=True)
    part_id = Column(Integer, ForeignKey("parts_inventory.part_id"), nullable=False)
    checklist_item_id = Column(Integer, ForeignKey("service_checklists.checklist_id"), nullable=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), Computed('quantity * unit_price'), nullable=False)  # Generated column
    was_replaced = Column(Boolean, default=False)
    replacement_reason = Column(Text, nullable=True)
    warranty_months = Column(Integer, default=12)

    # Relationships
    service = relationship("Service", back_populates="service_parts")
    part = relationship("PartInventory", back_populates="service_parts")
    checklist_item = relationship("ServiceChecklist", back_populates="service_parts")



