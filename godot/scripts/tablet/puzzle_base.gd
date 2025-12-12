extends Control
class_name PuzzleBase
## Base class for all tablet puzzles

signal puzzle_complete(success: bool, result: Dictionary)

var puzzle_data: Dictionary = {}


func _ready() -> void:
	pass


## Override this method to initialize puzzle with data from server
func setup(data: Dictionary) -> void:
	puzzle_data = data


## Call this when puzzle is completed
func complete_puzzle(success: bool, result: Dictionary = {}) -> void:
	puzzle_complete.emit(success, result)
