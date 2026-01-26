#!/usr/bin/env python3
"""
Script to seed default loyalty program
Usage: python3 seed_loyalty_program.py
"""
import sys
import os
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.loyalty import LoyaltyProgram

def seed_loyalty_program():
    """Seed default loyalty program"""
    db: Session = SessionLocal()
    
    try:
        # Check if any active program exists
        existing = db.query(LoyaltyProgram).filter(LoyaltyProgram.is_active == True).first()
        if existing:
            print(f"✅ Active loyalty program already exists: {existing.program_name} (ID: {existing.program_id})")
            return True
        
        # Check if program exists but is inactive
        inactive_program = db.query(LoyaltyProgram).filter(
            LoyaltyProgram.program_name == "Pay 3 Get 4th Free"
        ).first()
        
        if inactive_program:
            # Activate existing program
            inactive_program.is_active = True
            db.commit()
            db.refresh(inactive_program)
            print(f"✅ Activated existing loyalty program: {inactive_program.program_name} (ID: {inactive_program.program_id})")
            print(f"   Services Required: {inactive_program.services_required}")
            print(f"   Free Labor Hours: {inactive_program.free_labor_hours}")
            print(f"   Valid Days: {inactive_program.valid_days}")
            return True
        
        # Create default loyalty program
        program = LoyaltyProgram(
            program_name="Pay 3 Get 4th Free",
            services_required=3,
            free_labor_hours=3.00,
            free_parts_discount=0.00,
            valid_days=365,
            is_active=True
        )
        
        db.add(program)
        db.commit()
        db.refresh(program)
        
        print(f"✅ Created default loyalty program: {program.program_name} (ID: {program.program_id})")
        print(f"   Services Required: {program.services_required}")
        print(f"   Free Labor Hours: {program.free_labor_hours}")
        print(f"   Valid Days: {program.valid_days}")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding loyalty program: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("="*60)
    print("Seeding Default Loyalty Program")
    print("="*60)
    
    success = seed_loyalty_program()
    
    if success:
        print("\n" + "="*60)
        print("✅ LOYALTY PROGRAM SEEDING COMPLETE!")
        print("="*60 + "\n")
        sys.exit(0)
    else:
        print("\n" + "="*60)
        print("❌ LOYALTY PROGRAM SEEDING FAILED!")
        print("="*60 + "\n")
        sys.exit(1)
