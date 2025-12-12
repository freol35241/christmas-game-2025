extends Node
class_name WebSocketServer
## WebSocket server for TV display
## Handles connections from tablet and camera service

signal client_connected(peer_id: int)
signal client_disconnected(peer_id: int)
signal message_received(peer_id: int, message: Dictionary)
signal tablet_connected()
signal camera_connected()

var _server: TCPServer
var _peers: Dictionary = {}  # peer_id -> WebSocketPeer
var _tablet_peer_id: int = -1
var _camera_peer_id: int = -1
var _port: int = Constants.WS_PORT

# HTTP response for WebSocket upgrade
const HTTP_SWITCHING_PROTOCOLS := "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: %s\r\n\r\n"


func _ready() -> void:
	pass


func start(port: int = Constants.WS_PORT) -> Error:
	_port = port
	_server = TCPServer.new()
	var err := _server.listen(_port)
	if err != OK:
		push_error("[WebSocketServer] Failed to start server on port %d: %s" % [_port, error_string(err)])
		return err

	print("[WebSocketServer] Server started on port %d" % _port)
	GameState.ws_server = self
	return OK


func stop() -> void:
	for peer_id in _peers.keys():
		_disconnect_peer(peer_id)
	_peers.clear()

	if _server:
		_server.stop()
		_server = null

	print("[WebSocketServer] Server stopped")


func _process(_delta: float) -> void:
	if not _server:
		return

	# Accept new TCP connections
	while _server.is_connection_available():
		var tcp_peer := _server.take_connection()
		if tcp_peer:
			_handle_new_connection(tcp_peer)

	# Process existing WebSocket peers
	var peers_to_remove: Array[int] = []

	for peer_id in _peers.keys():
		var peer_data: Dictionary = _peers[peer_id]
		var ws_peer: WebSocketPeer = peer_data.get("ws")
		var tcp_peer: StreamPeerTCP = peer_data.get("tcp")

		if ws_peer:
			ws_peer.poll()

			var state := ws_peer.get_ready_state()
			match state:
				WebSocketPeer.STATE_OPEN:
					while ws_peer.get_available_packet_count() > 0:
						var packet := ws_peer.get_packet()
						_handle_packet(peer_id, packet)

				WebSocketPeer.STATE_CLOSING:
					pass  # Wait for close

				WebSocketPeer.STATE_CLOSED:
					peers_to_remove.append(peer_id)

		elif tcp_peer:
			# Handle HTTP upgrade request
			tcp_peer.poll()
			if tcp_peer.get_status() == StreamPeerTCP.STATUS_CONNECTED:
				if tcp_peer.get_available_bytes() > 0:
					var data := tcp_peer.get_utf8_string(tcp_peer.get_available_bytes())
					if data.length() > 0:
						_handle_http_request(peer_id, data)

	# Remove disconnected peers
	for peer_id in peers_to_remove:
		_disconnect_peer(peer_id)


func _handle_new_connection(tcp_peer: StreamPeerTCP) -> void:
	var peer_id := _generate_peer_id()
	_peers[peer_id] = {
		"tcp": tcp_peer,
		"ws": null
	}
	print("[WebSocketServer] New TCP connection, peer_id: %d" % peer_id)


func _handle_http_request(peer_id: int, request: String) -> void:
	# Parse HTTP headers for WebSocket upgrade
	if not "Upgrade: websocket" in request:
		print("[WebSocketServer] Non-WebSocket request from peer %d" % peer_id)
		_disconnect_peer(peer_id)
		return

	# Extract Sec-WebSocket-Key
	var key_match := RegEx.new()
	key_match.compile("Sec-WebSocket-Key:\\s*([^\\r\\n]+)")
	var result := key_match.search(request)

	if not result:
		print("[WebSocketServer] No WebSocket key from peer %d" % peer_id)
		_disconnect_peer(peer_id)
		return

	var client_key := result.get_string(1).strip_edges()

	# Generate accept key
	var accept_key := _generate_accept_key(client_key)

	# Send upgrade response
	var tcp_peer: StreamPeerTCP = _peers[peer_id]["tcp"]
	var response := HTTP_SWITCHING_PROTOCOLS % accept_key
	tcp_peer.put_data(response.to_utf8_buffer())

	# Create WebSocket peer
	var ws_peer := WebSocketPeer.new()
	ws_peer.accept_stream(tcp_peer)

	_peers[peer_id]["ws"] = ws_peer
	_peers[peer_id]["tcp"] = null  # TCP is now owned by WebSocket

	print("[WebSocketServer] WebSocket handshake complete for peer %d" % peer_id)
	client_connected.emit(peer_id)


