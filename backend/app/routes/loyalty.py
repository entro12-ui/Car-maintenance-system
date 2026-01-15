from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import List
from app.database import get_db
from app.models.loyalty import CustomerLoyalty, LoyaltyProgram
from app.models.customer import Customer
from app.schemas.loyalty import LoyaltyStatusResponse, LoyaltyProgramResponse

router = APIRouter()

@router.get("/programs", response_model=List[LoyaltyProgramResponse])
def get_loyalty_programs(db: Session = Depends(get_db)):
    programs = db.query(LoyaltyProgram).filter(LoyaltyProgram.is_active == True).all()
    return programs

@router.get("/status/{customer_id}", response_model=LoyaltyStatusResponse)
def get_loyalty_status(customer_id: int, db: Session = Depends(get_db)):
    from app.models.service import Service
    from app.models.vehicle import Vehicle
    
    loyalty = db.query(CustomerLoyalty).filter(
        CustomerLoyalty.customer_id == customer_id
    ).join(LoyaltyProgram).filter(LoyaltyProgram.is_active == True).first()
    
    if not loyalty:
        # Get default program
        program = db.query(LoyaltyProgram).filter(LoyaltyProgram.is_active == True).first()
        if not program:
            raise HTTPException(status_code=404, detail="No active loyalty program found")
        
        # Create loyalty record
        loyalty = CustomerLoyalty(
            customer_id=customer_id,
            program_id=program.program_id
        )
        db.add(loyalty)
        db.commit()
        db.refresh(loyalty)
        program = loyalty.program
    else:
        program = loyalty.program
    
    # Get total services count for this customer (actual count from services table)
    # Use a direct join to count services more efficiently and reliably
    total_services_count = db.query(Service).join(
        Vehicle, Service.vehicle_id == Vehicle.vehicle_id
    ).filter(
        Vehicle.customer_id == customer_id
    ).count()
    
    # Get all services ordered by date to calculate consecutive count
    services = db.query(Service).join(
        Vehicle, Service.vehicle_id == Vehicle.vehicle_id
    ).filter(
        Vehicle.customer_id == customer_id
    ).order_by(Service.service_date.asc()).all()
    
    # Calculate consecutive count based on actual services
    # If consecutive_count is 0 but there are services, sync it
    # For simplicity, if services exist and consecutive_count is 0, set it to total_services_count
    # (This assumes all services are consecutive - a more sophisticated approach would check dates)
    if total_services_count > 0 and (loyalty.consecutive_count or 0) == 0:
        # Sync consecutive count - set it to total services if it's currently 0
        # This handles cases where services were added before loyalty tracking was set up
        loyalty.consecutive_count = total_services_count
        # Also update total_services if it's out of sync
        if (loyalty.total_services or 0) < total_services_count:
            loyalty.total_services = total_services_count
        # Update last_service_date if we have services
        if services:
            loyalty.last_service_date = services[-1].service_date
        db.commit()
        db.refresh(loyalty)
    
    services_needed = program.services_required - (loyalty.consecutive_count or 0)
    eligibility = "ELIGIBLE" if (
        loyalty.free_service_available == True and
        (loyalty.free_service_expiry is None or loyalty.free_service_expiry >= date.today())
    ) else "NOT_ELIGIBLE"
    
    return {
        "customer_id": customer_id,
        "loyalty_id": loyalty.loyalty_id,
        "consecutive_count": loyalty.consecutive_count or 0,
        "total_services": total_services_count,  # Always use actual count from services table
        "total_services_count": total_services_count,  # Actual count from services table (same value)
        "services_required": program.services_required,
        "services_needed": max(0, services_needed),
        "free_service_available": loyalty.free_service_available == True,
        "free_service_expiry": loyalty.free_service_expiry,
        "free_services_earned": loyalty.free_services_earned or 0,
        "free_services_used": loyalty.free_services_used or 0,
        "last_service_date": loyalty.last_service_date,
        "next_service_expected": loyalty.next_service_expected,
        "eligibility_status": eligibility
    }

@router.post("/{customer_id}/apply-free-service")
def apply_free_service(customer_id: int, service_id: int, db: Session = Depends(get_db)):
    from app.models.service import Service
    from decimal import Decimal
    
    loyalty = db.query(CustomerLoyalty).filter(
        CustomerLoyalty.customer_id == customer_id
    ).join(LoyaltyProgram).filter(LoyaltyProgram.is_active == True).first()
    
    if not loyalty or loyalty.free_service_available != True:
        raise HTTPException(status_code=400, detail="Free service not available")
    
    if loyalty.free_service_expiry and loyalty.free_service_expiry < date.today():
        raise HTTPException(status_code=400, detail="Free service has expired")
    
    service = db.query(Service).filter(Service.service_id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Calculate discount
    discount_amount = Decimal(str(loyalty.program.free_labor_hours)) * Decimal(str(service.labor_cost_per_hour))
    
    # Apply discount
    service.discount_amount = discount_amount
    service.grand_total = Decimal(str(service.grand_total)) - discount_amount
    service.payment_status = "Free Service"
    
    # Update loyalty
    loyalty.free_service_available = False
    loyalty.free_services_used = (loyalty.free_services_used or 0) + 1
    loyalty.consecutive_count = 0
    
    db.commit()
    return {"message": "Free service applied", "discount_amount": float(discount_amount)}


