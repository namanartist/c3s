"""
ai_surveillance/backend/routers/ws.py
WebSocket manager for real-time telemetry streaming and emergency SOS broadcasting.
"""

from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["WebSockets"])


class ConnectionManager:
    """Manages active WebSocket connections to security dashboards and control rooms."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_alert(self, message: dict):
        """Dispatches high-priority alert to all connected operators."""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)

        for dead in disconnected:
            self.disconnect(dead)


ws_manager = ConnectionManager()


@router.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep alive and receive client heartbeats/acknowledgments
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

