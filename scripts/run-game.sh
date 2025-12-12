#!/bin/bash
# Run the Godot game (TV display)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Ensure VNC is running
if ! pgrep -x "Xvfb" > /dev/null; then
    echo "Starting VNC first..."
    "$SCRIPT_DIR/start-vnc.sh"
    sleep 2
fi

echo "🎮 Starting Tomtens Försvunna Minnen..."
echo "   View at: http://localhost:6080/vnc.html"
echo ""

# Run Godot
DISPLAY=:1 godot --path "$PROJECT_DIR/godot" "$@"
