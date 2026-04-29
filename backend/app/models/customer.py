from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, Numeric
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

    # HillMaster-style "New Customer Creation" (general + GL + addresses)
    sub_ledger = Column(String(40), nullable=True, index=True)
    tin = Column(String(30), nullable=True)
    contact_name = Column(String(120), nullable=True)
    alt_phone = Column(String(20), nullable=True)
    fax_no = Column(String(30), nullable=True)
    po_box = Column(String(40), nullable=True)
    tax_rate = Column(String(50), nullable=True)
    credit_limit = Column(Numeric(12, 2), nullable=True)
    invoice_due_days = Column(Integer, nullable=True)
    price_list_code = Column(String(80), nullable=True)
    status_label = Column(String(40), nullable=True)
    gl_coa_code = Column(String(40), nullable=True)
    gl_coa_name = Column(Text, nullable=True)
    gl_category = Column(String(80), nullable=True)
    gl_customer_type = Column(String(80), nullable=True)
    allow_credit = Column(Boolean, nullable=False, default=True)
    on_hold = Column(Boolean, nullable=False, default=False)
    is_dealer = Column(Boolean, nullable=False, default=False)
    notes_other = Column(Text, nullable=True)
    address_local = Column(Text, nullable=True)
    address_foreign = Column(Text, nullable=True)

    registration_date = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    password_hash = Column(String(255), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    vehicles = relationship("Vehicle", back_populates="customer", cascade="all, delete-orphan")
    loyalty = relationship("CustomerLoyalty", back_populates="customer", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="customer")
    proformas = relationship("Proforma", back_populates="customer")  # No cascade - preserve proformas as business records



