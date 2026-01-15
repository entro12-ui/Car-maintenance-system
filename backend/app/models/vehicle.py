from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    vehicle_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id", ondelete="CASCADE"), nullable=False, index=True)
    license_plate = Column(String(20), unique=True, nullable=False, index=True)
    vin = Column(String(17), unique=True, nullable=True)
    make = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    color = Column(String(30), nullable=True)
    engine_type = Column(String(30), nullable=True)
    transmission_type = Column(String(20), nullable=True)
    fuel_type = Column(String(20), nullable=True)
    current_mileage = Column(Numeric(10, 2), default=0.00)
    last_service_mileage = Column(Numeric(10, 2), default=0.00)
    next_service_mileage = Column(Numeric(10, 2), default=5000.00)
    purchase_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    customer = relationship("Customer", back_populates="vehicles")
    appointments = relationship("Appointment", back_populates="vehicle", cascade="all, delete-orphan")
    services = relationship("Service", back_populates="vehicle", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="vehicle")



