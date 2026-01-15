#!/bin/bash
# Build script for Render deployment

set -e  # Exit on error

echo "🚀 Starting Render build process..."

# Navigate to backend directory
cd "$(dirname "$0")"

echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Build complete!"

# Note: Database initialization is already done, so we don't run init-db.py here
# The database tables are already created on your Render database
