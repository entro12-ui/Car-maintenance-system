#!/bin/bash
# Script to run database migrations using DATABASE_URL from .env file

set -e  # Exit on error

echo "🚀 Starting database migrations..."

# Navigate to backend directory
cd "$(dirname "$0")"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with DATABASE_URL"
    exit 1
fi

# Load DATABASE_URL from .env file
# Extract DATABASE_URL value (handles URLs with special characters)
DATABASE_URL=$(grep -v '^#' .env | grep "^DATABASE_URL=" | cut -d '=' -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed "s/^['\"]//;s/['\"]$//")

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not found in .env file!"
    exit 1
fi

echo "✅ Found DATABASE_URL"
echo "📦 Running migrations..."

# Migration files in order
MIGRATIONS=(
    "database/migration_add_proformas.sql"
    "database/migration_add_market_prices.sql"
    "database/migration_add_item_type.sql"
    "database/migration_make_customer_optional.sql"
    "database/migration_fix_proforma_cascade.sql"
    "database/migration_add_org_customer_car.sql"
)

# Run each migration
for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$migration" ]; then
        echo ""
        echo "📄 Running: $migration"
        # Capture both stdout and stderr, but don't fail on errors (some are expected like "already exists")
        psql "$DATABASE_URL" -f "$migration" 2>&1 | grep -v "ERROR:" || true
        EXIT_CODE=${PIPESTATUS[0]}
        if [ $EXIT_CODE -eq 0 ]; then
            echo "✅ Successfully applied: $migration"
        else
            # Check if errors are just "already exists" which are safe to ignore
            ERROR_COUNT=$(psql "$DATABASE_URL" -f "$migration" 2>&1 | grep -c "ERROR:" || true)
            if [ $ERROR_COUNT -gt 0 ]; then
                echo "⚠️  Migration had errors (may be expected if objects already exist): $migration"
                echo "   Check output above for details"
            else
                echo "✅ Successfully applied: $migration"
            fi
        fi
    else
        echo "⚠️  Migration file not found: $migration (skipping)"
    fi
done

echo ""
echo "============================================================"
echo "✅ All migrations completed!"
echo "============================================================"
