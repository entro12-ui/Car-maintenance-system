from sqlalchemy import Column, Integer, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.sql import func

from app.database import Base


class UserJobTypeAccess(Base):
    __tablename__ = "user_job_type_access"
    __table_args__ = (
        UniqueConstraint("user_id", "job_type_setting_id", name="uq_user_job_type_access"),
    )

    access_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_accounts.user_id", ondelete="CASCADE"), nullable=False, index=True)
    job_type_setting_id = Column(Integer, ForeignKey("system_settings.setting_id", ondelete="CASCADE"), nullable=False, index=True)

    created_by_user_id = Column(Integer, ForeignKey("user_accounts.user_id", ondelete="SET NULL"), nullable=True)
    created_ws = Column(String(120), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

