extends Node
class_name TabletController
## Main controller for tablet display
## Handles puzzle presentation and WebSocket communication

@onready var ws_client: WebSocketClient = $WebSocketClient
@onready var scene_container: Node = $SceneContainer
@onready var connection_ui: Control = $ConnectionUI
@onready var ip_input: LineEdit = $ConnectionUI/VBox/IPInput
@onready var connect_button: Button = $ConnectionUI/VBox/ConnectButton
@onready var status_label: Label = $ConnectionUI/VBox/StatusLabel

var _current_puzzle_scene: Node = null

# Puzzle scene paths
const PUZZLE_SCENES := {
	"drag_drop": "res://scenes/tablet/puzzle_drag_drop.tscn",
	"cipher": "res://scenes/tablet/puzzle_cipher.tscn",
	"location_select": "res://scenes/tablet/puzzle_location_select.tscn",
	"tap_targets": "res://scenes/tablet/puzzle_tap_targets.tscn",
	"sequence": "res://scenes/tablet/puzzle_sequence.tscn",
	"waiting": "res://scenes/tablet/waiting_screen.tscn"
}


func _ready() -> void:
	GameState.set_tablet_mode()

	# Connect WebSocket signals
	ws_client.connected.connect(_on_connected)
	ws_client.disconnected.connect(_on_disconnected)
	ws_client.connection_error.connect(_on_connection_error)
	ws_client.puzzle_received.connect(_on_puzzle_received)
	ws_client.state_changed.connect(_on_state_changed)
	ws_client.waiting_message_received.connect(_on_waiting_message)

	# Connect UI signals
	connect_button.pressed.connect(_on_connect_pressed)

	# Set default IP
	ip_input.text = "ws://192.168.1.100:8765"

	# Show connection UI
	connection_ui.visible = true


func _on_connect_pressed() -> void:
	var url := ip_input.text.strip_edges()
	if url.is_empty():
		status_label.text = "[SWEDISH: Please enter server address]"
		return

	status_label.text = "[SWEDISH: Connecting...]"
	connect_button.disabled = true

	var err := ws_client.connect_to_server(url)
	if err != OK:
		status_label.text = "[SWEDISH: Failed to connect]"
		connect_button.disabled = false


func _on_connected() -> void:
	print("[TabletController] Connected to server!")
	connection_ui.visible = false
	_show_waiting("[SWEDISH: Connected! Waiting for puzzle...]")


func _on_disconnected() -> void:
	print("[TabletController] Disconnected from server")
	connection_ui.visible = true
	connect_button.disabled = false
	status_label.text = "[SWEDISH: Disconnected. Try reconnecting.]"


func _on_connection_error(error: String) -> void:
	print("[TabletController] Connection error: %s" % error)
	status_label.text = "[SWEDISH: Error: %s]" % error
	connect_button.disabled = false


func _on_puzzle_received(memory: int, layer: String, puzzle_data: Dictionary) -> void:
	print("[TabletController] Received puzzle - Memory %d, Layer: %s" % [memory, layer])
	_load_puzzle(puzzle_data)


func _on_state_changed(new_state: String) -> void:
	print("[TabletController] State changed to: %s" % new_state)

	# Show waiting screen for TV states
	if new_state in ["INTRO", "MEMORY_INTRO", "MEMORY_PHYSICAL", "MEMORY_RESOLUTION", "ENDING"]:
		_show_waiting("[SWEDISH: Watch the TV!]")


func _on_waiting_message(message: String) -> void:
	_show_waiting(message)


func _show_waiting(message: String) -> void:
	_clear_current_puzzle()

	var scene_resource := load(PUZZLE_SCENES["waiting"])
	if scene_resource:
		_current_puzzle_scene = scene_resource.instantiate()
		scene_container.add_child(_current_puzzle_scene)
		if _current_puzzle_scene.has_method("set_message"):
			_current_puzzle_scene.set_message(message)


func _load_puzzle(puzzle_data: Dictionary) -> void:
	_clear_current_puzzle()

	var puzzle_type: String = puzzle_data.get("puzzle_type", "")
	if puzzle_type.is_empty() or puzzle_type not in PUZZLE_SCENES:
		push_error("[TabletController] Unknown puzzle type: %s" % puzzle_type)
		_show_waiting("[SWEDISH: Error loading puzzle]")
		return

	var scene_resource := load(PUZZLE_SCENES[puzzle_type])
	if not scene_resource:
		push_error("[TabletController] Failed to load puzzle scene: %s" % puzzle_type)
		return

	_current_puzzle_scene = scene_resource.instantiate()
	scene_container.add_child(_current_puzzle_scene)

	# Connect puzzle completion signal
	if _current_puzzle_scene.has_signal("puzzle_complete"):
		_current_puzzle_scene.puzzle_complete.connect(_on_puzzle_complete)

	# Initialize puzzle with data
	if _current_puzzle_scene.has_method("setup"):
		_current_puzzle_scene.setup(puzzle_data)


func _clear_current_puzzle() -> void:
	if _current_puzzle_scene:
		_current_puzzle_scene.queue_free()
		_current_puzzle_scene = null


func _on_puzzle_complete(success: bool, result: Dictionary) -> void:
	print("[TabletController] Puzzle complete - Success: %s" % success)

	# Send result to server
	ws_client.send_puzzle_complete(success, result)

	# Show waiting screen
	if success:
		_show_waiting("[SWEDISH: Great job! Watch the TV!]")
	else:
		_show_waiting("[SWEDISH: Try again!]")
