/**
 * WebSocket Client - Handles real-time communication with the server
 * Manages WebSocket connections, message handling, and reconnection
 */

class WebSocketClient {
    constructor() {
        this.ws = null;
        this.url = '';
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.messageHandlers = new Map();
        
        this.setupDefaultHandlers();
    }
    
    setupDefaultHandlers() {
        this.on('connection', (data) => {
            console.log('WebSocket connected:', data);
            this.updateConnectionStatus(true);
        });
        
        this.on('scene_update', (data) => {
            console.log('Scene update received:', data);
            // Handle scene updates here
        });
        
        this.on('object_transform', (data) => {
            console.log('Object transform update:', data);
            // Handle object transformations here
        });
        
        this.on('server_update', (data) => {
            console.log('Server update received:', data);
            // Handle server monitoring updates here
        });
    }
    
    connect(endpoint = '/ws/realtime') {
        if (this.isConnected) {
            console.log('Already connected to WebSocket');
            return;
        }
        
        // Determine WebSocket URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        this.url = `${protocol}//${host}${endpoint}`;
        
        console.log('Connecting to WebSocket:', this.url);
        
        try {
            this.ws = new WebSocket(this.url);
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.scheduleReconnect();
        }
    }
    
    setupEventListeners() {
        this.ws.onopen = (event) => {
            console.log('WebSocket connection established');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus(true);
        };
        
        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error, event.data);
            }
        };
        
        this.ws.onclose = (event) => {
            console.log('WebSocket connection closed:', event.code, event.reason);
            this.isConnected = false;
            this.updateConnectionStatus(false);
            
            if (event.code !== 1000) { // 1000 is normal closure
                this.scheduleReconnect();
            }
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.isConnected = false;
            this.updateConnectionStatus(false);
        };
    }
    
    handleMessage(message) {
        const messageType = message.type;
        
        if (this.messageHandlers.has(messageType)) {
            const handlers = this.messageHandlers.get(messageType);
            handlers.forEach(handler => {
                try {
                    handler(message);
                } catch (error) {
                    console.error(`Error in message handler for ${messageType}:`, error);
                }
            });
        } else {
            console.log('Unhandled message type:', messageType, message);
        }
    }
    
    send(message) {
        if (!this.isConnected || !this.ws) {
            console.warn('Cannot send message: WebSocket not connected');
            return false;
        }
        
        try {
            const messageString = typeof message === 'string' ? message : JSON.stringify(message);
            this.ws.send(messageString);
            return true;
        } catch (error) {
            console.error('Failed to send WebSocket message:', error);
            return false;
        }
    }
    
    on(messageType, handler) {
        if (!this.messageHandlers.has(messageType)) {
            this.messageHandlers.set(messageType, []);
        }
        this.messageHandlers.get(messageType).push(handler);
    }
    
    off(messageType, handler) {
        if (this.messageHandlers.has(messageType)) {
            const handlers = this.messageHandlers.get(messageType);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
        
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
            this.connect(this.url.split('//')[1].split('/').slice(1).join('/'));
        }, delay);
    }
    
    disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'User initiated disconnect');
            this.ws = null;
        }
        this.isConnected = false;
        this.updateConnectionStatus(false);
    }
    
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = connected ? 'Connected' : 'Disconnected';
            statusElement.className = connected ? 'connected' : 'disconnected';
        }
    }
    
    // Convenience methods for common message types
    sendSceneUpdate(sceneId, updateType, data) {
        return this.send({
            type: 'scene_update',
            scene_id: sceneId,
            update_type: updateType,
            data: data,
            timestamp: new Date().toISOString()
        });
    }
    
    sendObjectTransform(sceneId, objectId, transform) {
        return this.send({
            type: 'object_transform',
            scene_id: sceneId,
            object_id: objectId,
            transform: transform,
            timestamp: new Date().toISOString()
        });
    }
    
    sendCameraUpdate(sceneId, camera) {
        return this.send({
            type: 'camera_update',
            scene_id: sceneId,
            camera: camera,
            timestamp: new Date().toISOString()
        });
    }
    
    sendPing() {
        return this.send({
            type: 'ping',
            timestamp: new Date().toISOString()
        });
    }
    
    // Auto-ping to keep connection alive
    startKeepAlive(interval = 30000) {
        this.keepAliveInterval = setInterval(() => {
            if (this.isConnected) {
                this.sendPing();
            }
        }, interval);
    }
    
    stopKeepAlive() {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
    }
}
