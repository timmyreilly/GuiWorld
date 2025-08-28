"""
Procedural mesh generation utilities.
Creates 3D meshes programmatically using mathematical functions.
"""

import numpy as np
from typing import Tuple, List
from app.models import Mesh


class TerrainGenerator:
    """Generates terrain meshes using various algorithms."""
    
    @staticmethod
    def generate_heightmap_terrain(
        width: int = 64,
        height: int = 64,
        scale: float = 10.0,
        height_scale: float = 5.0,
        octaves: int = 4
    ) -> Mesh:
        """Generate terrain from Perlin noise heightmap."""
        vertices = []
        normals = []
        colors = []
        indices = []
        
        # Generate heightmap using simple noise function
        heightmap = np.zeros((height, width))
        for y in range(height):
            for x in range(width):
                # Simple noise approximation
                value = 0
                amplitude = 1
                frequency = 1
                
                for octave in range(octaves):
                    nx = x * frequency / width
                    ny = y * frequency / height
                    value += amplitude * np.sin(nx * 2 * np.pi) * np.cos(ny * 2 * np.pi)
                    amplitude *= 0.5
                    frequency *= 2
                
                heightmap[y, x] = value * height_scale
        
        # Generate vertices and normals
        for y in range(height):
            for x in range(width):
                # Position
                world_x = (x - width / 2) * scale / width
                world_z = (y - height / 2) * scale / height
                world_y = heightmap[y, x]
                
                vertices.extend([world_x, world_y, world_z])
                
                # Calculate normal (simplified)
                if x > 0 and x < width - 1 and y > 0 and y < height - 1:
                    dx = heightmap[y, x + 1] - heightmap[y, x - 1]
                    dz = heightmap[y + 1, x] - heightmap[y - 1, x]
                    normal = np.array([-dx, 2.0, -dz])
                    normal = normal / np.linalg.norm(normal)
                else:
                    normal = np.array([0, 1, 0])
                
                normals.extend(normal.tolist())
                
                # Color based on height
                height_ratio = (world_y + height_scale) / (2 * height_scale)
                if height_ratio < 0.3:
                    color = [0.2, 0.4, 0.8, 1.0]  # Water blue
                elif height_ratio < 0.6:
                    color = [0.2, 0.8, 0.2, 1.0]  # Grass green
                else:
                    color = [0.8, 0.8, 0.8, 1.0]  # Mountain gray
                
                colors.extend(color)
        
        # Generate indices
        for y in range(height - 1):
            for x in range(width - 1):
                # Two triangles per quad
                top_left = y * width + x
                top_right = y * width + (x + 1)
                bottom_left = (y + 1) * width + x
                bottom_right = (y + 1) * width + (x + 1)
                
                # First triangle
                indices.extend([top_left, bottom_left, top_right])
                # Second triangle
                indices.extend([top_right, bottom_left, bottom_right])
        
        return Mesh(
            vertices=vertices,
            indices=indices,
            normals=normals,
            colors=colors
        )


class ParticleGenerator:
    """Generates particle system data."""
    
    @staticmethod
    def generate_particle_system(
        particle_count: int = 1000,
        area_size: float = 10.0,
        height_range: Tuple[float, float] = (0.0, 5.0)
    ) -> Mesh:
        """Generate a particle system mesh."""
        vertices = []
        colors = []
        
        for i in range(particle_count):
            # Random position within area
            x = (np.random.random() - 0.5) * area_size
            y = np.random.random() * (height_range[1] - height_range[0]) + height_range[0]
            z = (np.random.random() - 0.5) * area_size
            
            vertices.extend([x, y, z])
            
            # Random color
            hue = np.random.random()
            if hue < 0.33:
                color = [1.0, hue * 3, 0.0, 1.0]  # Red to yellow
            elif hue < 0.66:
                color = [1.0 - (hue - 0.33) * 3, 1.0, 0.0, 1.0]  # Yellow to green
            else:
                color = [0.0, 1.0 - (hue - 0.66) * 3, (hue - 0.66) * 3, 1.0]  # Green to blue
            
            colors.extend(color)
        
        # For particles, indices are just sequential
        indices = list(range(particle_count))
        
        return Mesh(
            vertices=vertices,
            indices=indices,
            colors=colors
        )


