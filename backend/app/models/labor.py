from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class LaborType(Base):
    __tablename__ = "labor_types"

    labor_type_id = Column(Integer, primary_key=True, index=True)
    labor_type_name = Column(String(120), unique=True, nullable=False, index=True)
    hourly_rate = Column(Numeric(10, 2), nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class JobOrderLaborCharge(Base):
    __tablename__ = "job_order_labor_charges"

    labor_charge_id = Column(Integer, primary_key=True, index=True)

    job_order_id = Column(Integer, ForeignKey("job_orders.job_order_id", ondelete="CASCADE"), nullable=False, index=True)
    labor_type_id = Column(Integer, ForeignKey("labor_types.labor_type_id"), nullable=False, index=True)

    technician_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True, index=True)

    hours_worked = Column(Numeric(10, 2), nullable=False)
    hourly_rate = Column(Numeric(10, 2), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)

    remark = Column(Text, nullable=True)

    recorded_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    job_order = relationship("JobOrder")
    labor_type = relationship("LaborType")
    technician_employee = relationship("Employee", foreign_keys=[technician_employee_id])
    recorded_by_employee = relationship("Employee", foreign_keys=[recorded_by_employee_id])
