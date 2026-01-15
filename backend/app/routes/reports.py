from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from app.database import get_db
from app.models.service import Service
from app.models.vehicle import Vehicle
from app.models.customer import Customer
from app.models.service import Appointment

router = APIRouter()

@router.get("/daily")
def get_daily_report(report_date: date = None, db: Session = Depends(get_db)):
    if not report_date:
        report_date = date.today()
    
    services = db.query(Service).filter(Service.service_date == report_date).all()
    
    total_services = len(services)
    total_revenue = sum(float(s.grand_total) for s in services)
    total_labor_hours = sum(float(s.total_labor_hours) for s in services)
    total_parts_cost = sum(float(s.total_parts_cost) for s in services)
    total_discounts = sum(float(s.discount_amount) for s in services)
    unique_customers = len(set(s.vehicle.customer_id for s in services))
    
    return {
        "service_day": str(report_date),
        "total_services": total_services,
        "unique_customers": unique_customers,
        "total_revenue": total_revenue,
        "avg_service_cost": total_revenue / total_services if total_services > 0 else 0,
        "total_labor_hours": total_labor_hours,
        "total_parts_revenue": total_parts_cost,
        "total_discounts": total_discounts
    }

@router.get("/monthly")
def get_monthly_report(month: int = Query(None, ge=1, le=12), year: int = Query(None), db: Session = Depends(get_db)):
    if not month:
        month = date.today().month
    if not year:
        year = date.today().year
    
    services = db.query(Service).filter(
        func.extract('year', Service.service_date) == year,
        func.extract('month', Service.service_date) == month
    ).all()
    
    total_services = len(services)
    total_revenue = sum(float(s.grand_total) for s in services)
    labor_revenue = sum(float(s.total_labor_cost) for s in services)
    parts_revenue = sum(float(s.total_parts_cost) for s in services)
    tax_collected = sum(float(s.tax_amount) for s in services)
    discounts_given = sum(float(s.discount_amount) for s in services)
    unique_customers = len(set(s.vehicle.customer_id for s in services))
    
    return {
        "year": year,
        "month": month,
        "total_services": total_services,
        "total_revenue": total_revenue,
        "labor_revenue": labor_revenue,
        "parts_revenue": parts_revenue,
        "tax_collected": tax_collected,
        "discounts_given": discounts_given,
        "avg_ticket_size": total_revenue / total_services if total_services > 0 else 0,
        "unique_customers": unique_customers
    }

@router.get("/customers-due")
def get_customers_due_for_service(days: int = 7, db: Session = Depends(get_db)):
    from app.models.service import ServiceType
    
    # Get vehicles that are due for service
    vehicles = db.query(Vehicle).join(Customer).filter(Customer.is_active == "TRUE").all()
    
    due_vehicles = []
    for v in vehicles:
        # Check mileage-based due
        mileage_due = float(v.next_service_mileage) - float(v.current_mileage) <= 500
        
        # Check time-based due
        last_service = db.query(Service).filter(
            Service.vehicle_id == v.vehicle_id
        ).order_by(Service.service_date.desc()).first()
        
        time_due = False
        if last_service:
            service_type = db.query(ServiceType).filter(
                ServiceType.service_type_id == last_service.service_type_id
            ).first()
            if service_type:
                next_service_date = last_service.service_date + timedelta(days=service_type.time_interval_months * 30)
                time_due = next_service_date <= date.today() + timedelta(days=days)
        
        if mileage_due or time_due:
            due_vehicles.append({
                "customer_id": v.customer_id,
                "customer_name": f"{v.customer.first_name} {v.customer.last_name}",
                "email": v.customer.email,
                "phone": v.customer.phone,
                "license_plate": v.license_plate,
                "make": v.make,
                "model": v.model,
                "current_mileage": float(v.current_mileage),
                "next_service_mileage": float(v.next_service_mileage),
                "mileage_remaining": float(v.next_service_mileage) - float(v.current_mileage)
            })
    
    return due_vehicles

