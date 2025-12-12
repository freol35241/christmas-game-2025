extends Node
## Global game state manager for Tomtens Försvunna Minnen
## Handles state transitions, memory tracking, and communication coordination

signal state_changed(old_state: int, new_state: int)
signal memory_changed(memory_index: int)
signal puzzle_layer_changed(layer: int)
signal memory_completed(memory_index: int)
signal all_memories_completed()

# Current game state
var current_state: int = Constants.GameState.INIT
var current_memory: int = Constants.Memory.TOMTEGROETEN
var current_puzzle_layer: int = Constants.PuzzleLayer.KIDS

# Tracking completed memories
var completed_memories: Array[int] = []

# Physical challenge tracking
var physical_attempts: int = 0
var physical_challenge_active: bool = false

# WebSocket references (set by TV/Tablet controllers)
var ws_server = null  # WebSocket server (TV side)
var ws_client = null  # WebSocket client (Tablet side)

# Mode detection
var is_tv_mode: bool = false
var is_tablet_mode: bool = false


func _ready() -> void:
	print("[GameState] Initialized")


# ============================================================
# STATE MANAGEMENT
# ============================================================

func set_state(new_state: int) -> void:
	if new_state == current_state:
		return

	var old_state := current_state
	current_state = new_state

	print("[GameState] State changed: %s -> %s" % [
		_state_to_string(old_state),
		_state_to_string(new_state)
	])

	state_changed.emit(old_state, new_state)

	# Broadcast state change via WebSocket
	_broadcast_state_change(new_state)


func get_state() -> int:
	return current_state


func _state_to_string(state: int) -> String:
	match state:
		Constants.GameState.INIT: return "INIT"
		Constants.GameState.INTRO: return "INTRO"
		Constants.GameState.MEMORY_INTRO: return "MEMORY_INTRO"
		Constants.GameState.MEMORY_KIDS: return "MEMORY_KIDS"
		Constants.GameState.MEMORY_ADULTS: return "MEMORY_ADULTS"
		Constants.GameState.MEMORY_TOGETHER: return "MEMORY_TOGETHER"
		Constants.GameState.MEMORY_PHYSICAL: return "MEMORY_PHYSICAL"
		Constants.GameState.MEMORY_RESOLUTION: return "MEMORY_RESOLUTION"
		Constants.GameState.ENDING: return "ENDING"
		_: return "UNKNOWN"


# ============================================================
# MEMORY MANAGEMENT
# ============================================================

func set_memory(memory_index: int) -> void:
	if memory_index < 1 or memory_index > 7:
		push_error("[GameState] Invalid memory index: %d" % memory_index)
		return

	current_memory = memory_index
	physical_attempts = 0
	memory_changed.emit(memory_index)
	print("[GameState] Current memory: %d" % memory_index)


func get_memory() -> int:
	return current_memory


func complete_memory(memory_index: int) -> void:
	if memory_index not in completed_memories:
		completed_memories.append(memory_index)
		memory_completed.emit(memory_index)
		print("[GameState] Memory %d completed! Total: %d/7" % [memory_index, completed_memories.size()])

		if completed_memories.size() == 7:
			all_memories_completed.emit()


func is_memory_completed(memory_index: int) -> bool:
	return memory_index in completed_memories


func get_completed_count() -> int:
	return completed_memories.size()


# ============================================================
# PUZZLE LAYER MANAGEMENT
# ============================================================

func set_puzzle_layer(layer: int) -> void:
	current_puzzle_layer = layer
	puzzle_layer_changed.emit(layer)
	print("[GameState] Puzzle layer: %s" % _layer_to_string(layer))


func get_puzzle_layer() -> int:
	return current_puzzle_layer


func _layer_to_string(layer: int) -> String:
	match layer:
		Constants.PuzzleLayer.KIDS: return "KIDS"
		Constants.PuzzleLayer.ADULTS: return "ADULTS"
		Constants.PuzzleLayer.TOGETHER: return "TOGETHER"
		_: return "UNKNOWN"


# ============================================================
# PHYSICAL CHALLENGE MANAGEMENT
# ============================================================

