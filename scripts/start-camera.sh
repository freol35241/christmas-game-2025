#!/bin/bash
# Start the Python camera service

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "📷 Starting camera service..."
echo ""
echo "Note: Camera access from devcontainer may require additional setup."
echo "      For testing without a camera, use --no-preview flag."
echo ""

cd "$PROJECT_DIR/camera_service"

# Check if running in demo mode
if [ "$1" == "--demo" ]; then
    echo "Running in demo mode (no camera)..."
    python main.py --no-preview "$@"
else
    python main.py "$@"
fi
