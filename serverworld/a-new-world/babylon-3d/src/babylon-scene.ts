import { Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, Vector3, MeshBuilder, StandardMaterial, Color3, Animation, ShadowGenerator, Mesh, PointerEventTypes } from '@babylonjs/core';

class BabylonScene {
    private engine: Engine;
    private scene: Scene;
    private camera!: ArcRotateCamera; // Definite assignment assertion
    private cubes: Mesh[] = [];
    private shadowGenerator!: ShadowGenerator;
    private canvas: HTMLCanvasElement;
    private centerCube!: Mesh; // Reference to the red center cube
    private greenCube!: Mesh; // Reference to the green cube
    private yellowCube!: Mesh; // Reference to the yellow cube
    private blueCube!: Mesh; // Reference to the blue cube
    private purpleCube!: Mesh; // Reference to the purple cube
    private audioContext: AudioContext | null = null;
    private clickHandlersSetup: boolean = false; // Guard to prevent duplicate handlers
    private currentSceneType: 'main' | 'menu' = 'main'; // Track current scene type

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        
        // Create Babylon.js engine and scene
        this.engine = new Engine(canvas, true);
        this.scene = new Scene(this.engine);
        
        this.createCamera();
        this.createLighting();
        this.createGeometry();
        this.setupAudio();
        this.setupClickHandling();
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
        
        // Store reference to center cube for click detection
        this.centerCube = centerCube;

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
            
            // Store reference to green cube (index 0), yellow cube (index 2), blue cube (index 1), and purple cube (index 3)
            if (index === 0) {
                this.greenCube = cube;
            }
            if (index === 2) {
                this.yellowCube = cube;
            }
            if (index === 1) {
                this.blueCube = cube;
            }
            if (index === 3) {
                this.purpleCube = cube;
            }
            
