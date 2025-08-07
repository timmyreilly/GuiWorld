"""
WebGL code generation utilities.
Generates GLSL shaders, mesh data, and WebGL-specific code from Python.
"""

from typing import Dict, List, Tuple, Any
import numpy as np
from app.models import Mesh, Object3D, WebGLShader


class ShaderGenerator:
    """Generates GLSL shader code for various 3D effects."""
    
    @staticmethod
    def basic_vertex_shader() -> str:
        """Basic vertex shader for simple 3D rendering."""
        return """
        attribute vec3 aPosition;
        attribute vec3 aNormal;
        attribute vec4 aColor;
        
        uniform mat4 uModelMatrix;
        uniform mat4 uViewMatrix;
        uniform mat4 uProjectionMatrix;
        uniform mat3 uNormalMatrix;
        
        varying vec3 vNormal;
        varying vec4 vColor;
        varying vec3 vWorldPosition;
        
        void main() {
            vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
            vWorldPosition = worldPosition.xyz;
            vNormal = normalize(uNormalMatrix * aNormal);
            vColor = aColor;
            
            gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
        }
        """
    
    @staticmethod
    def basic_fragment_shader() -> str:
        """Basic fragment shader with simple lighting."""
        return """
        precision mediump float;
        
        varying vec3 vNormal;
        varying vec4 vColor;
        varying vec3 vWorldPosition;
        
        uniform vec3 uLightPosition;
        uniform vec3 uLightColor;
        uniform vec3 uAmbientLight;
        
        void main() {
            vec3 lightDirection = normalize(uLightPosition - vWorldPosition);
            float lightIntensity = max(dot(vNormal, lightDirection), 0.0);
            
            vec3 ambient = uAmbientLight * vColor.rgb;
            vec3 diffuse = uLightColor * lightIntensity * vColor.rgb;
            
            gl_FragColor = vec4(ambient + diffuse, vColor.a);
        }
        """
    
    @staticmethod
    def particle_vertex_shader() -> str:
        """Vertex shader for particle systems."""
        return """
        attribute vec3 aPosition;
        attribute float aSize;
        attribute vec4 aColor;
        attribute float aLife;
        
        uniform mat4 uViewMatrix;
        uniform mat4 uProjectionMatrix;
        uniform float uTime;
        
        varying vec4 vColor;
        varying float vLife;
        
        void main() {
            vec3 position = aPosition;
            position.y += sin(uTime * 2.0 + aPosition.x) * 0.1;
            
            vec4 viewPosition = uViewMatrix * vec4(position, 1.0);
            gl_Position = uProjectionMatrix * viewPosition;
            gl_PointSize = aSize * (1.0 / -viewPosition.z);
            
            vColor = aColor;
            vLife = aLife;
        }
        """
    
    @staticmethod
    def particle_fragment_shader() -> str:
        """Fragment shader for particle systems."""
        return """
        precision mediump float;
        
        varying vec4 vColor;
        varying float vLife;
        
        void main() {
            vec2 center = gl_PointCoord - 0.5;
            float dist = length(center);
            
            if (dist > 0.5) {
                discard;
            }
            
            float alpha = (1.0 - dist * 2.0) * vLife * vColor.a;
            gl_FragColor = vec4(vColor.rgb, alpha);
        }
        """
    
    @classmethod
    def create_basic_shader(cls) -> WebGLShader:
        """Creates a basic shader set."""
        return WebGLShader(
            vertex_shader=cls.basic_vertex_shader(),
            fragment_shader=cls.basic_fragment_shader(),
            uniforms={
                "uModelMatrix": "mat4",
                "uViewMatrix": "mat4", 
                "uProjectionMatrix": "mat4",
                "uNormalMatrix": "mat3",
                "uLightPosition": "vec3",
                "uLightColor": "vec3",
                "uAmbientLight": "vec3"
            },
            attributes=["aPosition", "aNormal", "aColor"]
        )
    
    @classmethod
    def create_particle_shader(cls) -> WebGLShader:
        """Creates a particle system shader set."""
        return WebGLShader(
            vertex_shader=cls.particle_vertex_shader(),
            fragment_shader=cls.particle_fragment_shader(),
            uniforms={
                "uViewMatrix": "mat4",
                "uProjectionMatrix": "mat4",
                "uTime": "float"
            },
            attributes=["aPosition", "aSize", "aColor", "aLife"]
        )


