#!/bin/bash

echo "🔧 Create Admin User"
echo "===================="
echo ""

# Check if email and password provided
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./create_admin_user.sh <email> <password> [first_name] [last_name]"
    echo ""
    echo "Example:"
    echo "  ./create_admin_user.sh admin@carservice.com password123"
    echo "  ./create_admin_user.sh admin@carservice.com password123 John Admin"
    echo ""
    exit 1
fi

EMAIL=$1
PASSWORD=$2
FIRST_NAME=${3:-"Admin"}
LAST_NAME=${4:-"User"}

echo "Creating admin user..."
echo "Email: $EMAIL"
echo "Name: $FIRST_NAME $LAST_NAME"
echo ""

cd backend
source venv/bin/activate
python3 create_admin.py "$EMAIL" "$PASSWORD" "$FIRST_NAME" "$LAST_NAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Admin user created successfully!"
    echo ""
    echo "You can now login at: http://localhost:3000/login"
    echo "Email: $EMAIL"
    echo "Password: $PASSWORD"
else
    echo ""
    echo "❌ Failed to create admin user"
    exit 1
fi

