// Simple WebGL Test - Basic 3D scene without external dependencies
console.log("📄 simple3d.js file loaded");

class Simple3D {
    constructor() {
        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.cube = null;
        this.camera = {
            rotation: { x: 0, y: 0 },
            zoom: -6
        };
        this.cubeRotation = 0;
        this.cubeColor = [1.0, 0.0, 0.0, 1.0]; // Red
        this.isMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
    }

    init() {
        console.log("🎮 Initializing Simple3D...");
        console.log("Looking for canvas with ID: simple3d-canvas");
        
        this.canvas = document.getElementById('simple3d-canvas');
        if (!this.canvas) {
            console.error("❌ Canvas not found!");
            console.log("Available elements:", document.querySelectorAll('canvas'));
            this.updateStatus("❌ Canvas not found!");
            return false;
        }

        console.log("✅ Canvas found:", this.canvas);
        console.log("Canvas dimensions:", this.canvas.width, "x", this.canvas.height);

        // Get WebGL context
        console.log("🔍 Getting WebGL context...");
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) {
            console.error("❌ WebGL not supported!");
            this.updateStatus("❌ WebGL not supported!");
            this.showWebGLInfo("WebGL is not supported by your browser.");
            return false;
        }

        console.log("✅ WebGL context created!", this.gl);
        this.updateStatus("✅ WebGL Ready!");
        
        // Display WebGL info
        this.displayWebGLInfo();
        
        // Initialize WebGL
        console.log("🔧 Initializing WebGL settings...");
        this.initWebGL();
        console.log("🎨 Creating shaders...");
        this.createShaders();
        console.log("📦 Creating cube...");
        this.createCube();
        console.log("🎮 Setting up event listeners...");
        this.setupEventListeners();
        
        // Start render loop
        console.log("🚀 Starting render loop...");
        this.render();
        
