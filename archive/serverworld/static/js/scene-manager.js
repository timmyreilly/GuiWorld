/**
 * Scene Manager - Manages 3D scenes, objects, and rendering
 * Coordinates between the renderer and scene data
 */

class SceneManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.objects = [];
        this.camera = {
            position: [0, 0, 10],
            target: [0, 0, 0],
            up: [0, 1, 0],
            fov: 75 * Math.PI / 180, // Convert to radians
            near: 0.1,
            far: 1000.0
        };
        this.backgroundColor = [0.1, 0.1, 0.1, 1.0];
        
        // Initialize matrices
        this.viewMatrix = mat4.create();
        this.projectionMatrix = mat4.create();
        
        this.updateProjectionMatrix();
        this.updateViewMatrix();
    }
    
    loadScene(sceneData) {
        console.log('Loading scene:', sceneData);
        
        // Clear existing objects
        this.objects = [];
        
        // Load objects
        if (sceneData.objects) {
            sceneData.objects.forEach(objData => {
                this.addObject(objData);
            });
        }
        
        // Update camera
        if (sceneData.camera) {
            this.camera.position = sceneData.camera.position || this.camera.position;
            this.camera.target = sceneData.camera.target || this.camera.target;
            this.camera.up = sceneData.camera.up || this.camera.up;
            this.camera.fov = (sceneData.camera.fov || 75) * Math.PI / 180;
            this.camera.near = sceneData.camera.near || this.camera.near;
            this.camera.far = sceneData.camera.far || this.camera.far;
            
            this.updateProjectionMatrix();
            this.updateViewMatrix();
        }
        
        // Update background color
        if (sceneData.background_color) {
            this.backgroundColor = sceneData.background_color;
        }
        
        console.log(`Scene loaded with ${this.objects.length} objects`);
    }
    
    addObject(objectData) {
        const object = {
            id: objectData.id,
            name: objectData.name || 'Object',
            position: objectData.position || [0, 0, 0],
            rotation: objectData.rotation || [0, 0, 0],
            scale: objectData.scale || [1, 1, 1],
            mesh: objectData.mesh,
            material: objectData.material || {},
            visible: objectData.visible !== false,
            buffers: null // Will be created by renderer
        };
        
        this.objects.push(object);
        console.log('Added object:', object.name);
        return object;
    }
    
    removeObject(objectId) {
        const index = this.objects.findIndex(obj => obj.id === objectId);
        if (index !== -1) {
            // Clean up WebGL buffers
            const object = this.objects[index];
            if (object.buffers) {
                this.cleanupObjectBuffers(object);
            }
            
            this.objects.splice(index, 1);
            console.log('Removed object:', objectId);
            return true;
        }
        return false;
    }
    
    updateObject(objectId, updates) {
        const object = this.objects.find(obj => obj.id === objectId);
        if (object) {
            Object.assign(object, updates);
            console.log('Updated object:', objectId, updates);
            return true;
        }
        return false;
    }
    
    getObject(objectId) {
        return this.objects.find(obj => obj.id === objectId);
    }
    
    updateCamera(cameraData) {
        if (cameraData.position) this.camera.position = cameraData.position;
        if (cameraData.target) this.camera.target = cameraData.target;
        if (cameraData.up) this.camera.up = cameraData.up;
        if (cameraData.fov) this.camera.fov = cameraData.fov * Math.PI / 180;
        if (cameraData.near) this.camera.near = cameraData.near;
        if (cameraData.far) this.camera.far = cameraData.far;
        
        this.updateProjectionMatrix();
        this.updateViewMatrix();
    }
    
    updateProjectionMatrix() {
        const aspect = this.renderer.canvas.width / this.renderer.canvas.height;
        mat4.perspective(this.projectionMatrix, this.camera.fov, aspect, this.camera.near, this.camera.far);
    }
    
    updateViewMatrix() {
        mat4.lookAt(this.viewMatrix, this.camera.position, this.camera.target, this.camera.up);
    }
    
    render() {
        // Clear the screen
        this.renderer.clear(this.backgroundColor);
        
        // Update matrices
        this.updateViewMatrix();
        
        // Render all visible objects
        this.objects.forEach(object => {
            if (object.visible && object.mesh) {
                this.renderer.render(object, this.viewMatrix, this.projectionMatrix);
            }
        });
    }
    
    cleanupObjectBuffers(object) {
        if (object.buffers) {
            const gl = this.renderer.gl;
            
            if (object.buffers.position) gl.deleteBuffer(object.buffers.position);
            if (object.buffers.normal) gl.deleteBuffer(object.buffers.normal);
            if (object.buffers.color) gl.deleteBuffer(object.buffers.color);
            if (object.buffers.indices) gl.deleteBuffer(object.buffers.indices);
            
            object.buffers = null;
        }
    }
    
    resize(width, height) {
        this.renderer.resize(width, height);
        this.updateProjectionMatrix();
    }
    
    // Utility methods for object manipulation
    translateObject(objectId, translation) {
        const object = this.getObject(objectId);
        if (object) {
            object.position[0] += translation[0];
            object.position[1] += translation[1];
            object.position[2] += translation[2];
        }
    }
    
    rotateObject(objectId, rotation) {
        const object = this.getObject(objectId);
        if (object) {
            object.rotation[0] += rotation[0];
            object.rotation[1] += rotation[1];
            object.rotation[2] += rotation[2];
        }
    }
    
    scaleObject(objectId, scale) {
        const object = this.getObject(objectId);
        if (object) {
            object.scale[0] *= scale[0];
            object.scale[1] *= scale[1];
            object.scale[2] *= scale[2];
        }
    }
    
    // Animation helpers
    animateObject(objectId, property, targetValue, duration = 1000) {
        const object = this.getObject(objectId);
        if (!object) return;
        
        const startValue = [...object[property]];
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Linear interpolation
            for (let i = 0; i < startValue.length; i++) {
                object[property][i] = startValue[i] + (targetValue[i] - startValue[i]) * progress;
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    // Scene statistics
    getStats() {
        let totalVertices = 0;
        let totalTriangles = 0;
        
        this.objects.forEach(object => {
            if (object.mesh) {
                totalVertices += object.mesh.vertex_count || 0;
                totalTriangles += (object.mesh.index_count || 0) / 3;
            }
        });
        
        return {
            objectCount: this.objects.length,
            vertexCount: totalVertices,
            triangleCount: totalTriangles
        };
    }
}
