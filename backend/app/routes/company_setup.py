"""
Company Setup (HillMaster File → Company Setup parity).

Stores fields as SystemSetting rows with keys: cs.{section}.{field}
and category company_setup_{section} for filtering in System Settings UI.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_admin
from app.models.settings import SystemSetting
from app.models.audit import AuditLog

router = APIRouter(prefix="/company-setup", tags=["Company Setup"])

# section -> list of (field_key, description)
SCHEMA: Dict[str, List[Tuple[str, str]]] = {
    "company": [
        ("current_period", "Current period (month name or number)"),
        ("budget_year", "Budget year"),
        ("taken_done", "Conversion taken done (true/false)"),
        ("is_branch", "Is branch site (true/false)"),
        ("update_customer_from_gl", "Update customer from GL only (true/false)"),
        ("shop_branch", "Shop / branch code or name"),
        ("default_product_group", "Default product group for branch"),
        ("allow_sell_over_branch_stock", "Allow sell over branch stock (true/false)"),
        ("allow_sell_over_company_stock", "Allow sell over company stock (true/false)"),
        ("update_aging_credit_sales", "Update aging on credit sales (Yes/No)"),
        ("lead_time_safety_stock_months", "Lead time + safety stock (months)"),
        ("pricing_method", "Pricing method code or name"),
        ("vat_percent", "VAT % (e.g. 15)"),
        ("customer_supplier_start_number", "Starting supplier/customer number"),
        ("adjustment_start_number", "Adjustment starting number"),
        ("adjustment_transaction_prefix", "Adjustment transaction prefix"),
        ("sales_return_invoice_start", "Sales return invoice starting number"),
        ("sales_return_transaction_prefix", "Sales return transaction prefix"),
        ("cash_walkin_customer_start", "Cash walk-in customer starting number"),
        ("transfer_start_number", "Transfer starting number"),
    ],
    "application": [
        ("app_id", "Application ID"),
        ("app_name", "Application name"),
        ("description", "Application description"),
        ("application_path", "Application path"),
        ("data_path", "Data path"),
        ("report_path", "Report path"),
        ("assembly_file_name", "Assembly file name"),
        ("name_space", "Namespace"),
        ("start_up_class", "Startup class"),
        ("method_name", "Method name"),
        ("app_path_local", "Application path (local)"),
        ("rep_path_local", "Report path (local)"),
        ("current_period", "Current period"),
        ("overwrite", "Overwrite reports (true/false)"),
        ("report_header_logo_path", "Report header logo file path or URL"),
    ],
    "address": [
        ("line_1", "Address line 1"),
        ("line_2", "Address line 2"),
        ("line_3", "Address line 3"),
    ],
    "email": [
        ("smtp_server_name", "SMTP server name"),
        ("smtp_port", "SMTP port"),
        ("smtp_time_out", "SMTP timeout"),
        ("send_from_email_address", "Send from email address"),
        ("login_name", "Login name"),
        ("password", "Password"),
        ("use_login_credentials", "Use login credentials (true/false)"),
        ("enable_ssl", "Enable SSL (true/false)"),
        ("email_footer_line_1", "Email footer line 1"),
        ("email_footer_line_2", "Email footer line 2"),
    ],
    "sms": [
        ("message_server_type", "Message server type"),
        ("ms_sql_server_name", "MS SQL server name"),
        ("sql_server_user_id", "SQL server user ID"),
        ("password", "Password"),
        ("database_name", "Database name"),
        ("sender_number", "Sender number"),
        ("footer_line_1", "Footer line 1"),
        ("footer_line_2", "Footer line 2"),
        ("footer_line_3", "Footer line 3"),
        ("footer_line_4", "Footer line 4"),
        ("footer_line_5", "Footer line 5"),
    ],
    "default": [
        ("cash_sales_order_prefix", "Cash sales order number prefix"),
        ("cash_sales_order_next", "Cash sales order next number"),
        ("cash_sales_order_max_length", "Cash sales order max length"),
        ("cash_sales_order_inc_year", "Increment cash sales order year (true/false)"),
        ("cash_sales_order_inc_month", "Increment cash sales order month (true/false)"),
        ("credit_sales_order_prefix", "Credit sales order number prefix"),
        ("credit_sales_order_next", "Credit sales order next number"),
        ("credit_sales_order_max_length", "Credit sales order max length"),
        ("credit_sales_order_inc_year", "Increment credit sales order year (true/false)"),
        ("credit_sales_order_inc_month", "Increment credit sales order month (true/false)"),
        ("proforma_invoice_prefix", "Proforma invoice number prefix"),
        ("proforma_invoice_next", "Proforma invoice next number"),
        ("proforma_invoice_max_length", "Proforma invoice max length"),
        ("proforma_invoice_inc_year", "Increment proforma invoice year (true/false)"),
        ("proforma_invoice_inc_month", "Increment proforma invoice month (true/false)"),
        ("refund_credit_note_prefix", "Refund / credit note number prefix"),
        ("refund_credit_note_next", "Refund / credit note next number"),
        ("refund_credit_note_max_length", "Refund / credit note max length"),
        ("refund_credit_note_inc_year", "Increment refund / credit note year (true/false)"),
        ("refund_credit_note_inc_month", "Increment refund / credit note month (true/false)"),
    ],
}


def _setting_key(section: str, field: str) -> str:
    return f"cs.{section}.{field}"


def _category(section: str) -> str:
    return f"company_setup_{section}"


def _get_value(db: Session, section: str, field: str) -> Optional[str]:
    key = _setting_key(section, field)
    row = db.query(SystemSetting).filter(SystemSetting.setting_key == key).first()
    return row.setting_value if row else None


def _set_value(db: Session, section: str, field: str, value: Optional[str], user_id: Optional[int]):
    key = _setting_key(section, field)
    row = db.query(SystemSetting).filter(SystemSetting.setting_key == key).first()
    desc = next((d for f, d in SCHEMA[section] if f == field), field)
    if row is None:
        row = SystemSetting(
            setting_key=key,
            setting_value=value,
            setting_type="string",
            category=_category(section),
            description=desc,
            updated_by=user_id,
        )
        db.add(row)
    else:
        row.setting_value = value
        row.category = _category(section)
        row.description = desc or row.description
        row.updated_by = user_id


def _build_company_setup(db: Session) -> Dict[str, Dict[str, Optional[str]]]:
    out: Dict[str, Dict[str, Optional[str]]] = {}
    for section, fields in SCHEMA.items():
        out[section] = {}
        for field, _desc in fields:
            out[section][field] = _get_value(db, section, field)
    return out


class CompanySetupPayload(BaseModel):
    """Nested payload matching UI tabs (JSON key \"default\" for numbering tab)."""

    model_config = ConfigDict(populate_by_name=True)

    company: Dict[str, Optional[str]] = Field(default_factory=dict)
    application: Dict[str, Optional[str]] = Field(default_factory=dict)
    address: Dict[str, Optional[str]] = Field(default_factory=dict)
    email: Dict[str, Optional[str]] = Field(default_factory=dict)
    sms: Dict[str, Optional[str]] = Field(default_factory=dict)
    defaults: Dict[str, Optional[str]] = Field(default_factory=dict, alias="default")


@router.get("/", response_model=Dict[str, Any])
def get_company_setup(
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_admin),
):
    """Return all company setup fields grouped by tab (missing keys => null)."""
    return _build_company_setup(db)


