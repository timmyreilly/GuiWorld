# GuiWorld - Server World 3D Project Instructions

## Project Overview
GuiWorld is a real-time 3D server monitoring web application built with ASP.NET Core 8.0 and Blazor Server. The application provides an interactive 3D visualization interface for monitoring server states, metrics, and configurations in real-time.

## Technology Stack & Architecture

### Core Technologies
- **Framework**: ASP.NET Core 8.0 (.NET 8)
- **UI Framework**: Blazor Server Components with Interactive Server rendering
- **Real-time Communication**: SignalR hubs for live updates
- **RPC Communication**: gRPC with Protocol Buffers for high-performance data exchange
- **Frontend**: HTML5, CSS3, JavaScript with WebGL for 3D rendering
- **Styling**: Bootstrap 5 for responsive design

### Key Dependencies
```xml
- Google.Protobuf (3.31.1) - Protocol Buffer serialization
- Grpc.Net.Client (2.71.0) - gRPC client library
- Grpc.Tools (2.72.0) - gRPC code generation tools
- Microsoft.AspNetCore.SignalR.Client (9.0.7) - SignalR client
```

## Project Structure & Components

### Main Project: `serverworld3d/`
- **Target Framework**: .NET 8.0
- **Project Type**: ASP.NET Core Web Application with Blazor Server
- **Nullable Reference Types**: Enabled
- **Implicit Usings**: Enabled

### Key Directories & Files

#### `/Components/`
- **Pages/**: Blazor page components
  - `World3D.razor` - Main 3D visualization component (334 lines)
  - `Home.razor` - Landing page
  - `Counter.razor` - Demo counter component
  - `Weather.razor` - Weather demo component
  - `Error.razor` - Error handling page
- **Layout/**: Layout components
  - `MainLayout.razor` - Primary application layout
  - `NavMenu.razor` - Navigation menu component
- `App.razor` - Root app component
- `Routes.razor` - Routing configuration
- `_Imports.razor` - Global imports

#### `/Hubs/`
- `ServerHub.cs` - SignalR hub for real-time server communication
  - Handles client connections and server group management
  - Manages real-time server state updates
  - Provides server monitoring event broadcasting

#### `/Services/`
- `ServerMonitoringService.cs` - HTTP REST API service for server data
- `GrpcServerMonitoringService.cs` - gRPC service implementation
- Both implement interfaces for dependency injection

#### `/Models/`
- `ServerState.cs` - Core data model for server information
  - Properties: Id, Name, Status, CPU/Memory/Disk/Network metrics
  - Position data for 3D rendering
  - Alert management and custom metrics support

#### `/Protos/`
- `servermonitoring.proto` - Protocol Buffer definitions (82 lines)
  - Defines gRPC service contracts
  - Message types for server states and monitoring
  - Streaming updates and configuration management

#### `/wwwroot/`
- Static web assets including CSS, JavaScript, and images
- `js/serverworld3d.js` - 3D rendering and visualization logic
- `js/signalr-hub.js` - SignalR client connection management
- `js/integration.js` - Frontend integration utilities
- `css/serverworld3d.css` - Custom styling

## Development Patterns & Standards

### Blazor Server Patterns
- Use Interactive Server rendering mode
- Implement `IAsyncDisposable` for components with resources
- Inject services using `@inject` directive
- Use `IJSRuntime` for JavaScript interop

### SignalR Implementation
- Hub-based architecture with `ServerHub`
- Group-based client management (`server-{serverId}`)
- Real-time server state broadcasting
- Connection lifecycle management

### gRPC Services
- Protocol-first design with `.proto` files
- Streaming support for real-time updates
- Client-side gRPC integration
- Automatic C# code generation from protobuf

### Data Models
- Use nullable reference types
- Implement validation attributes
- Support for 3D positioning (`Vector3`)
- Extensible custom metrics dictionary

## Configuration & Setup

### Application URLs
- **HTTP**: http://localhost:5151
- **HTTPS**: https://localhost:7051
- **Main 3D View**: `/world`

### Development Environment
- Supports hot reload for Razor components
- Uses `appsettings.json` and `appsettings.Development.json`
- CORS configured for development
- Logging configured for all services

### Build & Run Commands
```bash
# Restore dependencies
dotnet restore

# Build solution
dotnet build

# Run from solution root
dotnet run --project serverworld3d

# Run from project directory
cd serverworld3d && dotnet run

# Clean build
dotnet clean && dotnet build

# Release build
dotnet run --configuration Release --project serverworld3d
```

## Code Style & Conventions

### C# Conventions
- Use nullable reference types consistently
- Implement proper async/await patterns
- Use dependency injection for all services
- Follow Microsoft C# coding conventions
- Use explicit interface implementations where appropriate

### Razor Component Conventions
- Use `@page` directive for routable components
- Implement proper component lifecycle methods
- Use `@inject` for service dependencies
- Handle disposal in `IAsyncDisposable.DisposeAsync()`

### JavaScript Integration
- Use `IJSRuntime` for JavaScript interop
- Implement proper error handling in JS calls
- Use modern JavaScript (ES6+) patterns
- Maintain separation between Blazor and vanilla JS

## 3D Visualization Architecture

### WebGL Integration
- Canvas-based 3D rendering in `#world3d-canvas`
- Real-time server position updates
- Interactive camera controls
- Performance optimization for multiple servers

### Data Flow
1. Server data retrieved via gRPC/HTTP services
2. Real-time updates via SignalR
3. State managed in Blazor components
4. 3D positions updated via JavaScript interop
5. Visual representation rendered in WebGL canvas

## Security & Performance

### Security Considerations
- HTTPS enforcement in production
- Proper input validation on all models
- Secure SignalR connections
- gRPC channel security

### Performance Optimizations
- Efficient SignalR group management
- Streaming gRPC for real-time data
- Minimal JavaScript interop calls
- Optimized 3D rendering loops

## Extension Points

### Adding New Server Metrics
1. Extend `ServerState` model
2. Update protobuf definitions
3. Modify service implementations
4. Update 3D visualization logic

### Custom Visualizations
- Extend JavaScript rendering engine
- Add new Razor components
- Implement additional SignalR events
- Create custom CSS animations

## Troubleshooting Common Issues

### Port Conflicts
- Modify `applicationUrl` in `Properties/launchSettings.json`
- Use `lsof -ti:5151` to find conflicting processes

### gRPC Issues
- Ensure protobuf files compile correctly
- Check gRPC service registration in `Program.cs`
- Verify client-server protobuf version compatibility

### SignalR Connection Problems
- Check browser console for WebSocket errors
- Verify hub registration and routing
- Ensure proper CORS configuration

### 3D Rendering Issues
- Verify WebGL support in browser
- Check JavaScript console for rendering errors
- Ensure proper canvas element initialization

## Development Workflow

1. **Setup**: Run `dotnet restore` and `dotnet build`
2. **Development**: Use `dotnet run --project serverworld3d`
3. **Testing**: Access application at http://localhost:5151
4. **3D Testing**: Navigate to `/world` for main visualization
5. **Hot Reload**: Save Razor/C# files for automatic updates
6. **Debugging**: Use browser dev tools + Visual Studio debugger

This project represents a modern, real-time web application showcasing advanced .NET technologies with interactive 3D visualization capabilities.
