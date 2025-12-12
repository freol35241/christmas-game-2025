# Tomtens Försvunna Minnen

**The Tomte's Lost Memories** - A collaborative family puzzle game for Christmas.

An old Swedish tomte (Christmas gnome) has lost his memories and can't remember how to celebrate Christmas. The family must help him recover 7 memories by solving collaborative puzzles together.

## Quick Start

### Option 1: DevContainer (Recommended)

The easiest way to get started is using VS Code with the DevContainer:

1. Install [VS Code](https://code.visualstudio.com/) and [Docker](https://www.docker.com/)
2. Install the "Dev Containers" VS Code extension
3. Open this folder in VS Code
4. Click "Reopen in Container" when prompted
5. Wait for the container to build (~5 minutes first time)
6. Run: `./scripts/start-all.sh`
7. Open http://localhost:6080/vnc.html to see Godot
8. Run `./scripts/run-game.sh` to start the game

### Option 2: Docker Compose

```bash
docker compose up
# Open http://localhost:6080/vnc.html
# In another terminal: docker compose exec godot ./scripts/run-game.sh
```

### Option 3: Local Installation

See [docs/setup.md](docs/setup.md) for detailed local setup instructions.

#### Requirements
- Godot Engine 4.2+
- Python 3.10+
- Webcam
- Tablet with web browser
- TV/monitor

#### Running Locally
1. Open the `godot/` project in Godot and run (F5)
2. Start the camera service: `cd camera_service && python main.py`
3. Export tablet and serve: `./scripts/export-tablet.sh && ./scripts/serve-tablet.sh`
4. Open the tablet browser and connect to the displayed WebSocket URL

## Game Overview

- **Players**: Family with kids and adults playing together
- **Platform**: TV display (Godot) + shared tablet (HTML5) + webcam (Python)
- **Language**: Swedish (placeholder text for now)
- **Tone**: 70% cozy, 30% silly

### The 7 Memories

1. **Tomtegröten** - The Christmas Porridge
2. **Lucia** - The Lucia Procession
3. **Julgranen** - The Christmas Tree
4. **Renarna** - The Reindeer
5. **Släden** - The Sleigh
6. **Julklapparna** - The Christmas Presents
7. **Julstjärnan** - The Christmas Star

Each memory follows the same flow:
1. TV: Intro (what's wrong)
2. Tablet: Kids puzzle
3. Tablet: Adults puzzle
4. Tablet: Together puzzle
5. TV: Physical challenge (camera)
6. TV: Resolution (memory restored)

## Project Status

### MVP Complete ✓
- [x] Project structure
- [x] WebSocket communication (TV ↔ Tablet ↔ Camera)
- [x] Game state machine
- [x] Memory 1 fully playable (all layers + physical)
- [x] Basic silhouette graphics
- [x] Python camera service with pose + color detection
- [x] Auto-pass after failed attempts
- [x] DevContainer setup for easy development
- [x] Docker Compose support

### In Progress
- [ ] Memories 2-7 puzzle implementations
- [ ] Swedish text localization
- [ ] Sound effects and music
- [ ] More polished animations

## License

A Christmas family game project.
