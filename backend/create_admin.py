#!/usr/bin/env python3
"""
Script to create an admin user
Usage: python3 create_admin.py <email> <password> [first_name] [last_name]
"""
import sys
import os
from sqlalchemy.orm import Session

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.employee import Employee, UserAccount
from app.auth import get_password_hash

def create_admin_user(email: str, password: str, first_name: str = "Admin", last_name: str = "User"):
    """Create an admin user"""
    db: Session = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_user = db.query(UserAccount).filter(UserAccount.username == email).first()
        if existing_user:
            print(f"❌ Admin user with email '{email}' already exists!")
            return False
        
        # Check if employee with this email exists
        existing_employee = db.query(Employee).filter(Employee.email == email).first()
        if existing_employee:
            print(f"❌ Employee with email '{email}' already exists!")
            return False
        
        # Create employee
        employee = Employee(
            employee_code=f"ADM{db.query(Employee).count() + 1:04d}",
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone="0000000000",  # Placeholder, can be updated later
            role="Admin",
            is_active=True
        )
        db.add(employee)
        db.flush()  # Get employee_id
        
        # Create user account
        user_account = UserAccount(
            employee_id=employee.employee_id,
            username=email,
            password_hash=get_password_hash(password),
            role="Admin",
            is_locked=False
        )
        db.add(user_account)
        db.commit()
        
        print(f"✅ Admin user created successfully!")
        print(f"   Email: {email}")
        print(f"   Name: {first_name} {last_name}")
        print(f"   Role: Admin")
        print(f"   Employee ID: {employee.employee_id}")
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating admin user: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 create_admin.py <email> <password> [first_name] [last_name]")
        print("\nExample:")
        print("  python3 create_admin.py admin@carservice.com password123")
        print("  python3 create_admin.py admin@carservice.com password123 John Admin")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    first_name = sys.argv[3] if len(sys.argv) > 3 else "Admin"
    last_name = sys.argv[4] if len(sys.argv) > 4 else "User"
    
    print(f"Creating admin user...")
    print(f"Email: {email}")
    print(f"Name: {first_name} {last_name}")
    print()
    
    success = create_admin_user(email, password, first_name, last_name)
    sys.exit(0 if success else 1)

