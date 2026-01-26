from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(Integer, primary_key=True, index=True)
    national_id = Column(String(20), unique=True, nullable=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    phone = Column(String(15), unique=True, nullable=False, index=True)
    address = Column(Text, nullable=True)
    city = Column(String(50), nullable=True)
    registration_date = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    password_hash = Column(String(255), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    vehicles = relationship("Vehicle", back_populates="customer", cascade="all, delete-orphan")
    loyalty = relationship("CustomerLoyalty", back_populates="customer", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="customer")
    proformas = relationship("Proforma", back_populates="customer")  # No cascade - preserve proformas as business records



