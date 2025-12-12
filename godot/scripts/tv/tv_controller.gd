extends Node
class_name TVController
## Main controller for TV display
## Handles game flow, WebSocket server, and scene management

signal tablet_connected()
signal camera_connected()

@onready var ws_server: WebSocketServer = $WebSocketServer
@onready var scene_manager: SceneManager = $SceneManager
@onready var scene_container: Node = $SceneContainer
@onready var transition_overlay: ColorRect = $TransitionOverlay
@onready var connection_label: Label = $UI/ConnectionLabel
@onready var debug_label: Label = $UI/DebugLabel

var _waiting_for_tablet: bool = true


func _ready() -> void:
	GameState.set_tv_mode()

	# Setup scene manager
	scene_manager.setup(scene_container, transition_overlay)

	# Connect WebSocket signals
	ws_server.tablet_connected.connect(_on_tablet_connected)
	ws_server.camera_connected.connect(_on_camera_connected)
	ws_server.message_received.connect(_on_message_received)

	# Connect GameState signals
	GameState.state_changed.connect(_on_state_changed)
	GameState.memory_completed.connect(_on_memory_completed)

	# Start WebSocket server
	var err := ws_server.start()
	if err == OK:
		_update_connection_label()
	else:
		connection_label.text = "[SWEDISH: Failed to start server]"

	# Start game
	_start_game()


func _process(_delta: float) -> void:
	_update_debug_info()


func _start_game() -> void:
	GameState.set_state(Constants.GameState.INIT)
	scene_manager.change_scene("waiting", true)


func _update_connection_label() -> void:
	var info := ws_server.get_connection_info()
	connection_label.text = "[SWEDISH: Connect tablet to: %s]" % info


func _update_debug_info() -> void:
	if debug_label:
		debug_label.text = "State: %s | Memory: %d | Tablet: %s | Camera: %s" % [
			_state_to_string(GameState.current_state),
			GameState.current_memory,
			"Yes" if ws_server.is_tablet_connected() else "No",
			"Yes" if ws_server.is_camera_connected() else "No"
		]


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
# WEBSOCKET HANDLERS
# ============================================================

func _on_tablet_connected() -> void:
	print("[TVController] Tablet connected!")
	_waiting_for_tablet = false
	connection_label.visible = false
	tablet_connected.emit()

	# Advance to intro if we were waiting
	if GameState.current_state == Constants.GameState.INIT:
		GameState.advance_to_next_state()


func _on_camera_connected() -> void:
	print("[TVController] Camera service connected!")
	camera_connected.emit()


func _on_message_received(_peer_id: int, message: Dictionary) -> void:
	var msg_type: String = message.get("type", "")

	match msg_type:
		Constants.MessageTypes.PUZZLE_COMPLETE:
			_handle_puzzle_complete(message)

		Constants.MessageTypes.DETECTION_UPDATE:
			_handle_detection_update(message)

		Constants.MessageTypes.CHALLENGE_COMPLETE:
			_handle_challenge_complete(message)


func _handle_puzzle_complete(message: Dictionary) -> void:
	var success: bool = message.get("success", false)
	var layer: String = message.get("layer", "")

	print("[TVController] Puzzle complete - Layer: %s, Success: %s" % [layer, success])

	if success:
		# Advance to next state
		GameState.advance_to_next_state()


func _handle_detection_update(message: Dictionary) -> void:
	# Forward to current scene if it's a physical challenge
	var current_scene := scene_manager.get_current_scene()
	if current_scene and current_scene.has_method("on_detection_update"):
		current_scene.on_detection_update(message)


func _handle_challenge_complete(message: Dictionary) -> void:
	var success: bool = message.get("success", false)
	var challenge_passed := GameState.record_physical_attempt(success)

	if challenge_passed:
		GameState.advance_to_next_state()


# ============================================================
# STATE CHANGE HANDLERS
# ============================================================

func _on_state_changed(_old_state: int, new_state: int) -> void:
	match new_state:
		Constants.GameState.INTRO:
			scene_manager.change_scene("intro")
			GameState.send_waiting_to_tablet("[SWEDISH: Watch the TV!]")

		Constants.GameState.MEMORY_INTRO:
			scene_manager.change_scene("memory_intro")
			GameState.send_waiting_to_tablet("[SWEDISH: Watch the TV!]")

		Constants.GameState.MEMORY_KIDS, Constants.GameState.MEMORY_ADULTS, Constants.GameState.MEMORY_TOGETHER:
			# TV shows waiting screen, tablet shows puzzle
			scene_manager.change_scene("waiting")
			_send_puzzle_to_tablet()

		Constants.GameState.MEMORY_PHYSICAL:
			scene_manager.change_scene("physical_challenge")
			GameState.send_waiting_to_tablet("[SWEDISH: Get ready for the physical challenge!]")
			_start_camera_detection()

		Constants.GameState.MEMORY_RESOLUTION:
			scene_manager.change_scene("memory_resolution")
			GameState.send_waiting_to_tablet("[SWEDISH: Watch the TV!]")
			_stop_camera_detection()

		Constants.GameState.ENDING:
			scene_manager.change_scene("ending")
			GameState.send_waiting_to_tablet("[SWEDISH: Watch the ending!]")


