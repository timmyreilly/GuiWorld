// Three.js 3D Server World Manager
class ServerWorld3D {
    constructor(containerId) {
        console.log("Creating ServerWorld3D for container:", containerId);
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            console.error("Container not found:", containerId);
            return;
        }
        
        console.log("Container found:", this.container);
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.character = null;
        this.controls = null;
        this.dashboards = new Map();
        this.servers = new Map();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.keys = {};
        this.characterState = {
            position: { x: 0, y: 1, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            isMoving: false
        };
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        console.log("Initializing Three.js scene...");
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 1, 1000);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 10, 20);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
        
        console.log("Renderer created and added to container");

        // Create lighting
        this.setupLighting();

        // Add a test cube to verify rendering
        this.addTestCube();

        // Create ground
        this.createGround();

        // Create character
        this.createCharacter();

        // Setup controls
        this.setupControls();

        // Handle resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    addTestCube() {
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 1, 0);
        cube.castShadow = true;
        cube.receiveShadow = true;
        this.scene.add(cube);
        console.log("Test cube added to scene");
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);

        // Point lights for atmosphere
        const pointLight1 = new THREE.PointLight(0x0099ff, 0.5, 50);
        pointLight1.position.set(-20, 10, -20);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xff3300, 0.5, 50);
        pointLight2.position.set(20, 10, 20);
        this.scene.add(pointLight2);
    }

    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x16213e,
            transparent: true,
            opacity: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Create grid
        const gridHelper = new THREE.GridHelper(200, 40, 0x0f3460, 0x0f3460);
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);
    }

    createCharacter() {
        // Create a simple character (capsule)
        const characterGroup = new THREE.Group();
        
        // Body (cylinder)
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        body.castShadow = true;
        characterGroup.add(body);

        // Head (sphere)
        const headGeometry = new THREE.SphereGeometry(0.25, 8, 6);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFE082 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.75;
        head.castShadow = true;
        characterGroup.add(head);

        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.05, 4, 4);
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.1, 1.8, 0.2);
        characterGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.1, 1.8, 0.2);
        characterGroup.add(rightEye);

        characterGroup.position.set(0, 0, 0);
        this.character = characterGroup;
        this.scene.add(characterGroup);
    }

    setupControls() {
        // Third-person camera controls
        this.controls = {
            distance: 10,
            height: 5,
            angle: 0
        };
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
        });

        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });

        // Mouse controls for camera
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            if (event.buttons === 1) { // Left mouse button
                this.controls.angle += event.movementX * 0.01;
            }
        });

        // Mouse click for dashboard interaction
        this.renderer.domElement.addEventListener('click', (event) => {
            this.onMouseClick(event);
        });

        // Prevent context menu
        this.renderer.domElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }

    updateCharacterMovement() {
        const moveSpeed = 0.1;
        const rotateSpeed = 0.05;
        let moved = false;

        // Movement
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.character.position.z -= moveSpeed;
            moved = true;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.character.position.z += moveSpeed;
            moved = true;
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.character.position.x -= moveSpeed;
            moved = true;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.character.position.x += moveSpeed;
            moved = true;
        }

        // Rotation
        if (this.keys['KeyQ']) {
            this.character.rotation.y += rotateSpeed;
        }
        if (this.keys['KeyE']) {
            this.character.rotation.y -= rotateSpeed;
        }

        // Update character state
        this.characterState.isMoving = moved;
        if (moved) {
            this.characterState.position.x = this.character.position.x;
            this.characterState.position.y = this.character.position.y;
            this.characterState.position.z = this.character.position.z;
            
            // Notify server of position change
            if (window.serverWorld3DHub) {
                window.serverWorld3DHub.updateCharacterPosition(this.characterState.position);
            }
        }
    }

    updateCamera() {
        // Third-person camera follow
        const targetPosition = new THREE.Vector3(
            this.character.position.x + Math.sin(this.controls.angle) * this.controls.distance,
            this.character.position.y + this.controls.height,
            this.character.position.z + Math.cos(this.controls.angle) * this.controls.distance
        );

        this.camera.position.lerp(targetPosition, 0.1);
        this.camera.lookAt(this.character.position);
    }

    createServerDashboard(serverState) {
        const dashboardGroup = new THREE.Group();
        
        // Dashboard panel
        const panelGeometry = new THREE.PlaneGeometry(4, 3);
        const panelMaterial = new THREE.MeshLambertMaterial({ 
            color: this.getStatusColor(serverState.status),
            transparent: true,
            opacity: 0.8
        });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.y = 2;
        dashboardGroup.add(panel);

        // Frame
        const frameGeometry = new THREE.RingGeometry(1.8, 2.1, 8);
        const frameMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.5
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.y = 2;
        frame.position.z = 0.01;
        dashboardGroup.add(frame);

        // Server name label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        context.fillStyle = '#ffffff';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.fillText(serverState.name, 128, 40);
        context.font = '16px Arial';
        context.fillText(`CPU: ${serverState.cpuUsage.toFixed(1)}%`, 128, 70);
        context.fillText(`Memory: ${serverState.memoryUsage.toFixed(1)}%`, 128, 95);

        const texture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.MeshBasicMaterial({ 
            map: texture,
            transparent: true
        });
        const labelGeometry = new THREE.PlaneGeometry(3, 1.5);
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.y = 2;
        label.position.z = 0.02;
        dashboardGroup.add(label);

        // Position the dashboard
        dashboardGroup.position.set(
            serverState.position.x,
            serverState.position.y,
            serverState.position.z
        );

        // Store references
        dashboardGroup.userData = { serverId: serverState.id, serverState: serverState };
        
        this.scene.add(dashboardGroup);
        this.dashboards.set(serverState.id, dashboardGroup);
        this.servers.set(serverState.id, serverState);

        return dashboardGroup;
    }

    updateServerDashboard(serverState) {
        const dashboard = this.dashboards.get(serverState.id);
        if (!dashboard) {
            return this.createServerDashboard(serverState);
        }

        // Update color based on status
        const panel = dashboard.children[0];
        panel.material.color.setHex(this.getStatusColor(serverState.status));

        // Update text
        const label = dashboard.children[2];
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        context.fillStyle = '#ffffff';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.fillText(serverState.name, 128, 40);
        context.font = '16px Arial';
        context.fillText(`CPU: ${serverState.cpuUsage.toFixed(1)}%`, 128, 70);
        context.fillText(`Memory: ${serverState.memoryUsage.toFixed(1)}%`, 128, 95);

        label.material.map = new THREE.CanvasTexture(canvas);
        label.material.needsUpdate = true;

        // Update stored state
        this.servers.set(serverState.id, serverState);
        dashboard.userData.serverState = serverState;
    }

    getStatusColor(status) {
        switch (status) {
            case 1: return 0x4CAF50; // Healthy - Green
            case 2: return 0xFF9800; // Warning - Orange
            case 3: return 0xF44336; // Critical - Red
            case 4: return 0x9E9E9E; // Offline - Gray
            case 5: return 0x2196F3; // Maintenance - Blue
            default: return 0x607D8B; // Unknown - Blue Gray
        }
    }

    onMouseClick(event) {
        // Calculate mouse position in normalized device coordinates
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Raycast
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            let dashboard = clickedObject.parent;
            
            // Find the dashboard group
            while (dashboard && !dashboard.userData.serverId) {
                dashboard = dashboard.parent;
            }

            if (dashboard && dashboard.userData.serverId) {
                this.onDashboardClick(dashboard.userData.serverId, dashboard.userData.serverState);
            }
        }
    }

    onDashboardClick(serverId, serverState) {
        console.log('Dashboard clicked:', serverId, serverState);
        
        // Trigger custom event for dashboard interaction
        const event = new CustomEvent('dashboardClicked', {
            detail: { serverId, serverState }
        });
        document.dispatchEvent(event);
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updateCharacterMovement();
        this.updateCamera();
        
        // Animate dashboards (floating effect)
        this.dashboards.forEach((dashboard) => {
            dashboard.position.y = Math.sin(Date.now() * 0.001 + dashboard.position.x) * 0.2 + 2;
            dashboard.rotation.y = Math.sin(Date.now() * 0.0005) * 0.1;
        });
        
        this.renderer.render(this.scene, this.camera);
    }

    // Public API methods
    addOrUpdateServer(serverState) {
        this.updateServerDashboard(serverState);
    }

    removeServer(serverId) {
        const dashboard = this.dashboards.get(serverId);
        if (dashboard) {
            this.scene.remove(dashboard);
            this.dashboards.delete(serverId);
            this.servers.delete(serverId);
        }
    }

    getCharacterPosition() {
        return this.characterState.position;
    }

    setCharacterPosition(x, y, z) {
        this.character.position.set(x, y, z);
        this.characterState.position = { x, y, z };
    }
}

// Make it globally available
window.ServerWorld3D = ServerWorld3D;
