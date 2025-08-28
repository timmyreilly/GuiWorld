"""
FastAPI application entry point for ServerWorld.
Main application setup, routing, and configuration.
"""

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
import uvicorn
from pathlib import Path

# Import API routers
from api.scenes import router as scenes_router
from api.objects import router as objects_router
from api.realtime import router as realtime_router

# Application metadata
app = FastAPI(
    title="ServerWorld",
    description="Python WebGL 3D Visualization and Server Monitoring",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Static files and templates
BASE_DIR = Path(__file__).parent.parent
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")

# Include API routes
app.include_router(scenes_router, prefix="/api", tags=["scenes"])
app.include_router(objects_router, prefix="/api", tags=["objects"])
app.include_router(realtime_router, prefix="/ws", tags=["websocket"])


@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """Landing page with project overview and navigation."""
    return templates.TemplateResponse(
        "base.html", 
        {
            "request": request,
            "title": "ServerWorld - Python WebGL Demo",
            "page": "home"
        }
    )


@app.get("/viewer", response_class=HTMLResponse)
async def viewer(request: Request):
    """Main 3D viewer page with WebGL canvas."""
    return templates.TemplateResponse(
        "viewer.html",
        {
            "request": request,
            "title": "3D Viewer - ServerWorld",
            "page": "viewer"
        }
    )


@app.get("/demos", response_class=HTMLResponse)
async def demos_index(request: Request):
    """Demo gallery page with links to all demonstrations."""
    demos = [
        {"name": "Cube", "url": "/demos/cube", "description": "Basic cube rendering and rotation"},
        {"name": "Particles", "url": "/demos/particles", "description": "Particle system simulation"},
        {"name": "Terrain", "url": "/demos/terrain", "description": "Procedural terrain generation"}
    ]
    return templates.TemplateResponse(
        "demos/index.html",
        {
            "request": request,
            "title": "WebGL Demos - ServerWorld",
            "page": "demos",
            "demos": demos
        }
    )


@app.get("/demos/cube", response_class=HTMLResponse)
async def cube_demo(request: Request):
    """Basic cube demonstration."""
    return templates.TemplateResponse(
        "demos/cube.html",
        {
            "request": request,
            "title": "Cube Demo - ServerWorld",
            "page": "cube_demo"
        }
    )


@app.get("/demos/particles", response_class=HTMLResponse)
async def particles_demo(request: Request):
    """Particle system demonstration."""
    return templates.TemplateResponse(
        "demos/particles.html",
        {
            "request": request,
            "title": "Particles Demo - ServerWorld",
            "page": "particles_demo"
        }
    )


@app.get("/demos/terrain", response_class=HTMLResponse)
async def terrain_demo(request: Request):
    """Terrain generation demonstration."""
    return templates.TemplateResponse(
        "demos/terrain.html",
        {
            "request": request,
            "title": "Terrain Demo - ServerWorld",
            "page": "terrain_demo"
        }
    )


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "service": "serverworld"}


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
