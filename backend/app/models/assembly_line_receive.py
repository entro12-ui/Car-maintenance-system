from sqlalchemy import Column, Integer, String, Date, DateTime, JSON
from sqlalchemy.sql import func

from app.database import Base


class AssemblyLineReceive(Base):
    """Assembly line receipt (HillMaster §8.5) — header + selected closed job IDs."""

    __tablename__ = "assembly_line_receives"

    assembly_receive_id = Column(Integer, primary_key=True, index=True)
    reference_no = Column(String(50), nullable=False, index=True)
    receive_date = Column(Date, nullable=False)
    requesting_unit = Column(String(200), nullable=False)
    job_order_ids = Column(JSON, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
