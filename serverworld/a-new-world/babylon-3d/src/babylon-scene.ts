import { Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, Vector3, MeshBuilder, StandardMaterial, Color3, Animation, ShadowGenerator, Mesh } from '@babylonjs/core';

class BabylonScene {
    private engine: Engine;
    private scene: Scene;
    private camera!: ArcRotateCamera; // Definite assignment assertion
    private cubes: Mesh[] = [];
    private shadowGenerator!: ShadowGenerator;
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        
        // Create Babylon.js engine and scene
        this.engine = new Engine(canvas, true);
        this.scene = new Scene(this.engine);
        
        this.createCamera();
        this.createLighting();
        this.createGeometry();
        this.setupKeyboardControls();
        this.startRenderLoop();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    private createCamera(): void {
        // Create an arc rotate camera (orbital camera) similar to the WebGL version
        this.camera = new ArcRotateCamera(
            "camera", 
            0,          // alpha (horizontal rotation)
            Math.PI/3,  // beta (vertical rotation) 
            10,         // radius (distance from target)
            Vector3.Zero(), // target position
            this.scene
        );
        
        // Enable camera controls (mouse/touch interaction)
        this.camera.attachControl();
        
        // Set camera limits for better user experience
        this.camera.lowerRadiusLimit = 3;
        this.camera.upperRadiusLimit = 20;
        this.camera.lowerBetaLimit = 0.1;
        this.camera.upperBetaLimit = Math.PI / 2;
    }

    private createLighting(): void {
        // Ambient light for overall scene illumination
        const ambientLight = new HemisphericLight("ambient", new Vector3(0, 1, 0), this.scene);
        ambientLight.intensity = 0.3;

        // Directional light for shadows and realistic lighting
        const dirLight = new DirectionalLight("dirLight", new Vector3(-1, -1, -1), this.scene);
        dirLight.position = new Vector3(10, 10, 10);
        dirLight.intensity = 0.8;

        // Enable shadows
        const shadowGenerator = new ShadowGenerator(1024, dirLight);
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurKernel = 32;
        
        // Store reference for later use
        this.shadowGenerator = shadowGenerator;
    }

    private createGeometry(): void {
        // Create ground plane (equivalent to TABLE in WebGL version)
        const ground = MeshBuilder.CreateGround("ground", {
            width: 20,
            height: 20
        }, this.scene);
        
        const groundMaterial = new StandardMaterial("groundMat", this.scene);
        groundMaterial.diffuseColor = new Color3(0.2, 0.2, 0.2); // Gray color
        ground.material = groundMaterial;
        ground.receiveShadows = true;

        // Create center cube (large, at origin)
        const centerCube = MeshBuilder.CreateBox("centerCube", {
            size: 0.8  // Scale of 0.4 from WebGL version * 2 for size
        }, this.scene);
        
        centerCube.position = new Vector3(0, 0.4, 0);
        
        const centerMaterial = new StandardMaterial("centerMat", this.scene);
        centerMaterial.diffuseColor = new Color3(1, 0, 0); // Red color (matching WebGL front face)
        centerCube.material = centerMaterial;
        
        // Enable shadows
        this.shadowGenerator.addShadowCaster(centerCube);
        this.cubes.push(centerCube);

        // Create smaller cubes at cardinal positions (matching WebGL version exactly)
        const cubeConfigs = [
            { pos: new Vector3(1, 0.05, 1), scale: 0.05, rotation: 20 },
            { pos: new Vector3(1, 0.1, -1), scale: 0.1, rotation: 40 },
            { pos: new Vector3(-1, 0.15, 1), scale: 0.15, rotation: 60 },
            { pos: new Vector3(-1, 0.2, -1), scale: 0.2, rotation: 80 }
        ];

        cubeConfigs.forEach((config, index) => {
            const cube = MeshBuilder.CreateBox(`cube${index}`, {
                size: config.scale * 2  // Convert scale to size
            }, this.scene);
            
            cube.position = config.pos;
            cube.rotation.y = (config.rotation * Math.PI) / 180; // Convert degrees to radians
            
            // Create materials with different colors for variety
            const material = new StandardMaterial(`cubeMat${index}`, this.scene);
            const colors = [
                new Color3(0, 1, 0),    // Green
                new Color3(0, 0, 1),    // Blue  
                new Color3(1, 1, 0),    // Yellow
                new Color3(1, 0, 1)     // Magenta
            ];
            material.diffuseColor = colors[index];
            cube.material = material;
            
            // Enable shadows
            this.shadowGenerator.addShadowCaster(cube);
            this.cubes.push(cube);
        });
    }

