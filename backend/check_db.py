#!/usr/bin/env python3
"""
Script to check and setup PostgreSQL database connection
"""
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/car_service_db")

def check_connection():
    """Test database connection"""
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print(f"\nConnection string: {DATABASE_URL}")
        print("\nTroubleshooting steps:")
        print("1. Check if PostgreSQL is running: sudo systemctl status postgresql")
        print("2. Verify database exists: sudo -u postgres psql -l")
        print("3. Check user password: sudo -u postgres psql -c '\\du'")
        print("4. Update DATABASE_URL in backend/.env file")
        return False

def check_database_exists():
    """Check if the database exists"""
    try:
        # Connect to postgres database to check if car_service_db exists
        db_url = DATABASE_URL.rsplit('/', 1)[0] + '/postgres'
        engine = create_engine(db_url)
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT 1 FROM pg_database WHERE datname = 'car_service_db'"
            ))
            exists = result.fetchone() is not None
            if exists:
                print("✅ Database 'car_service_db' exists")
            else:
                print("❌ Database 'car_service_db' does not exist")
                print("\nTo create it, run:")
                print("sudo -u postgres psql -c \"CREATE DATABASE car_service_db;\"")
            return exists
    except Exception as e:
        print(f"⚠️  Could not check database existence: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Checking database configuration...\n")
    
    if not check_connection():
        sys.exit(1)
    
    check_database_exists()
    print("\n✅ Database is ready!")

