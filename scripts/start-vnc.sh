#!/bin/bash
# Start VNC server for Godot display

set -e

echo "🖥️  Starting VNC display server..."

# Start Xvfb if not running
if ! pgrep -x "Xvfb" > /dev/null; then
    echo "Starting Xvfb..."
    Xvfb :1 -screen 0 1920x1080x24 &
    sleep 2
fi

# Start window manager
if ! pgrep -x "fluxbox" > /dev/null; then
    echo "Starting fluxbox window manager..."
    DISPLAY=:1 fluxbox &
    sleep 1
fi

# Start VNC server
if ! pgrep -x "x11vnc" > /dev/null; then
    echo "Starting x11vnc..."
    x11vnc -display :1 -forever -shared -rfbport 5901 -bg -o /tmp/x11vnc.log
fi

# Start noVNC
if ! pgrep -f "websockify" > /dev/null; then
    echo "Starting noVNC..."
    websockify --web=/usr/share/novnc 6080 localhost:5901 &
fi

echo ""
echo "✅ VNC server ready!"
echo "   Open in browser: http://localhost:6080/vnc.html"
echo ""