    private setupKeyboardControls(): void {
        // Make canvas focusable
        this.canvas.tabIndex = 0;
        
        // Camera movement speed
        const rotationSpeed = 0.05; // radians per keypress
        const zoomSpeed = 0.5; // units per keypress
        
        // Add focus styling to show when canvas is active
        this.canvas.style.outline = 'none';
        this.canvas.addEventListener('focus', () => {
            this.canvas.style.boxShadow = '0 0 0 3px rgba(76, 175, 80, 0.5)';
        });
        
        this.canvas.addEventListener('blur', () => {
            this.canvas.style.boxShadow = '0 4px 16px rgba(76, 175, 80, 0.3)';
        });
        
        // Keyboard event handler
        this.canvas.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'ArrowLeft':
                    // Rotate left (decrease alpha)
                    this.camera.alpha -= rotationSpeed;
                    event.preventDefault();
                    break;
                    
                case 'ArrowRight':
                    // Rotate right (increase alpha)
                    this.camera.alpha += rotationSpeed;
                    event.preventDefault();
                    break;
                    
                case 'ArrowUp':
                    // Zoom in (decrease radius)
                    const lowerLimit = this.camera.lowerRadiusLimit ?? 1;
                    this.camera.radius = Math.max(lowerLimit, this.camera.radius - zoomSpeed);
                    event.preventDefault();
                    break;
                    
                case 'ArrowDown':
                    // Zoom out (increase radius)
                    const upperLimit = this.camera.upperRadiusLimit ?? 20;
                    this.camera.radius = Math.min(upperLimit, this.camera.radius + zoomSpeed);
                    event.preventDefault();
                    break;
                    
                case 'KeyW':
                    // Tilt up (decrease beta)
                    const lowerBetaLimit = this.camera.lowerBetaLimit ?? 0.1;
                    this.camera.beta = Math.max(lowerBetaLimit, this.camera.beta - rotationSpeed);
                    event.preventDefault();
                    break;
                    
                case 'KeyS':
                    // Tilt down (increase beta)
                    const upperBetaLimit = this.camera.upperBetaLimit ?? Math.PI / 2;
                    this.camera.beta = Math.min(upperBetaLimit, this.camera.beta + rotationSpeed);
                    event.preventDefault();
                    break;
            }
        });
        
        // Click to focus the canvas
        this.canvas.addEventListener('click', () => {
            this.canvas.focus();
        });
        
        // Initial focus
        this.canvas.focus();
    }

    private startRenderLoop(): void {
        // Start the render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    // Public method to dispose of resources
    public dispose(): void {
        this.scene.dispose();
        this.engine.dispose();
    }
}

// Initialize the Babylon.js scene when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('renderCanvas');
    
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
        console.error('Canvas element not found or is not a canvas!');
        return;
    }

    try {
        const babylonScene = new BabylonScene(canvas);
        console.log('Babylon.js scene initialized successfully!');
        
        // Optional: Add scene to global scope for debugging
        (window as any).babylonScene = babylonScene;
        
    } catch (error) {
        console.error('Failed to initialize Babylon.js scene:', error);
        
        // Display error in the DOM
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.padding = '20px';
        errorDiv.style.textAlign = 'center';
        errorDiv.innerHTML = `
            <h3>Error initializing 3D scene</h3>
            <p>${error}</p>
            <p>Please check browser console for more details.</p>
        `;
        document.body.appendChild(errorDiv);
    }
});
