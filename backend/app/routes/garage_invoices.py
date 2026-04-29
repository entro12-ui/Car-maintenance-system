from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal

from app.database import get_db
from app.auth import get_current_admin

from app.models.job_order import JobOrder, JobOrderStatus, JobOrderInvoiceType
from app.models.customer import Customer
from app.models.vehicle import Vehicle
from app.models.employee import Employee

from app.models.labor import LaborType, JobOrderLaborCharge
from app.models.job_order_additional_charges import (
    JobOrderMiscCharge,
    JobOrderFuelLubricantCharge,
    JobOrderSubletWorkCharge,
    JobOrderOtherCharge,
    MiscChargeType,
    FuelLubricantItem,
    SubletWorkType,
    OtherChargeType,
)
from app.models.job_order_inventory import (
    JobOrderItemIssue,
    JobOrderItemIssueLine,
    JobOrderItemIssueStatus,
    JobOrderReturnRequest,
    JobOrderReturnRequestLine,
    JobOrderReturnRequestStatus,
)
from app.models.part import PartInventory

from app.models.garage_invoice import (
    GarageInvoice,
    GarageInvoiceStatus,
    DiscountRateEntry,
    DiscountRateEntryScope,
)
from app.models.enterprise import GLPostingRule
from app.models.gl import Journal, JournalLine, JournalStatus
from app.schemas.garage_invoice import (
    EligibleJobOrderResponse,
    GarageInvoiceCreate,
    GarageInvoiceResponse,
    GarageInvoiceCancelReturnRequest,
    UncollectedInvoicesResponse,
    ClearUncollectedRequest,
    DiscountRateEntryCreate,
    DiscountRateEntryResponse,
    GarageInvoicePrintResponse,
    InvoiceLineLabor,
    InvoiceLinePart,
    InvoiceLineCharge,
)

router = APIRouter(prefix="/garage-invoices", tags=["garage-invoices"])


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


def _resolve_amount(inv: GarageInvoice, amount_source: str) -> Decimal:
    src = (amount_source or "TOTAL_AMOUNT").upper()
    if src == "DISCOUNT_AMOUNT":
        return Decimal(str(inv.discount_amount or 0))
    if src == "SUBTOTAL":
        return Decimal(str(inv.subtotal or 0))
    return Decimal(str(inv.total_amount or 0))


def _auto_post_invoice_event(db: Session, inv: GarageInvoice, event_code: str):
    rules = (
        db.query(GLPostingRule)
        .filter(GLPostingRule.event_code == event_code)
        .filter(GLPostingRule.is_active.is_(True))
        .all()
    )
    if not rules:
        return

    for rule in rules:
        amount = _resolve_amount(inv, rule.amount_source)
        if amount <= 0:
            continue
        journal = Journal(
            journal_number=_generate_journal_number(db),
            journal_date=date.today(),
            description=f"{event_code} auto-post for invoice {inv.invoice_number}",
            status=JournalStatus.POSTED,
            source_type="GarageInvoice",
            source_id=inv.invoice_id,
            posted_at=datetime.utcnow(),
        )
        db.add(journal)
        db.flush()
        db.add(JournalLine(
            journal_id=journal.journal_id,
            line_number=1,
            account_id=rule.debit_account_id,
            description=f"{event_code} debit",
            debit=amount,
            credit=Decimal("0"),
        ))
        db.add(JournalLine(
            journal_id=journal.journal_id,
            line_number=2,
            account_id=rule.credit_account_id,
            description=f"{event_code} credit",
            debit=Decimal("0"),
            credit=amount,
        ))


def _generate_invoice_number(db: Session) -> str:
    today = date.today()
    date_part = today.strftime("%Y%m%d")

    last = (
        db.query(GarageInvoice)
        .filter(GarageInvoice.invoice_number.like(f"INV-{date_part}-%"))
        .order_by(GarageInvoice.invoice_id.desc())
        .first()
    )

    if last and last.invoice_number:
        try:
            seq = int(last.invoice_number.split("-")[-1]) + 1
        except Exception:
            seq = 1
    else:
        seq = 1

    return f"INV-{date_part}-{seq:04d}"


