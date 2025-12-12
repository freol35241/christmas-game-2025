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
		Constants.Memory.LUCIA:
			return _get_memory_2_puzzle(layer)
		Constants.Memory.JULGRANEN:
			return _get_memory_3_puzzle(layer)
		Constants.Memory.RENARNA:
			return _get_memory_4_puzzle(layer)
		Constants.Memory.SLADEN:
			return _get_memory_5_puzzle(layer)
		Constants.Memory.JULKLAPPARNA:
			return _get_memory_6_puzzle(layer)
		Constants.Memory.JULSTJARNAN:
			return _get_memory_7_puzzle(layer)
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


func _get_memory_2_puzzle(layer: int) -> Dictionary:
	# Memory 2: Lucia - The Lucia procession got lost in the dark
	match layer:
		Constants.PuzzleLayer.KIDS:
			return {
				"puzzle_type": "tap_targets",
				"title": "[SWEDISH: Light the candles!]",
				"instructions": "[SWEDISH: Tap the candles in order from 1 to 7 to light the way]",
				"targets": [
					{"id": "candle_1", "label": "1", "order": 1},
					{"id": "candle_2", "label": "2", "order": 2},
					{"id": "candle_3", "label": "3", "order": 3},
					{"id": "candle_4", "label": "4", "order": 4},
					{"id": "candle_5", "label": "5", "order": 5},
					{"id": "candle_6", "label": "6", "order": 6},
					{"id": "candle_7", "label": "7", "order": 7}
				],
				"require_order": true
			}

		Constants.PuzzleLayer.ADULTS:
			return {
				"puzzle_type": "cipher",
				"title": "[SWEDISH: Decode the Lucia song!]",
				"instructions": "[SWEDISH: What song does Lucia sing?]",
				"cipher_text": "19-1-14-11-20-1 12-21-3-9-1",  # S-A-N-K-T-A L-U-C-I-A
				"hint": "[SWEDISH: A=1, B=2, C=3... Two words]",
				"answer": "SANKTA LUCIA"
			}

		Constants.PuzzleLayer.TOGETHER:
			return {
				"puzzle_type": "location_select",
				"title": "[SWEDISH: Guide the Lucia procession!]",
				"instructions": "[SWEDISH: Where should the procession go? Discuss together!]",
				"locations": [
					{"id": "kitchen", "name": "[SWEDISH: Kitchen]"},
					{"id": "bedroom", "name": "[SWEDISH: Bedroom]"},
					{"id": "tomtens_cottage", "name": "[SWEDISH: Tomten's cottage]"},
					{"id": "barn", "name": "[SWEDISH: The barn]"},
					{"id": "forest", "name": "[SWEDISH: Into the forest]"}
				],
				"correct_location": "tomtens_cottage"
			}

		_:
			return {}


func _get_memory_3_puzzle(layer: int) -> Dictionary:
	# Memory 3: Julgranen - The Christmas tree is decorated wrong
	match layer:
		Constants.PuzzleLayer.KIDS:
			return {
				"puzzle_type": "drag_drop",
				"title": "[SWEDISH: Decorate the Christmas tree!]",
				"instructions": "[SWEDISH: Drag the right decorations onto the tree]",
				"items": [
					{"id": "star", "name": "[SWEDISH: Star]", "correct": true},
					{"id": "baubles", "name": "[SWEDISH: Baubles]", "correct": true},
					{"id": "tinsel", "name": "[SWEDISH: Tinsel]", "correct": true},
					{"id": "lights", "name": "[SWEDISH: Lights]", "correct": true},
					{"id": "socks", "name": "[SWEDISH: Socks]", "correct": false},
					{"id": "spoon", "name": "[SWEDISH: Wooden spoon]", "correct": false}
				],
				"target": "tree",
				"required_correct": 4
			}

		Constants.PuzzleLayer.ADULTS:
			return {
				"puzzle_type": "cipher",
				"title": "[SWEDISH: What goes on top?]",
				"instructions": "[SWEDISH: Decode what belongs at the top of the tree]",
				"cipher_text": "19-20-10-1-18-14-1",  # S-T-J-Ä-R-N-A (Ä=A for simplicity)
				"hint": "[SWEDISH: A=1, B=2... It shines bright!]",
				"answer": "STJARNA"
			}

		Constants.PuzzleLayer.TOGETHER:
			return {
				"puzzle_type": "location_select",
				"title": "[SWEDISH: Where should the tree stand?]",
				"instructions": "[SWEDISH: Pick the best spot for the Christmas tree!]",
				"locations": [
					{"id": "corner", "name": "[SWEDISH: In the corner]"},
					{"id": "window", "name": "[SWEDISH: By the window]"},
					{"id": "center", "name": "[SWEDISH: In the center]"},
					{"id": "outside", "name": "[SWEDISH: Outside]"},
					{"id": "kitchen", "name": "[SWEDISH: In the kitchen]"}
				],
				"correct_location": "window"
			}

		_:
			return {}


