"""
Script to seed parts inventory with checklist items.
Run this script to add parts for all standard checklist items.
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.part import PartInventory
from decimal import Decimal

# Checklist items as parts with their details
CHECKLIST_PARTS = [
    {
        "part_code": "ENG-OIL-001",
        "part_name": "Engine Oil",
        "description": "Engine oil for vehicle maintenance",
        "category": "Fluids",
        "unit_price": Decimal("500.00"),
        "cost_price": Decimal("350.00"),
        "stock_quantity": 50,
        "min_stock_level": 10,
    },
    {
        "part_code": "OIL-FIL-001",
        "part_name": "Oil Filter",
        "description": "Engine oil filter replacement",
        "category": "Filters",
        "unit_price": Decimal("200.00"),
        "cost_price": Decimal("120.00"),
        "stock_quantity": 30,
        "min_stock_level": 5,
    },
    {
        "part_code": "AIR-FIL-001",
        "part_name": "Air Filter",
        "description": "Engine air filter replacement",
        "category": "Filters",
        "unit_price": Decimal("150.00"),
        "cost_price": Decimal("80.00"),
        "stock_quantity": 25,
        "min_stock_level": 5,
    },
    {
        "part_code": "SPK-PLG-001",
        "part_name": "Spark Plugs",
        "description": "Spark plugs set for engine",
        "category": "Engine",
        "unit_price": Decimal("800.00"),
        "cost_price": Decimal("500.00"),
        "stock_quantity": 20,
        "min_stock_level": 5,
    },
    {
        "part_code": "THR-CLN-001",
        "part_name": "Throttle Body Cleaning",
        "description": "Throttle body cleaning service",
        "category": "Engine",
        "unit_price": Decimal("300.00"),
        "cost_price": Decimal("150.00"),
        "stock_quantity": 999,
        "min_stock_level": 0,
    },
    {
        "part_code": "BRK-PAD-001",
        "part_name": "Brake Pads",
        "description": "Front brake pads set",
        "category": "Brakes",
        "unit_price": Decimal("1200.00"),
        "cost_price": Decimal("800.00"),
        "stock_quantity": 15,
        "min_stock_level": 5,
    },
    {
        "part_code": "BRK-PAD-002",
        "part_name": "Brake Pads Rear",
        "description": "Rear brake pads set",
        "category": "Brakes",
        "unit_price": Decimal("1000.00"),
        "cost_price": Decimal("650.00"),
        "stock_quantity": 15,
        "min_stock_level": 5,
    },
    {
        "part_code": "COOL-001",
        "part_name": "Coolant",
        "description": "Engine coolant/antifreeze",
        "category": "Fluids",
        "unit_price": Decimal("400.00"),
        "cost_price": Decimal("250.00"),
        "stock_quantity": 40,
        "min_stock_level": 10,
    },
    {
        "part_code": "AGS-OIL-001",
        "part_name": "AGS Oil",
        "description": "Automatic transmission fluid",
        "category": "Fluids",
        "unit_price": Decimal("600.00"),
        "cost_price": Decimal("400.00"),
        "stock_quantity": 30,
        "min_stock_level": 5,
    },
    {
        "part_code": "GEAR-OIL-001",
        "part_name": "Gear Oil",
        "description": "Manual transmission oil",
        "category": "Fluids",
        "unit_price": Decimal("500.00"),
        "cost_price": Decimal("320.00"),
        "stock_quantity": 25,
        "min_stock_level": 5,
    },
    {
        "part_code": "CV-GRS-001",
        "part_name": "CV Joint Grease",
        "description": "CV joint grease and service",
        "category": "Other",  # Changed from "Suspension" - not in ENUM
        "unit_price": Decimal("400.00"),
        "cost_price": Decimal("200.00"),
        "stock_quantity": 20,
        "min_stock_level": 5,
    },
    {
        "part_code": "FUEL-PMP-001",
        "part_name": "Fuel Pump",
        "description": "Fuel pump replacement",
        "category": "Engine",
        "unit_price": Decimal("2500.00"),
        "cost_price": Decimal("1800.00"),
        "stock_quantity": 10,
        "min_stock_level": 3,
    },
    {
        "part_code": "ELEC-001",
        "part_name": "Electrical Components",
        "description": "Various electrical components and wiring",
        "category": "Electrical",
        "unit_price": Decimal("500.00"),
        "cost_price": Decimal("300.00"),
        "stock_quantity": 50,
        "min_stock_level": 10,
    },
    {
        "part_code": "DIAG-001",
        "part_name": "Computer Diagnosis",
        "description": "ECU scan and diagnostic service",
        "category": "Other",
        "unit_price": Decimal("500.00"),
        "cost_price": Decimal("200.00"),
        "stock_quantity": 999,
        "min_stock_level": 0,
    },
]

def seed_checklist_parts():
    """Add parts for all checklist items"""
    db = SessionLocal()
    try:
        created_count = 0
        updated_count = 0
        error_count = 0
        
        # Valid categories from ENUM: 'Engine', 'Brakes', 'Filters', 'Electrical', 'Tires', 'Fluids', 'Other'
        valid_categories = ['Engine', 'Brakes', 'Filters', 'Electrical', 'Tires', 'Fluids', 'Other']
        
        for part_data in CHECKLIST_PARTS:
            try:
                # Validate category
                if part_data["category"] not in valid_categories:
                    print(f"  ⚠ Skipping {part_data['part_name']}: Invalid category '{part_data['category']}'")
                    print(f"     Using 'Other' instead")
                    part_data["category"] = "Other"
                
                # Check if part already exists
                existing = db.query(PartInventory).filter(
                    PartInventory.part_code == part_data["part_code"]
                ).first()
                
                if existing:
                    # Update existing part to ensure it's active
                    existing.is_active = True
                    if existing.category != part_data["category"]:
                        existing.category = part_data["category"]
                    updated_count += 1
                    print(f"  ✓ Updated: {part_data['part_name']}")
                else:
                    # Create new part one at a time
                    part = PartInventory(
                        part_code=part_data["part_code"],
                        part_name=part_data["part_name"],
                        description=part_data["description"],
                        category=part_data["category"],
                        unit_price=part_data["unit_price"],
                        cost_price=part_data["cost_price"],
                        stock_quantity=part_data["stock_quantity"],
                        min_stock_level=part_data["min_stock_level"],
                        is_active=True
                    )
                    db.add(part)
                    db.flush()  # Flush to get any immediate errors
                    created_count += 1
                    print(f"  ✓ Created: {part_data['part_name']}")
            except Exception as e:
                error_count += 1
                print(f"  ❌ Error creating {part_data['part_name']}: {e}")
                db.rollback()
                continue
        
        db.commit()
        print(f"\n✅ Successfully seeded parts!")
        print(f"   Created: {created_count} parts")
        print(f"   Updated: {updated_count} parts")
        if error_count > 0:
            print(f"   Errors: {error_count} parts")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting checklist parts seeding...")
    print("Adding parts for all checklist items...\n")
    seed_checklist_parts()
    print("\nDone!")