def _get_active_discount_rate(db: Session, job_order: JobOrder) -> Decimal:
    today = date.today()

    job_row = (
        db.query(DiscountRateEntry)
        .filter(DiscountRateEntry.scope == DiscountRateEntryScope.JOB_ORDER)
        .filter(DiscountRateEntry.job_order_id == job_order.job_order_id)
        .order_by(DiscountRateEntry.created_at.desc())
        .first()
    )
    if job_row:
        if job_row.valid_from and today < job_row.valid_from:
            pass
        elif job_row.valid_to and today > job_row.valid_to:
            pass
        else:
            return Decimal(str(job_row.discount_rate or 0))

    if job_order.customer_id is None:
        return Decimal("0")

    cust_row = (
        db.query(DiscountRateEntry)
        .filter(DiscountRateEntry.scope == DiscountRateEntryScope.CUSTOMER)
        .filter(DiscountRateEntry.customer_id == job_order.customer_id)
        .order_by(DiscountRateEntry.created_at.desc())
        .first()
    )
    if not cust_row:
        return Decimal("0")

    if cust_row.valid_from and today < cust_row.valid_from:
        return Decimal("0")
    if cust_row.valid_to and today > cust_row.valid_to:
        return Decimal("0")

    return Decimal(str(cust_row.discount_rate or 0))


def _calculate_job_totals(db: Session, job_order_id: int):
    labor_total = (
        db.query(func.coalesce(func.sum(JobOrderLaborCharge.amount), 0))
        .filter(JobOrderLaborCharge.job_order_id == job_order_id)
        .scalar()
    )

    misc_total = (
        db.query(func.coalesce(func.sum(JobOrderMiscCharge.amount), 0))
        .filter(JobOrderMiscCharge.job_order_id == job_order_id)
        .scalar()
    )
    fuel_total = (
        db.query(func.coalesce(func.sum(JobOrderFuelLubricantCharge.amount), 0))
        .filter(JobOrderFuelLubricantCharge.job_order_id == job_order_id)
        .scalar()
    )
    sublet_total = (
        db.query(func.coalesce(func.sum(JobOrderSubletWorkCharge.amount), 0))
        .filter(JobOrderSubletWorkCharge.job_order_id == job_order_id)
        .scalar()
    )
    other_total = (
        db.query(func.coalesce(func.sum(JobOrderOtherCharge.amount), 0))
        .filter(JobOrderOtherCharge.job_order_id == job_order_id)
        .scalar()
    )

    charges_total = Decimal(str(misc_total)) + Decimal(str(fuel_total)) + Decimal(str(sublet_total)) + Decimal(str(other_total))

    # Parts: sum finalized issues minus approved returns (net quantity per part)
    issued = (
        db.query(
            JobOrderItemIssueLine.part_id,
            func.coalesce(func.sum(JobOrderItemIssueLine.quantity), 0).label("qty"),
            func.max(JobOrderItemIssueLine.unit_price).label("unit_price"),
        )
        .join(JobOrderItemIssue, JobOrderItemIssue.issue_id == JobOrderItemIssueLine.issue_id)
        .filter(JobOrderItemIssue.job_order_id == job_order_id)
        .filter(JobOrderItemIssue.status == JobOrderItemIssueStatus.FINALIZED)
        .group_by(JobOrderItemIssueLine.part_id)
        .all()
    )

    returned = (
        db.query(
            JobOrderReturnRequestLine.part_id,
            func.coalesce(func.sum(JobOrderReturnRequestLine.quantity), 0).label("qty"),
        )
        .join(JobOrderReturnRequest, JobOrderReturnRequest.return_request_id == JobOrderReturnRequestLine.return_request_id)
        .filter(JobOrderReturnRequest.job_order_id == job_order_id)
        .filter(JobOrderReturnRequest.status == JobOrderReturnRequestStatus.APPROVED)
        .group_by(JobOrderReturnRequestLine.part_id)
        .all()
    )
    returned_map = {int(r.part_id): int(r.qty or 0) for r in returned}

    parts_total = Decimal("0")
    for row in issued:
        part_id = int(row.part_id)
        issued_qty = int(row.qty or 0)
        returned_qty = int(returned_map.get(part_id, 0))
        net_qty = max(issued_qty - returned_qty, 0)
        unit_price = Decimal(str(row.unit_price or 0))
        parts_total += Decimal(net_qty) * unit_price

    labor_total = Decimal(str(labor_total or 0))

    subtotal = labor_total + parts_total + charges_total
    return {
        "labor_total": labor_total,
        "parts_total": parts_total,
        "charges_total": charges_total,
        "subtotal": subtotal,
    }


