from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.employee import Employee

router = APIRouter()

@router.get("/")
def get_employees(
    role: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Employee).filter(Employee.is_active == True)
    if role:
        query = query.filter(Employee.role == role)
    employees = query.offset(skip).limit(limit).all()
    
    return [
        {
            "employee_id": e.employee_id,
            "employee_code": e.employee_code,
            "first_name": e.first_name,
            "last_name": e.last_name,
            "email": e.email,
            "phone": e.phone,
            "role": e.role,
            "specialization": e.specialization,
        }
        for e in employees
    ]

@router.get("/mechanics")
def get_mechanics(db: Session = Depends(get_db)):
    mechanics = db.query(Employee).filter(
        Employee.role == "Mechanic",
        Employee.is_active == True
    ).all()
    
    return [
        {
            "employee_id": m.employee_id,
            "name": f"{m.first_name} {m.last_name}",
            "specialization": m.specialization,
        }
        for m in mechanics
    ]


