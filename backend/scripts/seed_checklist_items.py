"""
Script to seed service checklist items for all service types.
Run this script to add the standard checklist items to your database.
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.service import ServiceType, ServiceChecklist

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

def seed_checklist_items():
    """Add checklist items to all service types"""
    db = SessionLocal()
    try:
        # Get all service types
        service_types = db.query(ServiceType).all()
        
        if not service_types:
            print("No service types found. Please create service types first.")
            return
        
        # Create General Service type if it doesn't exist
        general_service = db.query(ServiceType).filter(
            ServiceType.type_name == "General Service"
        ).first()
        
        if not general_service:
            general_service = ServiceType(
                type_name="General Service",
                description="Standard vehicle service with all checklist items",
                base_labor_hours=2.0,
                mileage_interval=10000,
                time_interval_months=6
            )
            db.add(general_service)
            db.flush()
            print("Created 'General Service' type")
        
        # Add to all service types
        all_service_types = service_types + [general_service]
        
        for service_type in all_service_types:
            print(f"\nProcessing service type: {service_type.type_name}")
            
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
                    print(f"  ✓ Added: {item_name}")
                else:
                    print(f"  - Already exists: {item_name}")
        
        db.commit()
        print("\n✅ Successfully seeded checklist items!")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting checklist items seeding...")
    seed_checklist_items()
    print("\nDone!")

