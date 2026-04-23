from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Numeric, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class GarageInvoiceStatus:
    ISSUED = "Issued"
    CANCELLED = "Cancelled"
    RETURNED = "Returned"


class GarageInvoice(Base):
    __tablename__ = "garage_invoices"

    invoice_id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(40), unique=True, nullable=False, index=True)

    job_order_id = Column(Integer, ForeignKey("job_orders.job_order_id"), nullable=False, index=True)
    invoice_type = Column(String(10), nullable=False, index=True)

    status = Column(String(20), nullable=False, default=GarageInvoiceStatus.ISSUED, index=True)

    subtotal = Column(Numeric(12, 2), nullable=False, default=0)
    labor_total = Column(Numeric(12, 2), nullable=False, default=0)
    parts_total = Column(Numeric(12, 2), nullable=False, default=0)
    charges_total = Column(Numeric(12, 2), nullable=False, default=0)

    discount_rate = Column(Numeric(6, 2), nullable=False, default=0)
    discount_amount = Column(Numeric(12, 2), nullable=False, default=0)

    total_amount = Column(Numeric(12, 2), nullable=False, default=0)

    is_collected = Column(Boolean, nullable=False, default=False, index=True)
    collected_at = Column(DateTime(timezone=True), nullable=True)
    cleared_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)

    issued_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)

    cancel_reason = Column(Text, nullable=True)
    cancel_letter_reference = Column(String(120), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)

    return_reason = Column(Text, nullable=True)
    return_letter_reference = Column(String(120), nullable=True)
    returned_at = Column(DateTime(timezone=True), nullable=True)
    returned_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    job_order = relationship("JobOrder")
    cleared_by_employee = relationship("Employee", foreign_keys=[cleared_by_employee_id])
    issued_by_employee = relationship("Employee", foreign_keys=[issued_by_employee_id])
    cancelled_by_employee = relationship("Employee", foreign_keys=[cancelled_by_employee_id])
    returned_by_employee = relationship("Employee", foreign_keys=[returned_by_employee_id])


class DiscountRateEntryScope:
    JOB_ORDER = "JobOrder"
    CUSTOMER = "Customer"


class DiscountRateEntry(Base):
    __tablename__ = "discount_rate_entries"

    discount_entry_id = Column(Integer, primary_key=True, index=True)

    scope = Column(String(20), nullable=False, index=True)
    job_order_id = Column(Integer, ForeignKey("job_orders.job_order_id", ondelete="CASCADE"), nullable=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id", ondelete="CASCADE"), nullable=True, index=True)

    discount_rate = Column(Numeric(6, 2), nullable=False)
    remark = Column(Text, nullable=True)
    authority_name = Column(String(200), nullable=True)

    valid_from = Column(Date, nullable=True)
    valid_to = Column(Date, nullable=True)

    recorded_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    job_order = relationship("JobOrder")
    customer = relationship("Customer")
    recorded_by_employee = relationship("Employee", foreign_keys=[recorded_by_employee_id])
