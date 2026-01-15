from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import date, timedelta
from typing import List
from decimal import Decimal
from app.database import get_db
from app.models.service import Service, ServiceType, ServicePart
from app.models.vehicle import Vehicle
from app.models.part import PartInventory
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceResponse
from app.auth import get_current_admin

router = APIRouter()

@router.post("/", response_model=ServiceResponse)
def create_service(
    service_data: ServiceCreate, 
    current_user = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Validate vehicle
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == service_data.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Get service type
    service_type = db.query(ServiceType).filter(ServiceType.service_type_id == service_data.service_type_id).first()
    if not service_type:
        raise HTTPException(status_code=404, detail="Service type not found")
    
    # Calculate next service mileage and date
    next_service_mileage = service_data.mileage_at_service + Decimal(str(service_type.mileage_interval))
    next_service_date = date.today() + timedelta(days=service_type.time_interval_months * 30)
    
    # Calculate costs
    total_labor_hours = Decimal(str(service_type.base_labor_hours))
    labor_cost_per_hour = Decimal("1000.00")
    total_labor_cost = total_labor_hours * labor_cost_per_hour
    
    # Create service
    service_dict = service_data.dict(exclude={"parts"})
    service_dict.update({
        "next_service_mileage": next_service_mileage,
        "next_service_date": next_service_date,
        "total_labor_hours": total_labor_hours,
        "labor_cost_per_hour": labor_cost_per_hour,
        "total_labor_cost": total_labor_cost,
    })
    
    db_service = Service(**service_dict)
    db.add(db_service)
    db.flush()
    
    # Add parts if provided
    total_parts_cost = Decimal("0.00")
    if service_data.parts:
        for part_data in service_data.parts:
            part = db.query(PartInventory).filter(PartInventory.part_id == part_data.part_id).first()
            if not part:
                continue
            
            unit_price = Decimal(str(part.unit_price))
            total_price = unit_price * Decimal(str(part_data.quantity))
            total_parts_cost += total_price
            
            service_part = ServicePart(
                service_id=db_service.service_id,
                part_id=part_data.part_id,
                quantity=part_data.quantity,
                unit_price=unit_price,
                # total_price is a generated column, don't set it
                was_replaced=part_data.was_replaced,
                replacement_reason=part_data.replacement_reason,
                checklist_item_id=part_data.checklist_item_id
            )
            db.add(service_part)
            
            # Update inventory if replaced
            if part_data.was_replaced:
                part.stock_quantity -= part_data.quantity
    
    # Calculate totals
    tax_rate = Decimal("15.00")
    subtotal = total_labor_cost + total_parts_cost
    tax_amount = subtotal * (tax_rate / Decimal("100"))
    grand_total = subtotal + tax_amount
    
    db_service.total_parts_cost = total_parts_cost
    db_service.tax_amount = tax_amount
    db_service.grand_total = grand_total
    
    # Update vehicle mileage
    vehicle.current_mileage = service_data.mileage_at_service
    vehicle.last_service_mileage = service_data.mileage_at_service
    vehicle.next_service_mileage = next_service_mileage
    
    db.commit()
    db.refresh(db_service)
    return db_service

@router.get("/")
def get_services(
    skip: int = 0,
    limit: int = 100,
    vehicle_id: int = None,
    db: Session = Depends(get_db)
):
    # Use joinedload to eagerly load relationships and avoid N+1 queries
    query = db.query(Service).options(
        joinedload(Service.vehicle),
        joinedload(Service.service_type)
    )
    if vehicle_id:
        query = query.filter(Service.vehicle_id == vehicle_id)
    services = query.order_by(Service.service_date.desc()).offset(skip).limit(limit).all()
    
    # Build response with vehicle and service type information
    result = []
    for service in services:
        vehicle = service.vehicle  # Already loaded via joinedload
        service_type = service.service_type  # Already loaded via joinedload
        result.append({
            "service_id": service.service_id,
            "appointment_id": service.appointment_id,
            "vehicle_id": service.vehicle_id,
            "service_type_id": service.service_type_id,
            "service_type": service_type.type_name if service_type else "",
            "service_date": service.service_date,
            "mileage_at_service": float(service.mileage_at_service),
            "next_service_mileage": float(service.next_service_mileage),
            "next_service_date": service.next_service_date,
            "total_labor_hours": float(service.total_labor_hours),
            "total_labor_cost": float(service.total_labor_cost),
            "total_parts_cost": float(service.total_parts_cost),
            "discount_amount": float(service.discount_amount),
            "tax_amount": float(service.tax_amount),
            "grand_total": float(service.grand_total),
            "payment_status": service.payment_status,
            "payment_method": service.payment_method,
            "mechanic_notes": service.mechanic_notes,
            "customer_feedback": service.customer_feedback,
            "rating": service.rating,
            "oil_type": service.oil_type,
            "service_note": service.service_note,
            "reference_number": service.reference_number,
            "branch": service.branch,
            "serviced_by_name": service.serviced_by_name,
            "created_at": service.created_at,
            "vehicle": {
                "vehicle_id": vehicle.vehicle_id if vehicle else None,
                "license_plate": vehicle.license_plate if vehicle else "",
                "vin": vehicle.vin if vehicle else None,
                "make": vehicle.make if vehicle else "",
                "model": vehicle.model if vehicle else "",
                "year": vehicle.year if vehicle else None,
                "color": vehicle.color if vehicle else None,
                "engine_type": vehicle.engine_type if vehicle else None,
                "transmission_type": vehicle.transmission_type if vehicle else None,
                "fuel_type": vehicle.fuel_type if vehicle else None,
                "current_mileage": float(vehicle.current_mileage) if vehicle and vehicle.current_mileage else None,
            } if vehicle else None,
        })
    
    return result

@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.service_id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service

@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    service_update: ServiceUpdate,
    db: Session = Depends(get_db)
):
    service = db.query(Service).filter(Service.service_id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    update_data = service_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(service, field, value)
    
    db.commit()
    db.refresh(service)
    return service

@router.post("/{service_id}/calculate-bill")
def calculate_service_bill(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.service_id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Recalculate parts cost
    parts = db.query(ServicePart).filter(
        ServicePart.service_id == service_id,
        ServicePart.was_replaced == True
    ).all()
    
    total_parts_cost = sum(Decimal(str(p.total_price)) for p in parts)
    
    # Recalculate totals
    total_labor_cost = Decimal(str(service.total_labor_hours)) * Decimal(str(service.labor_cost_per_hour))
    subtotal = total_labor_cost + total_parts_cost
    tax_amount = subtotal * (Decimal(str(service.tax_rate)) / Decimal("100"))
    grand_total = subtotal + tax_amount - Decimal(str(service.discount_amount))
    
    service.total_parts_cost = total_parts_cost
    service.total_labor_cost = total_labor_cost
    service.tax_amount = tax_amount
    service.grand_total = grand_total
    
    db.commit()
    db.refresh(service)
    return service
