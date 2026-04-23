from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import GLAccount, Journal, JournalLine
from app.models.gl import JournalStatus


router = APIRouter()


class GLAccountBase(BaseModel):
    account_code: str = Field(..., max_length=30)
    account_name: str = Field(..., max_length=200)
    category: Optional[str] = Field(
        default=None,
        description="Optional category: Asset, Liability, Income, Expense, Equity",
    )


class GLAccountCreate(GLAccountBase):
    pass


class GLAccountUpdate(BaseModel):
    account_name: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None


class GLAccountResponse(GLAccountBase):
    account_id: int
    is_active: bool

    class Config:
        orm_mode = True


class JournalLinePayload(BaseModel):
    account_id: int
    description: Optional[str] = None
    debit: float = 0.0
    credit: float = 0.0


class JournalCreate(BaseModel):
    journal_date: date
    description: Optional[str] = None
    source_type: Optional[str] = Field(
        default=None, description="e.g. GarageInvoice, JobOrder"
    )
    source_id: Optional[int] = None
    lines: List[JournalLinePayload]


class JournalLineResponse(BaseModel):
    journal_line_id: int
    line_number: int
    account_id: int
    account_code: str
    account_name: str
    description: Optional[str]
    debit: float
    credit: float

    class Config:
        orm_mode = True


class JournalResponse(BaseModel):
    journal_id: int
    journal_number: str
    journal_date: date
    description: Optional[str]
    status: str
    source_type: Optional[str]
    source_id: Optional[int]
    posted_at: Optional[datetime]
    total_debit: float
    total_credit: float
    lines: List[JournalLineResponse]

    class Config:
        orm_mode = True


def _generate_journal_number(db: Session) -> str:
    today_str = date.today().strftime("%Y%m%d")
    prefix = f"JRN-{today_str}-"
    last = (
        db.query(Journal)
        .filter(Journal.journal_number.like(f"{prefix}%"))
        .order_by(Journal.journal_number.desc())
        .first()
    )
    if not last:
        return f"{prefix}001"
    try:
        last_seq = int(last.journal_number.split("-")[-1])
    except Exception:
        last_seq = 0
    return f"{prefix}{last_seq + 1:03d}"


