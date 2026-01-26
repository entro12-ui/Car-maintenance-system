from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import date, datetime, timedelta
from typing import List, Optional
from decimal import Decimal
from app.database import get_db
from app.models.proforma import Proforma, ProformaItem, MarketPrice
from app.models.customer import Customer
from app.models.vehicle import Vehicle
from app.models.service import ServiceType, Service
from app.models.part import PartInventory
from app.models.employee import Employee
from app.schemas.proforma import (
    ProformaCreate, ProformaUpdate, ProformaResponse, ProformaListResponse,
    ProformaItemCreate, ProformaItemUpdate, ProformaItemResponse,
    MarketPriceCreate, MarketPriceUpdate, MarketPriceResponse
)
from app.auth import get_current_admin

router = APIRouter(prefix="/proformas", tags=["proformas"])

def generate_proforma_number(db: Session) -> str:
    """Generate a unique proforma number"""
    today = date.today()
    date_part = today.strftime("%Y%m%d")
    
    # Get the last proforma number for today
    last_proforma = db.query(Proforma).filter(
        Proforma.proforma_number.like(f"PRO-{date_part}-%")
    ).order_by(Proforma.proforma_id.desc()).first()
    
    if last_proforma:
        # Extract sequence number and increment
        try:
            seq = int(last_proforma.proforma_number.split("-")[-1])
            seq += 1
        except (ValueError, IndexError):
            seq = 1
    else:
        seq = 1
    
    return f"PRO-{date_part}-{seq:04d}"

def calculate_proforma_totals(items: List[ProformaItem], tax_rate: Decimal, discount_amount: Decimal) -> dict:
    """Calculate subtotal, tax, and grand total"""
    subtotal = sum(Decimal(str(item.total_price)) for item in items)
    tax_amount = subtotal * (tax_rate / Decimal("100"))
    grand_total = subtotal + tax_amount - discount_amount
    return {
        "subtotal": subtotal,
        "tax_amount": tax_amount,
        "grand_total": grand_total
    }

