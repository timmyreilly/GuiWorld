/**
 * Camera Controls - Handles user interaction for camera movement
 * Provides orbit controls, pan, zoom, and keyboard navigation
 */

class CameraControls {
    constructor(canvas, camera) {
        this.canvas = canvas;
        this.camera = camera;
        
        this.isMouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.rotationSpeed = 0.005;
        this.zoomSpeed = 0.1;
        this.panSpeed = 0.01;
        
        this.distance = 10;
        this.azimuth = 0;
        this.elevation = 0;
        
        this.setupEventListeners();
        this.updateCameraPosition();
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
        
        // Keyboard events
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    onMouseDown(event) {
        this.isMouseDown = true;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
        this.canvas.style.cursor = 'grabbing';
    }
    
    onMouseMove(event) {
        if (!this.isMouseDown) return;
        
        const deltaX = event.clientX - this.lastMouseX;
        const deltaY = event.clientY - this.lastMouseY;
        
        if (event.button === 0 || event.buttons === 1) {
            // Left mouse button - orbit
            this.azimuth -= deltaX * this.rotationSpeed;
            this.elevation += deltaY * this.rotationSpeed;
            
            // Clamp elevation to prevent flipping
            this.elevation = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.elevation));
        } else if (event.button === 2 || event.buttons === 2) {
            // Right mouse button - pan
            this.panCamera(deltaX, deltaY);
        }
        
