#!/bin/bash
# Start script for Render deployment

set -e  # Exit on error

echo "🚀 Starting application..."

# Navigate to backend directory
cd "$(dirname "$0")"

# Check if PORT is set
if [ -z "$PORT" ]; then
    echo "⚠️  Warning: PORT environment variable not set, defaulting to 8000"
    export PORT=8000
fi

echo "📡 Starting uvicorn on 0.0.0.0:$PORT"

# Start uvicorn with explicit host and port binding
# Use python -m uvicorn for better reliability
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --workers 1
