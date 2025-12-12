"""
WebSocket client for connecting to the Godot game server.
"""

import asyncio
import json
import logging
from typing import Callable, Optional
import websockets
from websockets.client import WebSocketClientProtocol

logger = logging.getLogger(__name__)


class WebSocketClient:
    """WebSocket client for camera service to Godot communication."""

    def __init__(self, uri: str = "ws://localhost:8765"):
        self.uri = uri
        self.websocket: Optional[WebSocketClientProtocol] = None
        self.connected = False
        self.message_handler: Optional[Callable] = None
        self._reconnect_delay = 2.0
        self._max_reconnect_attempts = 10

    async def connect(self) -> bool:
        """Connect to the WebSocket server."""
        attempts = 0
        while attempts < self._max_reconnect_attempts:
            try:
                self.websocket = await websockets.connect(self.uri)
                self.connected = True
                logger.info(f"Connected to {self.uri}")

                # Send ready message
                await self.send({
                    "type": "camera_ready"
                })

                return True
            except Exception as e:
                attempts += 1
                logger.warning(f"Connection attempt {attempts} failed: {e}")
                await asyncio.sleep(self._reconnect_delay)

        logger.error(f"Failed to connect after {self._max_reconnect_attempts} attempts")
        return False

    async def disconnect(self):
        """Disconnect from the WebSocket server."""
        if self.websocket:
            await self.websocket.close()
            self.websocket = None
        self.connected = False
        logger.info("Disconnected from server")

    async def send(self, message: dict):
        """Send a message to the server."""
        if not self.connected or not self.websocket:
            logger.warning("Cannot send - not connected")
            return

        try:
            await self.websocket.send(json.dumps(message))
        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            self.connected = False

    async def receive_messages(self):
        """Continuously receive messages from the server."""
        if not self.websocket:
            return

        try:
            async for message in self.websocket:
                try:
                    data = json.loads(message)
                    if self.message_handler:
                        await self.message_handler(data)
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON received: {message}")
        except websockets.exceptions.ConnectionClosed:
            logger.info("Connection closed")
            self.connected = False
        except Exception as e:
            logger.error(f"Error receiving messages: {e}")
            self.connected = False

    def set_message_handler(self, handler: Callable):
        """Set the callback for handling received messages."""
        self.message_handler = handler
