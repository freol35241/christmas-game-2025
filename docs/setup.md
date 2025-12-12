# Tomtens Försvunna Minnen - Setup Guide

A collaborative family puzzle game about helping an old Swedish tomte recover his Christmas memories.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        LAPTOP                               │
│  ┌─────────────────────┐    ┌─────────────────────────┐    │
│  │   Godot Game        │    │   Python Camera Service │    │
│  │   (TV Display)      │◄──►│   - MediaPipe Pose      │    │
│  │                     │ WS │   - Color Detection     │    │
│  │   WebSocket Server  │    └─────────────────────────┘    │
│  └──────────┬──────────┘         HDMI                       │
│             │                      │                        │
│             │                      ▼                        │
│             │                ┌──────────┐                   │
│             │                │    TV    │                   │
│             │                └──────────┘                   │
└─────────────┼───────────────────────────────────────────────┘
              │ WebSocket (local network)
              ▼
       ┌─────────────┐
       │   TABLET    │
       │  (Browser)  │
       │             │
       │ Godot HTML5 │
       └─────────────┘
```

## Requirements

### Software Requirements

- **Godot Engine 4.2+** (Download from https://godotengine.org)
- **Python 3.10+**
- **Web browser** (Chrome or Safari on tablet)
- **Webcam** (for physical challenges)

### Hardware Requirements

- **Laptop** with webcam
- **TV** connected via HDMI (or second monitor)
- **Tablet** (iOS or Android) with browser
- All devices on the same local network

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tomtens-minnen
```

### 2. Set Up the Godot Project

1. Open Godot Engine 4.2+
2. Click "Import" and navigate to the `godot/` directory
3. Select `project.godot` and click "Import & Edit"
4. The project will open in the Godot editor

### 3. Set Up the Camera Service

```bash
cd camera_service

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Export the Tablet Build (HTML5)

1. In Godot, go to **Project > Export**
2. Select "Web - Tablet" preset
3. Click "Export Project"
4. Choose a location (e.g., `export/web/`)

### 5. Serve the Tablet Build

You need to serve the HTML5 export over HTTP. Options:

**Using Python:**
```bash
cd export/web
python3 -m http.server 8000
```

**Using Node.js:**
```bash
npx serve export/web
```

The tablet will connect to `http://<laptop-ip>:8000`

## Running the Game

### Step 1: Start the Godot Game (TV Display)

1. In Godot, press F5 or click the Play button
2. The game will start and display the WebSocket connection URL
3. Ensure Godot is displaying on the TV (extend or mirror display)

### Step 2: Start the Camera Service

```bash
cd camera_service
python main.py --server ws://localhost:8765
```

Options:
- `--server, -s`: WebSocket server URI (default: `ws://localhost:8765`)
- `--camera, -c`: Camera device ID (default: `0`)
- `--no-preview`: Disable camera preview window
- `--debug, -d`: Enable debug logging

### Step 3: Connect the Tablet

1. On the tablet, open the browser
2. Navigate to `http://<laptop-ip>:8000`
3. Enter the WebSocket URL shown on the TV (e.g., `ws://192.168.1.100:8765`)
4. Click "Connect"

### Step 4: Play!

- The game will advance from the intro to Memory 1
- Kids solve puzzles on the tablet
- Adults solve puzzles on the tablet
- Everyone participates in physical challenges in front of the camera

## Troubleshooting

### Tablet Won't Connect

1. Ensure laptop and tablet are on the same WiFi network
2. Check firewall settings on the laptop (allow port 8765 and 8000)
3. Try using the laptop's IP address instead of `localhost`

### Camera Not Working

1. Check if another application is using the camera
2. Try a different camera ID: `python main.py --camera 1`
3. Ensure webcam permissions are granted

### WebSocket Connection Fails

1. Verify the Godot game is running
2. Check the WebSocket URL is correct
3. Look for error messages in the Godot output panel

### Physical Challenges Not Detecting

1. Ensure good lighting in the room
2. Stand back so your full body is visible
3. The camera preview window shows detection status
4. Debug shortcuts: Press SPACE to simulate detection, P to pass

## Debug Controls (TV Display)

- **SPACE**: Advance to next game state
- **R**: Reset game to beginning
- **P**: Pass physical challenge (during physical challenge phase)

## Project Structure

```
tomtens-minnen/
├── godot/                      # Godot game project
│   ├── project.godot           # Godot project file
│   ├── export_presets.cfg      # Export configurations
│   ├── scenes/
│   │   ├── main.tscn           # Entry point
│   │   ├── tv/                 # TV display scenes
│   │   └── tablet/             # Tablet puzzle scenes
│   └── scripts/
│       ├── autoload/           # Global scripts
│       ├── tv/                 # TV controller scripts
│       └── tablet/             # Tablet controller scripts
│
├── camera_service/             # Python camera service
│   ├── main.py                 # Entry point
│   ├── websocket_client.py     # WebSocket communication
│   ├── detection/              # Detection modules
│   │   ├── pose_detector.py    # MediaPipe pose detection
│   │   ├── color_detector.py   # Color detection
│   │   └── challenges.py       # Challenge-specific logic
│   └── requirements.txt
│
└── docs/
    └── setup.md                # This file
```

## Memory 1 Walkthrough (Tomtegröten)

1. **Intro**: Tomten explains the porridge problem
2. **Kids Puzzle**: Drag correct ingredients (ris, mjölk, socker) into the bowl
3. **Adults Puzzle**: Decode the cipher "19-11-1-16-5-20" → "SKAPET" (A=1, B=2...)
4. **Together Puzzle**: Find where the tomtenissar are hiding (the cupboard)
5. **Physical Challenge**: Everyone makes stirring motions for 5 seconds
6. **Resolution**: Memory restored, tomtenissar appear happy

## Notes for Development

- Swedish text uses placeholder format: `[SWEDISH: Description]`
- All graphics are programmatic (Polygon2D, ColorRect, etc.)
- Physical challenges auto-pass after 3 failed attempts
- Game state can be advanced manually with keyboard shortcuts

## License

This project is a Christmas family game. Enjoy!