func _get_memory_4_puzzle(layer: int) -> Dictionary:
	# Memory 4: Renarna - The reindeer won't respond, Tomten forgot their names
	match layer:
		Constants.PuzzleLayer.KIDS:
			return {
				"puzzle_type": "tap_targets",
				"title": "[SWEDISH: Find the reindeer!]",
				"instructions": "[SWEDISH: Tap all the reindeer hiding in the snow]",
				"targets": [
					{"id": "reindeer_1", "label": "🦌", "hidden": true},
					{"id": "reindeer_2", "label": "🦌", "hidden": true},
					{"id": "reindeer_3", "label": "🦌", "hidden": true},
					{"id": "reindeer_4", "label": "🦌", "hidden": true},
					{"id": "snowman", "label": "⛄", "hidden": false, "decoy": true},
					{"id": "tree", "label": "🌲", "hidden": false, "decoy": true}
				],
				"require_order": false,
				"find_count": 4
			}

		Constants.PuzzleLayer.ADULTS:
			return {
				"puzzle_type": "cipher",
				"title": "[SWEDISH: Remember the lead reindeer!]",
				"instructions": "[SWEDISH: Decode the name of the famous red-nosed reindeer]",
				"cipher_text": "18-21-4-15-12-6",  # R-U-D-O-L-F
				"hint": "[SWEDISH: A=1, B=2, C=3... His nose is red!]",
				"answer": "RUDOLF"
			}

		Constants.PuzzleLayer.TOGETHER:
			return {
				"puzzle_type": "location_select",
				"title": "[SWEDISH: Who leads the sleigh?]",
				"instructions": "[SWEDISH: Which reindeer should be at the front?]",
				"locations": [
					{"id": "dasher", "name": "[SWEDISH: Dasher]"},
					{"id": "dancer", "name": "[SWEDISH: Dancer]"},
					{"id": "rudolf", "name": "[SWEDISH: Rudolf]"},
					{"id": "comet", "name": "[SWEDISH: Comet]"},
					{"id": "blitzen", "name": "[SWEDISH: Blitzen]"}
				],
				"correct_location": "rudolf"
			}

		_:
			return {}


func _get_memory_5_puzzle(layer: int) -> Dictionary:
	# Memory 5: Släden - Tomten attached wrong things to the sleigh
	match layer:
		Constants.PuzzleLayer.KIDS:
			return {
				"puzzle_type": "drag_drop",
				"title": "[SWEDISH: Fix the sleigh!]",
				"instructions": "[SWEDISH: Drag the correct parts to the sleigh]",
				"items": [
					{"id": "runners", "name": "[SWEDISH: Runners]", "correct": true},
					{"id": "reins", "name": "[SWEDISH: Reins]", "correct": true},
					{"id": "bells", "name": "[SWEDISH: Bells]", "correct": true},
					{"id": "seat", "name": "[SWEDISH: Seat]", "correct": true},
					{"id": "wheels", "name": "[SWEDISH: Wheels]", "correct": false},
					{"id": "propeller", "name": "[SWEDISH: Propeller]", "correct": false}
				],
				"target": "sleigh",
				"required_correct": 4
			}

		Constants.PuzzleLayer.ADULTS:
			return {
				"puzzle_type": "cipher",
				"title": "[SWEDISH: The magic word!]",
				"instructions": "[SWEDISH: What makes the sleigh fly?]",
				"cipher_text": "13-1-7-9",  # M-A-G-I
				"hint": "[SWEDISH: A=1, B=2, C=3... Something magical!]",
				"answer": "MAGI"
			}

		Constants.PuzzleLayer.TOGETHER:
			return {
				"puzzle_type": "location_select",
				"title": "[SWEDISH: What's missing?]",
				"instructions": "[SWEDISH: The sleigh still needs one more thing!]",
				"locations": [
					{"id": "lantern", "name": "[SWEDISH: A lantern]"},
					{"id": "blanket", "name": "[SWEDISH: A warm blanket]"},
					{"id": "gift_sack", "name": "[SWEDISH: The gift sack]"},
					{"id": "map", "name": "[SWEDISH: A map]"},
					{"id": "compass", "name": "[SWEDISH: A compass]"}
				],
				"correct_location": "gift_sack"
			}

		_:
			return {}


