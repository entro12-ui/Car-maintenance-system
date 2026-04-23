from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class JobOrderCustomerNotificationEntry(Base):
    __tablename__ = "job_order_customer_notifications"

    notification_entry_id = Column(Integer, primary_key=True, index=True)

    job_order_id = Column(Integer, ForeignKey("job_orders.job_order_id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id", ondelete="SET NULL"), nullable=True, index=True)

    notice_date = Column(Date, nullable=False, index=True)
    contact_name = Column(String(200), nullable=True)
    contact_phone = Column(String(30), nullable=True)

    notice_type = Column(String(100), nullable=False)
    remark = Column(Text, nullable=True)

    recorded_by_employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    job_order = relationship("JobOrder")
    customer = relationship("Customer")
    recorded_by_employee = relationship("Employee", foreign_keys=[recorded_by_employee_id])
