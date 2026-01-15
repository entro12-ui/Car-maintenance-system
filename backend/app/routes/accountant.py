from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import date
from decimal import Decimal
from app.database import get_db
from app.models.service import Service
from app.models.vehicle import Vehicle
from app.models.customer import Customer
from app.auth import get_current_accountant
from pydantic import BaseModel

router = APIRouter()

class ServicePaymentResponse(BaseModel):
    service_id: int
    service_date: date
    customer_name: str
    customer_email: str
    vehicle_info: str
    service_type: str
    grand_total: float
    payment_status: str
    payment_method: Optional[str]
    reference_number: Optional[str]
    created_at: str

class PaymentUpdateRequest(BaseModel):
    payment_status: str
    payment_method: Optional[str] = None

@router.get("/pending-approval")
def get_pending_accountants(
    db: Session = Depends(get_db)
):
    """Get accountants pending approval (Public endpoint for admin to view)"""
    from app.models.accountant import Accountant
    accountants = db.query(Accountant).filter(Accountant.is_active == False).all()
    return {
        "data": [
            {
                "accountant_id": a.accountant_id,
                "first_name": a.first_name,
                "last_name": a.last_name,
                "email": a.email,
                "phone": a.phone,
                "registration_date": a.registration_date.isoformat() if a.registration_date else None,
                "is_active": a.is_active,
            }
            for a in accountants
        ]
    }

@router.get("/payments")
def get_payments(
    payment_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_accountant),
    db: Session = Depends(get_db)
):
    """Get all services with payment information"""
    query = db.query(Service).join(Vehicle).join(Customer)
    
    if payment_status:
        query = query.filter(Service.payment_status == payment_status)
    
    services = query.order_by(Service.service_date.desc()).offset(skip).limit(limit).all()
    
    result = []
    for service in services:
        vehicle = service.vehicle
        customer = vehicle.customer if vehicle else None
        
        result.append({
            "service_id": service.service_id,
            "service_date": service.service_date,
            "customer_name": f"{customer.first_name} {customer.last_name}" if customer else "Unknown",
            "customer_email": customer.email if customer else "",
            "vehicle_info": f"{vehicle.make} {vehicle.model} ({vehicle.license_plate})" if vehicle else "Unknown",
            "service_type": service.service_type.type_name if service.service_type else "",
            "grand_total": float(service.grand_total),
            "payment_status": service.payment_status,
            "payment_method": service.payment_method,
            "reference_number": service.reference_number,
            "created_at": service.created_at.isoformat() if service.created_at else None,
        })
    
    return {"data": result, "count": len(result)}

@router.put("/payments/{service_id}")
def update_payment_status(
    service_id: int,
    payment_update: PaymentUpdateRequest,
    current_user = Depends(get_current_accountant),
    db: Session = Depends(get_db)
):
    """Update payment status for a service"""
    service = db.query(Service).filter(Service.service_id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Validate payment status
    valid_statuses = ["Pending", "Partial", "Paid", "Free Service"]
    if payment_update.payment_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid payment status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    service.payment_status = payment_update.payment_status
    if payment_update.payment_method:
        service.payment_method = payment_update.payment_method
    
    db.commit()
    db.refresh(service)
    
    return {
        "message": "Payment status updated successfully",
        "service_id": service.service_id,
        "payment_status": service.payment_status,
        "payment_method": service.payment_method
    }

@router.get("/payments/summary")
def get_payment_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user = Depends(get_current_accountant),
    db: Session = Depends(get_db)
):
    """Get payment summary statistics"""
    query = db.query(Service)
    
    if start_date:
        query = query.filter(Service.service_date >= start_date)
    if end_date:
        query = query.filter(Service.service_date <= end_date)
    
    services = query.all()
    
    total_revenue = sum(float(s.grand_total) for s in services if s.payment_status == "Paid")
    pending_amount = sum(float(s.grand_total) for s in services if s.payment_status == "Pending")
    partial_amount = sum(float(s.grand_total) for s in services if s.payment_status == "Partial")
    
    paid_count = len([s for s in services if s.payment_status == "Paid"])
    pending_count = len([s for s in services if s.payment_status == "Pending"])
    partial_count = len([s for s in services if s.payment_status == "Partial"])
    
    return {
        "total_revenue": total_revenue,
        "pending_amount": pending_amount,
        "partial_amount": partial_amount,
        "paid_count": paid_count,
        "pending_count": pending_count,
        "partial_count": partial_count,
        "total_services": len(services)
    }

