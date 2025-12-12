# Tomtens Försvunna Minnen

**The Tomte's Lost Memories** - A collaborative family puzzle game for Christmas.

An old Swedish tomte (Christmas gnome) has lost his memories and can't remember how to celebrate Christmas. The family must help him recover 7 memories by solving collaborative puzzles together.

## Quick Start

See [docs/setup.md](docs/setup.md) for detailed setup instructions.

### Requirements
- Godot Engine 4.2+
- Python 3.10+
- Webcam
- Tablet with web browser
- TV/monitor

### Running
1. Open the `godot/` project in Godot and run (F5)
2. Start the camera service: `cd camera_service && python main.py`
3. Open the tablet browser and connect to the displayed WebSocket URL

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

### In Progress
- [ ] Memories 2-7 puzzle implementations
- [ ] Swedish text localization
- [ ] Sound effects and music
- [ ] More polished animations

## License

A Christmas family game project.
