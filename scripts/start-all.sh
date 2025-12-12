#!/bin/bash
# Start all services for Tomtens Försvunna Minnen

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🎄 Starting Tomtens Försvunna Minnen - Full Stack"
echo ""

# Start VNC
echo "1️⃣  Starting VNC display server..."
"$SCRIPT_DIR/start-vnc.sh"

# Export tablet build if needed
if [ ! -f "$SCRIPT_DIR/../export/web/index.html" ]; then
    echo "2️⃣  Exporting tablet build..."
    "$SCRIPT_DIR/export-tablet.sh"
fi

# Start tablet server in background
echo "3️⃣  Starting tablet web server..."
"$SCRIPT_DIR/serve-tablet.sh" 8000 &
TABLET_PID=$!

# Give servers time to start
sleep 2

echo ""
echo "✅ All services started!"
echo ""
echo "📺 TV Display (Godot):  http://localhost:6080/vnc.html"
echo "📱 Tablet Interface:    http://localhost:8000"
echo "🔌 WebSocket Server:    ws://localhost:8765"
echo ""
echo "To run the game:"
echo "   ./scripts/run-game.sh"
echo ""
echo "To start camera service (in another terminal):"
echo "   ./scripts/start-camera.sh --demo"
echo ""
echo "Press Ctrl+C to stop tablet server."

# Wait for tablet server
wait $TABLET_PID
