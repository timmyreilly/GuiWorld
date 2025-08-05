import { Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, Vector3, MeshBuilder, StandardMaterial, Color3, Animation, ShadowGenerator, Mesh, PointerEventTypes } from '@babylonjs/core';

class BabylonScene {
    private engine: Engine;
    private scene: Scene;
    private camera!: ArcRotateCamera; // Definite assignment assertion
    private cubes: Mesh[] = [];
    private shadowGenerator!: ShadowGenerator;
    private canvas: HTMLCanvasElement;
    private centerCube!: Mesh; // Reference to the red center cube
    private yellowCube!: Mesh; // Reference to the yellow cube
    private blueCube!: Mesh; // Reference to the blue cube
    private purpleCube!: Mesh; // Reference to the purple cube
    private audioContext: AudioContext | null = null;
    private clickHandlersSetup: boolean = false; // Guard to prevent duplicate handlers

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
            
            // Store reference to yellow cube (index 2), blue cube (index 1), and purple cube (index 3)
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
        this.show2DSceneFeedback('🎨 2D Scene Launched! Press ESC or click ✕ to close', 'success');
    }

    private init2DScene(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
        // 2D Scene variables
        let particles: Array<{x: number, y: number, vx: number, vy: number, color: string, size: number}> = [];
        let mouseX = 0;
        let mouseY = 0;
        let animationId: number;
        
        // Create initial particles
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                size: Math.random() * 8 + 2
            });
        }
        
        // Mouse interaction
        canvas.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        // Click to add particles
        canvas.addEventListener('click', (e) => {
            for (let i = 0; i < 5; i++) {
                particles.push({
                    x: e.clientX + (Math.random() - 0.5) * 100,
                    y: e.clientY + (Math.random() - 0.5) * 100,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    color: `hsl(${Math.random() * 360}, 80%, 70%)`,
                    size: Math.random() * 12 + 3
                });
            }
        });
        
        // Animation loop
        const animate = () => {
            // Clear canvas with fade effect
            ctx.fillStyle = 'rgba(102, 126, 234, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw title
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🎨 Interactive 2D Scene', canvas.width / 2, 60);
            
            ctx.font = '16px Arial';
            ctx.fillText('Click anywhere to create particles! Move mouse to attract them.', canvas.width / 2, 90);
            
            // Update and draw particles
            particles.forEach((particle, index) => {
                // Mouse attraction
                const dx = mouseX - particle.x;
                const dy = mouseY - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 200) {
                    const force = (200 - distance) / 200 * 0.5;
                    particle.vx += (dx / distance) * force;
                    particle.vy += (dy / distance) * force;
                }
                
                // Apply velocity
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                // Damping
                particle.vx *= 0.99;
                particle.vy *= 0.99;
                
                // Bounce off edges
                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -0.8;
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -0.8;
                
                // Keep in bounds
                particle.x = Math.max(0, Math.min(canvas.width, particle.x));
                particle.y = Math.max(0, Math.min(canvas.height, particle.y));
                
                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = particle.color;
                ctx.fill();
                
                // Draw glow effect
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
                ctx.fillStyle = particle.color.replace('60%)', '20%)');
                ctx.fill();
                
                // Remove old particles
                if (particles.length > 200 && Math.random() < 0.01) {
                    particles.splice(index, 1);
                }
            });
            
            animationId = requestAnimationFrame(animate);
        };
        
        // Start animation
        animate();
        
        // Cleanup function (called when scene closes)
        canvas.addEventListener('remove', () => {
            cancelAnimationFrame(animationId);
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
        const originalScale = this.centerCube.scaling.clone();
        const yellowOriginalScale = this.yellowCube.scaling.clone();
        const blueOriginalScale = this.blueCube.scaling.clone();
        const purpleOriginalScale = this.purpleCube.scaling.clone();
        
        // Set up click detection using Babylon.js picking
        this.scene.onPointerObservable.add((pointerInfo) => {
            // Only handle pointer down events (clicks), not move or up events
            if (pointerInfo.type !== PointerEventTypes.POINTERDOWN) {
                return;
            }
            
            if (pointerInfo.pickInfo && pointerInfo.pickInfo.hit) {
                const pickedMesh = pointerInfo.pickInfo.pickedMesh;
                
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
