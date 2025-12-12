#!/bin/bash

echo "🚀 Starting development services..."

# Start Xvfb (virtual framebuffer)
if ! pgrep -x "Xvfb" > /dev/null; then
    echo "Starting Xvfb..."
    Xvfb :1 -screen 0 1920x1080x24 &
    sleep 2
fi

# Start fluxbox window manager
if ! pgrep -x "fluxbox" > /dev/null; then
    echo "Starting fluxbox..."
    DISPLAY=:1 fluxbox &
    sleep 1
fi

# Start x11vnc
if ! pgrep -x "x11vnc" > /dev/null; then
    echo "Starting x11vnc..."
    x11vnc -display :1 -forever -shared -rfbport 5901 -bg -o /tmp/x11vnc.log
    sleep 1
fi

# Start noVNC (web-based VNC client)
if ! pgrep -f "websockify" > /dev/null; then
    echo "Starting noVNC..."
    websockify --web=/usr/share/novnc 6080 localhost:5901 &
    sleep 1
fi

# Start nginx for tablet serving (if export exists)
if [ -d "/workspace/export/web" ]; then
    echo "Starting nginx..."
    sudo nginx -g "daemon off;" &
fi

echo ""
echo "✅ Services started!"
echo ""
echo "🖥️  Access Godot via noVNC: http://localhost:6080/vnc.html"
echo "📱 Tablet build served at: http://localhost:8000"
echo "🔌 WebSocket server port: 8765"
echo ""
