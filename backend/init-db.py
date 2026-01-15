#!/usr/bin/env python3
"""
Database initialization script for Render deployment
This script creates all database tables and optionally seeds initial data
"""
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import Base, engine
from app.models import (
    Customer, Vehicle, Service, ServiceType, ServicePart, PartInventory,
    Appointment, Employee, UserAccount, CustomerLoyalty, LoyaltyProgram,
    Notification, Accountant
)

load_dotenv()

def init_database():
    """Initialize database tables"""
    try:
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
        
        # Check if we need to run schema.sql
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            print(f"Database URL: {database_url.split('@')[1] if '@' in database_url else 'configured'}")
        
        # Try to run schema.sql if it exists
        schema_file = os.path.join(os.path.dirname(__file__), "database", "schema.sql")
        if os.path.exists(schema_file):
            print("\nRunning schema.sql...")
            database_url = os.getenv("DATABASE_URL")
            
            if not database_url:
                print("⚠️  DATABASE_URL not set, skipping schema.sql")
                print("   Set DATABASE_URL and run: psql $DATABASE_URL -f database/schema.sql")
            else:
                # Use psql directly for proper handling of PostgreSQL functions/triggers
                import subprocess
                try:
                    print("  Using psql to execute schema.sql (handles functions/triggers properly)...")
                    result = subprocess.run(
                        ["psql", database_url, "-f", schema_file, "-v", "ON_ERROR_STOP=0"],
                        capture_output=True,
                        text=True,
                        timeout=120
                    )
                    
                    # Filter output - show only important messages
                    if result.stdout:
                        output_lines = result.stdout.split('\n')
                        important = [
                            line for line in output_lines
                            if line.strip() and 
                            ('CREATE' in line.upper() or 'INSERT' in line.upper() or 
                             'ERROR' in line.upper() or 'WARNING' in line.upper())
                            and 'already exists' not in line.lower()
                        ]
                        if important:
                            for line in important[:10]:  # Show first 10 important lines
                                print(f"  {line[:100]}")
                    
                    if result.returncode == 0:
                        print("✅ Schema.sql executed successfully!")
                    else:
                        # Check stderr for critical errors
                        if result.stderr:
                            critical = [
                                line for line in result.stderr.split('\n')
                                if line.strip() and 
                                'ERROR' in line.upper() and
                                'already exists' not in line.lower() and
                                'duplicate' not in line.lower()
                            ]
                            if critical:
                                print("⚠️  Some errors occurred (non-critical errors filtered):")
                                for err in critical[:5]:
                                    print(f"   {err[:100]}")
                            else:
                                print("✅ Schema.sql executed (some objects may already exist)")
                        else:
                            print("✅ Schema.sql executed successfully!")
                            
                except FileNotFoundError:
                    print("⚠️  psql not found. Schema.sql contains PostgreSQL functions/triggers")
                    print("   that require psql for proper execution.")
                    print("   Options:")
                    print("   1. Install PostgreSQL client tools: sudo apt-get install postgresql-client")
                    print("   2. Run manually: psql $DATABASE_URL -f database/schema.sql")
                    print("   3. Use Render Shell: psql $DATABASE_URL -f database/schema.sql")
                except subprocess.TimeoutExpired:
                    print("⚠️  Schema.sql execution timed out (>120s)")
                    print("   Database may be slow or schema.sql is very large")
                    print("   Try running manually: psql $DATABASE_URL -f database/schema.sql")
                except Exception as e:
                    print(f"⚠️  Could not execute schema.sql: {e}")
                    print("   Run manually: psql $DATABASE_URL -f database/schema.sql")
        
        print("\n✅ Database initialization complete!")
        return True
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)
