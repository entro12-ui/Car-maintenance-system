from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class JobOrderStatus:
    OPEN = "Open"
    DISPATCHED = "Dispatched"
    RECEIVED = "Received"
    CLOSED = "Closed"
    CANCELLED = "Cancelled"


class JobOrderInvoiceType:
    CASH = "Cash"
    CREDIT = "Credit"
    ITM = "ITM"


class JobOrder(Base):
    __tablename__ = "job_orders"

    job_order_id = Column(Integer, primary_key=True, index=True)
    job_order_number = Column(String(30), unique=True, nullable=False, index=True)

    vehicle_id = Column(Integer, ForeignKey("vehicles.vehicle_id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id", ondelete="SET NULL"), nullable=True, index=True)
    service_type_id = Column(Integer, ForeignKey("service_types.service_type_id", ondelete="SET NULL"), nullable=True)

    invoice_type = Column(String(10), default=JobOrderInvoiceType.CASH, index=True)
    status = Column(String(20), default=JobOrderStatus.OPEN, index=True)

    mileage_in_km = Column(String(30), nullable=True)
    remarks = Column(Text, nullable=True)

    opened_date = Column(Date, nullable=True)
    expected_finish_date = Column(Date, nullable=True)

    dispatched_section = Column(String(100), nullable=True)
    dispatched_at = Column(DateTime(timezone=True), nullable=True)

    received_section = Column(String(100), nullable=True)
    received_vehicle_location = Column(String(200), nullable=True)
    received_at = Column(DateTime(timezone=True), nullable=True)

    closed_at = Column(DateTime(timezone=True), nullable=True)

    is_blocked = Column(Boolean, default=False, index=True)
    blocked_reason = Column(Text, nullable=True)
    blocked_at = Column(DateTime(timezone=True), nullable=True)
    blocked_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)

    delivered_at = Column(DateTime(timezone=True), nullable=True)
    delivered_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)
    delivered_to_name = Column(String(200), nullable=True)
    delivered_to_phone = Column(String(30), nullable=True)

    vrv_number = Column(String(40), unique=True, nullable=True, index=True)
    vrv_printed_at = Column(DateTime(timezone=True), nullable=True)

    opened_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    vehicle = relationship("Vehicle")
    customer = relationship("Customer")
    service_type = relationship("ServiceType")
    opened_by_employee = relationship("Employee", foreign_keys=[opened_by_employee_id])
    blocked_by_employee = relationship("Employee", foreign_keys=[blocked_by_employee_id])
    delivered_by_employee = relationship("Employee", foreign_keys=[delivered_by_employee_id])

    tasks = relationship("JobOrderTask", back_populates="job_order", cascade="all, delete-orphan")
    clocks = relationship("JobClock", back_populates="job_order", cascade="all, delete-orphan")
    qc_sheet = relationship("JobOrderQCSheet", back_populates="job_order", cascade="all, delete-orphan", uselist=False)


class JobOrderTask(Base):
    __tablename__ = "job_order_tasks"

    task_id = Column(Integer, primary_key=True, index=True)
    job_order_id = Column(Integer, ForeignKey("job_orders.job_order_id", ondelete="CASCADE"), nullable=False, index=True)

    task_name = Column(String(200), nullable=False)
    task_description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    job_order = relationship("JobOrder", back_populates="tasks")
    clocks = relationship("JobClock", back_populates="task")


class JobClock(Base):
    __tablename__ = "job_clocks"

    job_clock_id = Column(Integer, primary_key=True, index=True)
    job_order_id = Column(Integer, ForeignKey("job_orders.job_order_id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("job_order_tasks.task_id", ondelete="SET NULL"), nullable=True, index=True)

    technician_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True, index=True)

    clock_in_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    clock_in_remark = Column(Text, nullable=True)

    clock_out_at = Column(DateTime(timezone=True), nullable=True)
    clock_out_reason = Column(String(200), nullable=True)
    clock_out_remark = Column(Text, nullable=True)

    job_order = relationship("JobOrder", back_populates="clocks")
    task = relationship("JobOrderTask", back_populates="clocks")
    technician = relationship("Employee", foreign_keys=[technician_employee_id])


class JobOrderQCStatus:
    PENDING = "Pending"
    PASSED = "Passed"
    FAILED = "Failed"


class JobOrderQCSheet(Base):
    __tablename__ = "job_order_qc_sheets"

    qc_sheet_id = Column(Integer, primary_key=True, index=True)
    job_order_id = Column(Integer, ForeignKey("job_orders.job_order_id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    overall_status = Column(String(20), default=JobOrderQCStatus.PENDING, index=True)
    remarks = Column(Text, nullable=True)

    checked_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)
    checked_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    job_order = relationship("JobOrder", back_populates="qc_sheet")
    checked_by_employee = relationship("Employee", foreign_keys=[checked_by_employee_id])
    items = relationship("JobOrderQCItem", back_populates="qc_sheet", cascade="all, delete-orphan", order_by="JobOrderQCItem.sort_order")


class JobOrderQCItem(Base):
    __tablename__ = "job_order_qc_items"

    qc_item_id = Column(Integer, primary_key=True, index=True)
    qc_sheet_id = Column(Integer, ForeignKey("job_order_qc_sheets.qc_sheet_id", ondelete="CASCADE"), nullable=False, index=True)

    item_name = Column(String(200), nullable=False)
    passed = Column(Boolean, nullable=True)
    remark = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    qc_sheet = relationship("JobOrderQCSheet", back_populates="items")