func _get_memory_6_puzzle(layer: int) -> Dictionary:
	# Memory 6: Julklapparna - Gift tags fell off, who gets what?
	match layer:
		Constants.PuzzleLayer.KIDS:
			return {
				"puzzle_type": "drag_drop",
				"title": "[SWEDISH: Sort the presents!]",
				"instructions": "[SWEDISH: Match the gifts to who should receive them]",
				"items": [
					{"id": "toy_car", "name": "[SWEDISH: Toy car]", "correct": true, "recipient": "child"},
					{"id": "book", "name": "[SWEDISH: Book]", "correct": true, "recipient": "grandpa"},
					{"id": "scarf", "name": "[SWEDISH: Scarf]", "correct": true, "recipient": "grandma"},
					{"id": "doll", "name": "[SWEDISH: Doll]", "correct": true, "recipient": "child"},
					{"id": "coal", "name": "[SWEDISH: Coal]", "correct": false},
					{"id": "rock", "name": "[SWEDISH: Rock]", "correct": false}
				],
				"target": "gift_pile",
				"required_correct": 4
			}

		Constants.PuzzleLayer.ADULTS:
			return {
				"puzzle_type": "cipher",
				"title": "[SWEDISH: Read the gift tag!]",
				"instructions": "[SWEDISH: Decode the name on the mysterious gift]",
				"cipher_text": "20-15-13-20-5-14",  # T-O-M-T-E-N
				"hint": "[SWEDISH: A=1, B=2, C=3... Who delivers the gifts?]",
				"answer": "TOMTEN"
			}

		Constants.PuzzleLayer.TOGETHER:
			return {
				"puzzle_type": "location_select",
				"title": "[SWEDISH: Where do gifts belong?]",
				"instructions": "[SWEDISH: Where should the presents be placed?]",
				"locations": [
					{"id": "under_tree", "name": "[SWEDISH: Under the tree]"},
					{"id": "on_table", "name": "[SWEDISH: On the table]"},
					{"id": "in_stockings", "name": "[SWEDISH: In the stockings]"},
					{"id": "outside", "name": "[SWEDISH: Outside the door]"},
					{"id": "in_bed", "name": "[SWEDISH: In bed]"}
				],
				"correct_location": "under_tree"
			}

		_:
			return {}


func _get_memory_7_puzzle(layer: int) -> Dictionary:
	# Memory 7: Julstjärnan - Can't find the guiding star (Final memory!)
	match layer:
		Constants.PuzzleLayer.KIDS:
			return {
				"puzzle_type": "sequence",
				"title": "[SWEDISH: Find the Christmas star!]",
				"instructions": "[SWEDISH: Tap the stars in the right order to reveal the Christmas star]",
				"sequence": ["blue", "yellow", "red", "green"],
				"display_sequence": true,
				"sequence_length": 4
			}

		Constants.PuzzleLayer.ADULTS:
			return {
				"puzzle_type": "cipher",
				"title": "[SWEDISH: Which direction?]",
				"instructions": "[SWEDISH: The star always points the way. Which direction?]",
				"cipher_text": "14-15-18-18",  # N-O-R-R (North in Swedish)
				"hint": "[SWEDISH: A=1, B=2, C=3... Look to the cold!]",
				"answer": "NORR"
			}

		Constants.PuzzleLayer.TOGETHER:
			return {
				"puzzle_type": "location_select",
				"title": "[SWEDISH: Where is the star?]",
				"instructions": "[SWEDISH: Look up! Where in the sky is the Christmas star?]",
				"locations": [
					{"id": "east", "name": "[SWEDISH: In the east]"},
					{"id": "west", "name": "[SWEDISH: In the west]"},
					{"id": "north", "name": "[SWEDISH: In the north]"},
					{"id": "south", "name": "[SWEDISH: In the south]"},
					{"id": "straight_up", "name": "[SWEDISH: Straight up]"}
				],
				"correct_location": "north"
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
