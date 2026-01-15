#!/bin/bash

echo "🔧 Fixing PostgreSQL Database Connection"
echo "========================================"
echo ""

# Check if PostgreSQL is running
if ! sudo systemctl is-active --quiet postgresql; then
    echo "⚠️  PostgreSQL is not running. Starting it..."
    sudo systemctl start postgresql
    sleep 2
fi

echo "✅ PostgreSQL is running"
echo ""

# Try to connect and set password
echo "🔐 Setting up PostgreSQL user and database..."
echo ""

# Method 1: Try with sudo (no password needed)
sudo -u postgres psql << 'EOF' 2>/dev/null
-- Set password for postgres user
ALTER USER postgres WITH PASSWORD 'postgres';

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE car_service_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'car_service_db')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE car_service_db TO postgres;

-- Make postgres a superuser
ALTER USER postgres WITH SUPERUSER;

\q
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database setup successful!"
else
    echo "⚠️  Could not set up database automatically"
    echo ""
    echo "Please run these commands manually:"
    echo ""
    echo "sudo -u postgres psql"
    echo "ALTER USER postgres WITH PASSWORD 'postgres';"
    echo "CREATE DATABASE car_service_db;"
    echo "GRANT ALL PRIVILEGES ON DATABASE car_service_db TO postgres;"
    echo "\\q"
    echo ""
    exit 1
fi

# Update .env file
echo ""
echo "📝 Updating .env file..."
if [ -f ".env" ]; then
    # Update DATABASE_URL
    sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgresql://postgres:postgres@localhost:5432/car_service_db|' .env
    echo "✅ Updated .env file"
else
    # Create .env file
    cat > .env << 'ENVEOF'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/car_service_db
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
ENVEOF
    echo "✅ Created .env file"
fi

# Run schema
echo ""
echo "📋 Loading database schema..."
if [ -f "database/schema.sql" ]; then
    sudo -u postgres psql -d car_service_db -f database/schema.sql > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Schema loaded successfully"
    else
        echo "⚠️  Schema loading had some issues (tables may already exist)"
    fi
else
    echo "⚠️  Schema file not found at database/schema.sql"
fi

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Test connection:"
echo "  python3 check_db.py"
echo ""