class MeshGenerator:
    """Generates 3D mesh data for various geometric shapes."""
    
    @staticmethod
    def create_cube(size: float = 1.0) -> Mesh:
        """Creates a cube mesh."""
        s = size / 2.0
        
        vertices = [
            # Front face
            -s, -s,  s,   s, -s,  s,   s,  s,  s,  -s,  s,  s,
            # Back face
            -s, -s, -s,  -s,  s, -s,   s,  s, -s,   s, -s, -s,
            # Top face
            -s,  s, -s,  -s,  s,  s,   s,  s,  s,   s,  s, -s,
            # Bottom face
            -s, -s, -s,   s, -s, -s,   s, -s,  s,  -s, -s,  s,
            # Right face
             s, -s, -s,   s,  s, -s,   s,  s,  s,   s, -s,  s,
            # Left face
            -s, -s, -s,  -s, -s,  s,  -s,  s,  s,  -s,  s, -s,
        ]
        
        indices = [
            0,  1,  2,    0,  2,  3,    # front
            4,  5,  6,    4,  6,  7,    # back
            8,  9,  10,   8,  10, 11,   # top
            12, 13, 14,   12, 14, 15,   # bottom
            16, 17, 18,   16, 18, 19,   # right
            20, 21, 22,   20, 22, 23,   # left
        ]
        
        normals = [
            # Front face
            0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
            # Back face
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
            # Top face
            0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
            # Bottom face
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
            # Right face
            1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
            # Left face
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
        ]
        
        colors = [1.0, 1.0, 1.0, 1.0] * 24  # White for all vertices
        
        return Mesh(
            vertices=vertices,
            indices=indices,
            normals=normals,
            colors=colors
        )
    
    @staticmethod
    def create_sphere(radius: float = 1.0, segments: int = 16, rings: int = 16) -> Mesh:
        """Creates a sphere mesh using UV sphere algorithm."""
        vertices = []
        normals = []
        colors = []
        indices = []
        
        for ring in range(rings + 1):
            theta = ring * np.pi / rings
            sin_theta = np.sin(theta)
            cos_theta = np.cos(theta)
            
            for segment in range(segments + 1):
                phi = segment * 2 * np.pi / segments
                sin_phi = np.sin(phi)
                cos_phi = np.cos(phi)
                
                x = cos_phi * sin_theta
                y = cos_theta
                z = sin_phi * sin_theta
                
                vertices.extend([x * radius, y * radius, z * radius])
                normals.extend([x, y, z])
                colors.extend([1.0, 1.0, 1.0, 1.0])
        
        for ring in range(rings):
            for segment in range(segments):
                first = ring * (segments + 1) + segment
                second = first + segments + 1
                
                indices.extend([first, second, first + 1])
                indices.extend([second, second + 1, first + 1])
        
        return Mesh(
            vertices=vertices,
            indices=indices,
            normals=normals,
            colors=colors
        )
    
    @staticmethod
    def create_plane(width: float = 1.0, height: float = 1.0, 
                    width_segments: int = 1, height_segments: int = 1) -> Mesh:
        """Creates a plane mesh."""
        vertices = []
        normals = []
        colors = []
        indices = []
        
        w_half = width / 2
        h_half = height / 2
        
        grid_x = width_segments + 1
        grid_y = height_segments + 1
        
        segment_width = width / width_segments
        segment_height = height / height_segments
        
        for iy in range(grid_y):
            y = iy * segment_height - h_half
            for ix in range(grid_x):
                x = ix * segment_width - w_half
                
                vertices.extend([x, y, 0])
                normals.extend([0, 0, 1])
                colors.extend([1.0, 1.0, 1.0, 1.0])
        
        for iy in range(height_segments):
            for ix in range(width_segments):
                a = ix + grid_x * iy
                b = ix + grid_x * (iy + 1)
                c = (ix + 1) + grid_x * (iy + 1)
                d = (ix + 1) + grid_x * iy
                
                indices.extend([a, b, d])
                indices.extend([b, c, d])
        
        return Mesh(
            vertices=vertices,
            indices=indices,
            normals=normals,
            colors=colors
        )


class WebGLCodeGenerator:
    """Generates WebGL JavaScript code from Python data."""
    
    @staticmethod
    def generate_mesh_data(mesh: Mesh) -> Dict[str, Any]:
        """Converts mesh data to WebGL-ready format."""
        return {
            "vertices": mesh.vertices,
            "indices": mesh.indices,
            "normals": mesh.normals,
            "colors": mesh.colors,
            "uvs": mesh.uvs,
            "vertex_count": len(mesh.vertices) // 3,
            "index_count": len(mesh.indices)
        }
    
    @staticmethod
    def generate_object_data(obj: Object3D) -> Dict[str, Any]:
        """Converts 3D object to WebGL-ready format."""
        return {
            "id": obj.id,
            "name": obj.name,
            "position": [obj.position.x, obj.position.y, obj.position.z],
            "rotation": [obj.rotation.x, obj.rotation.y, obj.rotation.z],
            "scale": [obj.scale.x, obj.scale.y, obj.scale.z],
            "mesh": WebGLCodeGenerator.generate_mesh_data(obj.mesh),
            "material": obj.material,
            "visible": obj.visible,
            "custom_data": obj.custom_data
        }
