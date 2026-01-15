from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.employee import UserAccount
from app.models.customer import Customer
from app.models.accountant import Accountant
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash using bcrypt"""
    try:
        # Encode password to bytes and truncate if needed (bcrypt limit is 72 bytes)
        password_bytes = plain_password.encode('utf-8')
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
        
        # Handle both string and bytes hash formats
        if isinstance(hashed_password, str):
            hash_bytes = hashed_password.encode('utf-8')
        else:
            hash_bytes = hashed_password
        
        # Verify using bcrypt
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt directly (bcrypt limit is 72 bytes)"""
    # Ensure password is a string
    if not isinstance(password, str):
        password = str(password)
    # Encode to bytes and truncate to 72 bytes if longer (bcrypt limitation)
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    # Generate salt and hash
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Return as string
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_username(username: str, db: Session):
    """Get user by username (customer or employee)"""
    # Check user_accounts table
    user_account = db.query(UserAccount).filter(UserAccount.username == username).first()
    if user_account:
        return user_account
    
    # Check if customer email matches
    customer = db.query(Customer).filter(Customer.email == username).first()
    if customer:
        # Create user account for customer if doesn't exist
        if not customer.password_hash:
            return None
        # Return a mock user account object for customer
        class CustomerUser:
            def __init__(self, customer):
                self.user_id = customer.customer_id
                self.username = customer.email
                self.role = "Customer"
                self.customer_id = customer.customer_id
                self.employee_id = None
                self.accountant_id = None
                self.password_hash = customer.password_hash
                self.is_locked = False
        return CustomerUser(customer)
    
    # Check if accountant email matches
    accountant = db.query(Accountant).filter(Accountant.email == username).first()
    if accountant:
        if not accountant.password_hash:
            return None
        # Return a mock user account object for accountant
        class AccountantUser:
            def __init__(self, accountant):
                self.user_id = accountant.accountant_id
                self.username = accountant.email
                self.role = "Accountant"
                self.customer_id = None
                self.employee_id = None
                self.accountant_id = accountant.accountant_id
                self.password_hash = accountant.password_hash
                self.is_locked = False
        return AccountantUser(accountant)
    
    return None

def authenticate_user(username: str, password: str, db: Session):
    """Authenticate user and return user object"""
    user = get_user_by_username(username, db)
    if not user:
        return False
    if user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is locked"
        )
    
    # Check password
    if not verify_password(password, user.password_hash):
        return False
    
    return user

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = get_user_by_username(username, db)
    if user is None:
        raise credentials_exception
    return user

async def get_current_admin(
    current_user = Depends(get_current_user)
):
    """Get current admin user"""
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

async def get_current_customer(
    current_user = Depends(get_current_user)
):
    """Get current customer user"""
    if current_user.role != "Customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

async def get_current_accountant(
    current_user = Depends(get_current_user)
):
    """Get current accountant user"""
    if current_user.role != "Accountant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

