"""
WebSocket endpoints for real-time communication.
Handles live updates, server monitoring, and interactive 3D scene changes.
"""

from typing import Dict, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.models import SceneUpdate, ServerState
import json
import asyncio
from datetime import datetime
import uuid

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections for real-time communication."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.scene_subscribers: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, scene_id: str = None):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if scene_id:
            if scene_id not in self.scene_subscribers:
                self.scene_subscribers[scene_id] = []
            self.scene_subscribers[scene_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, scene_id: str = None):
        """Remove a WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        if scene_id and scene_id in self.scene_subscribers:
            if websocket in self.scene_subscribers[scene_id]:
                self.scene_subscribers[scene_id].remove(websocket)
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a specific connection."""
        await websocket.send_text(message)
    
    async def broadcast(self, message: str):
        """Broadcast a message to all connections."""
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Connection might be closed
                pass
    
    async def broadcast_to_scene(self, message: str, scene_id: str):
        """Broadcast a message to all connections subscribed to a scene."""
        if scene_id in self.scene_subscribers:
            for connection in self.scene_subscribers[scene_id]:
                try:
                    await connection.send_text(message)
                except:
                    # Connection might be closed
                    pass


manager = ConnectionManager()


@router.websocket("/realtime")
async def websocket_endpoint(websocket: WebSocket):
    """General real-time WebSocket endpoint."""
    await manager.connect(websocket)
    
    try:
        # Send welcome message
        await manager.send_personal_message(
            json.dumps({
                "type": "connection",
                "status": "connected",
                "timestamp": datetime.utcnow().isoformat()
            }),
            websocket
        )
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "ping":
                await manager.send_personal_message(
                    json.dumps({"type": "pong", "timestamp": datetime.utcnow().isoformat()}),
                    websocket
                )
            
            elif message.get("type") == "echo":
                await manager.send_personal_message(
                    json.dumps({
                        "type": "echo_response",
                        "original_message": message,
                        "timestamp": datetime.utcnow().isoformat()
                    }),
                    websocket
                )
            
            elif message.get("type") == "broadcast":
                await manager.broadcast(
                    json.dumps({
                        "type": "broadcast_message",
                        "content": message.get("content", ""),
                        "timestamp": datetime.utcnow().isoformat()
                    })
                )
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.websocket("/realtime/scene/{scene_id}")
async def scene_websocket_endpoint(websocket: WebSocket, scene_id: str):
    """Scene-specific real-time WebSocket endpoint."""
    await manager.connect(websocket, scene_id)
    
    try:
        # Send welcome message
        await manager.send_personal_message(
            json.dumps({
                "type": "scene_connection",
                "scene_id": scene_id,
                "status": "connected",
                "timestamp": datetime.utcnow().isoformat()
            }),
            websocket
        )
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle scene-specific messages
            if message.get("type") == "scene_update":
                update = SceneUpdate(
                    scene_id=scene_id,
                    update_type=message.get("update_type", "unknown"),
                    data=message.get("data", {}),
                    timestamp=datetime.utcnow().isoformat()
                )
                
                # Broadcast update to all scene subscribers
                await manager.broadcast_to_scene(
                    json.dumps({
                        "type": "scene_update",
                        "scene_id": scene_id,
                        "update_type": update.update_type,
                        "data": update.data,
                        "timestamp": update.timestamp
                    }),
                    scene_id
                )
            
            elif message.get("type") == "object_transform":
                # Handle object transformation updates
                await manager.broadcast_to_scene(
                    json.dumps({
                        "type": "object_transform",
                        "scene_id": scene_id,
                        "object_id": message.get("object_id"),
                        "transform": message.get("transform", {}),
                        "timestamp": datetime.utcnow().isoformat()
                    }),
                    scene_id
                )
            
            elif message.get("type") == "camera_update":
                # Handle camera updates
                await manager.broadcast_to_scene(
                    json.dumps({
                        "type": "camera_update",
                        "scene_id": scene_id,
                        "camera": message.get("camera", {}),
                        "timestamp": datetime.utcnow().isoformat()
                    }),
                    scene_id
                )
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, scene_id)


@router.websocket("/realtime/server-monitor")
async def server_monitor_websocket(websocket: WebSocket):
    """WebSocket endpoint for server monitoring updates."""
    await manager.connect(websocket)
    
    try:
        # Send welcome message
        await manager.send_personal_message(
            json.dumps({
                "type": "server_monitor_connection",
                "status": "connected",
                "timestamp": datetime.utcnow().isoformat()
            }),
            websocket
        )
        
        # Start sending mock server data
        while True:
            # Generate mock server states
            servers = []
            for i in range(5):
                server = ServerState(
                    id=f"server-{i}",
                    name=f"Server {i+1}",
                    status="online",
                    position={
                        "x": (i - 2) * 3.0,
                        "y": 0.0,
                        "z": 0.0
                    },
                    metrics={
                        "cpu_usage": 20 + (i * 15) % 80,
                        "memory_usage": 30 + (i * 20) % 70,
                        "disk_usage": 40 + (i * 10) % 60,
                        "network_in": 10 + (i * 5) % 50,
                        "network_out": 15 + (i * 7) % 45,
                        "uptime": 86400 + i * 3600
                    }
                )
                servers.append(server.dict())
            
            # Send server update
            await manager.send_personal_message(
                json.dumps({
                    "type": "server_update",
                    "servers": servers,
                    "timestamp": datetime.utcnow().isoformat()
                }),
                websocket
            )
            
            # Wait 5 seconds before next update
            await asyncio.sleep(5)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# Utility function to send updates from other parts of the application
async def send_scene_update(scene_id: str, update_type: str, data: Dict):
    """Send a scene update to all subscribed clients."""
    update_message = json.dumps({
        "type": "scene_update",
        "scene_id": scene_id,
        "update_type": update_type,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    await manager.broadcast_to_scene(update_message, scene_id)
