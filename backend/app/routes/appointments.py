from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from datetime import date, datetime
from typing import List, Optional
from app.database import get_db
from app.models.service import Appointment, ServiceType
from app.models.vehicle import Vehicle
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse

router = APIRouter()

@router.post("/", response_model=AppointmentResponse)
def create_appointment(appointment: AppointmentCreate, db: Session = Depends(get_db)):
    # Validate vehicle exists
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == appointment.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Validate service type exists
    service_type = db.query(ServiceType).filter(ServiceType.service_type_id == appointment.service_type_id).first()
    if not service_type:
        raise HTTPException(status_code=404, detail="Service type not found")
    
    db_appointment = Appointment(**appointment.dict())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

@router.get("/")
def get_appointments(
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=1000),  # Increased limit to show all appointments
    scheduled_date: Optional[date] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Eagerly load vehicle, customer, and service_type relationships
    query = db.query(Appointment).options(
        joinedload(Appointment.vehicle).joinedload(Vehicle.customer),
        joinedload(Appointment.service_type)
    )
    if scheduled_date:
        query = query.filter(Appointment.scheduled_date == scheduled_date)
    if status:
        query = query.filter(Appointment.status == status)
    appointments = query.order_by(Appointment.scheduled_date.desc(), Appointment.scheduled_time).offset(skip).limit(limit).all()
    
    # Build response with nested customer and vehicle data
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
                "customer": {
                    "customer_id": apt.vehicle.customer.customer_id,
                    "first_name": apt.vehicle.customer.first_name,
                    "last_name": apt.vehicle.customer.last_name,
                    "email": apt.vehicle.customer.email,
                    "phone": apt.vehicle.customer.phone,
                } if apt.vehicle.customer else None
            } if apt.vehicle else None,
            "service_type": {
                "service_type_id": apt.service_type.service_type_id,
                "type_name": apt.service_type.type_name,
            } if apt.service_type else None
        })
    return result

@router.get("/today")
def get_today_appointments(db: Session = Depends(get_db)):
    today = date.today()
    appointments = db.query(Appointment).filter(
        Appointment.scheduled_date == today,
        Appointment.status.in_(["Scheduled", "In Progress"])
    ).order_by(Appointment.scheduled_time).all()
    
    return [
        {
            "appointment_id": a.appointment_id,
            "license_plate": a.vehicle.license_plate,
            "customer_name": f"{a.vehicle.customer.first_name} {a.vehicle.customer.last_name}",
            "phone": a.vehicle.customer.phone,
            "service_type": a.service_type.type_name,
            "scheduled_time": str(a.scheduled_time),
            "status": a.status,
            "estimated_duration_minutes": a.estimated_duration_minutes,
        }
        for a in appointments
    ]

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment

@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    appointment_update: AppointmentUpdate,
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    update_data = appointment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)
    
    db.commit()
    db.refresh(appointment)
    return appointment

@router.post("/{appointment_id}/start")
def start_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    appointment.status = "In Progress"
    appointment.actual_start_time = datetime.now()
    db.commit()
    db.refresh(appointment)
    return appointment

@router.post("/{appointment_id}/complete")
def complete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.appointment_id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    appointment.status = "Completed"
    appointment.actual_end_time = datetime.now()
    db.commit()
    db.refresh(appointment)
    return appointment



