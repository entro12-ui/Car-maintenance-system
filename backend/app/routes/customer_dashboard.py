from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.auth import get_current_customer
from app.models.customer import Customer
from app.models.vehicle import Vehicle
from app.models.service import Service, ServicePart, ServiceChecklist, Appointment, ServiceType
from app.models.part import PartInventory
from app.schemas.vehicle import VehicleCreate
from decimal import Decimal

router = APIRouter()

@router.get("/vehicles")
def get_my_vehicles(
    current_user = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get all vehicles for the logged-in customer (including those added by admin)"""
    customer_id = current_user.customer_id
    vehicles = db.query(Vehicle).filter(Vehicle.customer_id == customer_id).order_by(Vehicle.created_at.desc()).all()
    
    return [
        {
            "vehicle_id": v.vehicle_id,
            "license_plate": v.license_plate,
            "make": v.make,
            "model": v.model,
            "year": v.year,
            "color": v.color,
            "fuel_type": v.fuel_type,
            "transmission_type": v.transmission_type,
            "current_mileage": float(v.current_mileage),
            "next_service_mileage": float(v.next_service_mileage),
            "last_service_mileage": float(v.last_service_mileage),
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in vehicles
    ]

@router.post("/vehicles", response_model=dict)
def create_my_vehicle(
    vehicle_data: VehicleCreate,
    current_user = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Create a new vehicle for the logged-in customer"""
    customer_id = current_user.customer_id
    
    # Check if license plate already exists
    existing = db.query(Vehicle).filter(Vehicle.license_plate == vehicle_data.license_plate).first()
    if existing:
        raise HTTPException(status_code=400, detail="License plate already registered")
    
    # Validate mileage (DECIMAL(10,2) max value is 99,999,999.99)
    if vehicle_data.current_mileage and float(vehicle_data.current_mileage) > 99999999:
        raise HTTPException(
            status_code=400, 
            detail="Current mileage cannot exceed 99,999,999 km"
        )
    
    # Create vehicle with customer_id from current user
    # Convert empty strings to None for fields with CHECK constraints
    vehicle_dict = vehicle_data.dict()
    vehicle_dict["customer_id"] = customer_id
    for field in ['fuel_type', 'transmission_type', 'vin', 'color', 'engine_type']:
        if vehicle_dict.get(field) == '':
            vehicle_dict[field] = None
    
    # Check if VIN already exists (only if VIN is provided and not None)
    if vehicle_dict.get('vin'):
        existing_vin = db.query(Vehicle).filter(Vehicle.vin == vehicle_dict['vin']).first()
        if existing_vin:
            raise HTTPException(status_code=400, detail="VIN already registered")
    
    db_vehicle = Vehicle(**vehicle_dict)
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    
    return {
        "vehicle_id": db_vehicle.vehicle_id,
        "license_plate": db_vehicle.license_plate,
        "make": db_vehicle.make,
        "model": db_vehicle.model,
        "year": db_vehicle.year,
        "color": db_vehicle.color,
        "current_mileage": float(db_vehicle.current_mileage),
        "next_service_mileage": float(db_vehicle.next_service_mileage),
        "last_service_mileage": float(db_vehicle.last_service_mileage),
    }

@router.get("/services")
def get_my_services(
    current_user = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get all services for the logged-in customer"""
    customer_id = current_user.customer_id
    
    # Get all vehicles for this customer
    vehicles = db.query(Vehicle).filter(Vehicle.customer_id == customer_id).all()
    vehicle_ids = [v.vehicle_id for v in vehicles]
    
    # Get all services for these vehicles
    services = db.query(Service).filter(
        Service.vehicle_id.in_(vehicle_ids)
    ).order_by(Service.service_date.desc()).all()
    
    result = []
    for service in services:
        # Get service parts
        service_parts = db.query(ServicePart).filter(
            ServicePart.service_id == service.service_id
        ).all()
        
        parts_list = []
        checklist_status = {}  # Track which checklist items were checked/changed
        
        for sp in service_parts:
            part = db.query(PartInventory).filter(PartInventory.part_id == sp.part_id).first()
            parts_list.append({
                "part_name": part.part_name if part else "Unknown",
                "part_code": part.part_code if part else "",
                "quantity": sp.quantity,
                "was_replaced": sp.was_replaced,
                "unit_price": float(sp.unit_price),
                "total_price": float(sp.total_price),
                "checklist_item_id": sp.checklist_item_id,
            })
            
            # Track checklist item status
            if sp.checklist_item_id:
                checklist_status[sp.checklist_item_id] = {
                    "checked": True,
                    "changed": sp.was_replaced
                }
        
        # Get all checklist items for this service type
        checklist_items = []
        if service.service_type_id:
            all_checklist = db.query(ServiceChecklist).filter(
                ServiceChecklist.service_type_id == service.service_type_id
            ).order_by(ServiceChecklist.sort_order).all()
            
            for item in all_checklist:
                status = checklist_status.get(item.checklist_id, {"checked": False, "changed": False})
                checklist_items.append({
                    "checklist_id": item.checklist_id,
                    "item_name": item.item_name,
                    "item_description": item.item_description,
                    "checked": status["checked"],
                    "changed": status["changed"],
                })
        
        # Get vehicle info
        vehicle = next((v for v in vehicles if v.vehicle_id == service.vehicle_id), None)
        
        result.append({
            "service_id": service.service_id,
            "service_date": service.service_date,
            "vehicle": {
                "license_plate": vehicle.license_plate if vehicle else "",
                "make": vehicle.make if vehicle else "",
                "model": vehicle.model if vehicle else "",
            },
            "service_type": service.service_type.type_name if service.service_type else "",
            "mileage_at_service": float(service.mileage_at_service),
            "next_service_mileage": float(service.next_service_mileage),
            "next_service_date": service.next_service_date,
            "total_labor_cost": float(service.total_labor_cost),
            "total_parts_cost": float(service.total_parts_cost),
            "discount_amount": float(service.discount_amount),
            "tax_amount": float(service.tax_amount),
            "grand_total": float(service.grand_total),
            "payment_status": service.payment_status,
            "payment_method": service.payment_method,
            "parts": parts_list,
            "checklist_items": checklist_items,
            "mechanic_notes": service.mechanic_notes,
            "oil_type": service.oil_type,
            "service_note": service.service_note,
            "reference_number": service.reference_number,
            "branch": service.branch,
            "serviced_by_name": service.serviced_by_name,
        })
    
    return result

@router.get("/summary")
def get_customer_summary(
    current_user = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get customer summary: total payments, next service, etc."""
    customer_id = current_user.customer_id
    
    # Get customer info
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    
    # Get all vehicles
    vehicles = db.query(Vehicle).filter(Vehicle.customer_id == customer_id).all()
    vehicle_ids = [v.vehicle_id for v in vehicles]
    
    # Get all services
    services = db.query(Service).filter(Service.vehicle_id.in_(vehicle_ids)).all()
    
    # Calculate totals
    total_payments = sum(float(s.grand_total) for s in services if s.payment_status == "Paid")
    total_services = len(services)
    
    # Get next service dates
    next_services = []
    for vehicle in vehicles:
        if vehicle.next_service_mileage:
            remaining_km = float(vehicle.next_service_mileage) - float(vehicle.current_mileage)
            next_services.append({
                "vehicle": f"{vehicle.make} {vehicle.model} ({vehicle.license_plate})",
                "next_service_mileage": float(vehicle.next_service_mileage),
                "current_mileage": float(vehicle.current_mileage),
                "remaining_km": remaining_km,
                "is_due": remaining_km <= 500,
            })
    
    return {
        "customer": {
            "name": f"{customer.first_name} {customer.last_name}",
            "email": customer.email,
            "phone": customer.phone,
        },
        "vehicles_count": len(vehicles),
        "total_services": total_services,
        "total_payments": total_payments,
        "next_services": next_services,
    }

@router.get("/appointments")
def get_my_appointments(
    current_user = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get all appointments for the logged-in customer's vehicles"""
    customer_id = current_user.customer_id
    
    # Get all vehicles for this customer
    vehicles = db.query(Vehicle).filter(Vehicle.customer_id == customer_id).all()
    vehicle_ids = [v.vehicle_id for v in vehicles]
    
    if not vehicle_ids:
        return []
    
    # Get all appointments for these vehicles, eagerly loading relationships
    appointments = db.query(Appointment).options(
        joinedload(Appointment.vehicle),
        joinedload(Appointment.service_type)
    ).filter(
        Appointment.vehicle_id.in_(vehicle_ids)
    ).order_by(Appointment.scheduled_date.desc(), Appointment.scheduled_time).all()
    
    result = []
    for apt in appointments:
        result.append({
            "appointment_id": apt.appointment_id,
            "vehicle_id": apt.vehicle_id,
            "service_type_id": apt.service_type_id,
            "scheduled_date": apt.scheduled_date,
            "scheduled_time": apt.scheduled_time,
            "notes": apt.notes,
            "estimated_duration_minutes": apt.estimated_duration_minutes,
            "status": apt.status,
            "assigned_mechanic_id": apt.assigned_mechanic_id,
            "actual_start_time": apt.actual_start_time,
            "actual_end_time": apt.actual_end_time,
            "created_at": apt.created_at,
            "updated_at": apt.updated_at,
            "vehicle": {
                "vehicle_id": apt.vehicle.vehicle_id,
                "license_plate": apt.vehicle.license_plate,
                "make": apt.vehicle.make,
                "model": apt.vehicle.model,
                "year": apt.vehicle.year,
            } if apt.vehicle else None,
            "service_type": {
                "service_type_id": apt.service_type.service_type_id,
                "type_name": apt.service_type.type_name,
            } if apt.service_type else None
        })
    return result

