from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Numeric,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class OtherChargeType(Base):
    __tablename__ = "other_charge_types"

    other_charge_type_id = Column(Integer, primary_key=True, index=True)
    charge_code = Column(String(30), unique=True, nullable=False, index=True)
    charge_category_code = Column(String(30), nullable=True, index=True)
    description = Column(String(200), nullable=False)
    discount_charge_code = Column(String(40), nullable=True)
    allow_to_journalize = Column(Boolean, nullable=False, default=False)
    auto_create_journal = Column(Boolean, nullable=False, default=False)
    taxable = Column(Boolean, nullable=False, default=True)

    job_type = Column(String(50), nullable=True)
    section = Column(String(100), nullable=True)
    unit_of_measure = Column(String(30), nullable=True)
    unit_price = Column(Numeric(12, 2), nullable=False, default=0)
    unit_cost = Column(Numeric(12, 2), nullable=False, default=0)
    sub_category = Column(String(100), nullable=True)

    is_active = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class FuelLubricantItem(Base):
    __tablename__ = "fuel_lubricant_items"

    fuel_lubricant_id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String(30), unique=True, nullable=False, index=True)
    description = Column(String(200), nullable=False)
    taxable = Column(Boolean, nullable=False, default=True)

    section = Column(String(100), nullable=True)
    unit_of_measure = Column(String(30), nullable=True)
    unit_price = Column(Numeric(12, 2), nullable=False, default=0)
    unit_cost = Column(Numeric(12, 2), nullable=False, default=0)

    is_active = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class MiscChargeType(Base):
    __tablename__ = "misc_charge_types"

    misc_charge_type_id = Column(Integer, primary_key=True, index=True)
    charge_code = Column(String(30), unique=True, nullable=False, index=True)
    description = Column(String(200), nullable=False)
    taxable = Column(Boolean, nullable=False, default=True)

    job_type = Column(String(50), nullable=True)
    section = Column(String(100), nullable=True)
    unit_of_measure = Column(String(30), nullable=True)
    unit_price = Column(Numeric(12, 2), nullable=False, default=0)
    unit_cost = Column(Numeric(12, 2), nullable=False, default=0)
    sub_category = Column(String(100), nullable=True)

    is_active = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class SubletWorkSupplier(Base):
    __tablename__ = "sublet_work_suppliers"

    supplier_id = Column(Integer, primary_key=True, index=True)
    supplier_name = Column(String(200), unique=True, nullable=False, index=True)

    contact_person = Column(String(200), nullable=True)
    phone = Column(String(50), nullable=True)
    fax_no = Column(String(50), nullable=True)
    email = Column(String(120), nullable=True)
    address = Column(String(250), nullable=True)
    address_line1 = Column(String(200), nullable=True)
    address_line2 = Column(String(200), nullable=True)
    address_line3 = Column(String(200), nullable=True)
    po_box = Column(String(80), nullable=True)

    supplier_coa_1 = Column(String(80), nullable=True)
    supplier_coa_2 = Column(String(80), nullable=True)
    auto_approve_orders = Column(Boolean, nullable=False, default=False)
    account_description = Column(String(500), nullable=True)

    is_active = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class SubletWorkType(Base):
    __tablename__ = "sublet_work_types"

    sublet_work_type_id = Column(Integer, primary_key=True, index=True)
    work_code = Column(String(30), unique=True, nullable=False, index=True)
    description = Column(String(200), nullable=False)
    taxable = Column(Boolean, nullable=False, default=True)

    job_type = Column(String(50), nullable=True)
    section = Column(String(100), nullable=True)
    unit_of_measure = Column(String(30), nullable=True)
    unit_price = Column(Numeric(12, 2), nullable=False, default=0)
    unit_cost = Column(Numeric(12, 2), nullable=False, default=0)
    sub_category = Column(String(100), nullable=True)

    supplier_id = Column(Integer, ForeignKey("sublet_work_suppliers.supplier_id", ondelete="SET NULL"), nullable=True, index=True)

    is_active = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    supplier = relationship("SubletWorkSupplier")


class JobOrderMiscCharge(Base):
    __tablename__ = "job_order_misc_charges"

    misc_charge_entry_id = Column(Integer, primary_key=True, index=True)
    job_order_id = Column(Integer, ForeignKey("job_orders.job_order_id", ondelete="CASCADE"), nullable=False, index=True)
    misc_charge_type_id = Column(Integer, ForeignKey("misc_charge_types.misc_charge_type_id"), nullable=False, index=True)

    unit_price = Column(Numeric(12, 2), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)

    remark = Column(Text, nullable=True)

    recorded_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    job_order = relationship("JobOrder")
    misc_charge_type = relationship("MiscChargeType")


class JobOrderFuelLubricantCharge(Base):
    __tablename__ = "job_order_fuel_lubricant_charges"

    fuel_lubricant_entry_id = Column(Integer, primary_key=True, index=True)
    job_order_id = Column(Integer, ForeignKey("job_orders.job_order_id", ondelete="CASCADE"), nullable=False, index=True)
    fuel_lubricant_id = Column(Integer, ForeignKey("fuel_lubricant_items.fuel_lubricant_id"), nullable=False, index=True)

    quantity = Column(Numeric(10, 2), nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)

    remark = Column(Text, nullable=True)

    recorded_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    job_order = relationship("JobOrder")
    fuel_lubricant = relationship("FuelLubricantItem")


class JobOrderSubletWorkCharge(Base):
    __tablename__ = "job_order_sublet_work_charges"

    sublet_work_entry_id = Column(Integer, primary_key=True, index=True)
    job_order_id = Column(Integer, ForeignKey("job_orders.job_order_id", ondelete="CASCADE"), nullable=False, index=True)
    sublet_work_type_id = Column(Integer, ForeignKey("sublet_work_types.sublet_work_type_id"), nullable=False, index=True)

    quantity = Column(Numeric(10, 2), nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)

    remark = Column(Text, nullable=True)

    recorded_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    job_order = relationship("JobOrder")
    sublet_work_type = relationship("SubletWorkType")


class JobOrderOtherCharge(Base):
    __tablename__ = "job_order_other_charges"

    other_charge_entry_id = Column(Integer, primary_key=True, index=True)
    job_order_id = Column(Integer, ForeignKey("job_orders.job_order_id", ondelete="CASCADE"), nullable=False, index=True)
    other_charge_type_id = Column(Integer, ForeignKey("other_charge_types.other_charge_type_id"), nullable=False, index=True)

    quantity = Column(Numeric(10, 2), nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)

    remark = Column(Text, nullable=True)

    recorded_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    job_order = relationship("JobOrder")
    other_charge_type = relationship("OtherChargeType")
