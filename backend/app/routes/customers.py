from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models.customer import Customer
from app.models.vehicle import Vehicle
from app.models.service import Service
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.auth import get_current_admin

router = APIRouter()

@router.post("/", response_model=CustomerResponse)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    # Check if email or phone already exists
    existing = db.query(Customer).filter(
        (Customer.email == customer.email) | (Customer.phone == customer.phone)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email or phone already registered")
    
    db_customer = Customer(**customer.dict(exclude={"password"}))
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.get("/pending-approval")
def get_pending_customers(
    current_user = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get customers pending admin approval (Admin only)"""
    customers = db.query(Customer).filter(Customer.is_active == False).order_by(Customer.registration_date.desc()).all()
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
                "status": "pending"
            }
            for c in customers
        ],
        "count": len(customers)
    }

@router.get("/", response_model=List[CustomerResponse])
def get_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Customer)
    if is_active is not None:
        query = query.filter(Customer.is_active == is_active)
    customers = query.offset(skip).limit(limit).all()
    return customers

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
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = customer_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
    
    db.commit()
    db.refresh(customer)
    return customer

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
    services = db.query(Service).join(Vehicle).filter(
        Vehicle.customer_id == customer_id
    ).order_by(Service.service_date.desc()).all()
    
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
            }
        }
        for s in services
    ]



