#!/bin/bash

echo "🗄️  Setting up PostgreSQL database for Car Service Management"
echo "=============================================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed!"
    echo "   Install it with: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

# Check if PostgreSQL is running
if ! sudo systemctl is-active --quiet postgresql; then
    echo "⚠️  PostgreSQL is not running. Starting it..."
    sudo systemctl start postgresql
    sleep 2
fi

echo "✅ PostgreSQL is running"
echo ""

# Get database credentials from .env or use defaults
if [ -f ".env" ]; then
    source .env
    DB_USER=$(echo $DATABASE_URL | grep -oP 'postgresql://\K[^:]+' || echo "postgres")
    DB_PASS=$(echo $DATABASE_URL | grep -oP 'postgresql://[^:]+:\K[^@]+' || echo "postgres")
    DB_NAME=$(echo $DATABASE_URL | grep -oP 'postgresql://[^/]+/\K[^?]+' || echo "car_service_db")
else
    DB_USER="postgres"
    DB_PASS="postgres"
    DB_NAME="car_service_db"
fi

echo "Database configuration:"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# Create database if it doesn't exist
echo "📦 Creating database..."
sudo -u postgres psql << EOF 2>/dev/null
SELECT 1 FROM pg_database WHERE datname = '$DB_NAME';
\gexec
EOF

if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "✅ Database '$DB_NAME' already exists"
else
    echo "Creating database '$DB_NAME'..."
    sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
EOF
    if [ $? -eq 0 ]; then
        echo "✅ Database created successfully"
    else
        echo "❌ Failed to create database"
        exit 1
    fi
fi

# Set password for postgres user if needed
echo ""
echo "🔐 Setting up user permissions..."
sudo -u postgres psql << EOF
ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';
ALTER USER $DB_USER WITH SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF

# Run schema
echo ""
echo "📋 Running database schema..."
if [ -f "database/schema.sql" ]; then
    sudo -u postgres psql -d $DB_NAME -f database/schema.sql
    if [ $? -eq 0 ]; then
        echo "✅ Schema loaded successfully"
    else
        echo "⚠️  Schema loading had some issues, but continuing..."
    fi
else
    echo "⚠️  Schema file not found at database/schema.sql"
fi

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Test connection with:"
echo "  python3 check_db.py"
echo ""

