"""
Scene management API endpoints.
Handles creation, retrieval, and management of 3D scenes.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from app.models import Scene3D, Object3D, Camera
from app.webgl_generator import MeshGenerator, WebGLCodeGenerator
import uuid
from datetime import datetime

router = APIRouter()

# In-memory storage for demo purposes
# In production, use a proper database
scenes_storage: Dict[str, Scene3D] = {}


def get_scene(scene_id: str) -> Scene3D:
    """Dependency to get a scene by ID."""
    if scene_id not in scenes_storage:
        raise HTTPException(status_code=404, detail="Scene not found")
    return scenes_storage[scene_id]


@router.get("/scenes", response_model=List[Dict[str, Any]])
async def list_scenes():
    """List all available scenes."""
    return [
        {
            "id": scene.id,
            "name": scene.name,
            "object_count": len(scene.objects),
            "server_count": len(scene.servers),
            "created_at": scene.created_at,
            "updated_at": scene.updated_at
        }
        for scene in scenes_storage.values()
    ]


@router.post("/scenes", response_model=Scene3D)
async def create_scene(scene: Scene3D):
    """Create a new 3D scene."""
    if not scene.id:
        scene.id = str(uuid.uuid4())
    
    if scene.id in scenes_storage:
        raise HTTPException(status_code=400, detail="Scene with this ID already exists")
    
    now = datetime.utcnow().isoformat()
    scene.created_at = now
    scene.updated_at = now
    
    scenes_storage[scene.id] = scene
    return scene


@router.get("/scenes/{scene_id}", response_model=Scene3D)
async def get_scene_data(scene: Scene3D = Depends(get_scene)):
    """Get complete scene data."""
    return scene


@router.put("/scenes/{scene_id}", response_model=Scene3D)
async def update_scene(scene_id: str, updated_scene: Scene3D):
    """Update an existing scene."""
    if scene_id not in scenes_storage:
        raise HTTPException(status_code=404, detail="Scene not found")
    
    updated_scene.id = scene_id
    updated_scene.updated_at = datetime.utcnow().isoformat()
    scenes_storage[scene_id] = updated_scene
    return updated_scene


@router.delete("/scenes/{scene_id}")
async def delete_scene(scene_id: str):
    """Delete a scene."""
    if scene_id not in scenes_storage:
        raise HTTPException(status_code=404, detail="Scene not found")
    
    del scenes_storage[scene_id]
    return {"message": "Scene deleted successfully"}


@router.get("/scenes/{scene_id}/webgl", response_model=Dict[str, Any])
async def get_scene_webgl_data(scene: Scene3D = Depends(get_scene)):
    """Get scene data formatted for WebGL rendering."""
    webgl_objects = []
    for obj in scene.objects:
        webgl_objects.append(WebGLCodeGenerator.generate_object_data(obj))
    
    return {
        "scene_id": scene.id,
        "name": scene.name,
        "objects": webgl_objects,
        "camera": {
            "position": [scene.camera.position.x, scene.camera.position.y, scene.camera.position.z],
            "target": [scene.camera.target.x, scene.camera.target.y, scene.camera.target.z],
            "up": [scene.camera.up.x, scene.camera.up.y, scene.camera.up.z],
            "fov": scene.camera.fov,
            "near": scene.camera.near,
            "far": scene.camera.far
        },
        "background_color": [
            scene.background_color.r,
            scene.background_color.g,
            scene.background_color.b,
            scene.background_color.a
        ],
        "ambient_light": [
            scene.ambient_light.r,
            scene.ambient_light.g,
            scene.ambient_light.b
        ]
    }


@router.post("/scenes/{scene_id}/objects", response_model=Object3D)
async def add_object_to_scene(scene_id: str, obj: Object3D):
    """Add a new object to an existing scene."""
    scene = get_scene(scene_id)
    
    if not obj.id:
        obj.id = str(uuid.uuid4())
    
    # Check if object ID already exists in scene
    if any(existing_obj.id == obj.id for existing_obj in scene.objects):
        raise HTTPException(status_code=400, detail="Object with this ID already exists in scene")
    
    scene.objects.append(obj)
    scene.updated_at = datetime.utcnow().isoformat()
    return obj


@router.delete("/scenes/{scene_id}/objects/{object_id}")
async def remove_object_from_scene(scene_id: str, object_id: str):
    """Remove an object from a scene."""
    scene = get_scene(scene_id)
    
    # Find and remove the object
    for i, obj in enumerate(scene.objects):
        if obj.id == object_id:
            del scene.objects[i]
            scene.updated_at = datetime.utcnow().isoformat()
            return {"message": "Object removed successfully"}
    
    raise HTTPException(status_code=404, detail="Object not found in scene")


# Initialize with a demo scene
async def create_demo_scene():
    """Create a demo scene with basic objects."""
    if "demo" not in scenes_storage:
        # Create cube mesh
        cube_mesh = MeshGenerator.create_cube(2.0)
        
        # Create sphere mesh
        sphere_mesh = MeshGenerator.create_sphere(1.5, 16, 16)
        
        # Create objects
        cube_obj = Object3D(
            id="cube1",
            name="Demo Cube",
            position={"x": -3.0, "y": 0.0, "z": 0.0},
            mesh=cube_mesh,
            material={"color": [1.0, 0.5, 0.2, 1.0]}
        )
        
        sphere_obj = Object3D(
            id="sphere1", 
            name="Demo Sphere",
            position={"x": 3.0, "y": 0.0, "z": 0.0},
            mesh=sphere_mesh,
            material={"color": [0.2, 0.8, 1.0, 1.0]}
        )
        
        # Create demo scene
        demo_scene = Scene3D(
            id="demo",
            name="Demo Scene",
            objects=[cube_obj, sphere_obj],
            camera=Camera(
                position={"x": 0.0, "y": 0.0, "z": 10.0},
                target={"x": 0.0, "y": 0.0, "z": 0.0}
            )
        )
        
        now = datetime.utcnow().isoformat()
        demo_scene.created_at = now
        demo_scene.updated_at = now
        
        scenes_storage["demo"] = demo_scene

# Create demo scene on startup
import asyncio
asyncio.create_task(create_demo_scene())
