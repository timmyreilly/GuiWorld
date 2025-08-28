/**
 * WebGL Renderer - Core WebGL rendering engine
 * Handles WebGL context initialization, shader compilation, and basic rendering operations
 */

class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = null;
        this.shaderProgram = null;
        this.buffers = {};
        
        this.init();
    }
    
    init() {
        // Get WebGL context
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }
        
        // Set viewport
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // Enable depth testing
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        
        // Enable blending for transparency
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        
        // Initialize basic shader program
        this.initShaders();
        
        console.log('WebGL renderer initialized');
    }
    
    initShaders() {
        const vertexShaderSource = `
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
        `;
        
        const fragmentShaderSource = `
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
        `;
        
        const vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);
        
        this.shaderProgram = this.gl.createProgram();
        this.gl.attachShader(this.shaderProgram, vertexShader);
        this.gl.attachShader(this.shaderProgram, fragmentShader);
        this.gl.linkProgram(this.shaderProgram);
        
        if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
            throw new Error('Failed to link shader program: ' + this.gl.getProgramInfoLog(this.shaderProgram));
        }
        
        this.gl.useProgram(this.shaderProgram);
        
        // Get attribute and uniform locations
        this.programInfo = {
            attribLocations: {
                position: this.gl.getAttribLocation(this.shaderProgram, 'aPosition'),
                normal: this.gl.getAttribLocation(this.shaderProgram, 'aNormal'),
                color: this.gl.getAttribLocation(this.shaderProgram, 'aColor'),
            },
            uniformLocations: {
                modelMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uModelMatrix'),
                viewMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uViewMatrix'),
                projectionMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix'),
                normalMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uNormalMatrix'),
                lightPosition: this.gl.getUniformLocation(this.shaderProgram, 'uLightPosition'),
                lightColor: this.gl.getUniformLocation(this.shaderProgram, 'uLightColor'),
                ambientLight: this.gl.getUniformLocation(this.shaderProgram, 'uAmbientLight'),
            }
        };
    }
    
    compileShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error('Failed to compile shader: ' + error);
        }
        
        return shader;
    }
    
    createBuffers(meshData) {
        const buffers = {};
        
        // Position buffer
        buffers.position = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers.position);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(meshData.vertices), this.gl.STATIC_DRAW);
        
        // Normal buffer
        if (meshData.normals) {
            buffers.normal = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers.normal);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(meshData.normals), this.gl.STATIC_DRAW);
        }
        
        // Color buffer
        if (meshData.colors) {
            buffers.color = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers.color);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(meshData.colors), this.gl.STATIC_DRAW);
        }
        
        // Index buffer
        if (meshData.indices) {
            buffers.indices = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(meshData.indices), this.gl.STATIC_DRAW);
        }
        
        return buffers;
    }
    
    clear(color = [0.1, 0.1, 0.1, 1.0]) {
        this.gl.clearColor(color[0], color[1], color[2], color[3]);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
    
    render(object, viewMatrix, projectionMatrix) {
        if (!object.buffers) {
            object.buffers = this.createBuffers(object.mesh);
        }
        
        this.gl.useProgram(this.shaderProgram);
        
        // Bind position buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.buffers.position);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.position, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.position);
        
        // Bind normal buffer
        if (object.buffers.normal) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.buffers.normal);
            this.gl.vertexAttribPointer(this.programInfo.attribLocations.normal, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(this.programInfo.attribLocations.normal);
        }
        
        // Bind color buffer
        if (object.buffers.color) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object.buffers.color);
            this.gl.vertexAttribPointer(this.programInfo.attribLocations.color, 4, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(this.programInfo.attribLocations.color);
        }
        
        // Create model matrix from object transform
        const modelMatrix = mat4.create();
        mat4.identity(modelMatrix);
        mat4.translate(modelMatrix, modelMatrix, object.position);
        mat4.rotateX(modelMatrix, modelMatrix, object.rotation[0]);
        mat4.rotateY(modelMatrix, modelMatrix, object.rotation[1]);
        mat4.rotateZ(modelMatrix, modelMatrix, object.rotation[2]);
        mat4.scale(modelMatrix, modelMatrix, object.scale);
        
        // Create normal matrix
        const normalMatrix = mat3.create();
        mat3.normalFromMat4(normalMatrix, modelMatrix);
        
        // Set uniforms
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelMatrix, false, modelMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.viewMatrix, false, viewMatrix);
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        this.gl.uniformMatrix3fv(this.programInfo.uniformLocations.normalMatrix, false, normalMatrix);
        
        // Set lighting uniforms
        this.gl.uniform3fv(this.programInfo.uniformLocations.lightPosition, [10.0, 10.0, 10.0]);
        this.gl.uniform3fv(this.programInfo.uniformLocations.lightColor, [1.0, 1.0, 1.0]);
        this.gl.uniform3fv(this.programInfo.uniformLocations.ambientLight, [0.2, 0.2, 0.2]);
        
        // Draw
        if (object.buffers.indices) {
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, object.buffers.indices);
            this.gl.drawElements(this.gl.TRIANGLES, object.mesh.index_count, this.gl.UNSIGNED_SHORT, 0);
        } else {
            this.gl.drawArrays(this.gl.TRIANGLES, 0, object.mesh.vertex_count);
        }
    }
    
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
    }
}

