from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_admin
from app.models import MemoTemplate, UserDefinedReport, GLPostingRule, GLAccount


router = APIRouter()


class MemoTemplateBase(BaseModel):
    template_code: str = Field(..., max_length=60)
    title: str = Field(..., max_length=200)
    category: Optional[str] = Field(default="Memo", max_length=50)
    body: str
    is_active: bool = True


class MemoTemplateUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    body: Optional[str] = None
    is_active: Optional[bool] = None


class MemoTemplateResponse(MemoTemplateBase):
    template_id: int

    class Config:
        from_attributes = True


@router.get("/memo-templates", response_model=List[MemoTemplateResponse])
def list_memo_templates(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    q = db.query(MemoTemplate).order_by(MemoTemplate.created_at.desc())
    if category:
        q = q.filter(MemoTemplate.category == category)
    return q.all()


@router.post("/memo-templates", response_model=MemoTemplateResponse)
def create_memo_template(
    payload: MemoTemplateBase,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    existing = db.query(MemoTemplate).filter(MemoTemplate.template_code == payload.template_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Template code already exists.")
    row = MemoTemplate(**payload.dict())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/memo-templates/{template_id}", response_model=MemoTemplateResponse)
def update_memo_template(
    template_id: int,
    payload: MemoTemplateUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = db.query(MemoTemplate).filter(MemoTemplate.template_id == template_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Template not found.")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row


class UserDefinedReportBase(BaseModel):
    report_code: str = Field(..., max_length=60)
    report_name: str = Field(..., max_length=200)
    report_group: Optional[str] = Field(default="UserDefined", max_length=50)
    description: Optional[str] = None
    query_definition: Optional[str] = None
    is_active: bool = True


class UserDefinedReportUpdate(BaseModel):
    report_name: Optional[str] = None
    report_group: Optional[str] = None
    description: Optional[str] = None
    query_definition: Optional[str] = None
    is_active: Optional[bool] = None


class UserDefinedReportResponse(UserDefinedReportBase):
    report_id: int

    class Config:
        from_attributes = True


@router.get("/user-defined-reports", response_model=List[UserDefinedReportResponse])
def list_user_defined_reports(
    report_group: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    q = db.query(UserDefinedReport).order_by(UserDefinedReport.created_at.desc())
    if report_group:
        q = q.filter(UserDefinedReport.report_group == report_group)
    return q.all()


@router.post("/user-defined-reports", response_model=UserDefinedReportResponse)
def create_user_defined_report(
    payload: UserDefinedReportBase,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    existing = db.query(UserDefinedReport).filter(UserDefinedReport.report_code == payload.report_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Report code already exists.")
    row = UserDefinedReport(**payload.dict())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/user-defined-reports/{report_id}", response_model=UserDefinedReportResponse)
def update_user_defined_report(
    report_id: int,
    payload: UserDefinedReportUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = db.query(UserDefinedReport).filter(UserDefinedReport.report_id == report_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Report not found.")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row


class GLPostingRuleBase(BaseModel):
    event_code: str = Field(..., max_length=80)
    description: Optional[str] = Field(default=None, max_length=255)
    debit_account_id: int
    credit_account_id: int
    amount_source: str = Field(default="TOTAL_AMOUNT", max_length=40)
    is_active: bool = True


class GLPostingRuleUpdate(BaseModel):
    description: Optional[str] = None
    debit_account_id: Optional[int] = None
    credit_account_id: Optional[int] = None
    amount_source: Optional[str] = None
    is_active: Optional[bool] = None


class GLPostingRuleResponse(GLPostingRuleBase):
    rule_id: int

    class Config:
        from_attributes = True


def _validate_accounts(db: Session, debit_account_id: int, credit_account_id: int):
    debit = db.query(GLAccount).filter(GLAccount.account_id == debit_account_id).first()
    credit = db.query(GLAccount).filter(GLAccount.account_id == credit_account_id).first()
    if not debit:
        raise HTTPException(status_code=400, detail="Invalid debit_account_id")
    if not credit:
        raise HTTPException(status_code=400, detail="Invalid credit_account_id")


@router.get("/gl-posting-rules", response_model=List[GLPostingRuleResponse])
def list_gl_posting_rules(
    event_code: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    q = db.query(GLPostingRule).order_by(GLPostingRule.created_at.desc())
    if event_code:
        q = q.filter(GLPostingRule.event_code == event_code)
    return q.all()


@router.post("/gl-posting-rules", response_model=GLPostingRuleResponse)
def create_gl_posting_rule(
    payload: GLPostingRuleBase,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    _validate_accounts(db, payload.debit_account_id, payload.credit_account_id)
    row = GLPostingRule(**payload.dict())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/gl-posting-rules/{rule_id}", response_model=GLPostingRuleResponse)
def update_gl_posting_rule(
    rule_id: int,
    payload: GLPostingRuleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = db.query(GLPostingRule).filter(GLPostingRule.rule_id == rule_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="GL posting rule not found.")

    data = payload.dict(exclude_unset=True)
    if "debit_account_id" in data or "credit_account_id" in data:
        _validate_accounts(
            db,
            data.get("debit_account_id", row.debit_account_id),
            data.get("credit_account_id", row.credit_account_id),
        )
    for k, v in data.items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row

