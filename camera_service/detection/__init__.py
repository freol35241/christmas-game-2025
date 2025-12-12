"""
Detection modules for the camera service.
"""

from .pose_detector import PoseDetector
from .color_detector import ColorDetector
from .challenges import ChallengeDetector

__all__ = ["PoseDetector", "ColorDetector", "ChallengeDetector"]
