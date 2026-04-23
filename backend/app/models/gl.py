from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class GLAccount(Base):
    __tablename__ = "gl_accounts"

    account_id = Column(Integer, primary_key=True, index=True)
    account_code = Column(String(30), unique=True, nullable=False, index=True)
    account_name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=True, index=True)  # Asset, Liability, Income, Expense, Equity
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class JournalStatus:
    DRAFT = "Draft"
    POSTED = "Posted"


class Journal(Base):
    __tablename__ = "journals"

    journal_id = Column(Integer, primary_key=True, index=True)
    journal_number = Column(String(40), unique=True, nullable=False, index=True)
    journal_date = Column(Date, nullable=False)
    description = Column(Text, nullable=True)

    status = Column(String(20), default=JournalStatus.DRAFT, index=True)

    source_type = Column(String(50), nullable=True, index=True)  # e.g. GarageInvoice, JobOrder
    source_id = Column(Integer, nullable=True, index=True)

    created_by_user_id = Column(Integer, ForeignKey("user_accounts.user_id", ondelete="SET NULL"), nullable=True)
    posted_by_user_id = Column(Integer, ForeignKey("user_accounts.user_id", ondelete="SET NULL"), nullable=True)
    posted_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    lines = relationship("JournalLine", back_populates="journal", cascade="all, delete-orphan")


class JournalLine(Base):
    __tablename__ = "journal_lines"

    journal_line_id = Column(Integer, primary_key=True, index=True)
    journal_id = Column(Integer, ForeignKey("journals.journal_id", ondelete="CASCADE"), nullable=False, index=True)

    line_number = Column(Integer, nullable=False)

    account_id = Column(Integer, ForeignKey("gl_accounts.account_id", ondelete="RESTRICT"), nullable=False, index=True)
    description = Column(Text, nullable=True)

    debit = Column(Numeric(18, 2), default=0)
    credit = Column(Numeric(18, 2), default=0)

    journal = relationship("Journal", back_populates="lines")
    account = relationship("GLAccount")