        console.log("✅ Simple3D initialization complete!");
        return true;
    }

    updateStatus(message) {
        const statusElement = document.getElementById('webgl-status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    displayWebGLInfo() {
        const gl = this.gl;
        const info = {
            'WebGL Version': gl.getParameter(gl.VERSION),
            'GLSL Version': gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
            'Vendor': gl.getParameter(gl.VENDOR),
            'Renderer': gl.getParameter(gl.RENDERER),
            'Max Texture Size': gl.getParameter(gl.MAX_TEXTURE_SIZE),
            'Max Viewport Dims': gl.getParameter(gl.MAX_VIEWPORT_DIMS),
            'Max Vertex Attribs': gl.getParameter(gl.MAX_VERTEX_ATTRIBS)
        };

        let infoHTML = '';
        for (const [key, value] of Object.entries(info)) {
            infoHTML += `<p><strong>${key}:</strong> ${value}</p>`;
        }

        this.showWebGLInfo(infoHTML);
    }

    showWebGLInfo(html) {
        const infoElement = document.getElementById('webgl-info');
        if (infoElement) {
            infoElement.innerHTML = html;
        }
    }

    initWebGL() {
        const gl = this.gl;
        
        // Set clear color to dark blue
        gl.clearColor(0.1, 0.1, 0.2, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        
        // Set viewport
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    createShaders() {
        const gl = this.gl;

        // Vertex shader source
        const vertexShaderSource = `
            attribute vec4 aVertexPosition;
            attribute vec4 aVertexColor;
            
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            
            varying lowp vec4 vColor;
            
            void main(void) {
                gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
                vColor = aVertexColor;
            }
        `;

        // Fragment shader source
        const fragmentShaderSource = `
            varying lowp vec4 vColor;
            
            void main(void) {
                gl_FragColor = vColor;
            }
        `;

        // Create and compile shaders
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

        // Create shader program
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('❌ Unable to initialize shader program: ' + gl.getProgramInfoLog(this.program));
            return;
        }

        // Get attribute and uniform locations
        this.programInfo = {
            attribLocations: {
                vertexPosition: gl.getAttribLocation(this.program, 'aVertexPosition'),
                vertexColor: gl.getAttribLocation(this.program, 'aVertexColor'),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(this.program, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(this.program, 'uModelViewMatrix'),
            },
        };
    }

    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('❌ Error compiling shader: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    createCube() {
        const gl = this.gl;

        // Cube vertices
        const positions = [
            // Front face
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0,
             1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,

            // Back face
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0, -1.0,

            // Top face
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0, -1.0,

            // Bottom face
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,

            // Right face
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0,  1.0,  1.0,
             1.0, -1.0,  1.0,

            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0,
        ];

        // Face colors
        const faceColors = [
            [1.0, 0.0, 0.0, 1.0], // Front face: red
            [0.0, 1.0, 0.0, 1.0], // Back face: green
            [0.0, 0.0, 1.0, 1.0], // Top face: blue
            [1.0, 1.0, 0.0, 1.0], // Bottom face: yellow
            [1.0, 0.0, 1.0, 1.0], // Right face: purple
            [0.0, 1.0, 1.0, 1.0], // Left face: cyan
        ];

        // Convert to vertex colors
        let colors = [];
        for (let j = 0; j < faceColors.length; ++j) {
            const c = faceColors[j];
            colors = colors.concat(c, c, c, c);
        }

        // Cube indices
        const indices = [
            0,  1,  2,      0,  2,  3,    // front
            4,  5,  6,      4,  6,  7,    // back
            8,  9,  10,     8,  10, 11,   // top
            12, 13, 14,     12, 14, 15,   // bottom
            16, 17, 18,     16, 18, 19,   // right
            20, 21, 22,     20, 22, 23,   // left
        ];

        // Create buffers
        this.cube = {
            position: this.createBuffer(positions),
            color: this.createBuffer(colors),
            indices: this.createElementBuffer(indices),
            vertexCount: indices.length,
        };
    }

    createBuffer(data) {
        const gl = this.gl;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        return buffer;
    }

    createElementBuffer(data) {
        const gl = this.gl;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
        return buffer;
    }

    setupEventListeners() {
        // Mouse controls
        this.canvas.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isMouseDown) return;

            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;

            this.camera.rotation.y += deltaX * 0.01;
            this.camera.rotation.x += deltaY * 0.01;

            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        // Mouse wheel for zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.camera.zoom += e.deltaY * 0.01;
            this.camera.zoom = Math.max(-20, Math.min(-2, this.camera.zoom));
        });
    }

    render() {
        const gl = this.gl;

        // Clear the canvas
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Create projection matrix
        const fieldOfView = 45 * Math.PI / 180;
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 100.0;
        const projectionMatrix = this.createPerspectiveMatrix(fieldOfView, aspect, zNear, zFar);

        // Create model-view matrix
        const modelViewMatrix = this.createIdentityMatrix();
        this.translateMatrix(modelViewMatrix, [0.0, 0.0, this.camera.zoom]);
        this.rotateMatrix(modelViewMatrix, this.camera.rotation.x, [1, 0, 0]);
        this.rotateMatrix(modelViewMatrix, this.camera.rotation.y, [0, 1, 0]);
        this.rotateMatrix(modelViewMatrix, this.cubeRotation, [0, 0, 1]);
        this.rotateMatrix(modelViewMatrix, this.cubeRotation * 0.7, [0, 1, 0]);

        // Draw the cube
        this.drawCube(projectionMatrix, modelViewMatrix);

        // Update rotation
        this.cubeRotation += 0.01;

        // Continue rendering
        requestAnimationFrame(() => this.render());
    }

    drawCube(projectionMatrix, modelViewMatrix) {
        const gl = this.gl;

        // Use shader program
        gl.useProgram(this.program);

        // Set position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.cube.position);
        gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);

        // Set color attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.cube.color);
        gl.vertexAttribPointer(this.programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexColor);

        // Set indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.cube.indices);

        // Set uniforms
        gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        // Draw
        gl.drawElements(gl.TRIANGLES, this.cube.vertexCount, gl.UNSIGNED_SHORT, 0);
    }

    // Matrix utility functions
    createIdentityMatrix() {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    createPerspectiveMatrix(fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov / 2);
        const rangeInv = 1 / (near - far);

        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ]);
    }

    translateMatrix(matrix, translation) {
        matrix[12] += translation[0];
        matrix[13] += translation[1];
        matrix[14] += translation[2];
    }

    rotateMatrix(matrix, angle, axis) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const [x, y, z] = axis;

        // Create rotation matrix
        const rotMatrix = new Float32Array([
            c + x*x*(1-c), x*y*(1-c) - z*s, x*z*(1-c) + y*s, 0,
            y*x*(1-c) + z*s, c + y*y*(1-c), y*z*(1-c) - x*s, 0,
            z*x*(1-c) - y*s, z*y*(1-c) + x*s, c + z*z*(1-c), 0,
            0, 0, 0, 1
        ]);

        // Multiply matrices
        this.multiplyMatrices(matrix, rotMatrix);
    }

    multiplyMatrices(a, b) {
        const result = new Float32Array(16);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result[i * 4 + j] = 
                    a[i * 4 + 0] * b[0 * 4 + j] +
                    a[i * 4 + 1] * b[1 * 4 + j] +
                    a[i * 4 + 2] * b[2 * 4 + j] +
                    a[i * 4 + 3] * b[3 * 4 + j];
            }
        }
        for (let i = 0; i < 16; i++) {
            a[i] = result[i];
        }
    }

    // Public API methods for button controls
    rotateLeft() {
        this.camera.rotation.y -= 0.2;
    }

    rotateRight() {
        this.camera.rotation.y += 0.2;
    }

    changeColor() {
        // Generate random colors
        this.cubeColor = [Math.random(), Math.random(), Math.random(), 1.0];
        console.log("🎨 Color changed to:", this.cubeColor);
    }

    reset() {
        this.camera.rotation.x = 0;
        this.camera.rotation.y = 0;
        this.camera.zoom = -6;
        this.cubeRotation = 0;
        console.log("🔄 Scene reset");
    }
}

// Global instance
let simple3D = null;

// Initialize function called from Blazor
function initializeSimple3D() {
    console.log("🚀 initializeSimple3D called from Blazor");
    console.log("🔍 Checking if DOM is ready...");
    console.log("🔍 Document readyState:", document.readyState);
    
    // Add a small delay to ensure DOM is fully ready
    setTimeout(() => {
        console.log("🎯 Attempting to create Simple3D instance...");
        
        simple3D = new Simple3D();
        const success = simple3D.init();
        
        if (success) {
            console.log("✅ Simple3D initialized successfully!");
            
            // Make API available globally
            window.simple3D = {
                rotateLeft: () => simple3D.rotateLeft(),
                rotateRight: () => simple3D.rotateRight(),
                changeColor: () => simple3D.changeColor(),
                reset: () => simple3D.reset()
            };
        } else {
            console.error("❌ Simple3D initialization failed!");
            // Try to show what elements we can find
            console.log("Available canvas elements:", document.querySelectorAll('canvas'));
            console.log("Available elements with simple3d:", document.querySelectorAll('[id*="simple3d"]'));
        }
    }, 100); // Small delay to ensure DOM is ready
}

// Make initialization function global
window.initializeSimple3D = initializeSimple3D;

// CSP-safe debug function
window.updateDebugInfo = function() {
    const debugElement = document.getElementById('debug-info');
    if (debugElement) {
        debugElement.innerHTML = '<p>✅ Blazor component loaded</p><p>✅ JavaScript interop working</p>';
    }
};
