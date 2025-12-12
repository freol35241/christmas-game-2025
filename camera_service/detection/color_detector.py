"""
Color detection for physical challenges (e.g., finding red objects).
"""

import logging
from typing import Tuple
import numpy as np

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

logger = logging.getLogger(__name__)


class ColorDetector:
    """Detects specific colors in video frames."""

    # HSV color ranges
    COLOR_RANGES = {
        "red": [
            # Red wraps around in HSV, so we need two ranges
            {"lower": (0, 100, 100), "upper": (10, 255, 255)},
            {"lower": (170, 100, 100), "upper": (180, 255, 255)}
        ],
        "green": [
            {"lower": (40, 50, 50), "upper": (80, 255, 255)}
        ],
        "blue": [
            {"lower": (100, 50, 50), "upper": (130, 255, 255)}
        ],
        "yellow": [
            {"lower": (20, 100, 100), "upper": (35, 255, 255)}
        ],
        "gold": [
            {"lower": (15, 100, 150), "upper": (35, 255, 255)}
        ]
    }

    def __init__(self):
        if not CV2_AVAILABLE:
            logger.warning("OpenCV not available - color detection disabled")

    def detect_color(
        self,
        frame: np.ndarray,
        color: str = "red",
        region: str = "center",
        min_pixel_ratio: float = 0.01
    ) -> Tuple[bool, float]:
        """
        Detect if a specific color is present in the frame.

        Args:
            frame: BGR image frame
            color: Color to detect ("red", "green", "blue", etc.)
            region: Region to search ("center", "full", "left", "right")
            min_pixel_ratio: Minimum ratio of colored pixels to detect

        Returns:
            Tuple of (detected: bool, confidence: float)
        """
        if not CV2_AVAILABLE:
            return False, 0.0

        if color not in self.COLOR_RANGES:
            logger.warning(f"Unknown color: {color}")
            return False, 0.0

        # Extract region
        roi = self._get_region(frame, region)

        # Convert to HSV
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)

        # Create mask for the color
        mask = np.zeros(hsv.shape[:2], dtype=np.uint8)

        for range_def in self.COLOR_RANGES[color]:
            lower = np.array(range_def["lower"])
            upper = np.array(range_def["upper"])
            color_mask = cv2.inRange(hsv, lower, upper)
            mask = cv2.bitwise_or(mask, color_mask)

        # Calculate ratio of colored pixels
        total_pixels = mask.shape[0] * mask.shape[1]
        colored_pixels = cv2.countNonZero(mask)
        ratio = colored_pixels / total_pixels if total_pixels > 0 else 0

        detected = ratio >= min_pixel_ratio
        confidence = min(ratio / min_pixel_ratio, 1.0) if detected else ratio / min_pixel_ratio

        return detected, confidence

    def _get_region(self, frame: np.ndarray, region: str) -> np.ndarray:
        """Extract a region of interest from the frame."""
        height, width = frame.shape[:2]

        if region == "center":
            # Center third of the frame
            x1 = width // 3
            x2 = 2 * width // 3
            y1 = height // 3
            y2 = 2 * height // 3
            return frame[y1:y2, x1:x2]

        elif region == "left":
            return frame[:, :width // 2]

        elif region == "right":
            return frame[:, width // 2:]

        elif region == "top":
            return frame[:height // 2, :]

        elif region == "bottom":
            return frame[height // 2:, :]

        else:  # "full"
            return frame

    def get_color_center(self, frame: np.ndarray, color: str) -> Tuple[int, int]:
        """
        Find the center of the largest colored region.

        Returns:
            Tuple of (x, y) coordinates, or (-1, -1) if not found
        """
        if not CV2_AVAILABLE:
            return -1, -1

        if color not in self.COLOR_RANGES:
            return -1, -1

        # Convert to HSV
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        # Create mask
        mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
        for range_def in self.COLOR_RANGES[color]:
            lower = np.array(range_def["lower"])
            upper = np.array(range_def["upper"])
            color_mask = cv2.inRange(hsv, lower, upper)
            mask = cv2.bitwise_or(mask, color_mask)

        # Find contours
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return -1, -1

        # Find largest contour
        largest = max(contours, key=cv2.contourArea)

        # Get center
        M = cv2.moments(largest)
        if M["m00"] == 0:
            return -1, -1

        cx = int(M["m10"] / M["m00"])
        cy = int(M["m01"] / M["m00"])

        return cx, cy
