from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.customer import Customer
from app.models.vehicle import Vehicle
from app.models.service import Service, ServicePart
from app.models.part import PartInventory
from app.models.service import ServiceType, ServiceChecklist
from app.models.loyalty import CustomerLoyalty, LoyaltyProgram
from app.auth import get_current_admin
from app.schemas.service import ServiceCreate
from decimal import Decimal
from datetime import date, timedelta

router = APIRouter()

@router.get("/{customer_id}/full-details")
def get_customer_full_details(
    customer_id: int,
    current_user = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get full customer details with vehicles and services (Admin only)"""
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get vehicles
    vehicles = db.query(Vehicle).filter(Vehicle.customer_id == customer_id).all()
    
    # Get all services
    vehicle_ids = [v.vehicle_id for v in vehicles]
    services = db.query(Service).filter(Service.vehicle_id.in_(vehicle_ids)).all()
    
    # Calculate totals
    total_payments = sum(float(s.grand_total) for s in services if s.payment_status == "Paid")
    
    # Get loyalty information
    loyalty = db.query(CustomerLoyalty).filter(
        CustomerLoyalty.customer_id == customer_id
    ).join(LoyaltyProgram).filter(LoyaltyProgram.is_active == True).first()
    
    loyalty_info = None
    if loyalty:
        loyalty_info = {
            "loyalty_id": loyalty.loyalty_id,
            "consecutive_count": loyalty.consecutive_count or 0,
            "total_services": loyalty.total_services or 0,
            "free_services_earned": loyalty.free_services_earned or 0,
            "free_services_used": loyalty.free_services_used or 0,
            "free_service_available": loyalty.free_service_available == True,
            "services_required": loyalty.program.services_required if loyalty.program else 3,
            "services_needed": max(0, (loyalty.program.services_required if loyalty.program else 3) - (loyalty.consecutive_count or 0)),
        }
    
    return {
        "customer": {
            "customer_id": customer.customer_id,
            "first_name": customer.first_name,
            "last_name": customer.last_name,
            "email": customer.email,
            "phone": customer.phone,
            "address": customer.address,
            "city": customer.city,
            "is_active": customer.is_active,
            "registration_date": customer.registration_date,
        },
        "vehicles": [
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
        ],
        "services": [
            {
                "service_id": s.service_id,
                "service_date": s.service_date,
                "service_type": s.service_type.type_name if s.service_type else "",
                "grand_total": float(s.grand_total),
                "payment_status": s.payment_status,
            }
            for s in services
        ],
        "total_payments": total_payments,
        "total_services": len(services),
        "loyalty": loyalty_info,
    }

@router.get("/{customer_id}/service/{service_id}")
def get_service_details(
    customer_id: int,
    service_id: int,
    current_user = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get full service details with checklist and parts (Admin only)"""
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get service
    service = db.query(Service).filter(
        Service.service_id == service_id,
        Service.vehicle_id.in_([v.vehicle_id for v in db.query(Vehicle).filter(Vehicle.customer_id == customer_id).all()])
    ).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
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
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == service.vehicle_id).first()
    
    return {
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
    }

