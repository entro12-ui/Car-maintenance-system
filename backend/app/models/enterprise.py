from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class MemoTemplate(Base):
    __tablename__ = "memo_templates"

    template_id = Column(Integer, primary_key=True, index=True)
    template_code = Column(String(60), unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    category = Column(String(50), nullable=True, index=True)  # Letter, Memo, SMS, Email
    body = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class UserDefinedReport(Base):
    __tablename__ = "user_defined_reports"

    report_id = Column(Integer, primary_key=True, index=True)
    report_code = Column(String(60), unique=True, nullable=False, index=True)
    report_name = Column(String(200), nullable=False)
    report_group = Column(String(50), nullable=True, index=True)  # Listing/Sales/Productivity/Other/Custom/UserDefined
    description = Column(Text, nullable=True)
    query_definition = Column(Text, nullable=True)  # reserved for future SQL/report DSL
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class GLPostingRule(Base):
    __tablename__ = "gl_posting_rules"

    rule_id = Column(Integer, primary_key=True, index=True)
    event_code = Column(String(80), nullable=False, index=True)  # GARAGE_INVOICE_ISSUED, GARAGE_INVOICE_RETURNED, etc.
    description = Column(String(255), nullable=True)

    debit_account_id = Column(Integer, ForeignKey("gl_accounts.account_id", ondelete="RESTRICT"), nullable=False)
    credit_account_id = Column(Integer, ForeignKey("gl_accounts.account_id", ondelete="RESTRICT"), nullable=False)

    # amount_source currently supports TOTAL_AMOUNT, DISCOUNT_AMOUNT, SUBTOTAL
    amount_source = Column(String(40), nullable=False, default="TOTAL_AMOUNT")
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    debit_account = relationship("GLAccount", foreign_keys=[debit_account_id])
    credit_account = relationship("GLAccount", foreign_keys=[credit_account_id])