            // Enable shadows
            this.shadowGenerator.addShadowCaster(cube);
            this.cubes.push(cube);
        });
    }

    private createMenuScene(): void {
        console.log('Creating menu scene...');
        
        // Clear the current scene
        this.scene.dispose();
        
        // Create a new scene
        this.scene = new Scene(this.engine);
        this.currentSceneType = 'menu';
        
        // Create simpler lighting for the menu
        this.createMenuLighting();
        
        // Create menu geometry
        this.createMenuGeometry();
        
        // Create a simpler camera setup
        this.createMenuCamera();
        
        // Re-setup click handling for the new scene
        this.clickHandlersSetup = false;
        this.setupClickHandling();
        
        // Show transition feedback
        this.showSceneTransitionFeedback('🎮 Entered Menu Scene', 'success');
    }

    private createMenuLighting(): void {
        // Simple ambient light only - no shadows for cleaner look
        const ambientLight = new HemisphericLight("menuAmbient", new Vector3(0, 1, 0), this.scene);
        ambientLight.intensity = 0.8; // Brighter ambient for menu
        
        // Soft directional light for subtle depth
        const dirLight = new DirectionalLight("menuDirLight", new Vector3(-0.5, -1, -0.5), this.scene);
        dirLight.position = new Vector3(5, 10, 5);
        dirLight.intensity = 0.3; // Much softer than main scene
        
        // No shadow generator for simpler, cleaner look
    }

    private createMenuCamera(): void {
        // Create a camera positioned to view the menu nicely
        this.camera = new ArcRotateCamera(
            "menuCamera", 
            0,          // alpha (horizontal rotation)
            Math.PI/4,  // beta (vertical rotation) - slightly higher view
            8,          // radius (closer for menu view)
            Vector3.Zero(), // target position
            this.scene
        );
        
        // Enable camera controls but with tighter limits
        this.camera.attachControl();
        
        // Tighter camera limits for menu
        this.camera.lowerRadiusLimit = 5;
        this.camera.upperRadiusLimit = 12;
        this.camera.lowerBetaLimit = 0.1;
        this.camera.upperBetaLimit = Math.PI / 2.5; // Prevent looking too far down
    }

    private createMenuGeometry(): void {
        // Create a simple platform
        const platform = MeshBuilder.CreateGround("menuPlatform", {
            width: 8,
            height: 8
        }, this.scene);
        
        const platformMaterial = new StandardMaterial("platformMat", this.scene);
        platformMaterial.diffuseColor = new Color3(0.1, 0.15, 0.3); // Dark blue platform
        platform.material = platformMaterial;

        // Create menu title
        const titleBlock = MeshBuilder.CreateBox("titleBlock", {
            width: 4,
            height: 0.5,
            depth: 1
        }, this.scene);
        
        titleBlock.position = new Vector3(0, 0.25, -2);
        
        const titleMaterial = new StandardMaterial("titleMat", this.scene);
        titleMaterial.diffuseColor = new Color3(0.2, 0.8, 1); // Light blue
        titleMaterial.emissiveColor = new Color3(0.05, 0.2, 0.25); // Slight glow
        titleBlock.material = titleMaterial;

        // Create menu options as floating cubes
        const menuOptions = [
            { name: "option1", pos: new Vector3(-2, 1, 0), color: new Color3(0.3, 0.9, 0.3), label: "Settings" },
            { name: "option2", pos: new Vector3(0, 1, 0), color: new Color3(0.9, 0.6, 0.3), label: "Projects" },
            { name: "option3", pos: new Vector3(2, 1, 0), color: new Color3(0.9, 0.3, 0.6), label: "About" }
        ];

        menuOptions.forEach(option => {
            const cube = MeshBuilder.CreateBox(option.name, {
                size: 0.8
            }, this.scene);
            
            cube.position = option.pos;
            
            const material = new StandardMaterial(`${option.name}Mat`, this.scene);
            material.diffuseColor = option.color;
            material.emissiveColor = option.color.scale(0.1); // Subtle glow
            cube.material = material;
            
            // Add floating animation
            const animationKeys = [];
            animationKeys.push({
                frame: 0,
                value: option.pos.y
            });
            animationKeys.push({
                frame: 60,
                value: option.pos.y + 0.2
            });
            animationKeys.push({
                frame: 120,
                value: option.pos.y
            });

            const animationBox = Animation.CreateAndStartAnimation(
                `${option.name}Float`,
                cube,
                "position.y",
                30,
                120,
                option.pos.y,
                option.pos.y + 0.2,
                Animation.ANIMATIONLOOPMODE_CYCLE
            );
            
            this.cubes.push(cube);
        });

        // Add "Back to Main" button
        const backButton = MeshBuilder.CreateSphere("backButton", {
            diameter: 1
        }, this.scene);
        
        backButton.position = new Vector3(0, 0.5, 2.5);
        
        const backMaterial = new StandardMaterial("backMat", this.scene);
        backMaterial.diffuseColor = new Color3(0.8, 0.2, 0.2); // Red for back
        backMaterial.emissiveColor = new Color3(0.2, 0.05, 0.05);
        backButton.material = backMaterial;
        
        // Store reference for click detection
        (this as any).backButton = backButton;
        this.cubes.push(backButton);
    }

    private returnToMainScene(): void {
        console.log('Returning to main scene...');
        
        // Clear the menu scene
        this.scene.dispose();
        
        // Create a new main scene
        this.scene = new Scene(this.engine);
        this.currentSceneType = 'main';
        
        // Recreate main scene components
        this.createCamera();
        this.createLighting();
        this.createGeometry();
        
        // Re-setup click handling for the main scene
        this.clickHandlersSetup = false;
        this.setupClickHandling();
        
        // Show transition feedback
        this.showSceneTransitionFeedback('🌍 Returned to Main Scene', 'success');
    }

    private showSceneTransitionFeedback(message: string, type: 'success' | 'info'): void {
        // Create or update a feedback div for scene transitions
        let feedbackDiv = document.getElementById('scene-transition-feedback');
        
        if (!feedbackDiv) {
            feedbackDiv = document.createElement('div');
            feedbackDiv.id = 'scene-transition-feedback';
            feedbackDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0);
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
                padding: 20px 30px;
                border-radius: 15px;
                font-family: Arial, sans-serif;
                font-weight: bold;
                font-size: 18px;
                z-index: 1500;
                transition: transform 0.4s ease-in-out;
                box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);
                text-align: center;
            `;
            document.body.appendChild(feedbackDiv);
        }

        feedbackDiv.textContent = message;

        // Animate in
        setTimeout(() => {
            feedbackDiv.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);

        // Hide after 2.5 seconds
        setTimeout(() => {
            feedbackDiv.style.transform = 'translate(-50%, -50%) scale(0)';
        }, 2500);
    }

    private setupAudio(): void {
        // Initialize Web Audio API context
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }

    private playBoopSound(): void {
        if (!this.audioContext) {
            console.warn('Audio context not available');
            return;
        }

        try {
            // Create a simple "boop" sound using oscillators
            const oscillator1 = this.audioContext.createOscillator();
            const oscillator2 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            // Set up the main tone (higher frequency)
            oscillator1.type = 'sine';
            oscillator1.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator1.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);

            // Set up a subtle harmonic (lower frequency)
            oscillator2.type = 'sine';
            oscillator2.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator2.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);

            // Set up volume envelope for a pleasant "boop"
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

            // Connect the audio graph
            oscillator1.connect(gainNode);
            oscillator2.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Play the sound
            oscillator1.start(this.audioContext.currentTime);
            oscillator2.start(this.audioContext.currentTime);
            oscillator1.stop(this.audioContext.currentTime + 0.2);
            oscillator2.stop(this.audioContext.currentTime + 0.2);

        } catch (error) {
            console.warn('Error playing boop sound:', error);
        }
    }

    private updateHTMLContent(): void {
        // Create or update a message div outside the canvas
        let messageDiv = document.getElementById('yellow-cube-message');
        
        if (!messageDiv) {
            // Create the message div if it doesn't exist
            messageDiv = document.createElement('div');
            messageDiv.id = 'yellow-cube-message';
            messageDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #FFD700, #FFA500);
                color: #333;
                padding: 15px 20px;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
                font-family: Arial, sans-serif;
                font-weight: bold;
                font-size: 14px;
                max-width: 250px;
                z-index: 1000;
                transform: translateX(100%);
                transition: transform 0.3s ease-in-out;
                border: 2px solid #FFD700;
            `;
            document.body.appendChild(messageDiv);
        }

        // Generate a random message
        const messages = [
            "🌟 Yellow cube activated!",
            "⚡ External HTML updated!",
            "🎨 Canvas-to-DOM connection established!",
            "🚀 Yellow power engaged!",
            "✨ Magic happening outside the 3D world!",
            "🔥 DOM manipulation in progress!",
            "💫 Bridge between 3D and HTML activated!",
            "🎯 Click count: " + (Math.floor(Math.random() * 100) + 1)
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const timestamp = new Date().toLocaleTimeString();
        
        messageDiv.innerHTML = `
            <div style="font-size: 16px; margin-bottom: 5px;">${randomMessage}</div>
            <div style="font-size: 12px; opacity: 0.8;">Time: ${timestamp}</div>
        `;
        
        // Animate the message in
        messageDiv.style.transform = 'translateX(0)';
        
        // Hide the message after 3 seconds
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(100%)';
        }, 3000);
    }

    private async sendToQueueService(): Promise<void> {
        try {
            // Create a sample message payload
            const messagePayload = {
                timestamp: new Date().toISOString(),
                source: "babylon-blue-cube",
                event: "cube-clicked",
                data: {
                    cubeId: "blue-cube",
                    position: {
                        x: this.blueCube.position.x,
                        y: this.blueCube.position.y,
                        z: this.blueCube.position.z
                    },
                    message: "Blue cube interaction detected!",
                    sessionId: Math.random().toString(36).substring(2, 15)
                }
            };

            console.log('Sending payload to queue service:', messagePayload);

            // Send POST request to FastAPI endpoint
            const response = await fetch('http://localhost:8000/queue/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messagePayload)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Successfully sent to queue service:', result);
                
                // Show success feedback
                this.showQueueServiceFeedback('✅ Message sent to Azure queue!', 'success');
            } else {
                console.error('Failed to send to queue service:', response.status, response.statusText);
                this.showQueueServiceFeedback('❌ Failed to send message', 'error');
            }
        } catch (error) {
            console.error('Error sending to queue service:', error);
            this.showQueueServiceFeedback('🔌 Queue service unavailable', 'warning');
        }
    }

    private showQueueServiceFeedback(message: string, type: 'success' | 'error' | 'warning'): void {
        // Create or update a feedback div for queue service status
        let feedbackDiv = document.getElementById('queue-service-feedback');
        
        if (!feedbackDiv) {
            feedbackDiv = document.createElement('div');
            feedbackDiv.id = 'queue-service-feedback';
            feedbackDiv.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                padding: 15px 20px;
                border-radius: 10px;
                font-family: Arial, sans-serif;
                font-weight: bold;
                font-size: 14px;
                max-width: 300px;
                z-index: 1000;
                transform: translateY(100%);
                transition: transform 0.3s ease-in-out;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            `;
            document.body.appendChild(feedbackDiv);
        }

        // Set colors based on message type
        const colors = {
            success: { bg: 'linear-gradient(135deg, #4CAF50, #45a049)', border: '#4CAF50' },
            error: { bg: 'linear-gradient(135deg, #f44336, #d32f2f)', border: '#f44336' },
            warning: { bg: 'linear-gradient(135deg, #ff9800, #f57c00)', border: '#ff9800' }
        };

        feedbackDiv.style.background = colors[type].bg;
        feedbackDiv.style.border = `2px solid ${colors[type].border}`;
        feedbackDiv.style.color = 'white';
        feedbackDiv.textContent = message;

        // Animate in
        feedbackDiv.style.transform = 'translateY(0)';

        // Hide after 3 seconds
        setTimeout(() => {
            feedbackDiv.style.transform = 'translateY(100%)';
        }, 3000);
    }

    private launch2DScene(): void {
        console.log('Purple cube clicked! Launching 2D scene...');
        
        // Check if a 2D scene is already open to prevent duplicates
        const existing2DCanvas = document.getElementById('scene2d-canvas');
        if (existing2DCanvas) {
            console.log('2D scene already exists, not creating another one');
            return;
        }
        
        // Create a fullscreen 2D canvas overlay
        const canvas2D = document.createElement('canvas');
        canvas2D.id = 'scene2d-canvas';
        canvas2D.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 2000;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            cursor: crosshair;
        `;
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '✕ Close 2D Scene';
        closeButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2001;
            background: rgba(255, 255, 255, 0.9);
            border: 2px solid #764ba2;
            border-radius: 8px;
            padding: 10px 15px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.background = '#764ba2';
            closeButton.style.color = 'white';
        });
        
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.background = 'rgba(255, 255, 255, 0.9)';
            closeButton.style.color = 'black';
        });
        
        // Set canvas size
        canvas2D.width = window.innerWidth;
        canvas2D.height = window.innerHeight;
        
        // Get 2D context
        const ctx = canvas2D.getContext('2d');
        if (!ctx) return;
        
        // Initialize 2D scene
        this.init2DScene(ctx, canvas2D);
        
        // Add elements to DOM
        document.body.appendChild(canvas2D);
        document.body.appendChild(closeButton);
        
        // Close button functionality
        const closeHandler = () => {
            // Remove elements if they still exist
            const canvas2DToRemove = document.getElementById('scene2d-canvas');
            const closeButtonToRemove = document.querySelector('button');
            
            if (canvas2DToRemove) {
                document.body.removeChild(canvas2DToRemove);
            }
            if (closeButtonToRemove && closeButtonToRemove.textContent?.includes('Close 2D Scene')) {
                document.body.removeChild(closeButtonToRemove);
            }
            
            // Show transition feedback
            this.show2DSceneFeedback('👋 Returned to 3D scene!', 'success');
        };
        
        closeButton.addEventListener('click', closeHandler);
        
        // Also allow ESC key to close
        const escHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeHandler();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        // Show launch feedback
        this.show2DSceneFeedback('� Emoji Adventure Launched! Use WASD or arrows to move, click buttons to change emoji!', 'success');
    }

    private init2DScene(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
        // 2D Scene variables
        let player = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            emoji: '😊',
            size: 40
        };
        
        let animationId: number;
        let keys: { [key: string]: boolean } = {};
        
        // D-pad controls configuration
        let dPad = {
            centerX: 120,
            centerY: canvas.height - 250,
            buttonSize: 35,
            spacing: 45,
            pressedButton: null as string | null,
            buttons: {
                up: { x: 120, y: canvas.height - 295, direction: 'up', key: 'ArrowUp' },
                down: { x: 120, y: canvas.height - 205, direction: 'down', key: 'ArrowDown' },
                left: { x: 75, y: canvas.height - 250, direction: 'left', key: 'ArrowLeft' },
                right: { x: 165, y: canvas.height - 250, direction: 'right', key: 'ArrowRight' }
            }
        };
        
        // Menu buttons positioned on the right side of the canvas
        let menuButtons = [
            { x: canvas.width - 100, y: 120, emoji: '🚀', label: 'Rocket', color: '#ff6b6b' },
            { x: canvas.width - 100, y: 220, emoji: '🎮', label: 'Game', color: '#4ecdc4' },
            { x: canvas.width - 100, y: 320, emoji: '🎨', label: 'Art', color: '#45b7d1' },
            { x: canvas.width - 100, y: 420, emoji: '🎵', label: 'Music', color: '#f9ca24' },
            { x: canvas.width - 100, y: 520, emoji: '🌟', label: 'Star', color: '#f0932b' },
            { x: canvas.width - 100, y: 620, emoji: '🔥', label: 'Fire', color: '#eb4d4b' }
        ];
        
        // Add keyboard event listeners
        const keyDownHandler = (e: KeyboardEvent) => {
            keys[e.code] = true;
            e.preventDefault();
        };
        
        const keyUpHandler = (e: KeyboardEvent) => {
            keys[e.code] = false;
            e.preventDefault();
        };
        
        document.addEventListener('keydown', keyDownHandler);
        document.addEventListener('keyup', keyUpHandler);
        
        // Mouse/touch handlers for D-pad and buttons
        const mouseDownHandler = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            // Check D-pad button clicks
            Object.entries(dPad.buttons).forEach(([direction, button]) => {
                const distance = Math.sqrt(
                    Math.pow(clickX - button.x, 2) + Math.pow(clickY - button.y, 2)
                );
                
                if (distance < dPad.buttonSize) {
                    dPad.pressedButton = direction;
                    keys[button.key] = true;
                    e.preventDefault();
                }
            });
            
            // Check if any emoji button was clicked
            menuButtons.forEach(button => {
                const distance = Math.sqrt(
                    Math.pow(clickX - button.x, 2) + Math.pow(clickY - button.y, 2)
                );
                
                if (distance < 40) {
                    player.emoji = button.emoji;
                    console.log(`Emoji changed to ${button.emoji} (${button.label})`);
                }
            });
        };
        
        const mouseUpHandler = (e: MouseEvent) => {
            // Release all D-pad buttons
            if (dPad.pressedButton) {
                const button = dPad.buttons[dPad.pressedButton as keyof typeof dPad.buttons];
                keys[button.key] = false;
                dPad.pressedButton = null;
            }
        };
        
        canvas.addEventListener('mousedown', mouseDownHandler);
        canvas.addEventListener('mouseup', mouseUpHandler);
        canvas.addEventListener('mouseleave', mouseUpHandler); // Release buttons when mouse leaves canvas
        
        // Touch event handlers for mobile support
        const touchStartHandler = (e: TouchEvent) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            // Check D-pad button touches
            Object.entries(dPad.buttons).forEach(([direction, button]) => {
                const distance = Math.sqrt(
                    Math.pow(touchX - button.x, 2) + Math.pow(touchY - button.y, 2)
                );
                
                if (distance < dPad.buttonSize) {
                    dPad.pressedButton = direction;
                    keys[button.key] = true;
                }
            });
            
            // Check emoji button touches
            menuButtons.forEach(button => {
                const distance = Math.sqrt(
                    Math.pow(touchX - button.x, 2) + Math.pow(touchY - button.y, 2)
                );
                
                if (distance < 40) {
                    player.emoji = button.emoji;
                    console.log(`Emoji changed to ${button.emoji} (${button.label})`);
                }
            });
        };
        
        const touchEndHandler = (e: TouchEvent) => {
            e.preventDefault();
            // Release all D-pad buttons
            if (dPad.pressedButton) {
                const button = dPad.buttons[dPad.pressedButton as keyof typeof dPad.buttons];
                keys[button.key] = false;
                dPad.pressedButton = null;
            }
        };
        
        canvas.addEventListener('touchstart', touchStartHandler);
        canvas.addEventListener('touchend', touchEndHandler);
        canvas.addEventListener('touchcancel', touchEndHandler);
        
        // Animation loop
        const animate = () => {
            // Clear canvas with solid background
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Handle player movement
            const moveSpeed = 15;
            if (keys['ArrowLeft'] || keys['KeyA']) {
                player.x = Math.max(player.size, player.x - moveSpeed);
            }
            if (keys['ArrowRight'] || keys['KeyD']) {
                player.x = Math.min(canvas.width - player.size, player.x + moveSpeed);
            }
            if (keys['ArrowUp'] || keys['KeyW']) {
                player.y = Math.max(player.size, player.y - moveSpeed);
            }
            if (keys['ArrowDown'] || keys['KeyS']) {
                player.y = Math.min(canvas.height - player.size, player.y + moveSpeed);
            }
            
            // Draw menu buttons
            menuButtons.forEach(button => {
                // Draw button background
                ctx.beginPath();
                ctx.arc(button.x, button.y, 35, 0, Math.PI * 2);
                ctx.fillStyle = button.color;
                ctx.fill();
                
                // Draw button border
                ctx.beginPath();
                ctx.arc(button.x, button.y, 35, 0, Math.PI * 2);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // Draw button emoji
                ctx.font = '30px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(button.emoji, button.x, button.y);
                
                // Draw button label
                ctx.font = '14px Arial';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(button.label, button.x, button.y + 55);
                
                // Check for collision with player
                const distance = Math.sqrt(
                    Math.pow(player.x - button.x, 2) + Math.pow(player.y - button.y, 2)
                );
                
                if (distance < 60) {
                    // Highlight button when player is near
                    ctx.beginPath();
                    ctx.arc(button.x, button.y, 40, 0, Math.PI * 2);
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 4;
                    ctx.setLineDash([5, 5]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            });
            
            // Draw D-pad controller
            // D-pad background circle
            ctx.beginPath();
            ctx.arc(dPad.centerX, dPad.centerY, 60, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(52, 73, 94, 0.8)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw D-pad buttons
            Object.entries(dPad.buttons).forEach(([direction, button]) => {
                const isPressed = dPad.pressedButton === direction || keys[button.key];
                
                // Button background
                ctx.beginPath();
                ctx.arc(button.x, button.y, dPad.buttonSize, 0, Math.PI * 2);
                ctx.fillStyle = isPressed ? '#3498db' : 'rgba(149, 165, 166, 0.9)';
                ctx.fill();
                
                // Button border
                ctx.beginPath();
                ctx.arc(button.x, button.y, dPad.buttonSize, 0, Math.PI * 2);
                ctx.strokeStyle = isPressed ? '#ffffff' : 'rgba(127, 140, 141, 1)';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Arrow symbol
                ctx.fillStyle = isPressed ? '#ffffff' : '#2c3e50';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                const arrows = {
                    up: '▲',
                    down: '▼',
                    left: '◀',
                    right: '▶'
                };
                
                ctx.fillText(arrows[direction as keyof typeof arrows], button.x, button.y);
            });
            
            // D-pad label
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillText('MOVE', dPad.centerX, dPad.centerY + 90);
            
            // Draw player emoji
            ctx.font = `${player.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(player.emoji, player.x, player.y);
            
            // Draw player glow effect
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.size / 2 + 5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Draw instructions
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('🎮 Emoji Adventure', canvas.width / 2, 40);
            
            ctx.font = '16px Arial';
            ctx.fillStyle = '#ecf0f1';
            ctx.fillText('Use WASD, Arrow Keys, or D-pad to move • Click buttons to change emoji', canvas.width / 2, canvas.height - 30);
            
            // Draw current emoji info
            ctx.font = '18px Arial';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`Current: ${player.emoji}`, 20, canvas.height - 60);
            
            animationId = requestAnimationFrame(animate);
        };
        
        // Start animation
        animate();
        
        // Cleanup function (called when scene closes)
        canvas.addEventListener('remove', () => {
            cancelAnimationFrame(animationId);
            document.removeEventListener('keydown', keyDownHandler);
            document.removeEventListener('keyup', keyUpHandler);
            canvas.removeEventListener('mousedown', mouseDownHandler);
            canvas.removeEventListener('mouseup', mouseUpHandler);
            canvas.removeEventListener('mouseleave', mouseUpHandler);
            canvas.removeEventListener('touchstart', touchStartHandler);
            canvas.removeEventListener('touchend', touchEndHandler);
            canvas.removeEventListener('touchcancel', touchEndHandler);
        });
    }

    private show2DSceneFeedback(message: string, type: 'success' | 'info'): void {
        // Create or update a feedback div for 2D scene transitions
        let feedbackDiv = document.getElementById('scene2d-feedback');
        
        if (!feedbackDiv) {
            feedbackDiv = document.createElement('div');
            feedbackDiv.id = 'scene2d-feedback';
            feedbackDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0);
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 20px 30px;
                border-radius: 15px;
                font-family: Arial, sans-serif;
                font-weight: bold;
                font-size: 16px;
                z-index: 1500;
                transition: transform 0.3s ease-in-out;
                box-shadow: 0 8px 25px rgba(118, 75, 162, 0.3);
                text-align: center;
            `;
            document.body.appendChild(feedbackDiv);
        }

        feedbackDiv.textContent = message;

        // Animate in
        setTimeout(() => {
            feedbackDiv.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);

        // Hide after 2 seconds
        setTimeout(() => {
            feedbackDiv.style.transform = 'translate(-50%, -50%) scale(0)';
        }, 2000);
    }

    private setupClickHandling(): void {
        // Guard to prevent duplicate click handlers
        if (this.clickHandlersSetup) {
            console.log('Click handlers already set up, skipping...');
            return;
        }
        
        console.log('Setting up click handlers...');
        this.clickHandlersSetup = true;
        
        // Clear any existing pointer observers to prevent duplicates
        // this.scene.onPointerObservable.clear();
        
        // Store the original scale of all interactive cubes for consistent reset
        const originalScale = this.centerCube ? this.centerCube.scaling.clone() : Vector3.One();
        const greenOriginalScale = this.greenCube ? this.greenCube.scaling.clone() : Vector3.One();
        const yellowOriginalScale = this.yellowCube ? this.yellowCube.scaling.clone() : Vector3.One();
        const blueOriginalScale = this.blueCube ? this.blueCube.scaling.clone() : Vector3.One();
        const purpleOriginalScale = this.purpleCube ? this.purpleCube.scaling.clone() : Vector3.One();
        
        // Set up click detection using Babylon.js picking
        this.scene.onPointerObservable.add((pointerInfo) => {
            // Only handle pointer down events (clicks), not move or up events
            if (pointerInfo.type !== PointerEventTypes.POINTERDOWN) {
                return;
            }
            
            if (pointerInfo.pickInfo && pointerInfo.pickInfo.hit) {
                const pickedMesh = pointerInfo.pickInfo.pickedMesh;
                
                // Handle main scene interactions
                if (this.currentSceneType === 'main') {
                    // Check if the red center cube was clicked
                    if (pickedMesh === this.centerCube) {
                        console.log('Red cube clicked! Playing boop sound...');
                        this.playBoopSound();
                        
                        // Optional: Add a visual feedback (slight scale animation)
                        this.centerCube.scaling = originalScale.scale(1.1);
                        
                        // Reset scale after a short time to the exact original size
                        setTimeout(() => {
                            this.centerCube.scaling = originalScale.clone();
                        }, 100);
                    }
                    
                    // Check if the green cube was clicked
                    if (pickedMesh === this.greenCube) {
                        console.log('Green cube clicked! Transitioning to menu scene...');
                        this.createMenuScene();
                        
                        // Add visual feedback to green cube before transition
                        this.greenCube.scaling = greenOriginalScale.scale(1.3);
                        
                        // Reset scale after a short time
                        setTimeout(() => {
                            if (this.greenCube && this.currentSceneType === 'main') {
                                this.greenCube.scaling = greenOriginalScale.clone();
                            }
                        }, 200);
                    }
                    
                    // Check if the yellow cube was clicked
                    if (pickedMesh === this.yellowCube) {
                        console.log('Yellow cube clicked! Updating HTML content...');
                        this.updateHTMLContent();
                        
                        // Add visual feedback to yellow cube
                        this.yellowCube.scaling = yellowOriginalScale.scale(1.2);
                        
                        // Reset scale after a short time to the exact original size
                        setTimeout(() => {
                            this.yellowCube.scaling = yellowOriginalScale.clone();
                        }, 150);
                    }
                    
                    // Check if the blue cube was clicked
                    if (pickedMesh === this.blueCube) {
                        console.log('Blue cube clicked! Sending message to queue service...');
                        this.sendToQueueService();
                        
                        // Add visual feedback to blue cube
                        this.blueCube.scaling = blueOriginalScale.scale(1.15);
                        
                        // Reset scale after a short time to the exact original size
                        setTimeout(() => {
                            this.blueCube.scaling = blueOriginalScale.clone();
                        }, 120);
                    }
                    
                    // Check if the purple cube was clicked
                    if (pickedMesh === this.purpleCube) {
                        console.log('Purple cube clicked! Launching 2D scene...');
                        this.launch2DScene();
                        
                        // Add visual feedback to purple cube
                        this.purpleCube.scaling = purpleOriginalScale.scale(1.25);
                        
                        // Reset scale after a short time to the exact original size
                        setTimeout(() => {
                            this.purpleCube.scaling = purpleOriginalScale.clone();
                        }, 180);
                    }
                }
                
                // Handle menu scene interactions
                if (this.currentSceneType === 'menu') {
                    // Check if back button was clicked
                    if (pickedMesh === (this as any).backButton) {
                        console.log('Back button clicked! Returning to main scene...');
                        this.returnToMainScene();
                    }
                    
                    // Handle menu option clicks
                    if (pickedMesh && pickedMesh.name === 'option1') {
                        console.log('Settings option clicked!');
                        this.showMenuOptionFeedback('⚙️ Settings - Coming Soon!');
                    } else if (pickedMesh && pickedMesh.name === 'option2') {
                        console.log('Projects option clicked!');
                        this.showMenuOptionFeedback('📁 Projects - Feature in Development!');
                    } else if (pickedMesh && pickedMesh.name === 'option3') {
                        console.log('About option clicked!');
                        this.showMenuOptionFeedback('ℹ️ About - Multi-Modal 3D Demo by GuiWorld!');
                    }
                }
            }
        });
    }

    private showMenuOptionFeedback(message: string): void {
        // Create or update a feedback div for menu options
        let feedbackDiv = document.getElementById('menu-option-feedback');
        
        if (!feedbackDiv) {
            feedbackDiv = document.createElement('div');
            feedbackDiv.id = 'menu-option-feedback';
            feedbackDiv.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%) translateY(-100%);
                background: linear-gradient(135deg, #2196F3, #1976D2);
                color: white;
                padding: 15px 25px;
                border-radius: 12px;
                font-family: Arial, sans-serif;
                font-weight: bold;
                font-size: 16px;
                z-index: 1500;
                transition: transform 0.3s ease-in-out;
                box-shadow: 0 6px 20px rgba(33, 150, 243, 0.3);
                text-align: center;
                max-width: 400px;
            `;
            document.body.appendChild(feedbackDiv);
        }

        feedbackDiv.textContent = message;

        // Animate in
        setTimeout(() => {
            feedbackDiv.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);

        // Hide after 3 seconds
        setTimeout(() => {
            feedbackDiv.style.transform = 'translateX(-50%) translateY(-100%)';
        }, 3000);
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
    console.log('DOM loaded, checking for existing scene...');
    
    // Prevent multiple scene initializations
    if ((window as any).babylonScene) {
        console.log('Babylon.js scene already exists, not creating another one');
        return;
    }
    
    const canvas = document.getElementById('renderCanvas');
    
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
        console.error('Canvas element not found or is not a canvas!');
        return;
    }

    try {
        console.log('Creating new Babylon.js scene...');
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
