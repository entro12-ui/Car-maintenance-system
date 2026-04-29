from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func, text

from app.database import Base


class LaborType(Base):
    __tablename__ = "labor_types"

    labor_type_id = Column(Integer, primary_key=True, index=True)
    labor_code = Column(String(40), unique=True, nullable=True, index=True)
    labor_type_name = Column(String(120), unique=True, nullable=False, index=True)
    taxable = Column(Boolean, nullable=False, default=True)
    section = Column(String(120), nullable=True)
    allowed_for = Column(String(120), nullable=True)
    sub_category = Column(String(120), nullable=True)
    price_list_type = Column(String(120), nullable=True)
    hourly_rate = Column(Numeric(10, 2), nullable=False, default=0)
    consumable_charge_code = Column(String(40), nullable=True)
    unit_cost = Column(Numeric(12, 2), nullable=False, default=0)
    department = Column(String(120), nullable=True)
    start_station = Column(String(120), nullable=True)
    end_station = Column(String(120), nullable=True)
    transfer_all_sections = Column(Boolean, nullable=False, default=False)
    hold_section = Column(Boolean, nullable=False, default=False)
    take_from_third_party = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class LaborPriceList(Base):
    __tablename__ = "labor_price_lists"

    labor_price_list_id = Column(Integer, primary_key=True, index=True)
    pl_id = Column(Integer, unique=True, nullable=False, index=True)
    description = Column(String(200), nullable=False)
    rate_per_hour = Column(Numeric(10, 2), nullable=False, default=0)
    created_by = Column(String(120), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class LaborTypeModelGroupRate(Base):
    __tablename__ = "labor_type_model_group_rates"

    labor_type_model_group_rate_id = Column(Integer, primary_key=True, index=True)
    labor_type_id = Column(Integer, ForeignKey("labor_types.labor_type_id", ondelete="CASCADE"), nullable=False, index=True)
    model_group_type = Column(String(120), nullable=False, index=True)
    std_hours = Column(Numeric(10, 2), nullable=False, default=0)
    charge_amount = Column(Numeric(12, 2), nullable=False, default=0)
    mfc_hours = Column(Numeric(10, 2), nullable=False, default=0)
    job_comp_hours = Column(Numeric(10, 2), nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    labor_type = relationship("LaborType")


class JobOrderLaborCharge(Base):
    __tablename__ = "job_order_labor_charges"

    labor_charge_id = Column(Integer, primary_key=True, index=True)

    job_order_id = Column(Integer, ForeignKey("job_orders.job_order_id", ondelete="CASCADE"), nullable=False, index=True)
    labor_type_id = Column(Integer, ForeignKey("labor_types.labor_type_id"), nullable=False, index=True)

    technician_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True, index=True)

    hours_worked = Column(Numeric(10, 2), nullable=False)
    hourly_rate = Column(Numeric(10, 2), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)

    # Job Text / Charge (HillMaster-style extras; billing still uses hours_worked * hourly_rate)
    mfc_hours = Column(Numeric(10, 2), nullable=False, server_default=text("0"))
    repair_option = Column(String(50), nullable=True)
    price_list_type = Column(String(80), nullable=True)
    is_charged = Column(Boolean, nullable=False, default=False)
    charge_code = Column(String(40), nullable=True)

    remark = Column(Text, nullable=True)

    recorded_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    job_order = relationship("JobOrder")
    labor_type = relationship("LaborType")
    technician_employee = relationship("Employee", foreign_keys=[technician_employee_id])
    recorded_by_employee = relationship("Employee", foreign_keys=[recorded_by_employee_id])