@router.post("/", response_model=ProformaResponse)
def create_proforma(
    proforma_data: ProformaCreate,
    current_user = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new proforma invoice"""
    # Validate customer if provided (optional)
    customer = None
    if proforma_data.customer_id:
        customer = db.query(Customer).filter(Customer.customer_id == proforma_data.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
    
    # Validate vehicle if provided
    if proforma_data.vehicle_id:
        vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == proforma_data.vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        # If customer is provided, validate vehicle belongs to customer
        if proforma_data.customer_id and vehicle.customer_id != proforma_data.customer_id:
            raise HTTPException(status_code=400, detail="Vehicle does not belong to this customer")
    
    # Validate service type if provided
    if proforma_data.service_type_id:
        service_type = db.query(ServiceType).filter(ServiceType.service_type_id == proforma_data.service_type_id).first()
        if not service_type:
            raise HTTPException(status_code=404, detail="Service type not found")
    
    # Generate proforma number
    proforma_number = generate_proforma_number(db)
    
    # Create proforma
    proforma = Proforma(
        proforma_number=proforma_number,
        customer_id=proforma_data.customer_id,
        vehicle_id=proforma_data.vehicle_id,
        service_type_id=proforma_data.service_type_id,
        organization_name=proforma_data.organization_name,
        customer_name=proforma_data.customer_name,
        car_model=proforma_data.car_model,
        description=proforma_data.description,
        notes=proforma_data.notes,
        tax_rate=proforma_data.tax_rate or Decimal("15.00"),
        discount_amount=proforma_data.discount_amount or Decimal("0.00"),
        valid_until=proforma_data.valid_until,
        status="Draft",
        created_by=current_user.employee_id if hasattr(current_user, 'employee_id') else None
    )
    db.add(proforma)
    db.flush()
    
    # Add items
    items = []
    if proforma_data.items:
        for item_data in proforma_data.items:
            # Validate part if provided
            part = None
            if item_data.part_id:
                part = db.query(PartInventory).filter(PartInventory.part_id == item_data.part_id).first()
                if not part:
                    raise HTTPException(status_code=404, detail=f"Part with ID {item_data.part_id} not found")
            
            total_price = item_data.quantity * item_data.unit_price
            
            item = ProformaItem(
                proforma_id=proforma.proforma_id,
                part_id=item_data.part_id,
                item_type=item_data.item_type or "Other",
                item_name=item_data.item_name,
                item_description=item_data.item_description,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                total_price=total_price,
                notes=item_data.notes
            )
            db.add(item)
            db.flush()  # Flush to get item_id
            
            # Add market prices if provided
            if item_data.market_prices:
                for market_price_data in item_data.market_prices:
                    market_price = MarketPrice(
                        proforma_item_id=item.proforma_item_id,
                        organization_name=market_price_data.organization_name,
                        unit_price=market_price_data.unit_price,
                        notes=market_price_data.notes
                    )
                    db.add(market_price)
            
            items.append(item)
    
    # Calculate totals
    totals = calculate_proforma_totals(items, proforma.tax_rate, proforma.discount_amount)
    proforma.subtotal = totals["subtotal"]
    proforma.tax_amount = totals["tax_amount"]
    proforma.grand_total = totals["grand_total"]
    
    db.commit()
    db.refresh(proforma)
    
    return build_proforma_response(proforma, db)

@router.get("/", response_model=List[ProformaListResponse])
def get_proformas(
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get list of proformas"""
    query = db.query(Proforma)
    
    if customer_id:
        query = query.filter(Proforma.customer_id == customer_id)
    
    if status:
        query = query.filter(Proforma.status == status)
    
    proformas = query.order_by(Proforma.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for proforma in proformas:
        # Get customer name - use external customer_name first, then fallback to linked customer
        customer_name = proforma.customer_name  # External customer (not in system)
        if not customer_name and proforma.customer_id:
            customer = db.query(Customer).filter(Customer.customer_id == proforma.customer_id).first()
            if customer:
                customer_name = f"{customer.first_name} {customer.last_name}"
        
        # Get vehicle info - use external car_model first, then fallback to linked vehicle
        vehicle_info = proforma.car_model  # External vehicle (car model)
        if not vehicle_info and proforma.vehicle_id:
            vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == proforma.vehicle_id).first()
            if vehicle:
                vehicle_info = f"{vehicle.make} {vehicle.model} - {vehicle.license_plate}"
        
        result.append(ProformaListResponse(
            proforma_id=proforma.proforma_id,
            proforma_number=proforma.proforma_number,
            customer_id=proforma.customer_id,
            organization_name=proforma.organization_name,
            customer_name=customer_name,
            car_model=proforma.car_model,
            vehicle_info=vehicle_info,
            grand_total=proforma.grand_total,
            status=proforma.status,
            created_at=proforma.created_at,
            valid_until=proforma.valid_until
        ))
    
    return result

@router.get("/{proforma_id}", response_model=ProformaResponse)
def get_proforma(
    proforma_id: int,
    db: Session = Depends(get_db)
):
    """Get proforma details"""
    proforma = db.query(Proforma).filter(Proforma.proforma_id == proforma_id).first()
    if not proforma:
        raise HTTPException(status_code=404, detail="Proforma not found")
    
    return build_proforma_response(proforma, db)

@router.put("/{proforma_id}", response_model=ProformaResponse)
def update_proforma(
    proforma_id: int,
    proforma_update: ProformaUpdate,
    current_user = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update proforma"""
    proforma = db.query(Proforma).filter(Proforma.proforma_id == proforma_id).first()
    if not proforma:
        raise HTTPException(status_code=404, detail="Proforma not found")
    
    if proforma.status == "Converted":
        raise HTTPException(status_code=400, detail="Cannot update a converted proforma")
    
    # Update fields
    if proforma_update.vehicle_id is not None:
        if proforma_update.vehicle_id != proforma.vehicle_id:
            vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == proforma_update.vehicle_id).first()
            if not vehicle:
                raise HTTPException(status_code=404, detail="Vehicle not found")
            if vehicle.customer_id != proforma.customer_id:
                raise HTTPException(status_code=400, detail="Vehicle does not belong to this customer")
        proforma.vehicle_id = proforma_update.vehicle_id
    
    if proforma_update.service_type_id is not None:
        if proforma_update.service_type_id != proforma.service_type_id:
            service_type = db.query(ServiceType).filter(ServiceType.service_type_id == proforma_update.service_type_id).first()
            if not service_type:
                raise HTTPException(status_code=404, detail="Service type not found")
        proforma.service_type_id = proforma_update.service_type_id
    
    if proforma_update.description is not None:
        proforma.description = proforma_update.description
    
    if proforma_update.notes is not None:
        proforma.notes = proforma_update.notes
    
    if proforma_update.tax_rate is not None:
        proforma.tax_rate = proforma_update.tax_rate
    
    if proforma_update.discount_amount is not None:
        proforma.discount_amount = proforma_update.discount_amount
    
    if proforma_update.status is not None:
        proforma.status = proforma_update.status
    
    if proforma_update.valid_until is not None:
        proforma.valid_until = proforma_update.valid_until
    
    # Recalculate totals
    items = db.query(ProformaItem).filter(ProformaItem.proforma_id == proforma_id).all()
    totals = calculate_proforma_totals(items, proforma.tax_rate, proforma.discount_amount)
    proforma.subtotal = totals["subtotal"]
    proforma.tax_amount = totals["tax_amount"]
    proforma.grand_total = totals["grand_total"]
    
    db.commit()
    db.refresh(proforma)
    
    return build_proforma_response(proforma, db)

@router.delete("/{proforma_id}")
def delete_proforma(
    proforma_id: int,
    current_user = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete proforma"""
    proforma = db.query(Proforma).filter(Proforma.proforma_id == proforma_id).first()
    if not proforma:
        raise HTTPException(status_code=404, detail="Proforma not found")
    
    if proforma.status == "Converted":
        raise HTTPException(status_code=400, detail="Cannot delete a converted proforma")
    
    db.delete(proforma)
    db.commit()
    
    return {"message": "Proforma deleted successfully"}

# Item management endpoints
@router.post("/{proforma_id}/items", response_model=ProformaItemResponse)
def add_proforma_item(
    proforma_id: int,
    item_data: ProformaItemCreate,
    current_user = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Add item to proforma"""
    proforma = db.query(Proforma).filter(Proforma.proforma_id == proforma_id).first()
    if not proforma:
        raise HTTPException(status_code=404, detail="Proforma not found")
    
    if proforma.status == "Converted":
        raise HTTPException(status_code=400, detail="Cannot modify a converted proforma")
    
    # Validate part if provided
    part = None
    if item_data.part_id:
        part = db.query(PartInventory).filter(PartInventory.part_id == item_data.part_id).first()
        if not part:
            raise HTTPException(status_code=404, detail=f"Part with ID {item_data.part_id} not found")
    
    total_price = item_data.quantity * item_data.unit_price
    
    item = ProformaItem(
        proforma_id=proforma_id,
        part_id=item_data.part_id,
        item_type=item_data.item_type or "Other",
        item_name=item_data.item_name,
        item_description=item_data.item_description,
        quantity=item_data.quantity,
        unit_price=item_data.unit_price,
        total_price=total_price,
        notes=item_data.notes
    )
    db.add(item)
    db.flush()
    
    # Recalculate totals
    items = db.query(ProformaItem).filter(ProformaItem.proforma_id == proforma_id).all()
    totals = calculate_proforma_totals(items, proforma.tax_rate, proforma.discount_amount)
    proforma.subtotal = totals["subtotal"]
    proforma.tax_amount = totals["tax_amount"]
    proforma.grand_total = totals["grand_total"]
    
    db.commit()
    db.refresh(item)
    
    return build_item_response(item, db)

@router.put("/{proforma_id}/items/{item_id}", response_model=ProformaItemResponse)
def update_proforma_item(
    proforma_id: int,
    item_id: int,
    item_update: ProformaItemUpdate,
    current_user = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update proforma item"""
    proforma = db.query(Proforma).filter(Proforma.proforma_id == proforma_id).first()
    if not proforma:
        raise HTTPException(status_code=404, detail="Proforma not found")
    
    if proforma.status == "Converted":
        raise HTTPException(status_code=400, detail="Cannot modify a converted proforma")
    
    item = db.query(ProformaItem).filter(
        ProformaItem.proforma_item_id == item_id,
        ProformaItem.proforma_id == proforma_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Update fields
    if item_update.item_type is not None:
        item.item_type = item_update.item_type
    
    if item_update.item_name is not None:
        item.item_name = item_update.item_name
    
    if item_update.item_description is not None:
        item.item_description = item_update.item_description
    
    if item_update.quantity is not None:
        item.quantity = item_update.quantity
    
    if item_update.unit_price is not None:
        item.unit_price = item_update.unit_price
    
    if item_update.notes is not None:
        item.notes = item_update.notes
    
    # Recalculate total_price
    item.total_price = item.quantity * item.unit_price
    
    # Recalculate proforma totals
    items = db.query(ProformaItem).filter(ProformaItem.proforma_id == proforma_id).all()
    totals = calculate_proforma_totals(items, proforma.tax_rate, proforma.discount_amount)
    proforma.subtotal = totals["subtotal"]
    proforma.tax_amount = totals["tax_amount"]
    proforma.grand_total = totals["grand_total"]
    
    db.commit()
    db.refresh(item)
    
    return build_item_response(item, db)

@router.delete("/{proforma_id}/items/{item_id}")
def delete_proforma_item(
    proforma_id: int,
    item_id: int,
    current_user = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete proforma item"""
    proforma = db.query(Proforma).filter(Proforma.proforma_id == proforma_id).first()
    if not proforma:
        raise HTTPException(status_code=404, detail="Proforma not found")
    
    if proforma.status == "Converted":
        raise HTTPException(status_code=400, detail="Cannot modify a converted proforma")
    
    item = db.query(ProformaItem).filter(
        ProformaItem.proforma_item_id == item_id,
        ProformaItem.proforma_id == proforma_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(item)
    
    # Recalculate totals
    items = db.query(ProformaItem).filter(ProformaItem.proforma_id == proforma_id).all()
    totals = calculate_proforma_totals(items, proforma.tax_rate, proforma.discount_amount)
    proforma.subtotal = totals["subtotal"]
    proforma.tax_amount = totals["tax_amount"]
    proforma.grand_total = totals["grand_total"]
    
    db.commit()
    
    return {"message": "Item deleted successfully"}

# Market Price Management Endpoints
@router.post("/{proforma_id}/items/{item_id}/market-prices", response_model=MarketPriceResponse)
def add_market_price(
    proforma_id: int,
    item_id: int,
    market_price_data: MarketPriceCreate,
    current_user = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Add market price from another organization to a proforma item"""
    proforma = db.query(Proforma).filter(Proforma.proforma_id == proforma_id).first()
    if not proforma:
        raise HTTPException(status_code=404, detail="Proforma not found")
    
    if proforma.status == "Converted":
        raise HTTPException(status_code=400, detail="Cannot modify a converted proforma")
    
    item = db.query(ProformaItem).filter(
        ProformaItem.proforma_item_id == item_id,
        ProformaItem.proforma_id == proforma_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    market_price = MarketPrice(
        proforma_item_id=item_id,
        organization_name=market_price_data.organization_name,
        unit_price=market_price_data.unit_price,
        notes=market_price_data.notes
    )
    db.add(market_price)
    db.commit()
    db.refresh(market_price)
    
    return MarketPriceResponse(
        market_price_id=market_price.market_price_id,
        proforma_item_id=market_price.proforma_item_id,
        organization_name=market_price.organization_name,
        unit_price=market_price.unit_price,
        notes=market_price.notes,
        created_at=market_price.created_at
    )

@router.put("/{proforma_id}/items/{item_id}/market-prices/{market_price_id}", response_model=MarketPriceResponse)
def update_market_price(
    proforma_id: int,
    item_id: int,
    market_price_id: int,
    market_price_update: MarketPriceUpdate,
    current_user = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update market price"""
    proforma = db.query(Proforma).filter(Proforma.proforma_id == proforma_id).first()
    if not proforma:
        raise HTTPException(status_code=404, detail="Proforma not found")
    
    if proforma.status == "Converted":
        raise HTTPException(status_code=400, detail="Cannot modify a converted proforma")
    
    market_price = db.query(MarketPrice).filter(
        MarketPrice.market_price_id == market_price_id,
        MarketPrice.proforma_item_id == item_id
    ).first()
    if not market_price:
        raise HTTPException(status_code=404, detail="Market price not found")
    
    if market_price_update.organization_name is not None:
        market_price.organization_name = market_price_update.organization_name
    if market_price_update.unit_price is not None:
        market_price.unit_price = market_price_update.unit_price
    if market_price_update.notes is not None:
        market_price.notes = market_price_update.notes
    
    db.commit()
    db.refresh(market_price)
    
    return MarketPriceResponse(
        market_price_id=market_price.market_price_id,
        proforma_item_id=market_price.proforma_item_id,
        organization_name=market_price.organization_name,
        unit_price=market_price.unit_price,
        notes=market_price.notes,
        created_at=market_price.created_at
    )

@router.delete("/{proforma_id}/items/{item_id}/market-prices/{market_price_id}")
def delete_market_price(
    proforma_id: int,
    item_id: int,
    market_price_id: int,
    current_user = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete market price"""
    proforma = db.query(Proforma).filter(Proforma.proforma_id == proforma_id).first()
    if not proforma:
        raise HTTPException(status_code=404, detail="Proforma not found")
    
    if proforma.status == "Converted":
        raise HTTPException(status_code=400, detail="Cannot modify a converted proforma")
    
    market_price = db.query(MarketPrice).filter(
        MarketPrice.market_price_id == market_price_id,
        MarketPrice.proforma_item_id == item_id
    ).first()
    if not market_price:
        raise HTTPException(status_code=404, detail="Market price not found")
    
    db.delete(market_price)
    db.commit()
    
    return {"message": "Market price deleted successfully"}

@router.post("/{proforma_id}/print")
def mark_proforma_printed(
    proforma_id: int,
    current_user = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Mark proforma as printed"""
    proforma = db.query(Proforma).filter(Proforma.proforma_id == proforma_id).first()
    if not proforma:
        raise HTTPException(status_code=404, detail="Proforma not found")
    
    proforma.printed_at = datetime.now()
    if proforma.status == "Draft":
        proforma.status = "Sent"
    
    db.commit()
    db.refresh(proforma)
    
    return {"message": "Proforma marked as printed", "printed_at": proforma.printed_at}

@router.post("/{proforma_id}/convert")
def convert_proforma_to_service(
    proforma_id: int,
    current_user = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Convert proforma to actual service (future implementation)"""
    proforma = db.query(Proforma).filter(Proforma.proforma_id == proforma_id).first()
    if not proforma:
        raise HTTPException(status_code=404, detail="Proforma not found")
    
    if proforma.status == "Converted":
        raise HTTPException(status_code=400, detail="Proforma already converted")
    
    if not proforma.vehicle_id:
        raise HTTPException(status_code=400, detail="Cannot convert proforma without vehicle")
    
    # Mark as converted
    proforma.status = "Converted"
    # Note: converted_to_service_id will be set when actual service is created
    
    db.commit()
    db.refresh(proforma)
    
    return {"message": "Proforma marked as converted. Service creation can be done separately."}

# Helper functions
def build_item_response(item: ProformaItem, db: Session) -> ProformaItemResponse:
    """Build ProformaItemResponse with part details and market prices"""
    part_code = None
    part_name = None
    if item.part_id:
        part = db.query(PartInventory).filter(PartInventory.part_id == item.part_id).first()
        if part:
            part_code = part.part_code
            part_name = part.part_name
    
    # Get market prices
    market_prices = db.query(MarketPrice).filter(MarketPrice.proforma_item_id == item.proforma_item_id).all()
    market_price_responses = [
        MarketPriceResponse(
            market_price_id=mp.market_price_id,
            proforma_item_id=mp.proforma_item_id,
            organization_name=mp.organization_name,
            unit_price=mp.unit_price,
            notes=mp.notes,
            created_at=mp.created_at
        )
        for mp in market_prices
    ]
    
    return ProformaItemResponse(
        proforma_item_id=item.proforma_item_id,
        proforma_id=item.proforma_id,
        part_id=item.part_id,
        item_type=item.item_type or "Other",
        item_name=item.item_name,
        item_description=item.item_description,
        quantity=item.quantity,
        unit_price=item.unit_price,
        total_price=item.total_price,
        notes=item.notes,
        part_code=part_code,
        part_name=part_name,
        market_prices=market_price_responses
    )

def build_proforma_response(proforma: Proforma, db: Session) -> ProformaResponse:
    """Build ProformaResponse with all related data"""
    customer = None
    if proforma.customer_id:
        customer = db.query(Customer).filter(Customer.customer_id == proforma.customer_id).first()
    # Get vehicle info - use external car_model first, then fallback to linked vehicle
    vehicle_info = proforma.car_model  # External vehicle (car model)
    if not vehicle_info and proforma.vehicle_id:
        vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == proforma.vehicle_id).first()
        if vehicle:
            vehicle_info = f"{vehicle.make} {vehicle.model} - {vehicle.license_plate}"
    
    service_type_name = None
    if proforma.service_type_id:
        service_type = db.query(ServiceType).filter(ServiceType.service_type_id == proforma.service_type_id).first()
        if service_type:
            service_type_name = service_type.type_name
    
    creator_name = None
    if proforma.created_by:
        creator = db.query(Employee).filter(Employee.employee_id == proforma.created_by).first()
        if creator:
            creator_name = f"{creator.first_name} {creator.last_name}"
    
    # Get items
    items = db.query(ProformaItem).filter(ProformaItem.proforma_id == proforma.proforma_id).all()
    item_responses = [build_item_response(item, db) for item in items]
    
    return ProformaResponse(
        proforma_id=proforma.proforma_id,
        proforma_number=proforma.proforma_number,
        customer_id=proforma.customer_id,
        vehicle_id=proforma.vehicle_id,
        service_type_id=proforma.service_type_id,
        organization_name=proforma.organization_name,
        customer_name=proforma.customer_name or (f"{customer.first_name} {customer.last_name}" if customer else None),
        car_model=proforma.car_model,
        description=proforma.description,
        notes=proforma.notes,
        subtotal=proforma.subtotal,
        tax_rate=proforma.tax_rate,
        tax_amount=proforma.tax_amount,
        discount_amount=proforma.discount_amount,
        grand_total=proforma.grand_total,
        status=proforma.status,
        valid_until=proforma.valid_until,
        created_by=proforma.created_by,
        created_at=proforma.created_at,
        updated_at=proforma.updated_at,
        printed_at=proforma.printed_at,
        converted_to_service_id=proforma.converted_to_service_id,
        customer_email=customer.email if customer else None,
        customer_phone=customer.phone if customer else None,
        vehicle_info=vehicle_info,
        service_type_name=service_type_name,
        creator_name=creator_name,
        items=item_responses
    )
