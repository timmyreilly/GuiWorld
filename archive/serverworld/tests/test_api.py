"""
Basic API tests for the ServerWorld application.
Tests API endpoints, data models, and basic functionality.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Test the root endpoint returns the home page."""
    response = client.get("/")
    assert response.status_code == 200
    assert "ServerWorld" in response.text


def test_health_check():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "serverworld"


def test_viewer_page():
    """Test the 3D viewer page."""
    response = client.get("/viewer")
    assert response.status_code == 200
    assert "3D Viewer" in response.text


def test_demos_page():
    """Test the demos page."""
    response = client.get("/demos")
    assert response.status_code == 200
    assert "Demos" in response.text


def test_cube_demo():
    """Test the cube demo page."""
    response = client.get("/demos/cube")
    assert response.status_code == 200
    assert "Cube Demo" in response.text


def test_list_scenes():
    """Test listing scenes."""
    response = client.get("/api/scenes")
    assert response.status_code == 200
    scenes = response.json()
    assert isinstance(scenes, list)


def test_create_cube_object():
    """Test creating a cube object."""
    response = client.post("/api/objects/cube", json={
        "size": 2.0,
        "name": "Test Cube",
        "position": {"x": 1.0, "y": 2.0, "z": 3.0},
        "color": [1.0, 0.5, 0.2, 1.0]
    })
    assert response.status_code == 200
    obj = response.json()
    assert obj["name"] == "Test Cube"
    assert obj["position"]["x"] == 1.0
    assert obj["mesh"]["vertices"] is not None


def test_create_sphere_object():
    """Test creating a sphere object."""
    response = client.post("/api/objects/sphere", json={
        "radius": 1.5,
        "segments": 16,
        "rings": 16,
        "name": "Test Sphere"
    })
    assert response.status_code == 200
    obj = response.json()
    assert obj["name"] == "Test Sphere"
    assert obj["mesh"]["vertices"] is not None


def test_get_primitive_meshes():
    """Test getting available primitive mesh types."""
    response = client.get("/api/meshes/primitives")
    assert response.status_code == 200
    data = response.json()
    assert "primitives" in data
    primitives = data["primitives"]
    
    # Check that we have the expected primitives
    primitive_types = [p["type"] for p in primitives]
    assert "cube" in primitive_types
    assert "sphere" in primitive_types
    assert "plane" in primitive_types


def test_generate_cube_mesh():
    """Test generating a cube mesh."""
    response = client.post("/api/meshes/generate/cube", json={
        "size": 1.5
    })
    assert response.status_code == 200
    mesh = response.json()
    assert "vertices" in mesh
    assert "indices" in mesh
    assert len(mesh["vertices"]) > 0
    assert len(mesh["indices"]) > 0


def test_generate_sphere_mesh():
    """Test generating a sphere mesh."""
    response = client.post("/api/meshes/generate/sphere", json={
        "radius": 2.0,
        "segments": 32,
        "rings": 16
    })
    assert response.status_code == 200
    mesh = response.json()
    assert "vertices" in mesh
    assert "indices" in mesh
    assert len(mesh["vertices"]) > 0
    assert len(mesh["indices"]) > 0


def test_transform_object():
    """Test transforming an object."""
    response = client.post("/api/objects/test-object/transform", json={
        "position": {"x": 5.0, "y": 10.0, "z": 15.0},
        "rotation": {"x": 0.5, "y": 1.0, "z": 1.5},
        "scale": {"x": 2.0, "y": 2.0, "z": 2.0}
    })
    assert response.status_code == 200
    result = response.json()
    assert result["object_id"] == "test-object"
    assert "transformations" in result


def test_create_scene():
    """Test creating a new scene."""
    scene_data = {
        "id": "test-scene",
        "name": "Test Scene",
        "objects": [],
        "camera": {
            "position": {"x": 0.0, "y": 0.0, "z": 10.0},
            "target": {"x": 0.0, "y": 0.0, "z": 0.0},
            "fov": 75.0
        },
        "background_color": {"r": 0.2, "g": 0.2, "b": 0.2, "a": 1.0}
    }
    
    response = client.post("/api/scenes", json=scene_data)
    assert response.status_code == 200
    scene = response.json()
    assert scene["id"] == "test-scene"
    assert scene["name"] == "Test Scene"


def test_get_scene():
    """Test getting a specific scene."""
    # First create a scene
    scene_data = {
        "id": "get-test-scene",
        "name": "Get Test Scene",
        "objects": []
    }
    client.post("/api/scenes", json=scene_data)
    
    # Then get it
    response = client.get("/api/scenes/get-test-scene")
    assert response.status_code == 200
    scene = response.json()
    assert scene["id"] == "get-test-scene"
    assert scene["name"] == "Get Test Scene"


def test_get_nonexistent_scene():
    """Test getting a scene that doesn't exist."""
    response = client.get("/api/scenes/nonexistent")
    assert response.status_code == 404


def test_invalid_primitive_type():
    """Test requesting an invalid primitive type."""
    response = client.post("/api/meshes/generate/invalid", json={})
    assert response.status_code == 400