func _generate_accept_key(client_key: String) -> String:
	var magic := "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
	var combined := client_key + magic
	var sha1 := combined.sha1_buffer()
	return Marshalls.raw_to_base64(sha1)


func _handle_packet(peer_id: int, packet: PackedByteArray) -> void:
	var text := packet.get_string_from_utf8()

	var json := JSON.new()
	var parse_result := json.parse(text)

	if parse_result != OK:
		push_warning("[WebSocketServer] Invalid JSON from peer %d: %s" % [peer_id, text])
		return

	var message: Dictionary = json.data
	_process_message(peer_id, message)


func _process_message(peer_id: int, message: Dictionary) -> void:
	var msg_type: String = message.get("type", "")

	match msg_type:
		Constants.MessageTypes.TABLET_READY:
			_tablet_peer_id = peer_id
			print("[WebSocketServer] Tablet connected (peer %d)" % peer_id)
			tablet_connected.emit()

		"camera_ready":
			_camera_peer_id = peer_id
			print("[WebSocketServer] Camera service connected (peer %d)" % peer_id)
			camera_connected.emit()

		Constants.MessageTypes.PUZZLE_COMPLETE:
			message_received.emit(peer_id, message)

		Constants.MessageTypes.DETECTION_UPDATE, Constants.MessageTypes.CHALLENGE_COMPLETE:
			message_received.emit(peer_id, message)

		_:
			message_received.emit(peer_id, message)


func _disconnect_peer(peer_id: int) -> void:
	if peer_id not in _peers:
		return

	var peer_data: Dictionary = _peers[peer_id]

	if peer_data.get("ws"):
		peer_data["ws"].close()

	_peers.erase(peer_id)

	if peer_id == _tablet_peer_id:
		_tablet_peer_id = -1
		print("[WebSocketServer] Tablet disconnected")

	if peer_id == _camera_peer_id:
		_camera_peer_id = -1
		print("[WebSocketServer] Camera service disconnected")

	client_disconnected.emit(peer_id)
	print("[WebSocketServer] Peer %d disconnected" % peer_id)


func _generate_peer_id() -> int:
	return randi() % 1000000


# ============================================================
# PUBLIC API
# ============================================================

func broadcast(message: Dictionary) -> void:
	var json := JSON.stringify(message)
	var packet := json.to_utf8_buffer()

	for peer_id in _peers.keys():
		var ws_peer: WebSocketPeer = _peers[peer_id].get("ws")
		if ws_peer and ws_peer.get_ready_state() == WebSocketPeer.STATE_OPEN:
			ws_peer.send_text(json)


func send_to_tablet(message: Dictionary) -> void:
	if _tablet_peer_id < 0:
		push_warning("[WebSocketServer] No tablet connected")
		return

	_send_to_peer(_tablet_peer_id, message)


func send_to_camera(message: Dictionary) -> void:
	if _camera_peer_id < 0:
		push_warning("[WebSocketServer] No camera service connected")
		return

	_send_to_peer(_camera_peer_id, message)


func _send_to_peer(peer_id: int, message: Dictionary) -> void:
	if peer_id not in _peers:
		return

	var ws_peer: WebSocketPeer = _peers[peer_id].get("ws")
	if ws_peer and ws_peer.get_ready_state() == WebSocketPeer.STATE_OPEN:
		var json := JSON.stringify(message)
		ws_peer.send_text(json)


func is_tablet_connected() -> bool:
	return _tablet_peer_id >= 0


func is_camera_connected() -> bool:
	return _camera_peer_id >= 0


func get_connection_info() -> String:
	var ip := IP.get_local_addresses()
	var local_ip := "localhost"
	for addr in ip:
		if addr.begins_with("192.168.") or addr.begins_with("10.") or addr.begins_with("172."):
			local_ip = addr
			break
	return "ws://%s:%d" % [local_ip, _port]
