#!/usr/bin/env python3
"""
Quick script to test database connection with different methods
"""
import os
import sys
from sqlalchemy import create_engine, text

# Try different connection strings
connection_strings = [
    "postgresql://postgres:postgres@localhost:5432/car_service_db",
    "postgresql://postgres@localhost:5432/car_service_db",  # No password (peer auth)
]

print("Testing PostgreSQL connection...\n")

for i, db_url in enumerate(connection_strings, 1):
    print(f"Attempt {i}: {db_url.split('@')[0]}@...")
    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print(f"✅ SUCCESS! Connection works with this URL")
            print(f"\nUpdate your .env file with:")
            print(f"DATABASE_URL={db_url}\n")
            sys.exit(0)
    except Exception as e:
        print(f"❌ Failed: {str(e)[:100]}\n")

print("\n❌ None of the connection methods worked.")
print("\nPlease run manually:")
print("sudo -u postgres psql")
print("ALTER USER postgres WITH PASSWORD 'postgres';")
print("CREATE DATABASE car_service_db;")
print("\\q")

