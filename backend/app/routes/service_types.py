from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models.service import ServiceType, ServiceChecklist
from app.schemas.service_type import (
    ServiceTypeResponse, 
    ServiceChecklistItemCreate,
    ServiceChecklistItemUpdate,
    ServiceChecklistItemResponse,
    ServiceTypeWithChecklist
)
from app.auth import get_current_admin

router = APIRouter()

@router.get("/", response_model=List[ServiceTypeResponse])
def get_service_types(db: Session = Depends(get_db)):
    service_types = db.query(ServiceType).filter(ServiceType.is_active == True).all()
    return service_types

@router.get("/{service_type_id}", response_model=ServiceTypeResponse)
def get_service_type(service_type_id: int, db: Session = Depends(get_db)):
    service_type = db.query(ServiceType).filter(ServiceType.service_type_id == service_type_id).first()
    if not service_type:
        raise HTTPException(status_code=404, detail="Service type not found")
    return service_type

@router.get("/{service_type_id}/with-checklist", response_model=ServiceTypeWithChecklist)
def get_service_type_with_checklist(
    service_type_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Get service type with all checklist items (Admin only)"""
    service_type = db.query(ServiceType).options(
        joinedload(ServiceType.checklists)
    ).filter(ServiceType.service_type_id == service_type_id).first()
    if not service_type:
        raise HTTPException(status_code=404, detail="Service type not found")
    return service_type

@router.get("/{service_type_id}/checklist", response_model=List[ServiceChecklistItemResponse])
def get_service_checklist_items(
    service_type_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Get all checklist items for a service type (Admin only)"""
    # Verify service type exists
    service_type = db.query(ServiceType).filter(ServiceType.service_type_id == service_type_id).first()
    if not service_type:
        raise HTTPException(status_code=404, detail="Service type not found")
    
    checklist_items = db.query(ServiceChecklist).filter(
        ServiceChecklist.service_type_id == service_type_id
    ).order_by(ServiceChecklist.sort_order).all()
    
    return checklist_items

@router.post("/{service_type_id}/checklist", response_model=ServiceChecklistItemResponse)
def create_checklist_item(
    service_type_id: int,
    item_data: ServiceChecklistItemCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Create a new checklist item for a service type (Admin only)"""
    # Verify service type exists
    service_type = db.query(ServiceType).filter(ServiceType.service_type_id == service_type_id).first()
    if not service_type:
        raise HTTPException(status_code=404, detail="Service type not found")
    
    # Check if item with same name already exists
    existing = db.query(ServiceChecklist).filter(
        ServiceChecklist.service_type_id == service_type_id,
        ServiceChecklist.item_name == item_data.item_name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Checklist item with this name already exists")
    
    checklist_item = ServiceChecklist(
        service_type_id=service_type_id,
        **item_data.dict()
    )
    db.add(checklist_item)
    db.commit()
    db.refresh(checklist_item)
    return checklist_item

@router.put("/checklist/{checklist_id}", response_model=ServiceChecklistItemResponse)
def update_checklist_item(
    checklist_id: int,
    item_data: ServiceChecklistItemUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Update a checklist item (Admin only)"""
    checklist_item = db.query(ServiceChecklist).filter(
        ServiceChecklist.checklist_id == checklist_id
    ).first()
    if not checklist_item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    # Check name uniqueness if name is being updated
    if item_data.item_name and item_data.item_name != checklist_item.item_name:
        existing = db.query(ServiceChecklist).filter(
            ServiceChecklist.service_type_id == checklist_item.service_type_id,
            ServiceChecklist.item_name == item_data.item_name,
            ServiceChecklist.checklist_id != checklist_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Checklist item with this name already exists")
    
    update_data = item_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(checklist_item, field, value)
    
    db.commit()
    db.refresh(checklist_item)
    return checklist_item

@router.delete("/checklist/{checklist_id}")
def delete_checklist_item(
    checklist_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Delete a checklist item (Admin only)"""
    checklist_item = db.query(ServiceChecklist).filter(
        ServiceChecklist.checklist_id == checklist_id
    ).first()
    if not checklist_item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    db.delete(checklist_item)
    db.commit()
    return {"message": "Checklist item deleted successfully"}