@router.post("/{customer_id}/add-service")
def add_service_for_customer(
    customer_id: int,
    service_data: ServiceCreate,
    current_user = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Add a service for a customer (Admin only)"""
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Verify vehicle belongs to customer
    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == service_data.vehicle_id,
        Vehicle.customer_id == customer_id
    ).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found or doesn't belong to customer")
    
    # Get service type
    service_type = db.query(ServiceType).filter(ServiceType.service_type_id == service_data.service_type_id).first()
    if not service_type:
        raise HTTPException(status_code=404, detail="Service type not found")
    
    # Calculate next service
    next_service_mileage = service_data.mileage_at_service + Decimal(str(service_type.mileage_interval))
    next_service_date = date.today() + timedelta(days=service_type.time_interval_months * 30)
    
    # Calculate costs
    total_labor_hours = Decimal(str(service_type.base_labor_hours))
    labor_cost_per_hour = Decimal("1000.00")
    total_labor_cost = total_labor_hours * labor_cost_per_hour
    
    # Create service
    service_dict = service_data.dict(exclude={"parts", "checklist_items", "checklist_status"})
    service_dict.update({
        "next_service_mileage": next_service_mileage,
        "next_service_date": next_service_date,
        "total_labor_hours": total_labor_hours,
        "labor_cost_per_hour": labor_cost_per_hour,
        "total_labor_cost": total_labor_cost,
        "service_advisor_id": current_user.employee_id if hasattr(current_user, 'employee_id') else None,
        # Include new service record fields
        "oil_type": service_data.oil_type,
        "service_note": service_data.service_note,
        "reference_number": service_data.reference_number,
        "branch": service_data.branch,
        "serviced_by_name": service_data.serviced_by_name or (f"{current_user.first_name} {current_user.last_name}" if hasattr(current_user, 'first_name') else None),
    })
    
    db_service = Service(**service_dict)
    db.add(db_service)
    db.flush()
    
    # Get or create a special "Inspection" part for checklist items without parts
    inspection_part = db.query(PartInventory).filter(
        PartInventory.part_code == "INSPECTION"
    ).first()
    if not inspection_part:
        # Create inspection part if it doesn't exist
        inspection_part = PartInventory(
            part_code="INSPECTION",
            part_name="Inspection Service",
            description="Generic inspection service for checklist items",
            category="Other",
            unit_price=Decimal("0.00"),
            cost_price=Decimal("0.00"),
            stock_quantity=999999,
            min_stock_level=0,
            is_active=True
        )
        db.add(inspection_part)
        db.flush()
    
    # Track which checklist items have been handled through parts
    handled_checklist_items = set()
    
    # Add parts (both replaced and non-replaced)
    total_parts_cost = Decimal("0.00")
    if service_data.parts:
        for part_data in service_data.parts:
            part = db.query(PartInventory).filter(PartInventory.part_id == part_data.part_id).first()
            if not part:
                continue
            
            unit_price = Decimal(str(part.unit_price))
            total_price = unit_price * Decimal(str(part_data.quantity))
            
            # Only add to cost if replaced
            if part_data.was_replaced:
                total_parts_cost += total_price
            
            service_part = ServicePart(
                service_id=db_service.service_id,
                part_id=part_data.part_id,
                quantity=part_data.quantity,
                unit_price=unit_price,
                # total_price is a generated column, don't set it
                was_replaced=part_data.was_replaced,
                replacement_reason=part_data.replacement_reason if part_data.was_replaced else None,
                checklist_item_id=part_data.checklist_item_id
            )
            db.add(service_part)
            
            # Track that this checklist item has been handled
            if part_data.checklist_item_id:
                handled_checklist_items.add(part_data.checklist_item_id)
            
            # Update inventory only if replaced
            if part_data.was_replaced:
                part.stock_quantity -= part_data.quantity
    
    # Handle checklist_status - create ServicePart entries for checked/changed items without parts
    if service_data.checklist_status:
        for checklist_status in service_data.checklist_status:
            # Skip if already handled through parts
            if checklist_status.checklist_item_id in handled_checklist_items:
                continue
            
            # Only create entry if checked or changed
            if checklist_status.checked or checklist_status.changed:
                service_part = ServicePart(
                    service_id=db_service.service_id,
                    part_id=inspection_part.part_id,
                    quantity=1,
                    unit_price=Decimal("0.00"),
                    # total_price is a generated column, don't set it
                    was_replaced=checklist_status.changed,  # Changed = replaced, Checked = not replaced
                    checklist_item_id=checklist_status.checklist_item_id
                )
                db.add(service_part)
    
    # Check loyalty and apply 4th service benefit (free labor, only material cost)
    loyalty = db.query(CustomerLoyalty).filter(
        CustomerLoyalty.customer_id == customer_id
    ).join(LoyaltyProgram).filter(LoyaltyProgram.is_active == True).first()
    
    # Get or create loyalty record
    if not loyalty:
        program = db.query(LoyaltyProgram).filter(LoyaltyProgram.is_active == True).first()
        if program:
            loyalty = CustomerLoyalty(
                customer_id=customer_id,
                program_id=program.program_id
            )
            db.add(loyalty)
            db.flush()
    
    is_4th_service = False
    if loyalty:
        # Count total services before adding this one
        total_services_before = loyalty.total_services or 0
        
        # Check if this is the 4th service (total_services_before == 3 means this is 4th)
        if total_services_before == 3:
            is_4th_service = True
            # Free labor for 4th service - only charge for replacement parts/material
            total_labor_cost = Decimal("0.00")
            db_service.total_labor_cost = Decimal("0.00")
            db_service.payment_status = "Free Service"
        
        # Update loyalty tracking
        loyalty.total_services = total_services_before + 1
        loyalty.consecutive_count = (loyalty.consecutive_count or 0) + 1
        loyalty.last_service_date = service_data.service_date
        
        # Check if customer earned a free service (every 3 consecutive services)
        services_required = loyalty.program.services_required if loyalty.program else 3
        if loyalty.consecutive_count >= services_required:
            loyalty.free_services_earned = (loyalty.free_services_earned or 0) + 1
            loyalty.free_service_available = True
            if loyalty.program:
                expiry_date = service_data.service_date + timedelta(days=loyalty.program.valid_days)
                loyalty.free_service_expiry = expiry_date
            loyalty.consecutive_count = 0  # Reset after earning free service
    
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
    
    return {
        "message": "Service added successfully",
        "service_id": db_service.service_id,
        "grand_total": float(db_service.grand_total),
    }

@router.get("/{customer_id}/service-checklist/{service_type_id}")
def get_service_checklist(
    customer_id: int,
    service_type_id: int,
    current_user = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get checklist items for a service type with available parts"""
    checklist_items = db.query(ServiceChecklist).filter(
        ServiceChecklist.service_type_id == service_type_id
    ).order_by(ServiceChecklist.sort_order).all()
    
    # Get all parts for reference
    all_parts = db.query(PartInventory).filter(PartInventory.is_active == True).all()
    
    result = []
    for item in checklist_items:
        # Find related parts (by name matching or category)
        related_parts = [
            {
                "part_id": p.part_id,
                "part_code": p.part_code,
                "part_name": p.part_name,
                "category": p.category,
                "unit_price": float(p.unit_price),
                "stock_quantity": p.stock_quantity,
            }
            for p in all_parts
            if item.item_name.lower() in p.part_name.lower() or 
               (p.category and item.item_name.lower() in p.category.lower())
        ]
        
        result.append({
            "checklist_id": item.checklist_id,
            "item_name": item.item_name,
            "item_description": item.item_description,
            "is_mandatory": item.is_mandatory,
            "estimated_duration_minutes": item.estimated_duration_minutes,
            "sort_order": item.sort_order,
            "related_parts": related_parts,
        })
    
    return result

