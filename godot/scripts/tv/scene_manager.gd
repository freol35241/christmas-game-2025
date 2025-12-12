extends Node
class_name SceneManager
## Manages scene transitions and loading for TV display

signal scene_changed(scene_name: String)
signal transition_started()
signal transition_finished()

var _current_scene: Node = null
var _scene_container: Node = null
var _transition_overlay: ColorRect = null
var _is_transitioning: bool = false

# Scene paths
const SCENES := {
	"intro": "res://scenes/tv/intro.tscn",
	"memory_intro": "res://scenes/tv/memory_intro.tscn",
	"physical_challenge": "res://scenes/tv/physical_challenge.tscn",
	"memory_resolution": "res://scenes/tv/memory_resolution.tscn",
	"ending": "res://scenes/tv/ending.tscn",
	"waiting": "res://scenes/tv/waiting_for_tablet.tscn"
}


func _ready() -> void:
	pass


func setup(container: Node, overlay: ColorRect) -> void:
	_scene_container = container
	_transition_overlay = overlay

	# Ensure overlay starts invisible
	if _transition_overlay:
		_transition_overlay.modulate.a = 0.0


func change_scene(scene_name: String, instant: bool = false) -> void:
	if _is_transitioning:
		push_warning("[SceneManager] Already transitioning, ignoring request")
		return

	if scene_name not in SCENES:
		push_error("[SceneManager] Unknown scene: %s" % scene_name)
		return

	var scene_path: String = SCENES[scene_name]

	if instant:
		_load_scene_instant(scene_path, scene_name)
	else:
		_load_scene_with_transition(scene_path, scene_name)


func _load_scene_instant(scene_path: String, scene_name: String) -> void:
	# Remove current scene
	if _current_scene:
		_current_scene.queue_free()
		_current_scene = null

	# Load and instance new scene
	var scene_resource := load(scene_path)
	if not scene_resource:
		push_error("[SceneManager] Failed to load scene: %s" % scene_path)
		return

	_current_scene = scene_resource.instantiate()
	_scene_container.add_child(_current_scene)

	scene_changed.emit(scene_name)
	print("[SceneManager] Scene changed to: %s" % scene_name)


func _load_scene_with_transition(scene_path: String, scene_name: String) -> void:
	_is_transitioning = true
	transition_started.emit()

	# Fade out
	if _transition_overlay:
		var fade_out := create_tween()
		fade_out.tween_property(_transition_overlay, "modulate:a", 1.0, Constants.FADE_DURATION)
		await fade_out.finished

	# Remove current scene
	if _current_scene:
		_current_scene.queue_free()
		_current_scene = null

	# Load and instance new scene
	var scene_resource := load(scene_path)
	if not scene_resource:
		push_error("[SceneManager] Failed to load scene: %s" % scene_path)
		_is_transitioning = false
		return

	_current_scene = scene_resource.instantiate()
	_scene_container.add_child(_current_scene)

	# Fade in
	if _transition_overlay:
		var fade_in := create_tween()
		fade_in.tween_property(_transition_overlay, "modulate:a", 0.0, Constants.FADE_DURATION)
		await fade_in.finished

	_is_transitioning = false
	transition_finished.emit()
	scene_changed.emit(scene_name)
	print("[SceneManager] Scene changed to: %s" % scene_name)


func get_current_scene() -> Node:
	return _current_scene


func is_transitioning() -> bool:
	return _is_transitioning
