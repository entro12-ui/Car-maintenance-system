from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import timedelta
from typing import Optional
from pydantic import BaseModel, EmailStr, validator
from app.database import get_db
from app.models.customer import Customer
from app.models.employee import UserAccount
from app.models.accountant import Accountant
from app.auth import (
    authenticate_user, create_access_token, get_password_hash,
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter()

class CustomerRegister(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    password: str  # Max 72 characters for bcrypt
    address: str = None
    city: str = None
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        if len(v) > 72:
            raise ValueError('Password cannot exceed 72 characters (bcrypt limitation)')
        return v

class CustomerRegisterResponse(BaseModel):
    message: str
    customer_id: int
    status: str

class AccountantRegister(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    password: str
    address: str = None
    city: str = None
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        if len(v) > 72:
            raise ValueError('Password cannot exceed 72 characters (bcrypt limitation)')
        return v

class AccountantRegisterResponse(BaseModel):
    message: str
    accountant_id: int
    status: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int

class UserInfo(BaseModel):
    user_id: int
    username: str
    role: str
    customer_id: Optional[int] = None
    employee_id: Optional[int] = None
    accountant_id: Optional[int] = None

@router.post("/register", response_model=CustomerRegisterResponse)
def register_customer(customer_data: CustomerRegister, db: Session = Depends(get_db)):
    """Register a new customer (requires admin approval)"""
    try:
        # Test database connection first
        db.execute(text("SELECT 1"))
    except Exception as e:
        error_msg = str(e)
        if "password authentication failed" in error_msg.lower():
            detail = "Database password authentication failed. Run: sudo -u postgres psql, then: ALTER USER postgres WITH PASSWORD 'postgres'; CREATE DATABASE car_service_db;"
        elif "does not exist" in error_msg.lower() or "database" in error_msg.lower():
            detail = "Database 'car_service_db' does not exist. Run: sudo -u postgres psql -c 'CREATE DATABASE car_service_db;'"
        else:
            detail = f"Database error: {error_msg[:150]}. See MANUAL_DB_SETUP.txt for fix instructions."
        raise HTTPException(
            status_code=503,
            detail=detail
        )
    
    # Check if email already exists
    existing = db.query(Customer).filter(Customer.email == customer_data.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Check if phone already exists
    existing_phone = db.query(Customer).filter(Customer.phone == customer_data.phone).first()
    if existing_phone:
        raise HTTPException(
            status_code=400,
            detail="Phone number already registered"
        )
    
    # Create customer with pending approval
    customer = Customer(
        first_name=customer_data.first_name,
        last_name=customer_data.last_name,
        email=customer_data.email,
        phone=customer_data.phone,
        address=customer_data.address,
        city=customer_data.city,
        password_hash=get_password_hash(customer_data.password),
        is_active=False  # Requires admin approval
    )
    
    db.add(customer)
    db.commit()
    db.refresh(customer)
    
    return {
        "message": "Registration successful. Your account is pending admin approval.",
        "customer_id": customer.customer_id,
        "status": "pending"
    }

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login endpoint for customers and employees"""
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if customer account is approved
    if hasattr(user, 'customer_id') and user.customer_id:
        customer = db.query(Customer).filter(Customer.customer_id == user.customer_id).first()
        if customer and not customer.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is pending admin approval"
            )
    
    # Check if accountant account is approved
    if hasattr(user, 'accountant_id') and user.accountant_id:
        accountant = db.query(Accountant).filter(Accountant.accountant_id == user.accountant_id).first()
        if accountant and not accountant.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is pending admin approval"
            )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": getattr(user, 'customer_id') or getattr(user, 'employee_id') or getattr(user, 'accountant_id') or user.user_id
    }

@router.get("/me", response_model=UserInfo)
def get_current_user_info(current_user = Depends(get_current_user)):
    """Get current user information"""
    # Get user_id
    user_id = getattr(current_user, 'user_id', None)
    if not user_id:
        user_id = getattr(current_user, 'customer_id', None) or getattr(current_user, 'employee_id', None)
    
    # Get customer_id, employee_id, and accountant_id
    customer_id = getattr(current_user, 'customer_id', None)
    employee_id = getattr(current_user, 'employee_id', None)
    accountant_id = getattr(current_user, 'accountant_id', None)
    
    return {
        "user_id": user_id,
        "username": current_user.username,
        "role": current_user.role,
        "customer_id": customer_id if customer_id is not None else None,
        "employee_id": employee_id if employee_id is not None else None,
        "accountant_id": accountant_id if accountant_id is not None else None
    }

@router.post("/register-accountant", response_model=AccountantRegisterResponse)
def register_accountant(accountant_data: AccountantRegister, db: Session = Depends(get_db)):
    """Register a new accountant (requires admin approval)"""
    try:
        # Test database connection first
        db.execute(text("SELECT 1"))
    except Exception as e:
        error_msg = str(e)
        if "password authentication failed" in error_msg.lower():
            detail = "Database password authentication failed. Run: sudo -u postgres psql, then: ALTER USER postgres WITH PASSWORD 'postgres'; CREATE DATABASE car_service_db;"
        elif "does not exist" in error_msg.lower() or "database" in error_msg.lower():
            detail = "Database 'car_service_db' does not exist. Run: sudo -u postgres psql -c 'CREATE DATABASE car_service_db;'"
        else:
            detail = f"Database error: {error_msg[:150]}. See MANUAL_DB_SETUP.txt for fix instructions."
        raise HTTPException(
            status_code=503,
            detail=detail
        )
    
    # Check if email already exists
    existing = db.query(Accountant).filter(Accountant.email == accountant_data.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Check if phone already exists
    existing_phone = db.query(Accountant).filter(Accountant.phone == accountant_data.phone).first()
    if existing_phone:
        raise HTTPException(
            status_code=400,
            detail="Phone number already registered"
        )
    
    # Create accountant with pending approval
    accountant = Accountant(
        first_name=accountant_data.first_name,
        last_name=accountant_data.last_name,
        email=accountant_data.email,
        phone=accountant_data.phone,
        address=accountant_data.address,
        city=accountant_data.city,
        password_hash=get_password_hash(accountant_data.password),
        is_active=False  # Requires admin approval
    )
    
    db.add(accountant)
    db.commit()
    db.refresh(accountant)
    
    return {
        "message": "Registration successful. Your account is pending admin approval.",
        "accountant_id": accountant.accountant_id,
        "status": "pending"
    }

@router.post("/approve/{customer_id}")
def approve_customer(
    customer_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Approve a customer account (Admin only)"""
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can approve customers"
        )
    
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    customer.is_active = True
    db.commit()
    
    return {"message": f"Customer {customer.first_name} {customer.last_name} approved successfully"}

@router.post("/approve-accountant/{accountant_id}")
def approve_accountant(
    accountant_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Approve an accountant account (Admin only)"""
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can approve accountants"
        )
    
    accountant = db.query(Accountant).filter(Accountant.accountant_id == accountant_id).first()
    if not accountant:
        raise HTTPException(status_code=404, detail="Accountant not found")
    
    accountant.is_active = True
    db.commit()
    
    return {"message": f"Accountant {accountant.first_name} {accountant.last_name} approved successfully"}

