"""
Pose detection using MediaPipe for physical challenges.
"""

import logging
from typing import List, Optional, Tuple
import numpy as np

try:
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False

logger = logging.getLogger(__name__)


class PoseDetector:
    """Detects human poses using MediaPipe."""

    def __init__(self):
        self.pose = None
        self.mp_pose = None
        self.mp_drawing = None

        if MEDIAPIPE_AVAILABLE:
            self.mp_pose = mp.solutions.pose
            self.mp_drawing = mp.solutions.drawing_utils
            self.pose = self.mp_pose.Pose(
                static_image_mode=False,
                model_complexity=1,
                enable_segmentation=False,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            logger.info("MediaPipe Pose initialized")
        else:
            logger.warning("MediaPipe not available - pose detection disabled")

    def detect(self, frame: np.ndarray) -> Optional[List[dict]]:
        """
        Detect poses in a frame.

        Returns a list of detected poses, each containing landmark positions.
        """
        if not self.pose:
            return None

        # Convert BGR to RGB
        rgb_frame = frame[:, :, ::-1]

        results = self.pose.process(rgb_frame)

        if not results.pose_landmarks:
            return None

        # Extract landmark positions
        landmarks = []
        for landmark in results.pose_landmarks.landmark:
            landmarks.append({
                "x": landmark.x,
                "y": landmark.y,
                "z": landmark.z,
                "visibility": landmark.visibility
            })

        return [{"landmarks": landmarks}]

    def get_wrist_positions(self, pose: dict) -> Tuple[Optional[dict], Optional[dict]]:
        """Get left and right wrist positions from a pose."""
        if not pose or "landmarks" not in pose:
            return None, None

        landmarks = pose["landmarks"]

        # MediaPipe landmark indices
        LEFT_WRIST = 15
        RIGHT_WRIST = 16

        left_wrist = None
        right_wrist = None

        if len(landmarks) > LEFT_WRIST:
            left_wrist = landmarks[LEFT_WRIST]
        if len(landmarks) > RIGHT_WRIST:
            right_wrist = landmarks[RIGHT_WRIST]

        return left_wrist, right_wrist

    def get_hand_positions(self, pose: dict) -> Tuple[Optional[dict], Optional[dict]]:
        """Get left and right hand positions (index finger tip or wrist fallback)."""
        # For simplicity, use wrist positions
        return self.get_wrist_positions(pose)

    def get_head_position(self, pose: dict) -> Optional[dict]:
        """Get head/nose position from a pose."""
        if not pose or "landmarks" not in pose:
            return None

        landmarks = pose["landmarks"]
        NOSE = 0

        if len(landmarks) > NOSE:
            return landmarks[NOSE]
        return None

    def are_hands_above_head(self, pose: dict, threshold: float = 0.1) -> bool:
        """Check if both hands are above the head."""
        left_wrist, right_wrist = self.get_wrist_positions(pose)
        head = self.get_head_position(pose)

        if not left_wrist or not right_wrist or not head:
            return False

        # In MediaPipe, y increases downward, so hands above head means lower y
        return (left_wrist["y"] < head["y"] - threshold and
                right_wrist["y"] < head["y"] - threshold)

    def are_arms_extended(self, pose: dict, threshold: float = 0.3) -> bool:
        """Check if arms are extended outward (star pose)."""
        if not pose or "landmarks" not in pose:
            return False

        landmarks = pose["landmarks"]

        # Check shoulder-to-wrist distance is significant
        LEFT_SHOULDER = 11
        RIGHT_SHOULDER = 12
        LEFT_WRIST = 15
        RIGHT_WRIST = 16

        if len(landmarks) <= max(LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_WRIST, RIGHT_WRIST):
            return False

        left_shoulder = landmarks[LEFT_SHOULDER]
        right_shoulder = landmarks[RIGHT_SHOULDER]
        left_wrist = landmarks[LEFT_WRIST]
        right_wrist = landmarks[RIGHT_WRIST]

        # Calculate horizontal distance from shoulder to wrist
        left_extension = abs(left_wrist["x"] - left_shoulder["x"])
        right_extension = abs(right_wrist["x"] - right_shoulder["x"])

        return left_extension > threshold and right_extension > threshold

    def cleanup(self):
        """Release resources."""
        if self.pose:
            self.pose.close()
