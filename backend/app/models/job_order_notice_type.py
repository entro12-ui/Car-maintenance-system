from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func

from app.database import Base


class JobOrderNoticeType(Base):
    __tablename__ = "job_order_notice_types"

    notice_type_id = Column(Integer, primary_key=True, index=True)
    notice_type_name = Column(String(100), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
