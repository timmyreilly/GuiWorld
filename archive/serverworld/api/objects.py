"""
3D object manipulation API endpoints.
Handles individual 3D objects, mesh generation, and transformations.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from app.models import Object3D, Mesh, Vector3
from app.webgl_generator import MeshGenerator, WebGLCodeGenerator
import uuid

router = APIRouter()


@router.post("/objects/cube", response_model=Object3D)
async def create_cube_object(
    size: float = 1.0,
    name: str = "Cube",
    position: Vector3 = None,
    color: List[float] = None
):
    """Create a new cube object."""
    if position is None:
        position = Vector3()
    if color is None:
        color = [1.0, 1.0, 1.0, 1.0]
    
    mesh = MeshGenerator.create_cube(size)
    
    # Apply color to mesh
    if mesh.colors:
        mesh.colors = color * (len(mesh.colors) // 4)
    
    obj = Object3D(
        id=str(uuid.uuid4()),
        name=name,
        position=position,
        mesh=mesh,
        material={"color": color}
    )
    
    return obj


@router.post("/objects/sphere", response_model=Object3D)
async def create_sphere_object(
    radius: float = 1.0,
    segments: int = 16,
    rings: int = 16,
    name: str = "Sphere",
    position: Vector3 = None,
    color: List[float] = None
):
    """Create a new sphere object."""
    if position is None:
        position = Vector3()
    if color is None:
        color = [1.0, 1.0, 1.0, 1.0]
    
    mesh = MeshGenerator.create_sphere(radius, segments, rings)
    
    # Apply color to mesh
    if mesh.colors:
        mesh.colors = color * (len(mesh.colors) // 4)
    
    obj = Object3D(
        id=str(uuid.uuid4()),
        name=name,
        position=position,
        mesh=mesh,
        material={"color": color}
    )
    
    return obj


@router.post("/objects/plane", response_model=Object3D)
async def create_plane_object(
    width: float = 1.0,
    height: float = 1.0,
    width_segments: int = 1,
    height_segments: int = 1,
    name: str = "Plane",
    position: Vector3 = None,
    color: List[float] = None
):
    """Create a new plane object."""
    if position is None:
        position = Vector3()
    if color is None:
        color = [1.0, 1.0, 1.0, 1.0]
    
    mesh = MeshGenerator.create_plane(width, height, width_segments, height_segments)
    
    # Apply color to mesh
    if mesh.colors:
        mesh.colors = color * (len(mesh.colors) // 4)
    
    obj = Object3D(
        id=str(uuid.uuid4()),
        name=name,
        position=position,
        mesh=mesh,
        material={"color": color}
    )
    
    return obj


@router.get("/objects/{object_id}/webgl", response_model=Dict[str, Any])
async def get_object_webgl_data(object_id: str):
    """Get object data formatted for WebGL rendering."""
    # In a real application, you would retrieve the object from storage
    # For now, create a demo cube
    mesh = MeshGenerator.create_cube(1.0)
    obj = Object3D(
        id=object_id,
        name="Demo Object",
        mesh=mesh,
        material={"color": [1.0, 0.5, 0.2, 1.0]}
    )
    
    return WebGLCodeGenerator.generate_object_data(obj)


@router.post("/objects/custom", response_model=Object3D)
async def create_custom_object(obj: Object3D):
    """Create a custom object with provided mesh data."""
    if not obj.id:
        obj.id = str(uuid.uuid4())
    
    return obj


@router.get("/meshes/primitives")
async def get_primitive_meshes():
    """Get a list of available primitive mesh types."""
    return {
        "primitives": [
            {
                "type": "cube",
                "description": "Basic cube primitive",
                "parameters": ["size"]
            },
            {
                "type": "sphere",
                "description": "UV sphere primitive",
                "parameters": ["radius", "segments", "rings"]
            },
            {
                "type": "plane",
                "description": "Flat plane primitive",
                "parameters": ["width", "height", "width_segments", "height_segments"]
            }
        ]
    }


@router.post("/meshes/generate/{primitive_type}", response_model=Mesh)
async def generate_primitive_mesh(
    primitive_type: str,
    parameters: Dict[str, Any] = None
):
    """Generate a primitive mesh with given parameters."""
    if parameters is None:
        parameters = {}
    
    if primitive_type == "cube":
        size = parameters.get("size", 1.0)
        return MeshGenerator.create_cube(size)
    
    elif primitive_type == "sphere":
        radius = parameters.get("radius", 1.0)
        segments = parameters.get("segments", 16)
        rings = parameters.get("rings", 16)
        return MeshGenerator.create_sphere(radius, segments, rings)
    
    elif primitive_type == "plane":
        width = parameters.get("width", 1.0)
        height = parameters.get("height", 1.0)
        width_segments = parameters.get("width_segments", 1)
        height_segments = parameters.get("height_segments", 1)
        return MeshGenerator.create_plane(width, height, width_segments, height_segments)
    
    else:
        raise HTTPException(status_code=400, detail=f"Unknown primitive type: {primitive_type}")


@router.post("/objects/{object_id}/transform")
async def transform_object(
    object_id: str,
    position: Vector3 = None,
    rotation: Vector3 = None,
    scale: Vector3 = None
):
    """Apply transformations to an object."""
    # In a real application, you would update the object in storage
    transformations = {}
    
    if position:
        transformations["position"] = [position.x, position.y, position.z]
    if rotation:
        transformations["rotation"] = [rotation.x, rotation.y, rotation.z]
    if scale:
        transformations["scale"] = [scale.x, scale.y, scale.z]
    
    return {
        "object_id": object_id,
        "transformations": transformations,
        "message": "Transformations applied successfully"
    }
