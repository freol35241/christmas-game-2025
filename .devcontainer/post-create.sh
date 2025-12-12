#!/bin/bash
set -e

echo "🎄 Setting up Tomtens Försvunna Minnen development environment..."

# Install Python dependencies for camera service
echo "📦 Installing Python dependencies..."
cd /workspace/camera_service
pip install --user -r requirements.txt

# Create export directory for tablet build
echo "📁 Creating export directories..."
mkdir -p /workspace/export/web

# Import Godot project to generate .godot folder
echo "🎮 Importing Godot project..."
timeout 30 /usr/local/bin/godot --headless --path /workspace/godot --import || true

# Set up Godot editor settings
mkdir -p /home/vscode/.config/godot
cat > /home/vscode/.config/godot/editor_settings-4.tres << 'EOF'
[gd_resource type="EditorSettings" format=3]

[resource]
interface/editor/display_scale = 1
run/window_placement/rect = 0
EOF

# Set permissions
chown -R vscode:vscode /home/vscode/.config/godot
chown -R vscode:vscode /home/vscode/.local/share/godot

echo "✅ Setup complete!"
echo ""
echo "📋 Quick Start:"
echo "  1. Start VNC: ./scripts/start-vnc.sh"
echo "  2. Open noVNC in browser: http://localhost:6080"
echo "  3. Run Godot: godot --path godot"
echo "  4. Export tablet: ./scripts/export-tablet.sh"
echo "  5. Start camera service: ./scripts/start-camera.sh"
echo ""