@router.put("/", response_model=Dict[str, Any])
def save_company_setup(
    payload: CompanySetupPayload,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Upsert all provided fields and write an audit log entry."""
    user_id = getattr(current_user, "user_id", None)

    incoming = {
        "company": payload.company or {},
        "application": payload.application or {},
        "address": payload.address or {},
        "email": payload.email or {},
        "sms": payload.sms or {},
        "default": payload.defaults or {},
    }

    allowed_fields = {s: {f for f, _ in SCHEMA[s]} for s in SCHEMA}
    snapshot_before: Dict[str, Dict[str, Optional[str]]] = {}
    snapshot_after: Dict[str, Dict[str, Optional[str]]] = {}

    for section, data in incoming.items():
        if section not in SCHEMA:
            raise HTTPException(status_code=400, detail=f"Unknown section: {section}")
        for field, value in data.items():
            if field not in allowed_fields[section]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unknown field '{field}' for section '{section}'",
                )
            old_val = _get_value(db, section, field)
            if section not in snapshot_before:
                snapshot_before[section] = {}
            snapshot_before[section][field] = old_val
            _set_value(db, section, field, value, user_id)
            if section not in snapshot_after:
                snapshot_after[section] = {}
            snapshot_after[section][field] = value

    if snapshot_after:
        log = AuditLog(
            user_id=user_id,
            action_type="COMPANY_SETUP_SAVE",
            table_name="company_setup",
            record_id=None,
            old_values=snapshot_before,
            new_values=snapshot_after,
        )
        db.add(log)
    db.commit()

    return _build_company_setup(db)


@router.get("/audit-log")
def list_company_setup_audit(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_admin),
):
    """Recent company setup saves (View Log)."""
    rows = (
        db.query(AuditLog)
        .filter(AuditLog.action_type == "COMPANY_SETUP_SAVE")
        .order_by(AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        {
            "log_id": r.log_id,
            "user_id": r.user_id,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "old_values": r.old_values,
            "new_values": r.new_values,
        }
        for r in rows
    ]
