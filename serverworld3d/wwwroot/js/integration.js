// Global variables for 3D world integration
let serverWorld3D = null;
let serverWorld3DHub = null;
let dotNetRef = null;

// Initialize the 3D world
async function initializeServerWorld3D(canvasId, dotNetReference) {
    try {
        dotNetRef = dotNetReference;
        
        // Create the 3D world
        serverWorld3D = new ServerWorld3D(canvasId);
        window.serverWorld3D = serverWorld3D;
        
        // Initialize SignalR connection
        serverWorld3DHub = new ServerWorld3DHubConnection();
        window.serverWorld3DHub = serverWorld3DHub;
        
        // Set up event listeners
        setupEventListeners();
        
        // Start SignalR connection
        await serverWorld3DHub.start();
        
        console.log("Server World 3D initialized successfully");
        
    } catch (error) {
        console.error("Failed to initialize Server World 3D:", error);
    }
}

// Set up custom event listeners
function setupEventListeners() {
    // Handle dashboard clicks
    document.addEventListener('dashboardClicked', async (event) => {
        const { serverId, serverState } = event.detail;
        console.log('Dashboard clicked:', serverId, serverState);
        
        if (dotNetRef) {
            await dotNetRef.invokeMethodAsync('OnDashboardClicked', serverId);
        }
    });
    
    // Handle server state updates
    document.addEventListener('serverStateUpdated', (event) => {
        const { serverState } = event.detail;
        console.log('Server state updated:', serverState);
        
        if (serverWorld3D) {
            serverWorld3D.addOrUpdateServer(serverState);
        }
    });
    
    // Handle server states received
    document.addEventListener('serverStatesReceived', (event) => {
        const { servers } = event.detail;
        console.log('Server states received:', servers);
        
        if (serverWorld3D) {
            servers.forEach(server => {
                serverWorld3D.addOrUpdateServer(server);
            });
        }
    });
    
    // Handle server alerts
    document.addEventListener('serverAlert', (event) => {
        const { serverId, alertMessage } = event.detail;
        console.log('Server alert:', serverId, alertMessage);
        
        // You could add visual effects here for alerts
        showAlert(serverId, alertMessage);
    });
    
    // Character position tracking
    setInterval(() => {
        if (serverWorld3D && dotNetRef) {
            const position = serverWorld3D.getCharacterPosition();
            dotNetRef.invokeMethodAsync('OnCharacterPositionChanged', 
                position.x, position.y, position.z);
        }
    }, 1000); // Update every second
}

// Update servers from C#
function updateServersInWorld(serversJson) {
    try {
        const servers = JSON.parse(serversJson);
        if (serverWorld3D) {
            servers.forEach(server => {
                serverWorld3D.addOrUpdateServer(server);
            });
        }
    } catch (error) {
        console.error("Failed to update servers in world:", error);
    }
}

// Update single server from C#
function updateServerInWorld(serverJson) {
    try {
        const server = JSON.parse(serverJson);
        if (serverWorld3D) {
            serverWorld3D.addOrUpdateServer(server);
        }
    } catch (error) {
        console.error("Failed to update server in world:", error);
    }
}

// Focus camera on specific server
function focusOnServer(serverId) {
    if (serverWorld3D) {
        const dashboard = serverWorld3D.dashboards.get(serverId);
        if (dashboard) {
            // Move character closer to the server
            const serverPosition = dashboard.position;
            const offsetPosition = {
                x: serverPosition.x + 5,
                y: 1,
                z: serverPosition.z + 5
            };
            
            serverWorld3D.setCharacterPosition(
                offsetPosition.x, 
                offsetPosition.y, 
                offsetPosition.z
            );
            
            console.log(`Focused on server: ${serverId}`);
        }
    }
}

// Show alert notification
function showAlert(serverId, alertMessage) {
    // Create a visual alert in the 3D world
    if (serverWorld3D) {
        const dashboard = serverWorld3D.dashboards.get(serverId);
        if (dashboard) {
            // Add a pulsing red light effect
            const alertLight = new THREE.PointLight(0xff0000, 2, 10);
            alertLight.position.copy(dashboard.position);
            alertLight.position.y += 5;
            serverWorld3D.scene.add(alertLight);
            
            // Animate the alert light
            let intensity = 2;
            let direction = -1;
            const alertAnimation = () => {
                intensity += direction * 0.1;
                if (intensity <= 0.5 || intensity >= 2) {
                    direction *= -1;
                }
                alertLight.intensity = intensity;
                
                requestAnimationFrame(alertAnimation);
            };
            alertAnimation();
            
            // Remove alert light after 10 seconds
            setTimeout(() => {
                serverWorld3D.scene.remove(alertLight);
            }, 10000);
        }
    }
    
    // Show browser notification if possible
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification(`Server Alert - ${serverId}`, {
                body: alertMessage,
                icon: '/favicon.ico',
                tag: `server-alert-${serverId}`
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(`Server Alert - ${serverId}`, {
                        body: alertMessage,
                        icon: '/favicon.ico',
                        tag: `server-alert-${serverId}`
                    });
                }
            });
        }
    }
    
    // Show in-page notification
    showInPageAlert(serverId, alertMessage);
}

// Show in-page alert notification
function showInPageAlert(serverId, alertMessage) {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert-notification';
    alertDiv.innerHTML = `
        <div class="alert-content">
            <strong>🚨 Server Alert</strong>
            <div>${serverId}: ${alertMessage}</div>
            <button onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add styles if not already present
    if (!document.getElementById('alert-styles')) {
        const style = document.createElement('style');
        style.id = 'alert-styles';
        style.textContent = `
            .alert-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(244, 67, 54, 0.95);
                color: white;
                padding: 1rem;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                max-width: 400px;
                animation: slideInRight 0.3s ease;
            }
            .alert-content {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                position: relative;
            }
            .alert-content button {
                position: absolute;
                top: -10px;
                right: -10px;
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 25px;
                height: 25px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to page
    document.body.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// Request notification permission on page load
document.addEventListener('DOMContentLoaded', () => {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (serverWorld3DHub) {
        serverWorld3DHub.stop();
    }
});
