#!/bin/bash
# Export the Godot project for tablet (HTML5/Web)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "📱 Exporting tablet build (HTML5)..."

# Create export directory
mkdir -p "$PROJECT_DIR/export/web"

# Export using Godot headless
godot --headless --path "$PROJECT_DIR/godot" --export-release "Web - Tablet" "$PROJECT_DIR/export/web/index.html"

echo ""
echo "✅ Export complete!"
echo "   Files in: $PROJECT_DIR/export/web/"
echo ""
echo "To serve the tablet build:"
echo "   cd $PROJECT_DIR/export/web && python -m http.server 8000"
echo ""
echo "Or if nginx is configured:"
echo "   Access at: http://localhost:8000"
echo ""
