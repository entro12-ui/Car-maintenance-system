from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.employee import Employee

from pydantic import BaseModel, EmailStr

router = APIRouter()


class EmployeeBase(BaseModel):
  employee_code: str
  first_name: str
  last_name: str
  email: EmailStr
  phone: str
  role: str
  specialization: Optional[str] = None


class EmployeeCreate(EmployeeBase):
  hourly_rate: Optional[float] = 0.0


class EmployeeUpdate(BaseModel):
  first_name: Optional[str] = None
  last_name: Optional[str] = None
  email: Optional[EmailStr] = None
  phone: Optional[str] = None
  role: Optional[str] = None
  specialization: Optional[str] = None
  hourly_rate: Optional[float] = None
  is_active: Optional[bool] = None


class EmployeeResponse(EmployeeBase):
  employee_id: int
  hourly_rate: float
  is_active: bool

  class Config:
    orm_mode = True


@router.get("/")
def get_employees(
  role: Optional[str] = None,
  include_inactive: bool = False,
  skip: int = 0,
  limit: int = 100,
  db: Session = Depends(get_db),
) -> List[EmployeeResponse]:
  query = db.query(Employee)
  if not include_inactive:
    query = query.filter(Employee.is_active == True)
  if role:
    query = query.filter(Employee.role == role)
  employees = query.offset(skip).limit(limit).all()
  return [
    EmployeeResponse(
      employee_id=e.employee_id,
      employee_code=e.employee_code,
      first_name=e.first_name,
      last_name=e.last_name,
      email=e.email,
      phone=e.phone,
      role=e.role,
      specialization=e.specialization,
      hourly_rate=float(e.hourly_rate or 0),
      is_active=bool(e.is_active),
    )
    for e in employees
  ]

@router.get("/mechanics")
def get_mechanics(db: Session = Depends(get_db)):
  mechanics = db.query(Employee).filter(
    Employee.role == "Mechanic",
    Employee.is_active == True,
  ).all()

  return [
    {
      "employee_id": m.employee_id,
      "name": f"{m.first_name} {m.last_name}",
      "specialization": m.specialization,
    }
    for m in mechanics
  ]


@router.post("/", response_model=EmployeeResponse)
def create_employee(
  payload: EmployeeCreate,
  db: Session = Depends(get_db),
):
  existing = db.query(Employee).filter(
    (Employee.employee_code == payload.employee_code)
    | (Employee.email == payload.email)
    | (Employee.phone == payload.phone),
  ).first()
  if existing:
    raise HTTPException(
      status_code=400,
      detail="Employee with same code, email or phone already exists.",
    )

  employee = Employee(
    employee_code=payload.employee_code,
    first_name=payload.first_name,
    last_name=payload.last_name,
    email=str(payload.email),
    phone=payload.phone,
    role=payload.role,
    specialization=payload.specialization,
    hourly_rate=payload.hourly_rate or 0.0,
    is_active=True,
  )
  db.add(employee)
  db.commit()
  db.refresh(employee)
  return EmployeeResponse(
    employee_id=employee.employee_id,
    employee_code=employee.employee_code,
    first_name=employee.first_name,
    last_name=employee.last_name,
    email=employee.email,
    phone=employee.phone,
    role=employee.role,
    specialization=employee.specialization,
    hourly_rate=float(employee.hourly_rate or 0),
    is_active=bool(employee.is_active),
  )


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
  employee_id: int,
  payload: EmployeeUpdate,
  db: Session = Depends(get_db),
):
  employee = (
    db.query(Employee)
    .filter(Employee.employee_id == employee_id)
    .first()
  )
  if not employee:
    raise HTTPException(status_code=404, detail="Employee not found.")

  if payload.first_name is not None:
    employee.first_name = payload.first_name
  if payload.last_name is not None:
    employee.last_name = payload.last_name
  if payload.email is not None:
    employee.email = str(payload.email)
  if payload.phone is not None:
    employee.phone = payload.phone
  if payload.role is not None:
    employee.role = payload.role
  if payload.specialization is not None:
    employee.specialization = payload.specialization
  if payload.hourly_rate is not None:
    employee.hourly_rate = payload.hourly_rate
  if payload.is_active is not None:
    employee.is_active = payload.is_active

  db.commit()
  db.refresh(employee)
  return EmployeeResponse(
    employee_id=employee.employee_id,
    employee_code=employee.employee_code,
    first_name=employee.first_name,
    last_name=employee.last_name,
    email=employee.email,
    phone=employee.phone,
    role=employee.role,
    specialization=employee.specialization,
    hourly_rate=float(employee.hourly_rate or 0),
    is_active=bool(employee.is_active),
  )


@router.delete("/{employee_id}")
def delete_employee(
  employee_id: int,
  db: Session = Depends(get_db),
):
  employee = (
    db.query(Employee)
    .filter(Employee.employee_id == employee_id)
    .first()
  )
  if not employee:
    raise HTTPException(status_code=404, detail="Employee not found.")

  db.delete(employee)
  db.commit()
  return {"detail": "Employee deleted successfully."}


