from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class NotificationTemplate(Base):
    __tablename__ = "notification_templates"

    template_id = Column(Integer, primary_key=True, index=True)
    template_name = Column(String(100), unique=True, nullable=False)
    template_type = Column(String(10), nullable=True)
    subject = Column(String(200), nullable=True)
    body = Column(Text, nullable=False)
    variables = Column(JSONB, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Relationships
    notifications = relationship("Notification", back_populates="template")

class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.vehicle_id"), nullable=True)
    template_id = Column(Integer, ForeignKey("notification_templates.template_id"), nullable=True)
    notification_type = Column(String(30), nullable=True)
    channel = Column(String(10), nullable=True)
    subject = Column(String(200), nullable=True)
    message = Column(Text, nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), default="Pending", index=True)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    scheduled_for = Column(DateTime(timezone=True), nullable=True, index=True)

    # Relationships
    customer = relationship("Customer", back_populates="notifications")
    vehicle = relationship("Vehicle", back_populates="notifications")
    template = relationship("NotificationTemplate", back_populates="notifications")



