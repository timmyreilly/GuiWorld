# ServerWorld - Python WebGL 3D Visualization

A Python-based WebGL demonstration project for real-time 3D server monitoring and visualization using FastAPI, WebSockets, and modern web technologies.

## 🚀 Features

- **FastAPI Backend**: High-performance async web framework
- **WebGL Rendering**: Client-side 3D visualization with raw WebGL
- **Real-time Updates**: WebSocket communication for live data streaming
- **3D Scene Management**: Procedural mesh generation and scene composition
- **Interactive Controls**: Camera controls and object manipulation
- **Multiple Demos**: Cube, particle systems, and terrain generation

## 🛠️ Technology Stack

- **Backend**: FastAPI + Uvicorn
- **Frontend**: Vanilla JavaScript + WebGL
- **Real-time**: WebSockets with asyncio
- **3D Math**: NumPy + SciPy
- **Template Engine**: Jinja2
- **Package Management**: Poetry

## 📦 Installation

### Prerequisites
- Python 3.11+
- Poetry (for dependency management)

### Quick Setup
```bash
# Install Poetry (if not already installed)
curl -sSL https://install.python-poetry.org | python3 -

# Install dependencies
make install

# Run development server
make dev
```

### Manual Setup
```bash
# Install dependencies with Poetry
poetry install

# Activate virtual environment
poetry shell

# Run development server
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run production server with gunicorn
poetry run gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## 🎯 Development Commands

```bash
# Install all dependencies
make install

# Run development server with hot reload
make dev

# Run production server
make prod

# Format code with black and isort
make format

# Run linting checks
make lint

# Run type checking
make typecheck

# Run tests
make test

# Clean up generated files
make clean

# Setup pre-commit hooks
make setup-hooks
```

## 🌐 API Endpoints

### Main Application
- `http://localhost:8000` - Landing page
- `http://localhost:8000/viewer` - Main 3D viewer
- `http://localhost:8000/demos` - Demo gallery

### API Routes
- `GET /api/scenes` - List available 3D scenes
- `POST /api/scenes` - Create new scene
- `GET /api/scenes/{scene_id}` - Get scene data
- `PUT /api/scenes/{scene_id}` - Update scene
- `GET /api/objects/{object_id}` - Get 3D object data
- `WebSocket /ws/realtime` - Real-time updates

### Demo Endpoints
- `GET /demos/cube` - Basic cube demonstration
- `GET /demos/particles` - Particle system demo
- `GET /demos/terrain` - Terrain generation demo

## 🏗️ Project Structure

```
serverworld/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── models.py               # Pydantic models for 3D data
│   └── webgl_generator.py      # WebGL code generation utilities
├── api/
│   ├── __init__.py
│   ├── scenes.py               # Scene management endpoints
│   ├── objects.py              # 3D object manipulation
│   └── realtime.py             # WebSocket endpoints
├── templates/
│   ├── base.html               # Base template
│   ├── viewer.html             # Main 3D viewer
│   └── demos/
│       ├── cube.html           # Cube demo
│       ├── particles.html      # Particle demo
│       └── terrain.html        # Terrain demo
├── static/
│   ├── js/
│   │   ├── webgl-renderer.js   # Core WebGL engine
│   │   ├── scene-manager.js    # Scene management
│   │   ├── camera-controls.js  # Camera interaction
│   │   └── websocket-client.js # Real-time communication
│   └── css/
│       ├── viewer.css          # Main viewer styles
│       └── controls.css        # Control panel styles
├── utils/
│   ├── __init__.py
│   ├── mesh_generators.py      # Procedural mesh generation
│   ├── shader_templates.py     # GLSL shader templates
│   └── webgl_helpers.py        # WebGL utility functions
├── tests/
│   ├── __init__.py
│   ├── test_api.py
│   └── test_webgl.py
├── Makefile                    # Development commands
├── pyproject.toml              # Poetry configuration
└── README.md                   # This file
```

## 🔧 Configuration

### Environment Variables
```bash
# Development
export SERVERWORLD_ENV=development
export SERVERWORLD_HOST=0.0.0.0
export SERVERWORLD_PORT=8000
export SERVERWORLD_DEBUG=true

# Production
export SERVERWORLD_ENV=production
export SERVERWORLD_HOST=0.0.0.0
export SERVERWORLD_PORT=8000
export SERVERWORLD_DEBUG=false
```

## 🎨 WebGL Architecture

### Data Flow
1. **Python Generation**: Create 3D scene data (vertices, indices, colors)
2. **API Serving**: FastAPI serves JSON data to frontend
3. **WebSocket Streaming**: Real-time updates via WebSocket
4. **WebGL Rendering**: JavaScript renders 3D scenes in browser
5. **User Interaction**: Mouse/keyboard input sent back to Python

### Key Components
- **Mesh Generation**: Procedural geometry creation in Python
- **Shader Management**: GLSL shader templates and compilation
- **Scene Graph**: Hierarchical 3D scene organization
- **Camera System**: Perspective and orthographic projection
- **Real-time Updates**: Efficient data streaming and rendering

## 🧪 Testing

```bash
# Run all tests
make test

# Run specific test file
poetry run pytest tests/test_api.py -v

# Run with coverage
poetry run pytest --cov=app tests/
```

## 🚀 Deployment

### Docker (Optional)
```bash
# Build image
docker build -t serverworld .

# Run container
docker run -p 8000:8000 serverworld
```

### Direct Deployment
```bash
# Install dependencies
poetry install --only=main

# Run with gunicorn (production)
poetry run gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and add tests
4. Run linting and tests: `make lint && make test`
5. Commit changes: `git commit -am 'Add feature'`
6. Push to branch: `git push origin feature-name`
7. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- **ServerWorld3D**: C#/.NET Blazor version in `../serverworld3d/`
- **GuiWorld**: Parent project containing both implementations

---

Built with ❤️ using Python, FastAPI, and WebGL
