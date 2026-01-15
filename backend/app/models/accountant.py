from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Accountant(Base):
    __tablename__ = "accountants"

    accountant_id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    phone = Column(String(15), unique=True, nullable=False, index=True)
    address = Column(Text, nullable=True)
    city = Column(String(50), nullable=True)
    registration_date = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=False)  # Requires admin approval
    password_hash = Column(String(255), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)