// Simple matrix library functions (minimal implementation)
const mat4 = {
    create: () => new Float32Array(16),
    
    identity: (out) => {
        out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
        out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
        out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
        return out;
    },
    
    perspective: (out, fovy, aspect, near, far) => {
        const f = 1.0 / Math.tan(fovy / 2);
        out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
        out[8] = 0; out[9] = 0; out[10] = (far + near) / (near - far); out[11] = -1;
        out[12] = 0; out[13] = 0; out[14] = (2 * far * near) / (near - far); out[15] = 0;
        return out;
    },
    
    lookAt: (out, eye, center, up) => {
        // Simplified lookAt implementation
        const z0 = eye[0] - center[0], z1 = eye[1] - center[1], z2 = eye[2] - center[2];
        let len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
        const zx = z0 * len, zy = z1 * len, zz = z2 * len;
        
        const x0 = up[1] * zz - up[2] * zy;
        const x1 = up[2] * zx - up[0] * zz;
        const x2 = up[0] * zy - up[1] * zx;
        len = 1 / Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
        const xx = x0 * len, xy = x1 * len, xz = x2 * len;
        
        const y0 = zy * xz - zz * xy;
        const y1 = zz * xx - zx * xz;
        const y2 = zx * xy - zy * xx;
        
        out[0] = xx; out[1] = y0; out[2] = zx; out[3] = 0;
        out[4] = xy; out[5] = y1; out[6] = zy; out[7] = 0;
        out[8] = xz; out[9] = y2; out[10] = zz; out[11] = 0;
        out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
        out[13] = -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]);
        out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
        out[15] = 1;
        return out;
    },
    
    translate: (out, a, v) => {
        // Copy all elements from a to out first
        for (let i = 0; i < 16; i++) {
            out[i] = a[i];
        }
        // Apply translation
        out[12] = a[0] * v[0] + a[4] * v[1] + a[8] * v[2] + a[12];
        out[13] = a[1] * v[0] + a[5] * v[1] + a[9] * v[2] + a[13];
        out[14] = a[2] * v[0] + a[6] * v[1] + a[10] * v[2] + a[14];
        out[15] = a[3] * v[0] + a[7] * v[1] + a[11] * v[2] + a[15];
        return out;
    },
    
    rotateX: (out, a, rad) => {
        // Copy all elements from a to out first
        for (let i = 0; i < 16; i++) {
            out[i] = a[i];
        }
        const s = Math.sin(rad), c = Math.cos(rad);
        const a01 = a[1], a02 = a[2];
        const a05 = a[5], a06 = a[6];
        const a09 = a[9], a10 = a[10];
        const a13 = a[13], a14 = a[14];
        
        out[1] = a01 * c + a02 * s;
        out[2] = a02 * c - a01 * s;
        out[5] = a05 * c + a06 * s;
        out[6] = a06 * c - a05 * s;
        out[9] = a09 * c + a10 * s;
        out[10] = a10 * c - a09 * s;
        out[13] = a13 * c + a14 * s;
        out[14] = a14 * c - a13 * s;
        return out;
    },
    
    rotateY: (out, a, rad) => {
        // Copy all elements from a to out first
        for (let i = 0; i < 16; i++) {
            out[i] = a[i];
        }
        const s = Math.sin(rad), c = Math.cos(rad);
        const a00 = a[0], a02 = a[2];
        const a04 = a[4], a06 = a[6];
        const a08 = a[8], a10 = a[10];
        const a12 = a[12], a14 = a[14];
        
        out[0] = a00 * c - a02 * s;
        out[2] = a00 * s + a02 * c;
        out[4] = a04 * c - a06 * s;
        out[6] = a04 * s + a06 * c;
        out[8] = a08 * c - a10 * s;
        out[10] = a08 * s + a10 * c;
        out[12] = a12 * c - a14 * s;
        out[14] = a12 * s + a14 * c;
        return out;
    },
    
    rotateZ: (out, a, rad) => {
        // Copy all elements from a to out first
        for (let i = 0; i < 16; i++) {
            out[i] = a[i];
        }
        const s = Math.sin(rad), c = Math.cos(rad);
        const a00 = a[0], a01 = a[1];
        const a04 = a[4], a05 = a[5];
        const a08 = a[8], a09 = a[9];
        const a12 = a[12], a13 = a[13];
        
        out[0] = a00 * c + a01 * s;
        out[1] = a01 * c - a00 * s;
        out[4] = a04 * c + a05 * s;
        out[5] = a05 * c - a04 * s;
        out[8] = a08 * c + a09 * s;
        out[9] = a09 * c - a08 * s;
        out[12] = a12 * c + a13 * s;
        out[13] = a13 * c - a12 * s;
        return out;
    },
    
    scale: (out, a, v) => {
        // Copy all elements from a to out first
        for (let i = 0; i < 16; i++) {
            out[i] = a[i];
        }
        out[0] = a[0] * v[0]; out[1] = a[1] * v[0]; out[2] = a[2] * v[0]; out[3] = a[3] * v[0];
        out[4] = a[4] * v[1]; out[5] = a[5] * v[1]; out[6] = a[6] * v[1]; out[7] = a[7] * v[1];
        out[8] = a[8] * v[2]; out[9] = a[9] * v[2]; out[10] = a[10] * v[2]; out[11] = a[11] * v[2];
        return out;
    }
};

const mat3 = {
    create: () => new Float32Array(9),
    
    normalFromMat4: (out, a) => {
        // Extract 3x3 from 4x4 and invert/transpose for normal matrix
        out[0] = a[0]; out[1] = a[1]; out[2] = a[2];
        out[3] = a[4]; out[4] = a[5]; out[5] = a[6];
        out[6] = a[8]; out[7] = a[9]; out[8] = a[10];
        return out;
    }
};
