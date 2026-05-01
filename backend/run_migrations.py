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


def table_exists(conn, table_name: str) -> bool:
    """Return True if a table exists in the current database."""
    with conn.cursor() as cursor:
        cursor.execute("SELECT to_regclass(%s)", (f"public.{table_name}",))
        return cursor.fetchone()[0] is not None


def bootstrap_base_schema(database_url: str) -> bool:
    """Ensure core tables exist for a fresh database.

    Uses SQLAlchemy models to create missing tables. This avoids running into
    ordering issues where later SQL migrations assume core tables already exist.
    """
    try:
        print("🧱 Bootstrapping base schema (SQLAlchemy create_all)...")

        # Ensure SQLAlchemy sees the same URL as this script
        os.environ["DATABASE_URL"] = database_url

        # Import models to register tables on Base.metadata
        from app.database import Base, engine  # noqa: WPS433
        import app.models  # noqa: F401, WPS433

        Base.metadata.create_all(bind=engine)
        print("✅ Base schema ensured")
        return True
    except Exception as e:
        print(f"❌ Error bootstrapping base schema: {e}")
        return False

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

    # Ensure anything importing app.database sees the same DB URL
    os.environ["DATABASE_URL"] = database_url
    
    # Migration files in order
    configured_migrations = [
        "database/migration_add_proformas.sql",
        "database/migration_add_market_prices.sql",
        "database/migration_add_item_type.sql",
        "database/migration_make_customer_optional.sql",
        "database/migration_fix_proforma_cascade.sql",
        "database/migration_add_org_customer_car.sql",
        "database/migration_add_job_orders.sql",
        "database/migration_add_job_order_block_deliver_qc.sql",
        "database/migration_add_job_order_item_issues_and_returns.sql",
        "database/migration_add_job_order_customer_notifications.sql",
        "database/migration_add_job_order_notice_types.sql",
        "database/migration_add_job_order_pairings.sql",
        "database/migration_add_job_order_vrv.sql",
        "database/migration_add_job_order_labor_charges.sql",
        "database/migration_add_job_order_additional_charges.sql",
        "database/migration_add_job_order_sublet_orders.sql",
        "database/migration_add_garage_invoices.sql",
        "database/migration_add_fuel_charge_odometer_km.sql",
    ]

    # Only run migrations that exist on disk (keeps output clean and avoids
    # confusion when optional/legacy migrations are not present in a checkout).
    migrations = [
        m
        for m in configured_migrations
        if (Path(__file__).parent / m).exists()
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

    # If this is a fresh DB, create core tables first so migrations that add
    # FK constraints don't fail on missing referenced tables.
    if not table_exists(conn, "customers") or not table_exists(conn, "vehicles"):
        if not bootstrap_base_schema(database_url):
            print("❌ Cannot continue without base schema")
            sys.exit(1)
        print("")

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
