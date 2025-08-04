// SignalR Hub Connection Manager
class ServerWorld3DHubConnection {
    constructor() {
        this.connection = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }

    async start() {
        try {
            this.connection = new signalR.HubConnectionBuilder()
                .withUrl("/serverHub")
                .withAutomaticReconnect([0, 2000, 10000, 30000])
                .build();

            this.setupEventHandlers();
            
            await this.connection.start();
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log("SignalR Connected successfully");
            
            // Request initial server states
            await this.requestServerStates();
            
        } catch (err) {
            console.error("SignalR Connection failed: ", err);
            this.isConnected = false;
            this.scheduleReconnect();
        }
    }

    setupEventHandlers() {
        // Handle connection events
        this.connection.onclose((error) => {
            this.isConnected = false;
            console.log("SignalR Connection closed", error);
            this.scheduleReconnect();
        });

        this.connection.onreconnecting((error) => {
            console.log("SignalR Reconnecting...", error);
            this.isConnected = false;
        });

        this.connection.onreconnected((connectionId) => {
            console.log("SignalR Reconnected with ID: ", connectionId);
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.requestServerStates();
        });

        // Handle server state updates
        this.connection.on("ServerStateUpdated", (serverStateJson) => {
            try {
                const serverState = JSON.parse(serverStateJson);
                console.log("Server state updated:", serverState);
                
                if (window.serverWorld3D) {
                    window.serverWorld3D.addOrUpdateServer(serverState);
                }
                
                // Trigger custom event
                const event = new CustomEvent('serverStateUpdated', {
                    detail: { serverState }
                });
                document.dispatchEvent(event);
                
            } catch (error) {
                console.error("Failed to parse server state update:", error);
            }
        });

        // Handle initial server states
        this.connection.on("ServerStatesReceived", (serversJson) => {
            try {
                const servers = JSON.parse(serversJson);
                console.log("Server states received:", servers);
                
                if (window.serverWorld3D) {
                    servers.forEach(server => {
                        window.serverWorld3D.addOrUpdateServer(server);
                    });
                }
                
                // Trigger custom event
                const event = new CustomEvent('serverStatesReceived', {
                    detail: { servers }
                });
                document.dispatchEvent(event);
                
            } catch (error) {
                console.error("Failed to parse server states:", error);
            }
        });

        // Handle character position updates from other clients
        this.connection.on("CharacterPositionUpdated", (connectionId, positionJson) => {
            try {
                const position = JSON.parse(positionJson);
                console.log(`Character ${connectionId} moved to:`, position);
                
                // You could implement multi-user support here
                // For now, we'll just log it
                
            } catch (error) {
                console.error("Failed to parse character position:", error);
            }
        });

        // Handle alerts
        this.connection.on("AlertTriggered", (serverId, alertMessage) => {
            console.log(`Alert for server ${serverId}: ${alertMessage}`);
            
            // Trigger custom event
            const event = new CustomEvent('serverAlert', {
                detail: { serverId, alertMessage }
            });
            document.dispatchEvent(event);
            
            // Show notification if possible
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`Server Alert - ${serverId}`, {
                    body: alertMessage,
                    icon: '/favicon.ico'
                });
            }
        });
    }

    async requestServerStates() {
        if (this.isConnected && this.connection) {
            try {
                await this.connection.invoke("RequestServerStates");
            } catch (error) {
                console.error("Failed to request server states:", error);
            }
        }
    }

    async updateCharacterPosition(position) {
        if (this.isConnected && this.connection) {
            try {
                const positionJson = JSON.stringify(position);
                await this.connection.invoke("UpdateCharacterPosition", positionJson);
            } catch (error) {
                console.error("Failed to update character position:", error);
            }
        }
    }

    async joinServerGroup(serverId) {
        if (this.isConnected && this.connection) {
            try {
                await this.connection.invoke("JoinServerGroup", serverId);
                console.log(`Joined server group: ${serverId}`);
            } catch (error) {
                console.error(`Failed to join server group ${serverId}:`, error);
            }
        }
    }

    async leaveServerGroup(serverId) {
        if (this.isConnected && this.connection) {
            try {
                await this.connection.invoke("LeaveServerGroup", serverId);
                console.log(`Left server group: ${serverId}`);
            } catch (error) {
                console.error(`Failed to leave server group ${serverId}:`, error);
            }
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            
            console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
            
            setTimeout(() => {
                this.start();
            }, delay);
        } else {
            console.error("Max reconnect attempts reached. Please refresh the page.");
        }
    }

    async stop() {
        if (this.connection) {
            await this.connection.stop();
            this.isConnected = false;
            console.log("SignalR Connection stopped");
        }
    }
}

// Initialize and make globally available
window.ServerWorld3DHubConnection = ServerWorld3DHubConnection;
