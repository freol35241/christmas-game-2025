extends Node
## Constants and configuration for Tomtens Försvunna Minnen

# WebSocket configuration
const WS_PORT: int = 8765
const WS_CAMERA_PORT: int = 8766

# Color palettes
class Colors:
	# Exterior/Night colors
	const NIGHT_DEEP_BLUE := Color("#1a1a2e")
	const NIGHT_NAVY := Color("#16213e")
	const STAR_WHITE := Color("#ffffff")

	# Interior/Warm colors
	const WARM_AMBER := Color("#ffb347")
	const WARM_DEEP_ORANGE := Color("#ff8c00")
	const WARM_BROWN := Color("#8b4513")

	# Snow colors
	const SNOW_BLUE_WHITE := Color("#e8f4f8")
	const SNOW_SOFT_GRAY := Color("#d0d0d0")

	# Tomten colors
	const TOMTEN_RED := Color("#8b0000")
	const TOMTEN_HIGHLIGHT := Color("#c41e3a")

	# UI colors
	const SUCCESS_GREEN := Color("#4a7c4e")
	const ERROR_RED := Color("#8b3a3a")
	const HIGHLIGHT_GOLD := Color("#ffd700")

# Memory identifiers
enum Memory {
	TOMTEGROETEN = 1,  # The Christmas Porridge
	LUCIA = 2,          # The Lucia Procession
	JULGRANEN = 3,      # The Christmas Tree
	RENARNA = 4,        # The Reindeer
	SLADEN = 5,         # The Sleigh
	JULKLAPPARNA = 6,   # The Christmas Presents
	JULSTJARNAN = 7     # The Christmas Star
}

# Game states
enum GameState {
	INIT,
	INTRO,
	MEMORY_INTRO,
	MEMORY_KIDS,
	MEMORY_ADULTS,
	MEMORY_TOGETHER,
	MEMORY_PHYSICAL,
	MEMORY_RESOLUTION,
	ENDING
}

# Puzzle layer types
enum PuzzleLayer {
	KIDS,
	ADULTS,
	TOGETHER
}

# Physical challenge types
enum ChallengeType {
	STIRRING,
	LUCIA_PROCESSION,
	TREE_SHAPE,
	ANTLERS,
	SLEIGH_RIDE,
	RED_OBJECT,
	STAR_SHAPE
}

# WebSocket message types
class MessageTypes:
	# Laptop -> Tablet
	const SHOW_PUZZLE := "show_puzzle"
	const STATE_CHANGE := "state_change"
	const SHOW_WAITING := "show_waiting"

	# Tablet -> Laptop
	const PUZZLE_COMPLETE := "puzzle_complete"
	const TABLET_READY := "tablet_ready"

	# Camera -> Laptop
	const DETECTION_UPDATE := "detection_update"
	const CHALLENGE_COMPLETE := "challenge_complete"

	# Laptop -> Camera
	const START_DETECTION := "start_detection"
	const STOP_DETECTION := "stop_detection"

# Puzzle configuration
const MAX_PHYSICAL_ATTEMPTS := 3
const HINT_DELAY_SECONDS := 60.0

# Animation durations
const FADE_DURATION := 0.5
const TRANSITION_DURATION := 1.0

# Memory 1 - Tomtegröten puzzle data
const MEMORY_1_INGREDIENTS := {
	"correct": ["ris", "mjolk", "socker"],
	"optional": ["kanel"],
	"incorrect": ["salt", "mjol"]
}

const MEMORY_1_CIPHER_ANSWER := "SKAPET"
const MEMORY_1_HIDING_SPOTS := ["cupboard", "drawer", "under_table", "behind_curtain", "in_pot"]
const MEMORY_1_CORRECT_SPOT := "cupboard"