        this.updateCameraPosition();
        
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }
    
    onMouseUp(event) {
        this.isMouseDown = false;
        this.canvas.style.cursor = 'grab';
    }
    
    onWheel(event) {
        event.preventDefault();
        
        const delta = event.deltaY > 0 ? 1 : -1;
        this.distance += delta * this.zoomSpeed * this.distance;
        this.distance = Math.max(0.1, Math.min(100, this.distance));
        
        this.updateCameraPosition();
    }
    
    onTouchStart(event) {
        event.preventDefault();
        if (event.touches.length === 1) {
            this.lastMouseX = event.touches[0].clientX;
            this.lastMouseY = event.touches[0].clientY;
            this.isMouseDown = true;
        }
    }
    
    onTouchMove(event) {
        event.preventDefault();
        if (event.touches.length === 1 && this.isMouseDown) {
            const deltaX = event.touches[0].clientX - this.lastMouseX;
            const deltaY = event.touches[0].clientY - this.lastMouseY;
            
            this.azimuth -= deltaX * this.rotationSpeed;
            this.elevation += deltaY * this.rotationSpeed;
            this.elevation = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.elevation));
            
            this.updateCameraPosition();
            
            this.lastMouseX = event.touches[0].clientX;
            this.lastMouseY = event.touches[0].clientY;
        }
    }
    
    onTouchEnd(event) {
        event.preventDefault();
        this.isMouseDown = false;
    }
    
    onKeyDown(event) {
        const moveSpeed = 0.5;
        
        switch (event.key.toLowerCase()) {
            case 'w':
                this.moveForward(moveSpeed);
                break;
            case 's':
                this.moveBackward(moveSpeed);
                break;
            case 'a':
                this.moveLeft(moveSpeed);
                break;
            case 'd':
                this.moveRight(moveSpeed);
                break;
            case 'q':
                this.moveUp(moveSpeed);
                break;
            case 'e':
                this.moveDown(moveSpeed);
                break;
            case 'r':
                this.reset();
                break;
        }
    }
    
    updateCameraPosition() {
        // Convert spherical coordinates to cartesian
        const x = this.distance * Math.cos(this.elevation) * Math.cos(this.azimuth);
        const y = this.distance * Math.sin(this.elevation);
        const z = this.distance * Math.cos(this.elevation) * Math.sin(this.azimuth);
        
        this.camera.position = [
            this.camera.target[0] + x,
            this.camera.target[1] + y,
            this.camera.target[2] + z
        ];
    }
    
    panCamera(deltaX, deltaY) {
        // Calculate camera right and up vectors
        const forward = [
            this.camera.target[0] - this.camera.position[0],
            this.camera.target[1] - this.camera.position[1],
            this.camera.target[2] - this.camera.position[2]
        ];
        
        // Normalize forward vector
        const forwardLength = Math.sqrt(forward[0] * forward[0] + forward[1] * forward[1] + forward[2] * forward[2]);
        forward[0] /= forwardLength;
        forward[1] /= forwardLength;
        forward[2] /= forwardLength;
        
        // Calculate right vector (cross product of forward and up)
        const right = [
            forward[1] * this.camera.up[2] - forward[2] * this.camera.up[1],
            forward[2] * this.camera.up[0] - forward[0] * this.camera.up[2],
            forward[0] * this.camera.up[1] - forward[1] * this.camera.up[0]
        ];
        
        // Calculate up vector (cross product of right and forward)
        const up = [
            right[1] * forward[2] - right[2] * forward[1],
            right[2] * forward[0] - right[0] * forward[2],
            right[0] * forward[1] - right[1] * forward[0]
        ];
        
        // Pan the target
        const panX = (-deltaX * this.panSpeed * this.distance / 100);
        const panY = (deltaY * this.panSpeed * this.distance / 100);
        
        this.camera.target[0] += right[0] * panX + up[0] * panY;
        this.camera.target[1] += right[1] * panX + up[1] * panY;
        this.camera.target[2] += right[2] * panX + up[2] * panY;
    }
    
    moveForward(distance) {
        const forward = [
            this.camera.target[0] - this.camera.position[0],
            this.camera.target[1] - this.camera.position[1],
            this.camera.target[2] - this.camera.position[2]
        ];
        
        const forwardLength = Math.sqrt(forward[0] * forward[0] + forward[1] * forward[1] + forward[2] * forward[2]);
        forward[0] = (forward[0] / forwardLength) * distance;
        forward[1] = (forward[1] / forwardLength) * distance;
        forward[2] = (forward[2] / forwardLength) * distance;
        
        this.camera.target[0] += forward[0];
        this.camera.target[1] += forward[1];
        this.camera.target[2] += forward[2];
        
        this.updateCameraPosition();
    }
    
    moveBackward(distance) {
        this.moveForward(-distance);
    }
    
    moveLeft(distance) {
        const forward = [
            this.camera.target[0] - this.camera.position[0],
            this.camera.target[1] - this.camera.position[1],
            this.camera.target[2] - this.camera.position[2]
        ];
        
        const right = [
            forward[1] * this.camera.up[2] - forward[2] * this.camera.up[1],
            forward[2] * this.camera.up[0] - forward[0] * this.camera.up[2],
            forward[0] * this.camera.up[1] - forward[1] * this.camera.up[0]
        ];
        
        const rightLength = Math.sqrt(right[0] * right[0] + right[1] * right[1] + right[2] * right[2]);
        right[0] = (right[0] / rightLength) * distance;
        right[1] = (right[1] / rightLength) * distance;
        right[2] = (right[2] / rightLength) * distance;
        
        this.camera.target[0] -= right[0];
        this.camera.target[1] -= right[1];
        this.camera.target[2] -= right[2];
        
        this.updateCameraPosition();
    }
    
    moveRight(distance) {
        this.moveLeft(-distance);
    }
    
    moveUp(distance) {
        this.camera.target[1] += distance;
        this.updateCameraPosition();
    }
    
    moveDown(distance) {
        this.moveUp(-distance);
    }
    
    reset() {
        this.camera.target = [0, 0, 0];
        this.distance = 10;
        this.azimuth = 0;
        this.elevation = 0;
        this.updateCameraPosition();
    }
    
    setTarget(target) {
        this.camera.target = [...target];
        this.updateCameraPosition();
    }
    
    setDistance(distance) {
        this.distance = Math.max(0.1, Math.min(100, distance));
        this.updateCameraPosition();
    }
}
