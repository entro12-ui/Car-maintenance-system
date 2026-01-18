#!/usr/bin/env python3
"""
Master script to seed all service data (service types and checklist items)
Usage: python3 seed_all_service_data.py
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.service import ServiceType, ServiceChecklist

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

# Standard checklist items in order
CHECKLIST_ITEMS = [
    ("Engine Oil", "Engine oil check and change", True, 15),
    ("Oil Filter", "Oil filter replacement", True, 10),
    ("Air Filter", "Air filter inspection and replacement", True, 10),
    ("Spark Plugs", "Spark plugs inspection and replacement", False, 20),
    ("Throttle", "Throttle body cleaning and inspection", False, 15),
    ("Brake Pads", "Brake pads inspection and replacement", True, 30),
    ("Coolant", "Coolant level check and top-up", True, 10),
    ("AGS Oil", "Automatic transmission fluid check and change", False, 20),
    ("Gear Oil", "Manual transmission oil check and change", False, 15),
    ("CV Joint Grease", "CV joint inspection and greasing", False, 20),
    ("Fuel Pump", "Fuel pump inspection and testing", False, 15),
    ("Electrical components", "Electrical system inspection", False, 25),
    ("Computer diagnosis", "ECU scan and diagnostic check", False, 30),
]

def seed_service_types(db):
    """Add service types to the database"""
    print("\n" + "="*60)
    print("STEP 1: Seeding Service Types")
    print("="*60)
    
    created_count = 0
    existing_count = 0
    
    for service_type_data in SERVICE_TYPES:
        # Check if service type already exists
        existing = db.query(ServiceType).filter(
            ServiceType.type_name == service_type_data["type_name"]
        ).first()
        
        if existing:
            print(f"⏭️  '{service_type_data['type_name']}' already exists")
            # Ensure existing service type is active
            if not existing.is_active:
                existing.is_active = True
                print(f"   ↻ Activated: {service_type_data['type_name']}")
            existing_count += 1
        else:
            # Create new service type - ensure is_active is True
            service_type_dict = service_type_data.copy()
            service_type_dict.setdefault('is_active', True)
            service_type = ServiceType(**service_type_dict)
            db.add(service_type)
            db.flush()
            print(f"✅ Created: {service_type_data['type_name']}")
            created_count += 1
    
    print(f"\n✅ Service Types: Created {created_count}, Already existed {existing_count}, Total {len(SERVICE_TYPES)}")
    return True

def seed_checklist_items(db):
    """Add checklist items to all service types"""
    print("\n" + "="*60)
    print("STEP 2: Seeding Checklist Items")
    print("="*60)
    
    # Get all service types
    service_types = db.query(ServiceType).all()
    
    if not service_types:
        print("❌ No service types found. Please seed service types first.")
        return False
    
    print(f"Found {len(service_types)} service type(s)")
    
    total_items_added = 0
    total_items_existing = 0
    
    for service_type in service_types:
        print(f"\n📋 Processing: {service_type.type_name}")
        items_added = 0
        items_existing = 0
        
        for sort_order, (item_name, description, is_mandatory, duration) in enumerate(CHECKLIST_ITEMS):
            # Check if item already exists
            existing = db.query(ServiceChecklist).filter(
                ServiceChecklist.service_type_id == service_type.service_type_id,
                ServiceChecklist.item_name == item_name
            ).first()
            
            if not existing:
                checklist_item = ServiceChecklist(
                    service_type_id=service_type.service_type_id,
                    item_name=item_name,
                    item_description=description,
                    is_mandatory=is_mandatory,
                    estimated_duration_minutes=duration,
                    sort_order=sort_order
                )
                db.add(checklist_item)
                items_added += 1
                total_items_added += 1
            else:
                items_existing += 1
                total_items_existing += 1
        
        if items_added > 0:
            print(f"  ✅ Added {items_added} items")
        if items_existing > 0:
            print(f"  ⏭️  {items_existing} items already existed")
    
    print(f"\n✅ Checklist Items: Added {total_items_added}, Already existed {total_items_existing}")
    return True

def seed_all_service_data():
    """Main function to seed all service data"""
    db = SessionLocal()
    try:
        print("🌱 Starting Service Data Seeding...")
        print("This will add:")
        print(f"  - {len(SERVICE_TYPES)} Service Types")
        print(f"  - {len(CHECKLIST_ITEMS)} Checklist Items (to each service type)")
        print()
        
        # Step 1: Seed service types
        seed_service_types(db)
        db.commit()  # Commit service types first
        
        # Step 2: Seed checklist items
        seed_checklist_items(db)
        db.commit()  # Commit checklist items
        
        # Summary
        print("\n" + "="*60)
        print("✅ ALL SERVICE DATA SEEDING COMPLETE!")
        print("="*60)
        print(f"📦 Service Types: {len(SERVICE_TYPES)}")
        print(f"📋 Checklist Items per Type: {len(CHECKLIST_ITEMS)}")
        print(f"📊 Total Checklist Items: {len(SERVICE_TYPES)} types × {len(CHECKLIST_ITEMS)} items")
        print()
        print("🎉 You can now use 'Manage Service Checklists' page to customize items per service type!")
        print("="*60 + "\n")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error seeding service data: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = seed_all_service_data()
    sys.exit(0 if success else 1)