func _on_memory_completed(memory_index: int) -> void:
	print("[TVController] Memory %d completed!" % memory_index)


# ============================================================
# PUZZLE & CHALLENGE MANAGEMENT
# ============================================================

func _send_puzzle_to_tablet() -> void:
	var puzzle_data := _get_puzzle_data_for_current_state()
	GameState.send_puzzle_to_tablet(puzzle_data)


func _get_puzzle_data_for_current_state() -> Dictionary:
	var memory := GameState.current_memory
	var layer := GameState.current_puzzle_layer

	# Return puzzle configuration based on memory and layer
	match memory:
		Constants.Memory.TOMTEGROETEN:
			return _get_memory_1_puzzle(layer)
		_:
			return {"puzzle_type": "placeholder", "message": "Puzzle not implemented"}


func _get_memory_1_puzzle(layer: int) -> Dictionary:
	match layer:
		Constants.PuzzleLayer.KIDS:
			return {
				"puzzle_type": "drag_drop",
				"title": "[SWEDISH: Help Tomten make porridge!]",
				"instructions": "[SWEDISH: Drag the correct ingredients into the bowl]",
				"items": [
					{"id": "mjol", "name": "[SWEDISH: Flour]", "correct": false},
					{"id": "ris", "name": "[SWEDISH: Rice]", "correct": true},
					{"id": "mjolk", "name": "[SWEDISH: Milk]", "correct": true},
					{"id": "socker", "name": "[SWEDISH: Sugar]", "correct": true},
					{"id": "salt", "name": "[SWEDISH: Salt]", "correct": false},
					{"id": "kanel", "name": "[SWEDISH: Cinnamon]", "correct": false}
				],
				"target": "bowl",
				"required_correct": 3
			}

		Constants.PuzzleLayer.ADULTS:
			return {
				"puzzle_type": "cipher",
				"title": "[SWEDISH: Decode the message!]",
				"instructions": "[SWEDISH: The tomtenissar left a coded message]",
				"cipher_text": "19-11-1-16-5-20",  # S-K-A-P-E-T (A=1)
				"hint": "[SWEDISH: A=1, B=2, C=3...]",
				"answer": "SKAPET"
			}

		Constants.PuzzleLayer.TOGETHER:
			return {
				"puzzle_type": "location_select",
				"title": "[SWEDISH: Find the tomtenissar!]",
				"instructions": "[SWEDISH: Where are they hiding? Discuss together!]",
				"locations": [
					{"id": "cupboard", "name": "[SWEDISH: Cupboard]"},
					{"id": "drawer", "name": "[SWEDISH: Drawer]"},
					{"id": "under_table", "name": "[SWEDISH: Under the table]"},
					{"id": "behind_curtain", "name": "[SWEDISH: Behind the curtain]"},
					{"id": "in_pot", "name": "[SWEDISH: In the pot]"}
				],
				"correct_location": "cupboard"
			}

		_:
			return {}


func _start_camera_detection() -> void:
	var challenge_type := _get_challenge_type_for_memory(GameState.current_memory)

	var message := {
		"type": Constants.MessageTypes.START_DETECTION,
		"challenge": challenge_type,
		"parameters": _get_challenge_parameters(challenge_type)
	}

	ws_server.send_to_camera(message)


func _stop_camera_detection() -> void:
	var message := {
		"type": Constants.MessageTypes.STOP_DETECTION
	}

	ws_server.send_to_camera(message)


func _get_challenge_type_for_memory(memory: int) -> String:
	match memory:
		Constants.Memory.TOMTEGROETEN: return "stirring"
		Constants.Memory.LUCIA: return "lucia_procession"
		Constants.Memory.JULGRANEN: return "tree_shape"
		Constants.Memory.RENARNA: return "antlers"
		Constants.Memory.SLADEN: return "sleigh_ride"
		Constants.Memory.JULKLAPPARNA: return "red_object"
		Constants.Memory.JULSTJARNAN: return "star_shape"
		_: return "unknown"


func _get_challenge_parameters(challenge_type: String) -> Dictionary:
	match challenge_type:
		"stirring":
			return {"required_duration": 5.0, "motion_type": "circular"}
		"lucia_procession":
			return {"required_duration": 3.0, "min_people": 2}
		"tree_shape":
			return {"required_duration": 3.0}
		"antlers":
			return {"required_duration": 3.0}
		"sleigh_ride":
			return {"required_duration": 5.0, "min_people": 2}
		"red_object":
			return {"required_duration": 2.0}
		"star_shape":
			return {"required_duration": 4.0}
		_:
			return {}


# ============================================================
# INPUT HANDLING
# ============================================================

func _input(event: InputEvent) -> void:
	# Debug shortcuts
	if event is InputEventKey and event.pressed:
		match event.keycode:
			KEY_SPACE:
				# Advance game state (for testing)
				GameState.advance_to_next_state()

			KEY_R:
				# Reset to beginning
				GameState.completed_memories.clear()
				GameState.set_memory(1)
				GameState.set_state(Constants.GameState.INIT)
				_start_game()

			KEY_P:
				# Simulate physical challenge complete
				if GameState.current_state == Constants.GameState.MEMORY_PHYSICAL:
					GameState.record_physical_attempt(true)
					GameState.advance_to_next_state()
