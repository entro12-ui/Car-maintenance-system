#!/bin/bash

echo "Creating PostgreSQL user and database..."
echo ""

# Try to create user and database using current system user
CURRENT_USER=$(whoami)

echo "Attempting to create database as user: $CURRENT_USER"
echo ""

# Try to connect and create
psql -U postgres << EOF 2>&1
-- Create user if doesn't exist
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$CURRENT_USER') THEN
      CREATE USER $CURRENT_USER WITH PASSWORD '$CURRENT_USER';
   END IF;
END
\$\$;

-- Create database
CREATE DATABASE car_service_db OWNER $CURRENT_USER;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE car_service_db TO $CURRENT_USER;

\q
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database created successfully!"
    echo ""
    echo "Update your .env file:"
    echo "DATABASE_URL=postgresql://$CURRENT_USER:$CURRENT_USER@localhost:5432/car_service_db"
else
    echo "❌ Could not create database automatically"
    echo ""
    echo "Please run manually:"
    echo "sudo -u postgres psql"
    echo "CREATE USER $CURRENT_USER WITH PASSWORD '$CURRENT_USER';"
    echo "CREATE DATABASE car_service_db OWNER $CURRENT_USER;"
    echo "GRANT ALL PRIVILEGES ON DATABASE car_service_db TO $CURRENT_USER;"
    echo "\\q"
fi

