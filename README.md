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
5. Wait for the container to build
6. Run: `npm start`
7. Open http://localhost:3000

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or with auto-reload for development
npm run dev
```

Then open http://localhost:3000 in your browser.

### Running Tests

```bash
npm test

# Watch mode
npm test:watch
```

## How to Play

1. **Start the server** with `npm start`
2. **Open the TV display**: Navigate to http://localhost:3000?mode=tv on your TV/large screen
3. **Open the tablet**: Navigate to http://localhost:3000?mode=tablet on a tablet or phone
4. **Play together**: Follow the on-screen instructions!

### Keyboard Shortcuts (TV)

- **SPACE**: Advance to next state
- **R** (Ctrl+R): Reset game
- **P**: Skip physical challenge
- **Ctrl+D**: Toggle debug panel

## Game Overview

- **Players**: Family with kids and adults playing together
- **Platform**: TV display (browser) + shared tablet (browser) + webcam (in-browser)
- **Language**: Swedish (placeholder text format: `[SWEDISH: text]`)
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
1. 📺 TV: Intro (what's wrong with this memory)
2. 📱 Tablet: Kids puzzle (drag & drop, tap targets, or sequence)
3. 📱 Tablet: Adults puzzle (cipher decoder)
4. 📱 Tablet: Together puzzle (multiple choice discussion)
5. 📺 TV: Physical challenge (camera-based activity)
6. 📺 TV: Resolution (memory restored, celebration!)

### Puzzle Types

| Type | Description | Used By |
|------|-------------|---------|
| **Drag & Drop** | Drag items to a target area | Kids |
| **Tap Targets** | Tap targets in order (or find hidden items) | Kids |
| **Sequence** | Repeat a color sequence (Simon Says) | Kids |
| **Cipher** | Decode number-to-letter cipher (A=1, B=2...) | Adults |
| **Location Select** | Discuss and choose from options | Together |

### Physical Challenges

All 7 memories end with a fun physical challenge detected via webcam:
- 🥄 **Stirring** - Make circular motions (porridge)
- 🚶 **Walking** - Walk across the room (Lucia)
- 🌲 **Tree Shape** - Arms up like a triangle (tree)
- 🦌 **Antlers** - Hands above head like antlers (reindeer)
- 🛷 **Bobbing** - Bounce up and down (sleigh ride)
- 🔴 **Red Object** - Show something red (presents)
- ⭐ **Star Shape** - Arms and legs extended (Christmas star)

## Project Structure

```
christmas-game-2025/
├── .devcontainer/       # VS Code DevContainer config
│   └── devcontainer.json
├── server/              # Node.js backend
│   ├── index.js         # Express + WebSocket server
│   ├── game-state.js    # Game state machine
│   ├── websocket-handler.js
│   └── constants.js     # Memories, puzzles, colors
├── public/              # Frontend (served statically)
│   ├── index.html       # Entry point
│   ├── css/
│   │   ├── common.css   # Shared styles
│   │   ├── tv.css       # TV display styles
│   │   └── tablet.css   # Tablet styles
│   └── js/
│       ├── main.js      # App entry & device detection
│       ├── websocket.js # WebSocket client
│       ├── shared/      # Shared utilities
│       ├── tv/          # TV controller & scenes
│       └── tablet/      # Tablet controller & puzzles
├── tests/               # Jest tests
├── package.json
└── README.md
```

## Tech Stack

- **Backend**: Node.js, Express, ws (WebSocket)
- **Frontend**: Vanilla JavaScript, HTML5 Canvas, CSS3
- **Camera**: MediaPipe.js (in-browser pose detection)
- **Testing**: Jest

## Development

### Adding a New Puzzle

1. Create a new puzzle class in `public/js/tablet/puzzles/`
2. Add the puzzle type to `server/constants.js`
3. Register it in `public/js/tablet/tablet-controller.js`

### Modifying Memories

All memory content is defined in `server/constants.js` in the `MEMORIES` array. Each memory includes:
- Intro text
- Kids, Adults, and Together puzzles
- Physical challenge configuration
- Resolution/celebration text

## Project Status

### Complete ✓
- [x] Full web-based architecture (Node.js + vanilla JS)
- [x] WebSocket communication (TV ↔ Tablet)
- [x] Complete game state machine
- [x] All 7 memories implemented
- [x] All puzzle types (5 types)
- [x] All physical challenges (7 challenges)
- [x] TV scenes (intro, memory-intro, waiting, physical, resolution, ending)
- [x] Responsive tablet UI
- [x] DevContainer setup
- [x] Unit tests

### In Progress
- [ ] Swedish text localization (replace `[SWEDISH: ...]` placeholders)
- [ ] Full MediaPipe.js integration for physical challenges
- [ ] Sound effects and music
- [ ] Enhanced animations

## License

A Christmas family game project.
