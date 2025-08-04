"""
Pydantic models for 3D data validation and serialization.
Defines data structures for scenes, objects, meshes, and server states.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from enum import Enum


class Vector3(BaseModel):
    """3D vector representation."""
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0


class Color(BaseModel):
    """RGBA color representation."""
    r: float = Field(ge=0.0, le=1.0, default=1.0)
    g: float = Field(ge=0.0, le=1.0, default=1.0)
    b: float = Field(ge=0.0, le=1.0, default=1.0)
    a: float = Field(ge=0.0, le=1.0, default=1.0)


class ServerStatus(str, Enum):
    """Server status enumeration."""
    ONLINE = "online"
    OFFLINE = "offline"
    WARNING = "warning"
    ERROR = "error"
    MAINTENANCE = "maintenance"


class ServerMetrics(BaseModel):
    """Server performance metrics."""
    cpu_usage: float = Field(ge=0.0, le=100.0, description="CPU usage percentage")
    memory_usage: float = Field(ge=0.0, le=100.0, description="Memory usage percentage")
    disk_usage: float = Field(ge=0.0, le=100.0, description="Disk usage percentage")
    network_in: float = Field(ge=0.0, description="Network input in MB/s")
    network_out: float = Field(ge=0.0, description="Network output in MB/s")
    uptime: int = Field(ge=0, description="Uptime in seconds")


class ServerState(BaseModel):
    """Server state model for 3D visualization."""
    id: str = Field(description="Unique server identifier")
    name: str = Field(description="Human-readable server name")
    status: ServerStatus = ServerStatus.OFFLINE
    position: Vector3 = Field(default_factory=Vector3)
    color: Color = Field(default_factory=Color)
    metrics: ServerMetrics = Field(default_factory=ServerMetrics)
    alerts: List[str] = Field(default_factory=list)
    custom_data: Dict[str, Any] = Field(default_factory=dict)
    last_updated: Optional[str] = None


class Mesh(BaseModel):
    """3D mesh data for WebGL rendering."""
    vertices: List[float] = Field(description="Vertex positions (x,y,z)")
    indices: List[int] = Field(description="Triangle indices")
    normals: Optional[List[float]] = Field(default=None, description="Vertex normals")
    colors: Optional[List[float]] = Field(default=None, description="Vertex colors")
    uvs: Optional[List[float]] = Field(default=None, description="Texture coordinates")


class Object3D(BaseModel):
    """3D object in the scene."""
    id: str = Field(description="Unique object identifier")
    name: str = Field(description="Object name")
    position: Vector3 = Field(default_factory=Vector3)
    rotation: Vector3 = Field(default_factory=Vector3, description="Euler angles in radians")
    scale: Vector3 = Field(default_factory=lambda: Vector3(x=1.0, y=1.0, z=1.0))
    mesh: Mesh = Field(description="3D mesh data")
    material: Dict[str, Any] = Field(default_factory=dict, description="Material properties")
    visible: bool = True
    custom_data: Dict[str, Any] = Field(default_factory=dict)


class Camera(BaseModel):
    """3D camera configuration."""
    position: Vector3 = Field(default_factory=lambda: Vector3(x=0.0, y=0.0, z=5.0))
    target: Vector3 = Field(default_factory=Vector3)
    up: Vector3 = Field(default_factory=lambda: Vector3(x=0.0, y=1.0, z=0.0))
    fov: float = Field(default=75.0, ge=1.0, le=180.0, description="Field of view in degrees")
    near: float = Field(default=0.1, gt=0.0, description="Near clipping plane")
    far: float = Field(default=1000.0, gt=0.0, description="Far clipping plane")


class Scene3D(BaseModel):
    """Complete 3D scene definition."""
    id: str = Field(description="Unique scene identifier")
    name: str = Field(description="Scene name")
    objects: List[Object3D] = Field(default_factory=list)
    servers: List[ServerState] = Field(default_factory=list)
    camera: Camera = Field(default_factory=Camera)
    background_color: Color = Field(default_factory=lambda: Color(r=0.1, g=0.1, b=0.1, a=1.0))
    ambient_light: Color = Field(default_factory=lambda: Color(r=0.2, g=0.2, b=0.2, a=1.0))
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class SceneUpdate(BaseModel):
    """Real-time scene update message."""
    scene_id: str
    update_type: str = Field(description="Type of update: 'object', 'server', 'camera', etc.")
    data: Dict[str, Any] = Field(description="Update data")
    timestamp: Optional[str] = None


class WebGLShader(BaseModel):
    """WebGL shader definition."""
    vertex_shader: str = Field(description="GLSL vertex shader source")
    fragment_shader: str = Field(description="GLSL fragment shader source")
    uniforms: Dict[str, Any] = Field(default_factory=dict)
    attributes: List[str] = Field(default_factory=list)
