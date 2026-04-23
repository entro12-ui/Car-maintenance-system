from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class JobOrderSubletOrderStatus:
    DRAFT = "Draft"
    FINALIZED = "Finalized"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    CANCELLED = "Cancelled"
    RECEIVED = "Received"


class JobOrderSubletOrder(Base):
    __tablename__ = "job_order_sublet_orders"

    sublet_order_id = Column(Integer, primary_key=True, index=True)
    sublet_order_number = Column(String(40), unique=True, nullable=False, index=True)

    job_order_id = Column(Integer, ForeignKey("job_orders.job_order_id", ondelete="CASCADE"), nullable=False, index=True)
    sublet_work_type_id = Column(Integer, ForeignKey("sublet_work_types.sublet_work_type_id"), nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("sublet_work_suppliers.supplier_id", ondelete="SET NULL"), nullable=True, index=True)

    quantity = Column(Numeric(10, 2), nullable=False, default=1)
    unit_price = Column(Numeric(12, 2), nullable=False, default=0)
    unit_cost = Column(Numeric(12, 2), nullable=False, default=0)

    remark = Column(Text, nullable=True)

    status = Column(String(20), nullable=False, default=JobOrderSubletOrderStatus.DRAFT, index=True)

    requested_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    finalized_at = Column(DateTime(timezone=True), nullable=True)

    decided_at = Column(DateTime(timezone=True), nullable=True)
    decided_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)
    decision_remark = Column(Text, nullable=True)

    delivery_order_number = Column(String(80), nullable=True)
    received_at = Column(DateTime(timezone=True), nullable=True)
    received_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)

    job_order = relationship("JobOrder")
    sublet_work_type = relationship("SubletWorkType")
    supplier = relationship("SubletWorkSupplier")

    requested_by_employee = relationship("Employee", foreign_keys=[requested_by_employee_id])
    decided_by_employee = relationship("Employee", foreign_keys=[decided_by_employee_id])
    received_by_employee = relationship("Employee", foreign_keys=[received_by_employee_id])
