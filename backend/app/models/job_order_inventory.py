from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class JobOrderItemIssueStatus:
    DRAFT = "Draft"
    FINALIZED = "Finalized"
    CANCELLED = "Cancelled"


class JobOrderReturnRequestStatus:
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"


class JobOrderItemIssue(Base):
    __tablename__ = "job_order_item_issues"

    issue_id = Column(Integer, primary_key=True, index=True)
    issue_number = Column(String(40), unique=True, nullable=False, index=True)

    job_order_id = Column(Integer, ForeignKey("job_orders.job_order_id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), default=JobOrderItemIssueStatus.DRAFT, index=True)

    issued_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)
    remarks = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    finalized_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    job_order = relationship("JobOrder")
    issued_by_employee = relationship("Employee", foreign_keys=[issued_by_employee_id])
    lines = relationship("JobOrderItemIssueLine", back_populates="issue", cascade="all, delete-orphan")


class JobOrderItemIssueLine(Base):
    __tablename__ = "job_order_item_issue_lines"

    issue_line_id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("job_order_item_issues.issue_id", ondelete="CASCADE"), nullable=False, index=True)

    part_id = Column(Integer, ForeignKey("parts_inventory.part_id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    issue = relationship("JobOrderItemIssue", back_populates="lines")
    part = relationship("PartInventory")


class JobOrderReturnRequest(Base):
    __tablename__ = "job_order_return_requests"

    return_request_id = Column(Integer, primary_key=True, index=True)
    return_number = Column(String(40), unique=True, nullable=False, index=True)

    issue_id = Column(Integer, ForeignKey("job_order_item_issues.issue_id", ondelete="CASCADE"), nullable=False, index=True)
    job_order_id = Column(Integer, ForeignKey("job_orders.job_order_id", ondelete="CASCADE"), nullable=False, index=True)

    status = Column(String(20), default=JobOrderReturnRequestStatus.PENDING, index=True)
    reason = Column(Text, nullable=True)
    authority_name = Column(String(200), nullable=True)

    requested_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    decided_at = Column(DateTime(timezone=True), nullable=True)
    decided_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)

    issue = relationship("JobOrderItemIssue")
    job_order = relationship("JobOrder")
    requested_by_employee = relationship("Employee", foreign_keys=[requested_by_employee_id])
    decided_by_employee = relationship("Employee", foreign_keys=[decided_by_employee_id])

    lines = relationship("JobOrderReturnRequestLine", back_populates="return_request", cascade="all, delete-orphan")


class JobOrderReturnRequestLine(Base):
    __tablename__ = "job_order_return_request_lines"

    return_line_id = Column(Integer, primary_key=True, index=True)
    return_request_id = Column(Integer, ForeignKey("job_order_return_requests.return_request_id", ondelete="CASCADE"), nullable=False, index=True)

    part_id = Column(Integer, ForeignKey("parts_inventory.part_id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    remark = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    return_request = relationship("JobOrderReturnRequest", back_populates="lines")
    part = relationship("PartInventory")
