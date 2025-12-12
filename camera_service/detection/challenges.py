"""
Challenge-specific detection logic combining pose and color detection.
"""

import logging
import time
from collections import deque
from typing import Dict, List, Optional, Tuple
import numpy as np

from .pose_detector import PoseDetector
from .color_detector import ColorDetector

logger = logging.getLogger(__name__)


class ChallengeDetector:
    """Handles detection for all physical challenges."""

    def __init__(self):
        self.pose_detector = PoseDetector()
        self.color_detector = ColorDetector()

        # Motion tracking
        self._wrist_history: deque = deque(maxlen=30)  # ~1 second at 30fps
        self._position_history: deque = deque(maxlen=60)

        # Challenge state
        self.current_challenge: Optional[str] = None
        self.challenge_params: Dict = {}
        self.detection_start_time: Optional[float] = None
        self.continuous_detection_time: float = 0.0

    def start_challenge(self, challenge: str, params: Dict):
        """Start detecting for a specific challenge."""
        self.current_challenge = challenge
        self.challenge_params = params
        self.detection_start_time = None
        self.continuous_detection_time = 0.0
        self._wrist_history.clear()
        self._position_history.clear()

        logger.info(f"Started challenge: {challenge} with params: {params}")

    def stop_challenge(self):
        """Stop the current challenge detection."""
        self.current_challenge = None
        self.challenge_params = {}
        self.detection_start_time = None
        self.continuous_detection_time = 0.0

    def process_frame(self, frame: np.ndarray) -> Dict:
        """
        Process a frame and return detection results.

        Returns:
            Dict with keys: detected, confidence, duration_met
        """
        if not self.current_challenge:
            return {"detected": False, "confidence": 0.0, "duration_met": False}

        # Get detection result based on challenge type
        detected, confidence = self._detect_for_challenge(frame)

        # Track continuous detection time
        current_time = time.time()
        if detected:
            if self.detection_start_time is None:
                self.detection_start_time = current_time
            self.continuous_detection_time = current_time - self.detection_start_time
        else:
            self.detection_start_time = None
            self.continuous_detection_time = 0.0

        # Check if duration requirement met
        required_duration = self.challenge_params.get("required_duration", 3.0)
        duration_met = self.continuous_detection_time >= required_duration

        return {
            "detected": detected,
            "confidence": confidence,
            "duration_met": duration_met,
            "current_duration": self.continuous_detection_time,
            "required_duration": required_duration
        }

    def _detect_for_challenge(self, frame: np.ndarray) -> Tuple[bool, float]:
        """Detect based on current challenge type."""
        challenge = self.current_challenge

        if challenge == "stirring":
            return self._detect_stirring(frame)
        elif challenge == "lucia_procession":
            return self._detect_walking(frame)
        elif challenge == "tree_shape":
            return self._detect_tree_shape(frame)
        elif challenge == "antlers":
            return self._detect_antlers(frame)
        elif challenge == "sleigh_ride":
            return self._detect_bobbing(frame)
        elif challenge == "red_object":
            return self._detect_red_object(frame)
        elif challenge == "star_shape":
            return self._detect_star_shape(frame)
        else:
            logger.warning(f"Unknown challenge: {challenge}")
            return False, 0.0

    def _detect_stirring(self, frame: np.ndarray) -> Tuple[bool, float]:
        """Detect circular stirring motion."""
        poses = self.pose_detector.detect(frame)
        if not poses:
            return False, 0.0

        pose = poses[0]
        left_wrist, right_wrist = self.pose_detector.get_wrist_positions(pose)

        if not left_wrist and not right_wrist:
            return False, 0.0

        # Use the more visible wrist
        wrist = left_wrist if (left_wrist and left_wrist.get("visibility", 0) >
                               (right_wrist.get("visibility", 0) if right_wrist else 0)) else right_wrist

        if not wrist:
            return False, 0.0

        # Add to history
        self._wrist_history.append((wrist["x"], wrist["y"], time.time()))

        # Need enough history to detect motion
        if len(self._wrist_history) < 15:
            return False, 0.0

        # Check for circular motion pattern
        is_circular, confidence = self._check_circular_motion()
        return is_circular, confidence

    def _check_circular_motion(self) -> Tuple[bool, float]:
        """Check if recent wrist positions form a circular pattern."""
        if len(self._wrist_history) < 15:
            return False, 0.0

        points = [(p[0], p[1]) for p in self._wrist_history]

        # Calculate center of motion
        center_x = sum(p[0] for p in points) / len(points)
        center_y = sum(p[1] for p in points) / len(points)

        # Calculate angles from center
        angles = []
        for x, y in points:
            dx = x - center_x
            dy = y - center_y
            angle = np.arctan2(dy, dx)
            angles.append(angle)

        # Check if angles progress in one direction (circular motion)
        angle_diffs = []
        for i in range(1, len(angles)):
            diff = angles[i] - angles[i-1]
            # Normalize to [-pi, pi]
            while diff > np.pi:
                diff -= 2 * np.pi
            while diff < -np.pi:
                diff += 2 * np.pi
            angle_diffs.append(diff)

        # Check if most differences are in the same direction
        if not angle_diffs:
            return False, 0.0

        positive = sum(1 for d in angle_diffs if d > 0.05)
        negative = sum(1 for d in angle_diffs if d < -0.05)
        total = len(angle_diffs)

        # Need consistent direction
        max_direction = max(positive, negative)
        consistency = max_direction / total if total > 0 else 0

        # Check for sufficient motion amplitude
        x_range = max(p[0] for p in points) - min(p[0] for p in points)
        y_range = max(p[1] for p in points) - min(p[1] for p in points)
        motion_amplitude = (x_range + y_range) / 2

        # Require some minimum motion and direction consistency
        if motion_amplitude > 0.05 and consistency > 0.6:
            return True, min(consistency, 1.0)

        return False, consistency * 0.5

    def _detect_walking(self, frame: np.ndarray) -> Tuple[bool, float]:
        """Detect people walking horizontally across frame."""
        poses = self.pose_detector.detect(frame)
        if not poses:
            return False, 0.0

        # Get center position of detected person
        pose = poses[0]
        if not pose or "landmarks" not in pose:
            return False, 0.0

        # Use hip center as reference
        landmarks = pose["landmarks"]
        if len(landmarks) < 24:
            return False, 0.0

        LEFT_HIP = 23
        RIGHT_HIP = 24
        center_x = (landmarks[LEFT_HIP]["x"] + landmarks[RIGHT_HIP]["x"]) / 2

        self._position_history.append((center_x, time.time()))

        if len(self._position_history) < 10:
            return False, 0.0

        # Check for horizontal movement
        recent = list(self._position_history)[-20:]
        if len(recent) < 5:
            return False, 0.0

        start_x = recent[0][0]
        end_x = recent[-1][0]
        movement = abs(end_x - start_x)

        # Need significant horizontal movement
        if movement > 0.3:
            return True, min(movement / 0.5, 1.0)

        return False, movement / 0.3

    def _detect_tree_shape(self, frame: np.ndarray) -> Tuple[bool, float]:
        """Detect triangular/tree formation (very forgiving)."""
        poses = self.pose_detector.detect(frame)
        if not poses:
            return False, 0.0

        # For single person: arms up in triangle shape
        pose = poses[0]
        left_wrist, right_wrist = self.pose_detector.get_wrist_positions(pose)
        head = self.pose_detector.get_head_position(pose)

        if not left_wrist or not right_wrist or not head:
            return False, 0.0

        # Check if hands are above shoulders and somewhat together at top
        # Very forgiving check
        hands_up = left_wrist["y"] < head["y"] and right_wrist["y"] < head["y"]

        if hands_up:
            return True, 0.8

        return False, 0.3

    def _detect_antlers(self, frame: np.ndarray) -> Tuple[bool, float]:
        """Detect hands above head like antlers."""
        poses = self.pose_detector.detect(frame)
        if not poses:
            return False, 0.0

        pose = poses[0]
        hands_up = self.pose_detector.are_hands_above_head(pose)

        if hands_up:
            return True, 1.0

        # Partial credit if one hand is up
        left_wrist, right_wrist = self.pose_detector.get_wrist_positions(pose)
        head = self.pose_detector.get_head_position(pose)

        if head and ((left_wrist and left_wrist["y"] < head["y"]) or
                     (right_wrist and right_wrist["y"] < head["y"])):
            return False, 0.5

        return False, 0.0

    def _detect_bobbing(self, frame: np.ndarray) -> Tuple[bool, float]:
        """Detect vertical bobbing motion (sleigh ride)."""
        poses = self.pose_detector.detect(frame)
        if not poses:
            return False, 0.0

        pose = poses[0]
        head = self.pose_detector.get_head_position(pose)

        if not head:
            return False, 0.0

        self._position_history.append((head["y"], time.time()))

        if len(self._position_history) < 20:
            return False, 0.0

        # Check for vertical oscillation
        recent_y = [p[0] for p in list(self._position_history)[-30:]]

        if len(recent_y) < 10:
            return False, 0.0

        # Count direction changes (oscillations)
        direction_changes = 0
        for i in range(2, len(recent_y)):
            if (recent_y[i] - recent_y[i-1]) * (recent_y[i-1] - recent_y[i-2]) < 0:
                direction_changes += 1

        # Need multiple direction changes for bobbing
        if direction_changes >= 3:
            return True, min(direction_changes / 5, 1.0)

        return False, direction_changes / 3

    def _detect_red_object(self, frame: np.ndarray) -> Tuple[bool, float]:
        """Detect red object in center of frame."""
        detected, confidence = self.color_detector.detect_color(
            frame,
            color="red",
            region="center",
            min_pixel_ratio=0.02
        )
        return detected, confidence

    def _detect_star_shape(self, frame: np.ndarray) -> Tuple[bool, float]:
        """Detect star shape (arms extended)."""
        poses = self.pose_detector.detect(frame)
        if not poses:
            return False, 0.0

        pose = poses[0]
        arms_extended = self.pose_detector.are_arms_extended(pose)

        if arms_extended:
            return True, 1.0

        return False, 0.3

    def cleanup(self):
        """Release resources."""
        self.pose_detector.cleanup()
