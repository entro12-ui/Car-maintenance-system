#!/bin/bash
# Start script for Render deployment

set -e  # Exit on error

echo "🚀 Starting application..."
echo "Current directory: $(pwd)"
echo "Python version: $(python3 --version || python --version)"

# Navigate to backend directory (script is in backend/)
cd "$(dirname "$0")" || cd backend || pwd
echo "Working directory: $(pwd)"

# Check if PORT is set (Render provides this automatically)
if [ -z "$PORT" ]; then
    echo "⚠️  Warning: PORT environment variable not set, defaulting to 8000"
    export PORT=8000
else
    echo "✅ PORT environment variable: $PORT"
fi

# Verify we can see the app
if [ ! -f "app/main.py" ]; then
    echo "❌ Error: app/main.py not found in $(pwd)"
    ls -la
    exit 1
fi

echo "📡 Starting uvicorn on 0.0.0.0:$PORT"

# Start uvicorn with explicit host and port binding
# Use python -m uvicorn for better reliability
# Use 'exec' to replace shell process and keep container alive
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --workers 1 --log-level info
