# GuiWorld - Dual Project Instructions

## Project Overview
GuiWorld contains two demonstration projects showcasing different approaches to 3D web visualization:

1. **ServerWorld3D** - Real-time 3D server monitoring with ASP.NET Core 8.0 and Blazor Server
2. **PyWebGL** - Python-based WebGL demonstrations using modern Python web frameworks

---

## Project 1: ServerWorld3D (C#/.NET)

### Technology Stack
- **Framework**: ASP.NET Core 8.0 (.NET 8)
- **UI**: Blazor Server Components with Interactive Server rendering
- **Real-time**: SignalR hubs for live updates
- **3D Rendering**: JavaScript with WebGL
- **Styling**: Bootstrap 5

### Project Structure: `serverworld3d/`

#### Core Components
```
/Components/
  /Pages/
    - World3D.razor          # Main 3D visualization component
    - Home.razor             # Landing page
    - Counter.razor          # Demo counter
    - Weather.razor          # Weather demo
  /Layout/
    - MainLayout.razor       # Primary layout
    - NavMenu.razor          # Navigation menu
  - App.razor                # Root app component
  - Routes.razor             # Routing configuration

/Hubs/
  - ServerHub.cs             # SignalR hub for real-time communication

/Services/
  - ServerMonitoringService.cs      # HTTP REST API service
  - GrpcServerMonitoringService.cs  # gRPC service implementation

/Models/
  - ServerState.cs           # Core data model for server information

/Protos/
  - servermonitoring.proto   # Protocol Buffer definitions

/wwwroot/
  /js/
    - serverworld3d.js       # 3D rendering and visualization logic
    - signalr-hub.js         # SignalR client connection management
    - integration.js         # Frontend integration utilities
  /css/
    - serverworld3d.css      # Custom styling
```

#### Development Commands
```bash
# Build and run
dotnet run --project serverworld3d

# Development URLs
http://localhost:5151
https://localhost:7051
```

---

## Project 2: PyWebGL (Python)

### Technology Stack
- **Framework**: FastAPI or Flask for web server
- **3D Library**: Three.js or raw WebGL with Python backend
- **Template Engine**: Jinja2 for HTML templates
- **WebGL Integration**: Python generates WebGL data, JavaScript renders
- **Real-time**: WebSockets with asyncio support

### Project Structure: `pywebgl/`

#### Core Components
```
/app/
  - main.py                  # FastAPI application entry point
  - models.py                # Data models for 3D objects and scenes
  - webgl_generator.py       # WebGL code generation utilities
  
/api/
  - scenes.py                # Scene management endpoints
  - objects.py               # 3D object manipulation endpoints
  - realtime.py              # WebSocket endpoints for live updates

/templates/
  - base.html                # Base HTML template
  - viewer.html              # Main 3D viewer page
  - demos/
    - cube.html              # Basic cube demonstration
    - particles.html         # Particle system demo
    - terrain.html           # Terrain generation demo

/static/
  /js/
    - webgl-renderer.js      # Core WebGL rendering engine
    - scene-manager.js       # Scene and object management
    - camera-controls.js     # Camera interaction handling
    - websocket-client.js    # Real-time communication
  /css/
    - viewer.css             # Viewer styling
    - controls.css           # UI controls styling

/utils/
  - mesh_generators.py       # Procedural mesh generation
  - shader_templates.py      # GLSL shader template system
  - webgl_helpers.py         # WebGL utility functions

/requirements.txt            # Python dependencies
/pyproject.toml             # Python project configuration
```

#### Key Dependencies
```python
# Web Framework
fastapi[all]>=0.104.0
uvicorn[standard]>=0.24.0

# 3D Math and Generation
numpy>=1.24.0
scipy>=1.11.0

# WebGL/Graphics Utilities
Pillow>=10.0.0              # Image processing
moderngl>=5.8.0             # Modern OpenGL wrapper (optional)

# Real-time Communication
websockets>=12.0
```

#### Development Commands
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Development URLs
http://localhost:8000
http://localhost:8000/viewer    # Main 3D viewer
http://localhost:8000/demos     # Demo gallery
```

#### Python WebGL Architecture

**Data Flow:**
1. Python generates 3D scene data (vertices, indices, colors)
2. FastAPI serves JSON data to frontend
3. JavaScript receives data via REST API or WebSocket
4. WebGL renders 3D scenes in browser
5. User interactions sent back to Python via WebSocket

**Code Patterns:**
- Use Pydantic models for 3D data validation
- Generate GLSL shaders programmatically in Python
- Stream large datasets efficiently with async/await
- Implement real-time scene updates via WebSocket

---

## Development Guidelines

### C# (.NET) Conventions
- Use nullable reference types consistently
- Implement proper async/await patterns
- Use dependency injection for all services
- Follow Microsoft C# coding conventions

### Python Conventions
- Follow PEP 8 style guidelines
- Use type hints for all function signatures
- Implement async/await for I/O operations
- Use Pydantic for data validation and serialization

### JavaScript Conventions (Both Projects)
- Use modern ES6+ syntax
- Implement proper error handling
- Maintain clean separation between data and rendering
- Optimize WebGL performance for real-time updates

### Shared 3D Visualization Principles
- Canvas-based WebGL rendering
- Interactive camera controls
- Real-time data updates
- Performance optimization for multiple objects
- Responsive design for different screen sizes
