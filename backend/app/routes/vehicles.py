from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.customer import Customer
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse
from app.auth import get_current_admin

router = APIRouter()

@router.post("/", response_model=VehicleResponse)
def create_vehicle(
    vehicle: VehicleCreate, 
    current_user = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Check if customer exists
    customer = db.query(Customer).filter(Customer.customer_id == vehicle.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check if license plate already exists
    existing = db.query(Vehicle).filter(Vehicle.license_plate == vehicle.license_plate).first()
    if existing:
        raise HTTPException(status_code=400, detail="License plate already registered")
    
    # Convert empty strings to None for fields with CHECK constraints
    vehicle_dict = vehicle.dict()
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
    return db_vehicle

@router.get("/", response_model=List[VehicleResponse])
def get_vehicles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Vehicle)
    if customer_id:
        query = query.filter(Vehicle.customer_id == customer_id)
    vehicles = query.offset(skip).limit(limit).all()
    return vehicles

@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int,
    vehicle_update: VehicleUpdate,
    db: Session = Depends(get_db)
):
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    update_data = vehicle_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vehicle, field, value)
    
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.get("/{vehicle_id}/services")
def get_vehicle_services(vehicle_id: int, db: Session = Depends(get_db)):
    from app.models.service import Service
    services = db.query(Service).filter(
        Service.vehicle_id == vehicle_id
    ).order_by(Service.service_date.desc()).all()
    
    return [
        {
            "service_id": s.service_id,
            "service_date": s.service_date,
            "mileage_at_service": float(s.mileage_at_service),
            "grand_total": float(s.grand_total),
            "payment_status": s.payment_status,
        }
        for s in services
    ]



