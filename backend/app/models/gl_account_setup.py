from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.sql import func

from app.database import Base


class GLAccountSetupType:
    PARTS = "PARTS"
    FUEL_LUB = "FUEL_LUB"
    LABOUR = "LABOUR"
    MISCELLANEOUS = "MISCELLANEOUS"
    OTHER_CHARGE = "OTHER_CHARGE"
    SUB_LET = "SUB_LET"


class GLAccountSetup(Base):
    __tablename__ = "gl_account_setups"
    __table_args__ = (
        UniqueConstraint(
            "material_type",
            "parts_group_code",
            "service_type_id",
            "maintenance_section",
            "job_type",
            "garage_location",
            name="uq_gl_account_setup_scope",
        ),
    )

    setup_id = Column(Integer, primary_key=True, index=True)
    material_type = Column(String(30), nullable=False, index=True)

    # Scope dimensions
    parts_group_code = Column(String(80), nullable=True, index=True)
    service_type_id = Column(Integer, ForeignKey("service_types.service_type_id", ondelete="SET NULL"), nullable=True, index=True)
    maintenance_section = Column(String(120), nullable=True, index=True)
    job_type = Column(String(120), nullable=True, index=True)
    garage_location = Column(String(120), nullable=True, index=True)

    # Account mapping
    stock_account_id = Column(Integer, ForeignKey("gl_accounts.account_id", ondelete="SET NULL"), nullable=True, index=True)
    wip_account_id = Column(Integer, ForeignKey("gl_accounts.account_id", ondelete="SET NULL"), nullable=True, index=True)
    cgs_account_id = Column(Integer, ForeignKey("gl_accounts.account_id", ondelete="SET NULL"), nullable=True, index=True)
    sales_account_id = Column(Integer, ForeignKey("gl_accounts.account_id", ondelete="SET NULL"), nullable=True, index=True)
    discount_account_id = Column(Integer, ForeignKey("gl_accounts.account_id", ondelete="SET NULL"), nullable=True, index=True)
    vat_account_id = Column(Integer, ForeignKey("gl_accounts.account_id", ondelete="SET NULL"), nullable=True, index=True)

    created_by_user_id = Column(Integer, ForeignKey("user_accounts.user_id", ondelete="SET NULL"), nullable=True)
    updated_by_user_id = Column(Integer, ForeignKey("user_accounts.user_id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

