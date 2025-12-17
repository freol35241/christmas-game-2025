extends Node
class_name WebSocketClient
## WebSocket client for tablet display
## Connects to TV server and handles puzzle communication

signal connected()
signal disconnected()
signal connection_error(error: String)
signal message_received(message: Dictionary)
signal puzzle_received(memory: int, layer: String, puzzle_data: Dictionary)
signal state_changed(new_state: String)
signal waiting_message_received(message: String)

var _socket: WebSocketPeer
var _url: String = ""
var _connected: bool = false
var _reconnect_timer: Timer
var _reconnect_attempts: int = 0
var _max_reconnect_attempts: int = 10
var _reconnect_delay: float = 2.0


func _ready() -> void:
	_reconnect_timer = Timer.new()
	_reconnect_timer.one_shot = true
	_reconnect_timer.timeout.connect(_attempt_reconnect)
	add_child(_reconnect_timer)


func connect_to_server(url: String) -> Error:
	_url = url
	_socket = WebSocketPeer.new()

	var err := _socket.connect_to_url(_url)
	if err != OK:
		push_error("[WebSocketClient] Failed to connect to %s: %s" % [_url, error_string(err)])
		connection_error.emit(error_string(err))
		return err

	print("[WebSocketClient] Connecting to %s..." % _url)
	return OK


func _process(_delta: float) -> void:
	if not _socket:
		return

	_socket.poll()

	var state := _socket.get_ready_state()
	match state:
		WebSocketPeer.STATE_OPEN:
			if not _connected:
				_on_connected()

			while _socket.get_available_packet_count() > 0:
				var packet := _socket.get_packet()
				_handle_packet(packet)

		WebSocketPeer.STATE_CLOSING:
			pass  # Wait

		WebSocketPeer.STATE_CLOSED:
			if _connected:
				_on_disconnected()


func _on_connected() -> void:
	_connected = true
	_reconnect_attempts = 0
	print("[WebSocketClient] Connected to server")
	GameState.ws_client = self

	# Send ready message
	send_message({
		"type": Constants.MessageTypes.TABLET_READY
	})

	connected.emit()


func _on_disconnected() -> void:
	_connected = false
	print("[WebSocketClient] Disconnected from server")
	GameState.ws_client = null
	disconnected.emit()

	# Attempt reconnection
	if _reconnect_attempts < _max_reconnect_attempts:
		_reconnect_timer.start(_reconnect_delay)


func _attempt_reconnect() -> void:
	_reconnect_attempts += 1
	print("[WebSocketClient] Reconnection attempt %d/%d" % [_reconnect_attempts, _max_reconnect_attempts])
	connect_to_server(_url)


func disconnect_from_server() -> void:
	if _socket:
		_socket.close()
		_socket = null
	_connected = false
	_reconnect_timer.stop()


func _handle_packet(packet: PackedByteArray) -> void:
	var text := packet.get_string_from_utf8()

	var json := JSON.new()
	var parse_result := json.parse(text)

	if parse_result != OK:
		push_warning("[WebSocketClient] Invalid JSON: %s" % text)
		return

	var message: Dictionary = json.data
	_process_message(message)


func _process_message(message: Dictionary) -> void:
	var msg_type: String = message.get("type", "")

	match msg_type:
		Constants.MessageTypes.SHOW_PUZZLE:
			var memory: int = message.get("memory", 0)
			var layer: String = message.get("layer", "")
			var puzzle_data: Dictionary = message.get("puzzle_data", {})
			print("[WebSocketClient] Puzzle received - Memory %d, Layer: %s" % [memory, layer])
			puzzle_received.emit(memory, layer, puzzle_data)

		Constants.MessageTypes.STATE_CHANGE:
			var new_state: String = message.get("new_state", "")
			print("[WebSocketClient] State changed to: %s" % new_state)
			state_changed.emit(new_state)

		Constants.MessageTypes.SHOW_WAITING:
			var wait_message: String = message.get("message", "")
			print("[WebSocketClient] Waiting: %s" % wait_message)
			waiting_message_received.emit(wait_message)

		_:
			message_received.emit(message)


# ============================================================
# PUBLIC API
# ============================================================

func send_message(message: Dictionary) -> void:
	if not _socket or not _connected:
		push_warning("[WebSocketClient] Cannot send - not connected")
		return

	var json := JSON.stringify(message)
	_socket.send_text(json)


func send_puzzle_complete(success: bool, result: Dictionary = {}) -> void:
	send_message({
		"type": Constants.MessageTypes.PUZZLE_COMPLETE,
		"memory": GameState.current_memory,
		"layer": _layer_to_string(GameState.current_puzzle_layer),
		"success": success,
		"result": result
	})


func _layer_to_string(layer: int) -> String:
	match layer:
		Constants.PuzzleLayer.KIDS: return "KIDS"
		Constants.PuzzleLayer.ADULTS: return "ADULTS"
		Constants.PuzzleLayer.TOGETHER: return "TOGETHER"
		_: return "UNKNOWN"


func is_server_connected() -> bool:
	return _connected


func get_url() -> String:
	return _url
