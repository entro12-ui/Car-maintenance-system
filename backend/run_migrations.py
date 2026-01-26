#!/usr/bin/env python3
"""
Script to run database migrations using DATABASE_URL from .env file
Usage: python3 run_migrations.py
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def load_env():
    """Load environment variables from .env file"""
    env_path = Path(__file__).parent / '.env'
    if not env_path.exists():
        print("❌ Error: .env file not found!")
        print("Please create a .env file with DATABASE_URL")
        sys.exit(1)
    
    load_dotenv(env_path)
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ Error: DATABASE_URL not found in .env file!")
        sys.exit(1)
    
    return database_url

def run_migration(conn, migration_file):
    """Run a single migration file"""
    migration_path = Path(__file__).parent / migration_file
    
    if not migration_path.exists():
        print(f"⚠️  Migration file not found: {migration_file} (skipping)")
        return False
    
    try:
        print(f"📄 Running: {migration_file}")
        
        with open(migration_path, 'r') as f:
            sql = f.read()
        
        cursor = conn.cursor()
        
        # Execute the entire SQL file
        # PostgreSQL allows multiple statements separated by semicolons
        cursor.execute(sql)
        cursor.close()
        
        print(f"✅ Successfully applied: {migration_file}")
        return True
    except Exception as e:
        print(f"❌ Error applying {migration_file}: {e}")
        conn.rollback()
        return False

def main():
    """Main function to run all migrations"""
    print("🚀 Starting database migrations...")
    print("")
    
    # Load DATABASE_URL from .env
    database_url = load_env()
    print("✅ Found DATABASE_URL")
    print("")
    
    # Migration files in order
    migrations = [
        "database/migration_add_proformas.sql",
        "database/migration_add_market_prices.sql",
        "database/migration_add_item_type.sql",
        "database/migration_make_customer_optional.sql",
        "database/migration_fix_proforma_cascade.sql",
        "database/migration_add_org_customer_car.sql",
    ]
    
    # Connect to database
    try:
        conn = psycopg2.connect(database_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        print("✅ Connected to database")
        print("")
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        sys.exit(1)
    
    # Run each migration
    success_count = 0
    for migration in migrations:
        if run_migration(conn, migration):
            success_count += 1
        print("")
    
    conn.close()
    
    print("=" * 60)
    print(f"✅ Migrations completed! ({success_count}/{len(migrations)} successful)")
    print("=" * 60)

if __name__ == "__main__":
    main()
