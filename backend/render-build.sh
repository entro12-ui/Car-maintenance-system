#!/bin/bash
# Build script for Render deployment

set -e  # Exit on error

echo "🚀 Starting Render build process..."
echo "Python version: $(python3 --version)"

# Set CARGO_HOME and RUSTUP_HOME to writable locations BEFORE any cargo/maturin calls
export CARGO_HOME=/tmp/.cargo
export RUSTUP_HOME=/tmp/.rustup
export PATH="/tmp/.cargo/bin:$PATH"

# Create directories if they don't exist
mkdir -p "$CARGO_HOME" "$RUSTUP_HOME"

# Navigate to backend directory
cd "$(dirname "$0")"

echo "📦 Installing Python dependencies..."
pip install --upgrade pip setuptools wheel

# Install dependencies - cargo should now use /tmp/.cargo
pip install -r requirements.txt

echo "✅ Build complete!"

# Note: Database initialization is already done, so we don't run init-db.py here
# The database tables are already created on your Render database
