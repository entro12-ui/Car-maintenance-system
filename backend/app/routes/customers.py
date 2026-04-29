from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional, Any, Dict

from app.database import get_db
from app.models.customer import Customer
from app.models.vehicle import Vehicle
from app.models.service import Service
from app.models.audit import AuditLog
from app.models.gl import GLAccount
from app.schemas.customer import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    GLAccountLookupResponse,
    GLAccountLookupMatch,
)
from app.auth import get_current_admin, get_password_hash

router = APIRouter()


def _customer_snapshot(c: Customer) -> Dict[str, Any]:
    return {
        "customer_id": c.customer_id,
        "first_name": c.first_name,
        "last_name": c.last_name,
        "email": c.email,
        "phone": c.phone,
        "sub_ledger": c.sub_ledger,
        "tin": c.tin,
        "gl_coa_code": c.gl_coa_code,
        "credit_limit": float(c.credit_limit) if c.credit_limit is not None else None,
        "is_active": c.is_active,
    }


def _write_customer_audit(
    db: Session,
    user_id: Optional[int],
    action: str,
    customer_id: Optional[int],
    old_values: Optional[Dict[str, Any]],
    new_values: Optional[Dict[str, Any]],
):
    db.add(
        AuditLog(
            user_id=user_id,
            action_type=action,
            table_name="customers",
            record_id=customer_id,
            old_values=old_values,
            new_values=new_values,
        )
    )


@router.get("/gl-account-lookup", response_model=GLAccountLookupResponse)
def lookup_gl_accounts_for_customer(
    code: str = Query("", max_length=80, description="Partial GL account code or name"),
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """HillMaster-style helper: find GL accounts to map COA on a customer."""
    q = (code or "").strip()
    if not q:
        return GLAccountLookupResponse(matches=[])

    like = f"%{q}%"
    rows = (
        db.query(GLAccount)
        .filter(GLAccount.is_active == True)  # noqa: E712
        .filter(
            or_(
                GLAccount.account_code.ilike(like),
                GLAccount.account_name.ilike(like),
            )
        )
        .order_by(GLAccount.account_code.asc())
        .limit(limit)
        .all()
    )
    matches = [
        GLAccountLookupMatch(
            account_id=r.account_id,
            account_code=r.account_code,
            account_name=r.account_name,
            category=r.category,
        )
        for r in rows
    ]
    return GLAccountLookupResponse(matches=matches)


@router.post("/", response_model=CustomerResponse)
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    existing = db.query(Customer).filter(
        (Customer.email == customer.email) | (Customer.phone == customer.phone)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email or phone already registered")

    payload = customer.model_dump(exclude={"password"}, exclude_none=True)
    db_customer = Customer(**payload)
    if customer.password:
        db_customer.password_hash = get_password_hash(customer.password)

    db.add(db_customer)
    db.flush()

    _write_customer_audit(
        db,
        getattr(current_user, "user_id", None),
        "CUSTOMER_CREATE",
        db_customer.customer_id,
        None,
        _customer_snapshot(db_customer),
    )
    db.commit()
    db.refresh(db_customer)
    return db_customer


@router.get("/pending-approval")
def get_pending_customers(
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get customers pending admin approval (Admin only)"""
    customers = db.query(Customer).filter(Customer.is_active == False).order_by(Customer.registration_date.desc()).all()  # noqa: E712
    return {
        "data": [
            {
                "customer_id": c.customer_id,
                "first_name": c.first_name,
                "last_name": c.last_name,
                "email": c.email,
                "phone": c.phone,
                "address": c.address,
                "city": c.city,
                "registration_date": c.registration_date.isoformat() if c.registration_date else None,
                "is_active": c.is_active,
                "status": "pending",
            }
            for c in customers
        ],
        "count": len(customers),
    }


@router.get("/", response_model=List[CustomerResponse])
def get_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Customer)
    if is_active is not None:
        query = query.filter(Customer.is_active == is_active)
    customers = query.offset(skip).limit(limit).all()
    return customers


@router.get("/{customer_id}/audit-log")
def get_customer_audit_log(
    customer_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    rows = (
        db.query(AuditLog)
        .filter(AuditLog.table_name == "customers")
        .filter(AuditLog.record_id == customer_id)
        .order_by(AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        {
            "log_id": r.log_id,
            "user_id": r.user_id,
            "action_type": r.action_type,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "old_values": r.old_values,
            "new_values": r.new_values,
        }
        for r in rows
    ]


@router.get("/{customer_id}/vehicles", response_model=List[dict])
def get_customer_vehicles(customer_id: int, db: Session = Depends(get_db)):
    vehicles = db.query(Vehicle).filter(Vehicle.customer_id == customer_id).all()
    return [
        {
            "vehicle_id": v.vehicle_id,
            "license_plate": v.license_plate,
            "make": v.make,
            "model": v.model,
            "year": v.year,
            "current_mileage": float(v.current_mileage),
            "next_service_mileage": float(v.next_service_mileage),
        }
        for v in vehicles
    ]


@router.get("/{customer_id}/history")
def get_customer_service_history(customer_id: int, db: Session = Depends(get_db)):
    services = (
        db.query(Service)
        .join(Vehicle)
        .filter(Vehicle.customer_id == customer_id)
        .order_by(Service.service_date.desc())
        .all()
    )

    return [
        {
            "service_id": s.service_id,
            "service_date": s.service_date,
            "mileage_at_service": float(s.mileage_at_service),
            "grand_total": float(s.grand_total),
            "payment_status": s.payment_status,
            "vehicle": {
                "license_plate": s.vehicle.license_plate,
                "make": s.vehicle.make,
                "model": s.vehicle.model,
            },
        }
        for s in services
    ]


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_update: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    before = _customer_snapshot(customer)

    update_data = customer_update.model_dump(exclude_unset=True)
    if "email" in update_data and update_data["email"] is not None:
        dup = (
            db.query(Customer)
            .filter(Customer.email == update_data["email"])
            .filter(Customer.customer_id != customer_id)
            .first()
        )
        if dup:
            raise HTTPException(status_code=400, detail="Email already in use")

    if "phone" in update_data and update_data["phone"] is not None:
        dup = (
            db.query(Customer)
            .filter(Customer.phone == update_data["phone"])
            .filter(Customer.customer_id != customer_id)
            .first()
        )
        if dup:
            raise HTTPException(status_code=400, detail="Phone already in use")

    pwd = update_data.pop("password", None)
    for field, value in update_data.items():
        setattr(customer, field, value)
    if pwd:
        customer.password_hash = get_password_hash(pwd)

    db.flush()
    after = _customer_snapshot(customer)
    _write_customer_audit(
        db,
        getattr(current_user, "user_id", None),
        "CUSTOMER_UPDATE",
        customer_id,
        before,
        after,
    )
    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}", response_model=CustomerResponse)
def deactivate_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Soft-delete: mark customer inactive (HillMaster Delete parity without orphaning data)."""
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    before = _customer_snapshot(customer)
    customer.is_active = False
    db.flush()
    after = _customer_snapshot(customer)
    _write_customer_audit(
        db,
        getattr(current_user, "user_id", None),
        "CUSTOMER_DELETE",
        customer_id,
        before,
        after,
    )
    db.commit()
    db.refresh(customer)
    return customer
