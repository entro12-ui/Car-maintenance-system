from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.part import PartInventory
from app.schemas.part import PartCreate, PartUpdate, PartResponse

router = APIRouter()

@router.post("/", response_model=PartResponse)
def create_part(part: PartCreate, db: Session = Depends(get_db)):
    # Check if part code exists
    existing = db.query(PartInventory).filter(PartInventory.part_code == part.part_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Part code already exists")
    
    db_part = PartInventory(**part.dict())
    db.add(db_part)
    db.commit()
    db.refresh(db_part)
    return db_part

@router.get("/", response_model=List[PartResponse])
def get_parts(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    low_stock: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(PartInventory)
    if category:
        query = query.filter(PartInventory.category == category)
    if low_stock:
        query = query.filter(
            PartInventory.stock_quantity <= PartInventory.min_stock_level,
            PartInventory.is_active == True
        )
    parts = query.offset(skip).limit(limit).all()
    return parts

@router.get("/low-stock")
def get_low_stock_parts(db: Session = Depends(get_db)):
    parts = db.query(PartInventory).filter(
        PartInventory.is_active == True,
        PartInventory.stock_quantity <= PartInventory.min_stock_level
    ).all()
    
    return [
        {
            "part_id": p.part_id,
            "part_code": p.part_code,
            "part_name": p.part_name,
            "category": p.category,
            "stock_quantity": p.stock_quantity,
            "min_stock_level": p.min_stock_level,
            "unit_price": float(p.unit_price),
            "stock_status": "OUT OF STOCK" if p.stock_quantity == 0 else "LOW STOCK"
        }
        for p in parts
    ]

@router.get("/{part_id}", response_model=PartResponse)
def get_part(part_id: int, db: Session = Depends(get_db)):
    part = db.query(PartInventory).filter(PartInventory.part_id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    return part

@router.put("/{part_id}", response_model=PartResponse)
def update_part(
    part_id: int,
    part_update: PartUpdate,
    db: Session = Depends(get_db)
):
    part = db.query(PartInventory).filter(PartInventory.part_id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    
    update_data = part_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(part, field, value)
    
    db.commit()
    db.refresh(part)
    return part