@router.get("/accounts", response_model=List[GLAccountResponse])
def list_accounts(
    category: Optional[str] = Query(default=None),
    include_inactive: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(GLAccount)
    if not include_inactive:
        query = query.filter(GLAccount.is_active == True)
    if category:
        query = query.filter(GLAccount.category == category)
    query = query.order_by(GLAccount.account_code.asc())
    return query.all()


@router.post("/accounts", response_model=GLAccountResponse)
def create_account(payload: GLAccountCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(GLAccount)
        .filter(GLAccount.account_code == payload.account_code)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="Account with this code already exists."
        )

    acc = GLAccount(
        account_code=payload.account_code,
        account_name=payload.account_name,
        category=payload.category,
        is_active=True,
    )
    db.add(acc)
    db.commit()
    db.refresh(acc)
    return acc


@router.put("/accounts/{account_id}", response_model=GLAccountResponse)
def update_account(
    account_id: int, payload: GLAccountUpdate, db: Session = Depends(get_db)
):
    acc = (
        db.query(GLAccount)
        .filter(GLAccount.account_id == account_id)
        .first()
    )
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found.")

    if payload.account_name is not None:
        acc.account_name = payload.account_name
    if payload.category is not None:
        acc.category = payload.category
    if payload.is_active is not None:
        acc.is_active = payload.is_active

    db.commit()
    db.refresh(acc)
    return acc


@router.post("/journals", response_model=JournalResponse)
def create_journal(payload: JournalCreate, db: Session = Depends(get_db)):
    if not payload.lines:
        raise HTTPException(status_code=400, detail="At least one line is required.")

    # Validate accounts and compute totals
    total_debit = 0.0
    total_credit = 0.0

    account_map = {}
    for line in payload.lines:
        if line.debit < 0 or line.credit < 0:
            raise HTTPException(
                status_code=400,
                detail="Debit and credit amounts must be non-negative.",
            )
        total_debit += float(line.debit)
        total_credit += float(line.credit)
        if line.account_id not in account_map:
            acc = (
                db.query(GLAccount)
                .filter(GLAccount.account_id == line.account_id)
                .first()
            )
            if not acc:
                raise HTTPException(
                    status_code=400,
                    detail=f"Account with id {line.account_id} not found.",
                )
            account_map[line.account_id] = acc

    if round(total_debit, 2) != round(total_credit, 2):
        raise HTTPException(
            status_code=400,
            detail="Journal is not balanced: total debit must equal total credit.",
        )

    journal_number = _generate_journal_number(db)

    journal = Journal(
        journal_number=journal_number,
        journal_date=payload.journal_date,
        description=payload.description,
        source_type=payload.source_type,
        source_id=payload.source_id,
        status=JournalStatus.DRAFT,
    )
    db.add(journal)
    db.flush()  # assign journal_id

    line_number = 1
    for line in payload.lines:
        jl = JournalLine(
            journal_id=journal.journal_id,
            line_number=line_number,
            account_id=line.account_id,
            description=line.description,
            debit=line.debit,
            credit=line.credit,
        )
        db.add(jl)
        line_number += 1

    db.commit()
    db.refresh(journal)

    return _to_journal_response(journal)


def _to_journal_response(journal: Journal) -> JournalResponse:
    total_debit = sum(float(l.debit or 0) for l in journal.lines)
    total_credit = sum(float(l.credit or 0) for l in journal.lines)

    return JournalResponse(
        journal_id=journal.journal_id,
        journal_number=journal.journal_number,
        journal_date=journal.journal_date,
        description=journal.description,
        status=journal.status,
        source_type=journal.source_type,
        source_id=journal.source_id,
        posted_at=journal.posted_at,
        total_debit=total_debit,
        total_credit=total_credit,
        lines=[
            JournalLineResponse(
                journal_line_id=l.journal_line_id,
                line_number=l.line_number,
                account_id=l.account_id,
                account_code=l.account.account_code,
                account_name=l.account.account_name,
                description=l.description,
                debit=float(l.debit or 0),
                credit=float(l.credit or 0),
            )
            for l in sorted(journal.lines, key=lambda x: x.line_number)
        ],
    )


@router.get("/journals", response_model=List[JournalResponse])
def list_journals(
    status: Optional[str] = Query(default=None),
    source_type: Optional[str] = Query(default=None),
    source_id: Optional[int] = Query(default=None),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Journal).order_by(Journal.journal_date.desc(), Journal.journal_number.desc())

    if status:
        query = query.filter(Journal.status == status)
    if source_type:
        query = query.filter(Journal.source_type == source_type)
    if source_id is not None:
        query = query.filter(Journal.source_id == source_id)
    if start_date:
        query = query.filter(Journal.journal_date >= start_date)
    if end_date:
        query = query.filter(Journal.journal_date <= end_date)

    journals = query.all()
    return [_to_journal_response(j) for j in journals]


@router.post("/journals/{journal_id}/post", response_model=JournalResponse)
def post_journal(journal_id: int, db: Session = Depends(get_db)):
    journal = (
        db.query(Journal)
        .filter(Journal.journal_id == journal_id)
        .first()
    )
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found.")

    if journal.status == JournalStatus.POSTED:
        raise HTTPException(status_code=400, detail="Journal is already posted.")

    # Validate balanced before posting
    total_debit = sum(float(l.debit or 0) for l in journal.lines)
    total_credit = sum(float(l.credit or 0) for l in journal.lines)
    if round(total_debit, 2) != round(total_credit, 2):
        raise HTTPException(
            status_code=400,
            detail="Cannot post unbalanced journal.",
        )

    journal.status = JournalStatus.POSTED
    journal.posted_at = datetime.utcnow()

    db.commit()
    db.refresh(journal)
    return _to_journal_response(journal)