class ComplexMeshGenerator:
    """Generates complex 3D meshes."""
    
    @staticmethod
    def generate_torus(
        major_radius: float = 2.0,
        minor_radius: float = 1.0,
        major_segments: int = 32,
        minor_segments: int = 16
    ) -> Mesh:
        """Generate a torus mesh."""
        vertices = []
        normals = []
        colors = []
        indices = []
        
        for i in range(major_segments):
            theta = i * 2 * np.pi / major_segments
            
            for j in range(minor_segments):
                phi = j * 2 * np.pi / minor_segments
                
                # Calculate position
                x = (major_radius + minor_radius * np.cos(phi)) * np.cos(theta)
                y = minor_radius * np.sin(phi)
                z = (major_radius + minor_radius * np.cos(phi)) * np.sin(theta)
                
                vertices.extend([x, y, z])
                
                # Calculate normal
                nx = np.cos(phi) * np.cos(theta)
                ny = np.sin(phi)
                nz = np.cos(phi) * np.sin(theta)
                
                normals.extend([nx, ny, nz])
                
                # Color based on position
                color_r = (np.cos(theta) + 1) * 0.5
                color_g = (np.sin(phi) + 1) * 0.5
                color_b = (np.cos(phi) + 1) * 0.5
                colors.extend([color_r, color_g, color_b, 1.0])
        
        # Generate indices
        for i in range(major_segments):
            for j in range(minor_segments):
                first = i * minor_segments + j
                second = ((i + 1) % major_segments) * minor_segments + j
                third = i * minor_segments + ((j + 1) % minor_segments)
                fourth = ((i + 1) % major_segments) * minor_segments + ((j + 1) % minor_segments)
                
                # Two triangles per quad
                indices.extend([first, second, third])
                indices.extend([second, fourth, third])
        
        return Mesh(
            vertices=vertices,
            indices=indices,
            normals=normals,
            colors=colors
        )
    
    @staticmethod
    def generate_icosphere(radius: float = 1.0, subdivisions: int = 2) -> Mesh:
        """Generate an icosphere (sphere with triangular faces)."""
        # Golden ratio
        phi = (1.0 + np.sqrt(5.0)) * 0.5
        
        # Initial icosahedron vertices
        vertices = [
            [-1,  phi, 0], [ 1,  phi, 0], [-1, -phi, 0], [ 1, -phi, 0],
            [ 0, -1,  phi], [ 0,  1,  phi], [ 0, -1, -phi], [ 0,  1, -phi],
            [ phi, 0, -1], [ phi, 0,  1], [-phi, 0, -1], [-phi, 0,  1]
        ]
        
        # Normalize to unit sphere
        vertices = [[v[0]/np.sqrt(v[0]**2 + v[1]**2 + v[2]**2) * radius,
                    v[1]/np.sqrt(v[0]**2 + v[1]**2 + v[2]**2) * radius,
                    v[2]/np.sqrt(v[0]**2 + v[1]**2 + v[2]**2) * radius] for v in vertices]
        
        # Initial faces
        faces = [
            [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
            [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
            [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
            [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
        ]
        
        # Subdivide (simplified version)
        for _ in range(subdivisions):
            new_faces = []
            for face in faces:
                # For simplicity, just use the original faces
                # A full implementation would subdivide each triangle
                new_faces.append(face)
            faces = new_faces
        
        # Flatten vertices and create indices
        flat_vertices = []
        normals = []
        colors = []
        indices = []
        
        for vertex in vertices:
            flat_vertices.extend(vertex)
            # Normal is same as normalized position for sphere
            norm = np.sqrt(vertex[0]**2 + vertex[1]**2 + vertex[2]**2)
            normals.extend([vertex[0]/norm, vertex[1]/norm, vertex[2]/norm])
            # Color based on position
            colors.extend([(vertex[0]/radius + 1) * 0.5, 
                          (vertex[1]/radius + 1) * 0.5, 
                          (vertex[2]/radius + 1) * 0.5, 1.0])
        
        for face in faces:
            indices.extend(face)
        
        return Mesh(
            vertices=flat_vertices,
            indices=indices,
            normals=normals,
            colors=colors
        )
