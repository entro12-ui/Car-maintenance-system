#!/usr/bin/env python3
"""
Script to seed service types into the database
Usage: python3 seed_service_types.py
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.service import ServiceType

# Service types to insert
SERVICE_TYPES = [
    {
        "type_name": "Basic Service",
        "description": "Oil change, filter check, tire rotation",
        "base_labor_hours": 1.5,
        "mileage_interval": 5000,
        "time_interval_months": 6,
    },
    {
        "type_name": "Major Service",
        "description": "Complete checkup with spark plugs and fluids",
        "base_labor_hours": 3.0,
        "mileage_interval": 20000,
        "time_interval_months": 12,
    },
    {
        "type_name": "Brake Service",
        "description": "Brake pad replacement and fluid check",
        "base_labor_hours": 2.0,
        "mileage_interval": 10000,
        "time_interval_months": 12,
    },
    {
        "type_name": "Tire Service",
        "description": "Tire rotation, balancing and alignment",
        "base_labor_hours": 1.0,
        "mileage_interval": 10000,
        "time_interval_months": 6,
    },
    {
        "type_name": "AC Service",
        "description": "AC gas refill and system check",
        "base_labor_hours": 1.5,
        "mileage_interval": 12000,
        "time_interval_months": 12,
    },
    {
        "type_name": "General Service",
        "description": "Standard vehicle service with all checklist items",
        "base_labor_hours": 2.0,
        "mileage_interval": 10000,
        "time_interval_months": 6,
    },
]

def seed_service_types():
    """Add service types to the database"""
    db = SessionLocal()
    try:
        created_count = 0
        existing_count = 0
        
        for service_type_data in SERVICE_TYPES:
            # Check if service type already exists
            existing = db.query(ServiceType).filter(
                ServiceType.type_name == service_type_data["type_name"]
            ).first()
            
            if existing:
                print(f"⏭️  '{service_type_data['type_name']}' already exists")
                existing_count += 1
            else:
                # Create new service type
                service_type = ServiceType(**service_type_data)
                db.add(service_type)
                db.flush()
                print(f"✅ Created: {service_type_data['type_name']}")
                created_count += 1
        
        db.commit()
        
        print(f"\n{'='*60}")
        print(f"✅ Service Types Seeding Complete!")
        print(f"   Created: {created_count}")
        print(f"   Already existed: {existing_count}")
        print(f"   Total: {len(SERVICE_TYPES)}")
        print(f"{'='*60}\n")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error seeding service types: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Starting service types seeding...")
    print()
    
    success = seed_service_types()
    
    sys.exit(0 if success else 1)
