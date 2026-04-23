from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class JobOrderPairing(Base):
    __tablename__ = "job_order_pairings"

    pairing_id = Column(Integer, primary_key=True, index=True)

    job_order_id_a = Column(Integer, ForeignKey("job_orders.job_order_id", ondelete="CASCADE"), nullable=False, index=True)
    job_order_id_b = Column(Integer, ForeignKey("job_orders.job_order_id", ondelete="CASCADE"), nullable=False, index=True)

    paired_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    paired_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)

    unpaired_at = Column(DateTime(timezone=True), nullable=True)
    unpaired_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)

    job_a = relationship("JobOrder", foreign_keys=[job_order_id_a])
    job_b = relationship("JobOrder", foreign_keys=[job_order_id_b])

    paired_by_employee = relationship("Employee", foreign_keys=[paired_by_employee_id])
    unpaired_by_employee = relationship("Employee", foreign_keys=[unpaired_by_employee_id])