func start_physical_challenge() -> void:
	physical_challenge_active = true
	physical_attempts = 0
	print("[GameState] Physical challenge started")


func record_physical_attempt(success: bool) -> bool:
	physical_attempts += 1

	if success:
		physical_challenge_active = false
		print("[GameState] Physical challenge succeeded on attempt %d" % physical_attempts)
		return true

	if physical_attempts >= Constants.MAX_PHYSICAL_ATTEMPTS:
		physical_challenge_active = false
		print("[GameState] Physical challenge auto-passed after %d attempts" % physical_attempts)
		return true  # Auto-pass

	print("[GameState] Physical challenge attempt %d failed" % physical_attempts)
	return false


func get_physical_attempts() -> int:
	return physical_attempts


func is_physical_challenge_active() -> bool:
	return physical_challenge_active


# ============================================================
# STATE TRANSITIONS
# ============================================================

func advance_to_next_state() -> void:
	match current_state:
		Constants.GameState.INIT:
			set_state(Constants.GameState.INTRO)

		Constants.GameState.INTRO:
			set_memory(Constants.Memory.TOMTEGROETEN)
			set_state(Constants.GameState.MEMORY_INTRO)

		Constants.GameState.MEMORY_INTRO:
			set_puzzle_layer(Constants.PuzzleLayer.KIDS)
			set_state(Constants.GameState.MEMORY_KIDS)

		Constants.GameState.MEMORY_KIDS:
			set_puzzle_layer(Constants.PuzzleLayer.ADULTS)
			set_state(Constants.GameState.MEMORY_ADULTS)

		Constants.GameState.MEMORY_ADULTS:
			set_puzzle_layer(Constants.PuzzleLayer.TOGETHER)
			set_state(Constants.GameState.MEMORY_TOGETHER)

		Constants.GameState.MEMORY_TOGETHER:
			start_physical_challenge()
			set_state(Constants.GameState.MEMORY_PHYSICAL)

		Constants.GameState.MEMORY_PHYSICAL:
			set_state(Constants.GameState.MEMORY_RESOLUTION)

		Constants.GameState.MEMORY_RESOLUTION:
			complete_memory(current_memory)
			if current_memory < 7:
				set_memory(current_memory + 1)
				set_state(Constants.GameState.MEMORY_INTRO)
			else:
				set_state(Constants.GameState.ENDING)

		Constants.GameState.ENDING:
			print("[GameState] Game complete!")


# ============================================================
# WEBSOCKET COMMUNICATION
# ============================================================

func _broadcast_state_change(new_state: int) -> void:
	var message := {
		"type": Constants.MessageTypes.STATE_CHANGE,
		"new_state": _state_to_string(new_state),
		"memory": current_memory,
		"layer": _layer_to_string(current_puzzle_layer)
	}

	if ws_server:
		ws_server.broadcast(message)


func send_puzzle_to_tablet(puzzle_data: Dictionary) -> void:
	var message := {
		"type": Constants.MessageTypes.SHOW_PUZZLE,
		"memory": current_memory,
		"layer": _layer_to_string(current_puzzle_layer),
		"puzzle_data": puzzle_data
	}

	if ws_server:
		ws_server.broadcast(message)


func send_waiting_to_tablet(text: String) -> void:
	var message := {
		"type": Constants.MessageTypes.SHOW_WAITING,
		"message": text
	}

	if ws_server:
		ws_server.broadcast(message)


func notify_puzzle_complete(success: bool, result: Dictionary = {}) -> void:
	var message := {
		"type": Constants.MessageTypes.PUZZLE_COMPLETE,
		"memory": current_memory,
		"layer": _layer_to_string(current_puzzle_layer),
		"success": success,
		"result": result
	}

	if ws_client:
		ws_client.send_message(message)


# ============================================================
# MODE DETECTION
# ============================================================

func set_tv_mode() -> void:
	is_tv_mode = true
	is_tablet_mode = false
	print("[GameState] Running in TV mode")


func set_tablet_mode() -> void:
	is_tv_mode = false
	is_tablet_mode = true
	print("[GameState] Running in Tablet mode")
