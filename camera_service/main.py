#!/usr/bin/env python3
"""
Camera service for Tomtens Försvunna Minnen.

This service captures video from a webcam, performs pose and color detection,
and communicates results to the Godot game via WebSocket.
"""

import argparse
import asyncio
import logging
import sys
import time
from typing import Optional

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("Warning: OpenCV not available. Install with: pip install opencv-python")

from websocket_client import WebSocketClient
from detection import ChallengeDetector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


class CameraService:
    """Main camera service that processes video and sends detection results."""

    def __init__(self, server_uri: str = "ws://localhost:8765", camera_id: int = 0):
        self.server_uri = server_uri
        self.camera_id = camera_id

        self.ws_client = WebSocketClient(server_uri)
        self.challenge_detector = ChallengeDetector()

        self.cap: Optional[cv2.VideoCapture] = None
        self.running = False
        self.show_preview = True

        # Detection state
        self.current_challenge: Optional[str] = None
        self.last_update_time = 0
        self.update_interval = 0.1  # Send updates every 100ms

    async def start(self):
        """Start the camera service."""
        logger.info("Starting camera service...")

        # Connect to WebSocket server
        connected = await self.ws_client.connect()
        if not connected:
            logger.error("Failed to connect to server")
            return False

        # Set up message handler
        self.ws_client.set_message_handler(self._handle_message)

        # Start camera
        if CV2_AVAILABLE:
            self.cap = cv2.VideoCapture(self.camera_id)
            if not self.cap.isOpened():
                logger.error(f"Failed to open camera {self.camera_id}")
                return False

            # Configure camera
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.cap.set(cv2.CAP_PROP_FPS, 30)

            logger.info(f"Camera {self.camera_id} opened successfully")
        else:
            logger.warning("OpenCV not available - running in demo mode")

        self.running = True
        return True

    async def run(self):
        """Main loop - process frames and handle WebSocket messages."""
        if not self.running:
            success = await self.start()
            if not success:
                return

        # Create tasks for message receiving and frame processing
        receive_task = asyncio.create_task(self.ws_client.receive_messages())
        process_task = asyncio.create_task(self._process_frames())

        try:
            await asyncio.gather(receive_task, process_task)
        except asyncio.CancelledError:
            logger.info("Service cancelled")
        finally:
            await self.stop()

    async def _process_frames(self):
        """Process video frames in a loop."""
        while self.running:
            if CV2_AVAILABLE and self.cap and self.cap.isOpened():
                ret, frame = self.cap.read()
                if ret:
                    await self._process_frame(frame)

                    # Show preview window
                    if self.show_preview:
                        self._show_preview(frame)

                    # Check for quit key
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        self.running = False
                        break
            else:
                # Demo mode - generate fake detection results
                await self._demo_detection()

            await asyncio.sleep(0.033)  # ~30 FPS

    async def _process_frame(self, frame):
        """Process a single frame."""
        if not self.current_challenge:
            return

        # Run detection
        result = self.challenge_detector.process_frame(frame)

        # Send update at regular intervals
        current_time = time.time()
        if current_time - self.last_update_time >= self.update_interval:
            self.last_update_time = current_time

            await self.ws_client.send({
                "type": "detection_update",
                "challenge": self.current_challenge,
                "detected": result["detected"],
                "confidence": result["confidence"],
                "duration_met": result["duration_met"],
                "current_duration": result.get("current_duration", 0),
                "required_duration": result.get("required_duration", 3.0)
            })

            # Check if challenge complete
            if result["duration_met"]:
                await self.ws_client.send({
                    "type": "challenge_complete",
                    "challenge": self.current_challenge,
                    "success": True
                })
                self.current_challenge = None
                self.challenge_detector.stop_challenge()

    async def _demo_detection(self):
        """Generate fake detection results for demo mode."""
        if not self.current_challenge:
            return

        # Simulate detection for demo
        import random

        current_time = time.time()
        if current_time - self.last_update_time >= self.update_interval:
            self.last_update_time = current_time

            # Random detection with some consistency
            detected = random.random() > 0.3

            await self.ws_client.send({
                "type": "detection_update",
                "challenge": self.current_challenge,
                "detected": detected,
                "confidence": random.uniform(0.5, 1.0) if detected else random.uniform(0, 0.5),
                "duration_met": False
            })

    def _show_preview(self, frame):
        """Show preview window with detection overlay."""
        if not CV2_AVAILABLE:
            return

        # Draw detection status
        status = f"Challenge: {self.current_challenge or 'None'}"
        cv2.putText(frame, status, (10, 30), cv2.FONT_HERSHEY_SIMPLEX,
                    0.7, (0, 255, 0), 2)

        if self.current_challenge:
            detector_state = "Detecting..."
            cv2.putText(frame, detector_state, (10, 60), cv2.FONT_HERSHEY_SIMPLEX,
                        0.7, (0, 255, 255), 2)

        cv2.imshow("Camera Service", frame)

    async def _handle_message(self, message: dict):
        """Handle messages from the game server."""
        msg_type = message.get("type", "")

        if msg_type == "start_detection":
            challenge = message.get("challenge", "")
            params = message.get("parameters", {})

            logger.info(f"Starting detection for challenge: {challenge}")
            self.current_challenge = challenge
            self.challenge_detector.start_challenge(challenge, params)

        elif msg_type == "stop_detection":
            logger.info("Stopping detection")
            self.current_challenge = None
            self.challenge_detector.stop_challenge()

    async def stop(self):
        """Stop the camera service."""
        self.running = False

        if self.cap:
            self.cap.release()

        if CV2_AVAILABLE:
            cv2.destroyAllWindows()

        await self.ws_client.disconnect()
        self.challenge_detector.cleanup()

        logger.info("Camera service stopped")


def main():
    """Entry point."""
    parser = argparse.ArgumentParser(description="Camera service for Tomtens Försvunna Minnen")
    parser.add_argument("--server", "-s", default="ws://localhost:8765",
                        help="WebSocket server URI")
    parser.add_argument("--camera", "-c", type=int, default=0,
                        help="Camera device ID")
    parser.add_argument("--no-preview", action="store_true",
                        help="Disable camera preview window")
    parser.add_argument("--debug", "-d", action="store_true",
                        help="Enable debug logging")

    args = parser.parse_args()

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    service = CameraService(server_uri=args.server, camera_id=args.camera)
    service.show_preview = not args.no_preview

    try:
        asyncio.run(service.run())
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
        sys.exit(0)


if __name__ == "__main__":
    main()
