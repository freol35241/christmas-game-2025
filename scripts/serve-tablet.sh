#!/bin/bash
# Serve the tablet build with proper CORS headers for Godot HTML5

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
EXPORT_DIR="$PROJECT_DIR/export/web"

PORT=${1:-8000}

if [ ! -f "$EXPORT_DIR/index.html" ]; then
    echo "❌ Tablet build not found!"
    echo "   Run ./scripts/export-tablet.sh first."
    exit 1
fi

echo "📱 Serving tablet build at http://localhost:$PORT"
echo "   (Press Ctrl+C to stop)"
echo ""

cd "$EXPORT_DIR"

# Use Python with custom headers for SharedArrayBuffer support
python3 << EOF
import http.server
import socketserver

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Required for Godot HTML5 (SharedArrayBuffer)
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.wasm'):
            return 'application/wasm'
        if path.endswith('.pck'):
            return 'application/octet-stream'
        return super().guess_type(path)

PORT = $PORT
with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
    print(f"Serving on port {PORT}")
    httpd.serve_forever()
EOF