@router.get("/eligible-jobs", response_model=List[EligibleJobOrderResponse])
def list_eligible_jobs(
    invoice_type: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    invoice_type = (invoice_type or "").strip()
    if invoice_type not in (JobOrderInvoiceType.CASH, JobOrderInvoiceType.CREDIT, JobOrderInvoiceType.ITM):
        raise HTTPException(status_code=400, detail="Invalid invoice_type (Cash|Credit|ITM)")

    issued_exists = (
        db.query(GarageInvoice.invoice_id)
        .filter(GarageInvoice.status == GarageInvoiceStatus.ISSUED)
        .filter(GarageInvoice.job_order_id == JobOrder.job_order_id)
        .exists()
    )

    rows = (
        db.query(JobOrder, Customer, Vehicle)
        .join(Vehicle, Vehicle.vehicle_id == JobOrder.vehicle_id)
        .outerjoin(Customer, Customer.customer_id == JobOrder.customer_id)
        .filter(JobOrder.status == JobOrderStatus.CLOSED)
        .filter(JobOrder.invoice_type == invoice_type)
        .filter(~issued_exists)
        .order_by(JobOrder.closed_at.desc().nullslast(), JobOrder.job_order_id.desc())
        .all()
    )

    out = []
    for job, customer, vehicle in rows:
        customer_name = None
        if customer:
            customer_name = f"{customer.first_name} {customer.last_name}".strip()
        out.append(
            EligibleJobOrderResponse(
                job_order_id=job.job_order_id,
                job_order_number=job.job_order_number,
                invoice_type=job.invoice_type,
                customer_id=job.customer_id,
                customer_name=customer_name,
                vehicle_id=job.vehicle_id,
                plate_number=getattr(vehicle, "license_plate", None),
                make=getattr(vehicle, "make", None),
                model=getattr(vehicle, "model", None),
            )
        )
    return out


@router.get("/proforma-preview/{job_order_id}")
def get_proforma_preview(
    job_order_id: int,
    invoice_type: str = JobOrderInvoiceType.CASH,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """
    Preview payload for proforma printing without issuing an invoice.
    Used for closed jobs that are pending invoicing.
    """
    invoice_type = (invoice_type or "").strip()
    if invoice_type not in (JobOrderInvoiceType.CASH, JobOrderInvoiceType.CREDIT, JobOrderInvoiceType.ITM):
        raise HTTPException(status_code=400, detail="Invalid invoice_type (Cash|Credit|ITM)")

    job = (
        db.query(JobOrder)
        .options(joinedload(JobOrder.customer), joinedload(JobOrder.vehicle))
        .filter(JobOrder.job_order_id == job_order_id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job order not found")
    if job.status != JobOrderStatus.CLOSED:
        raise HTTPException(status_code=400, detail="Only Closed job orders can be printed as proforma")
    if job.invoice_type != invoice_type:
        raise HTTPException(status_code=400, detail="Job order invoice_type does not match selected sales type")

    existing = (
        db.query(GarageInvoice)
        .filter(GarageInvoice.job_order_id == job.job_order_id)
        .filter(GarageInvoice.status == GarageInvoiceStatus.ISSUED)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Job is already invoiced")

    totals = _calculate_job_totals(db, job.job_order_id)
    discount_rate = _get_active_discount_rate(db, job)
    if discount_rate < 0:
        discount_rate = Decimal("0")
    if discount_rate > Decimal("100"):
        discount_rate = Decimal("100")
    discount_amount = (totals["subtotal"] * discount_rate) / Decimal("100")
    total_amount = totals["subtotal"] - discount_amount

    now = datetime.utcnow()
    proforma_number = f"PRF-{now.strftime('%Y%m%d')}-{job.job_order_id:04d}"

    customer = getattr(job, "customer", None)
    vehicle = getattr(job, "vehicle", None)
    customer_name = None
    if customer:
        customer_name = f"{customer.first_name} {customer.last_name}".strip()

    return {
        "proforma_number": proforma_number,
        "job_order_id": job.job_order_id,
        "job_order_number": job.job_order_number,
        "invoice_type": invoice_type,
        "invoice_date": now.date().isoformat(),
        "proforma_date": now.date().isoformat(),
        "customer_name": customer_name,
        "customer_address": getattr(customer, "address", None),
        "customer_tin": getattr(customer, "tin", None),
        "customer_phone": getattr(customer, "phone", None),
        "customer_city": getattr(customer, "city", None),
        "vehicle_plate": getattr(vehicle, "license_plate", None),
        "repair_type": getattr(job, "invoice_type", None),
        "total_amount": float(total_amount),
        "line_items_count": None,  # optional count for UI hint
        "totals": {
            "labor_total": float(totals["labor_total"]),
            "parts_total": float(totals["parts_total"]),
            "charges_total": float(totals["charges_total"]),
            "subtotal": float(totals["subtotal"]),
            "discount_rate": float(discount_rate),
            "discount_amount": float(discount_amount),
            "total_amount": float(total_amount),
        },
    }


@router.post("/", response_model=GarageInvoiceResponse)
def create_garage_invoice(
    payload: GarageInvoiceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    invoice_type = (payload.invoice_type or "").strip()
    if invoice_type not in (JobOrderInvoiceType.CASH, JobOrderInvoiceType.CREDIT, JobOrderInvoiceType.ITM):
        raise HTTPException(status_code=400, detail="Invalid invoice_type (Cash|Credit|ITM)")

    job = (
        db.query(JobOrder)
        .options(joinedload(JobOrder.customer), joinedload(JobOrder.vehicle))
        .filter(JobOrder.job_order_id == payload.job_order_id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job order not found")

    if job.status != JobOrderStatus.CLOSED:
        raise HTTPException(status_code=400, detail="Only Closed job orders can be invoiced")

    if job.invoice_type != invoice_type:
        raise HTTPException(status_code=400, detail="Job order invoice_type does not match")

    existing = (
        db.query(GarageInvoice)
        .filter(GarageInvoice.job_order_id == job.job_order_id)
        .filter(GarageInvoice.status == GarageInvoiceStatus.ISSUED)
        .first()
    )
    if existing:
        return existing

    totals = _calculate_job_totals(db, job.job_order_id)
    discount_rate = _get_active_discount_rate(db, job)
    if discount_rate < 0:
        discount_rate = Decimal("0")
    if discount_rate > Decimal("100"):
        discount_rate = Decimal("100")

    discount_amount = (totals["subtotal"] * discount_rate) / Decimal("100")
    total_amount = totals["subtotal"] - discount_amount

    row = GarageInvoice(
        invoice_number=_generate_invoice_number(db),
        job_order_id=job.job_order_id,
        invoice_type=invoice_type,
        status=GarageInvoiceStatus.ISSUED,
        subtotal=totals["subtotal"],
        labor_total=totals["labor_total"],
        parts_total=totals["parts_total"],
        charges_total=totals["charges_total"],
        discount_rate=discount_rate,
        discount_amount=discount_amount,
        total_amount=total_amount,
        issued_by_employee_id=getattr(current_user, "employee_id", None),
        is_collected=(invoice_type == JobOrderInvoiceType.CASH),
        collected_at=(datetime.utcnow() if invoice_type == JobOrderInvoiceType.CASH else None),
        cleared_by_employee_id=(getattr(current_user, "employee_id", None) if invoice_type == JobOrderInvoiceType.CASH else None),
    )

    db.add(row)
    db.flush()
    _auto_post_invoice_event(db, row, "GARAGE_INVOICE_ISSUED")
    db.commit()
    db.refresh(row)
    return row


@router.get("/", response_model=List[GarageInvoiceResponse])
def list_garage_invoices(
    status: Optional[str] = None,
    invoice_type: Optional[str] = None,
    job_order_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    q = db.query(GarageInvoice)
    if status:
        q = q.filter(GarageInvoice.status == status)
    if invoice_type:
        q = q.filter(GarageInvoice.invoice_type == invoice_type)
    if job_order_id is not None:
        q = q.filter(GarageInvoice.job_order_id == job_order_id)
    return q.order_by(GarageInvoice.created_at.desc()).all()


@router.get("/{invoice_id:int}", response_model=GarageInvoiceResponse)
def get_garage_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = db.query(GarageInvoice).filter(GarageInvoice.invoice_id == invoice_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return row


@router.post("/{invoice_id:int}/cancel", response_model=GarageInvoiceResponse)
def cancel_invoice(
    invoice_id: int,
    payload: GarageInvoiceCancelReturnRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = db.query(GarageInvoice).filter(GarageInvoice.invoice_id == invoice_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if row.status != GarageInvoiceStatus.ISSUED:
        raise HTTPException(status_code=400, detail="Only Issued invoices can be cancelled")

    row.status = GarageInvoiceStatus.CANCELLED
    row.cancel_reason = (payload.reason or "").strip() or None
    row.cancel_letter_reference = (payload.letter_reference or "").strip() or None
    row.cancelled_at = datetime.utcnow()
    row.cancelled_by_employee_id = getattr(current_user, "employee_id", None)

    _auto_post_invoice_event(db, row, "GARAGE_INVOICE_CANCELLED")
    db.commit()
    db.refresh(row)
    return row


@router.post("/{invoice_id:int}/return", response_model=GarageInvoiceResponse)
def return_invoice(
    invoice_id: int,
    payload: GarageInvoiceCancelReturnRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    row = db.query(GarageInvoice).filter(GarageInvoice.invoice_id == invoice_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if row.status != GarageInvoiceStatus.ISSUED:
        raise HTTPException(status_code=400, detail="Only Issued invoices can be returned")

    row.status = GarageInvoiceStatus.RETURNED
    row.return_reason = (payload.reason or "").strip() or None
    row.return_letter_reference = (payload.letter_reference or "").strip() or None
    row.returned_at = datetime.utcnow()
    row.returned_by_employee_id = getattr(current_user, "employee_id", None)

    _auto_post_invoice_event(db, row, "GARAGE_INVOICE_RETURNED")
    db.commit()
    db.refresh(row)
    return row


@router.get("/uncollected", response_model=List[UncollectedInvoicesResponse])
def list_uncollected(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date, datetime.max.time())

    rows = (
        db.query(GarageInvoice, JobOrder, Customer)
        .join(JobOrder, JobOrder.job_order_id == GarageInvoice.job_order_id)
        .outerjoin(Customer, Customer.customer_id == JobOrder.customer_id)
        .filter(GarageInvoice.status == GarageInvoiceStatus.ISSUED)
        .filter(GarageInvoice.is_collected.is_(False))
        .filter(GarageInvoice.created_at >= start_dt)
        .filter(GarageInvoice.created_at <= end_dt)
        .order_by(GarageInvoice.created_at.desc())
        .all()
    )

    out = []
    for inv, job, cust in rows:
        customer_name = None
        if cust:
            customer_name = f"{cust.first_name} {cust.last_name}".strip()
        out.append(
            UncollectedInvoicesResponse(
                invoice_id=inv.invoice_id,
                invoice_number=inv.invoice_number,
                invoice_type=inv.invoice_type,
                job_order_id=inv.job_order_id,
                job_order_number=job.job_order_number,
                customer_name=customer_name,
                total_amount=float(inv.total_amount or 0),
                created_at=inv.created_at,
            )
        )
    return out


@router.post("/uncollected/clear")
def clear_uncollected(
    start_date: date,
    end_date: date,
    payload: ClearUncollectedRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date, datetime.max.time())

    q = (
        db.query(GarageInvoice)
        .filter(GarageInvoice.status == GarageInvoiceStatus.ISSUED)
        .filter(GarageInvoice.is_collected.is_(False))
        .filter(GarageInvoice.created_at >= start_dt)
        .filter(GarageInvoice.created_at <= end_dt)
    )

    if payload.invoice_ids:
        q = q.filter(GarageInvoice.invoice_id.in_(payload.invoice_ids))

    rows = q.all()
    if not rows:
        return {"message": "Nothing to clear"}

    now = datetime.utcnow()
    emp_id = getattr(current_user, "employee_id", None)

    for inv in rows:
        inv.is_collected = True
        inv.collected_at = now
        inv.cleared_by_employee_id = emp_id

    db.commit()
    return {"message": f"Cleared {len(rows)} invoice(s)"}


@router.post("/discount-rates", response_model=DiscountRateEntryResponse)
def create_discount_rate(
    payload: DiscountRateEntryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    scope = (payload.scope or "").strip()
    if scope not in (DiscountRateEntryScope.JOB_ORDER, DiscountRateEntryScope.CUSTOMER):
        raise HTTPException(status_code=400, detail="Invalid scope (JobOrder|Customer)")

    if payload.discount_rate is None or float(payload.discount_rate) < 0 or float(payload.discount_rate) > 100:
        raise HTTPException(status_code=400, detail="discount_rate must be between 0 and 100")

    if scope == DiscountRateEntryScope.JOB_ORDER:
        if not payload.job_order_id:
            raise HTTPException(status_code=400, detail="job_order_id is required for JobOrder scope")
        job = db.query(JobOrder).filter(JobOrder.job_order_id == payload.job_order_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job order not found")

        row = DiscountRateEntry(
            scope=scope,
            job_order_id=payload.job_order_id,
            customer_id=None,
            discount_rate=Decimal(str(payload.discount_rate)),
            remark=(payload.remark or "").strip() or None,
            authority_name=(payload.authority_name or "").strip() or None,
            valid_from=payload.valid_from,
            valid_to=payload.valid_to,
            recorded_by_employee_id=getattr(current_user, "employee_id", None),
        )

    else:
        if not payload.customer_id:
            raise HTTPException(status_code=400, detail="customer_id is required for Customer scope")
        customer = db.query(Customer).filter(Customer.customer_id == payload.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

        row = DiscountRateEntry(
            scope=scope,
            job_order_id=None,
            customer_id=payload.customer_id,
            discount_rate=Decimal(str(payload.discount_rate)),
            remark=(payload.remark or "").strip() or None,
            authority_name=(payload.authority_name or "").strip() or None,
            valid_from=payload.valid_from,
            valid_to=payload.valid_to,
            recorded_by_employee_id=getattr(current_user, "employee_id", None),
        )

    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/discount-rates", response_model=List[DiscountRateEntryResponse])
def list_discount_rates(
    scope: str,
    job_order_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    scope = (scope or "").strip()
    if scope not in (DiscountRateEntryScope.JOB_ORDER, DiscountRateEntryScope.CUSTOMER):
        raise HTTPException(status_code=400, detail="Invalid scope (JobOrder|Customer)")

    q = db.query(DiscountRateEntry).filter(DiscountRateEntry.scope == scope)
    if scope == DiscountRateEntryScope.JOB_ORDER:
        if not job_order_id:
            raise HTTPException(status_code=400, detail="job_order_id is required for JobOrder scope")
        q = q.filter(DiscountRateEntry.job_order_id == job_order_id)
    else:
        if not customer_id:
            raise HTTPException(status_code=400, detail="customer_id is required for Customer scope")
        q = q.filter(DiscountRateEntry.customer_id == customer_id)

    return q.order_by(DiscountRateEntry.created_at.desc()).all()


@router.get("/{invoice_id:int}/print", response_model=GarageInvoicePrintResponse)
def get_invoice_print(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    inv = db.query(GarageInvoice).filter(GarageInvoice.invoice_id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    job = (
        db.query(JobOrder)
        .options(joinedload(JobOrder.customer), joinedload(JobOrder.vehicle))
        .filter(JobOrder.job_order_id == inv.job_order_id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job order not found")

    # Labor lines
    labor_rows = (
        db.query(JobOrderLaborCharge, LaborType, Employee)
        .join(LaborType, LaborType.labor_type_id == JobOrderLaborCharge.labor_type_id)
        .outerjoin(Employee, Employee.employee_id == JobOrderLaborCharge.technician_employee_id)
        .filter(JobOrderLaborCharge.job_order_id == job.job_order_id)
        .order_by(JobOrderLaborCharge.created_at.asc())
        .all()
    )
    labor_lines = []
    for lc, lt, tech in labor_rows:
        tech_name = None
        if tech:
            tech_name = getattr(tech, "name", None) or f"{getattr(tech, 'first_name', '')} {getattr(tech, 'last_name', '')}".strip() or None
        labor_lines.append(
            InvoiceLineLabor(
                labor_type_name=lt.labor_type_name,
                hours_worked=float(lc.hours_worked or 0),
                hourly_rate=float(lc.hourly_rate or 0),
                amount=float(lc.amount or 0),
                technician_name=tech_name,
                remark=lc.remark,
            )
        )

    # Part lines: net quantity per part
    issued = (
        db.query(
            JobOrderItemIssueLine.part_id,
            func.coalesce(func.sum(JobOrderItemIssueLine.quantity), 0).label("qty"),
            func.max(JobOrderItemIssueLine.unit_price).label("unit_price"),
        )
        .join(JobOrderItemIssue, JobOrderItemIssue.issue_id == JobOrderItemIssueLine.issue_id)
        .filter(JobOrderItemIssue.job_order_id == job.job_order_id)
        .filter(JobOrderItemIssue.status == JobOrderItemIssueStatus.FINALIZED)
        .group_by(JobOrderItemIssueLine.part_id)
        .all()
    )
    returned = (
        db.query(
            JobOrderReturnRequestLine.part_id,
            func.coalesce(func.sum(JobOrderReturnRequestLine.quantity), 0).label("qty"),
        )
        .join(JobOrderReturnRequest, JobOrderReturnRequest.return_request_id == JobOrderReturnRequestLine.return_request_id)
        .filter(JobOrderReturnRequest.job_order_id == job.job_order_id)
        .filter(JobOrderReturnRequest.status == JobOrderReturnRequestStatus.APPROVED)
        .group_by(JobOrderReturnRequestLine.part_id)
        .all()
    )
    returned_map = {int(r.part_id): int(r.qty or 0) for r in returned}

    part_ids = [int(r.part_id) for r in issued]
    parts = []
    if part_ids:
        parts = db.query(PartInventory).filter(PartInventory.part_id.in_(part_ids)).all()
    part_map = {int(p.part_id): p for p in parts}

    part_lines = []
    for r in issued:
        part_id = int(r.part_id)
        issued_qty = int(r.qty or 0)
        net_qty = max(issued_qty - int(returned_map.get(part_id, 0)), 0)
        if net_qty <= 0:
            continue
        unit_price = float(r.unit_price or 0)
        part = part_map.get(part_id)
        part_name = getattr(part, "part_name", None) or getattr(part, "name", None) or f"Part #{part_id}"
        part_lines.append(
            InvoiceLinePart(
                part_id=part_id,
                part_name=part_name,
                quantity=net_qty,
                unit_price=unit_price,
                amount=float(Decimal(net_qty) * Decimal(str(unit_price))),
            )
        )

    # Charge lines
    charge_lines: List[InvoiceLineCharge] = []

    misc_rows = (
        db.query(JobOrderMiscCharge, MiscChargeType)
        .join(MiscChargeType, MiscChargeType.misc_charge_type_id == JobOrderMiscCharge.misc_charge_type_id)
        .filter(JobOrderMiscCharge.job_order_id == job.job_order_id)
        .order_by(JobOrderMiscCharge.created_at.asc())
        .all()
    )
    for ch, ct in misc_rows:
        charge_lines.append(
            InvoiceLineCharge(
                category="Misc",
                code=ct.charge_code,
                description=ct.description,
                quantity=1,
                unit_price=float(ch.unit_price or 0),
                amount=float(ch.amount or 0),
                remark=ch.remark,
            )
        )

    fuel_rows = (
        db.query(JobOrderFuelLubricantCharge, FuelLubricantItem)
        .join(FuelLubricantItem, FuelLubricantItem.fuel_lubricant_id == JobOrderFuelLubricantCharge.fuel_lubricant_id)
        .filter(JobOrderFuelLubricantCharge.job_order_id == job.job_order_id)
        .order_by(JobOrderFuelLubricantCharge.created_at.asc())
        .all()
    )
    for ch, item in fuel_rows:
        charge_lines.append(
            InvoiceLineCharge(
                category="Fuel/Lubricant",
                code=item.item_code,
                description=item.description,
                quantity=float(ch.quantity or 0),
                unit_price=float(ch.unit_price or 0),
                amount=float(ch.amount or 0),
                remark=ch.remark,
            )
        )

    sublet_rows = (
        db.query(JobOrderSubletWorkCharge, SubletWorkType)
        .join(SubletWorkType, SubletWorkType.sublet_work_type_id == JobOrderSubletWorkCharge.sublet_work_type_id)
        .filter(JobOrderSubletWorkCharge.job_order_id == job.job_order_id)
        .order_by(JobOrderSubletWorkCharge.created_at.asc())
        .all()
    )
    for ch, st in sublet_rows:
        charge_lines.append(
            InvoiceLineCharge(
                category="Sublet",
                code=st.work_code,
                description=st.description,
                quantity=float(ch.quantity or 0),
                unit_price=float(ch.unit_price or 0),
                amount=float(ch.amount or 0),
                remark=ch.remark,
            )
        )

    other_rows = (
        db.query(JobOrderOtherCharge, OtherChargeType)
        .join(OtherChargeType, OtherChargeType.other_charge_type_id == JobOrderOtherCharge.other_charge_type_id)
        .filter(JobOrderOtherCharge.job_order_id == job.job_order_id)
        .order_by(JobOrderOtherCharge.created_at.asc())
        .all()
    )
    for ch, ot in other_rows:
        charge_lines.append(
            InvoiceLineCharge(
                category="Other",
                code=ot.charge_code,
                description=ot.description,
                quantity=float(ch.quantity or 0),
                unit_price=float(ch.unit_price or 0),
                amount=float(ch.amount or 0),
                remark=ch.remark,
            )
        )

    cust = getattr(job, "customer", None)
    veh = getattr(job, "vehicle", None)

    customer_name = None
    customer_phone = None
    if cust:
        customer_name = f"{cust.first_name} {cust.last_name}".strip()
        customer_phone = getattr(cust, "phone", None)

    return GarageInvoicePrintResponse(
        invoice=GarageInvoiceResponse.model_validate(inv),
        job_order_number=job.job_order_number,
        job_order_status=job.status,
        closed_at=job.closed_at,
        customer_name=customer_name,
        customer_phone=customer_phone,
        vehicle_plate=getattr(veh, "license_plate", None) if veh else None,
        vehicle_make=getattr(veh, "make", None) if veh else None,
        vehicle_model=getattr(veh, "model", None) if veh else None,
        labor_lines=labor_lines,
        part_lines=part_lines,
        charge_lines=charge_lines,
    )
