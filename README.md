# GuiWorld - Server World 3D

A real-time 3D server monitoring web application built with ASP.NET Core, Blazor Server, SignalR, and gRPC. This application provides a 3D visualization interface for monitoring server states and configurations.

## 🚀 Features

- **Real-time 3D Visualization**: Interactive 3D representation of servers and their states
- **SignalR Integration**: Real-time updates and communication
- **gRPC Services**: High-performance server monitoring with Protocol Buffers
- **Blazor Server Components**: Modern web UI with server-side rendering
- **Responsive Design**: Bootstrap-based responsive interface

## 🛠️ Technology Stack

- **Framework**: ASP.NET Core 8.0
- **UI**: Blazor Server Components
- **Real-time Communication**: SignalR
- **RPC**: gRPC with Protocol Buffers
- **Frontend**: HTML5, CSS3, JavaScript
- **Styling**: Bootstrap 5

## 📋 Prerequisites

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) or later
- Modern web browser with WebGL support

## 🏗️ Project Structure

```
GuiWorld/
├── serverworld3d/              # Main ASP.NET Core Blazor Server project
│   ├── Components/             # Blazor components
│   │   ├── Pages/             # Page components (Home, World3D, etc.)
│   │   └── Layout/            # Layout components
│   ├── Hubs/                  # SignalR hubs
│   ├── Services/              # Business logic and gRPC services
│   ├── Models/                # Data models
│   ├── Protos/                # Protocol Buffer definitions
│   └── wwwroot/               # Static web assets
└── webgui-experiments.sln     # Visual Studio solution file
```

## 🚀 Getting Started

### Building the Project

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd GuiWorld
   ```

2. **Restore NuGet packages**:
   ```bash
   dotnet restore
   ```

3. **Build the solution**:
   ```bash
   dotnet build
   ```

### Running the Application

#### Option 1: Run from Solution Root
```bash
dotnet run --project serverworld3d
```

#### Option 2: Run from Project Directory
```bash
cd serverworld3d
dotnet run
```

#### Option 3: Using Visual Studio
Open `webgui-experiments.sln` in Visual Studio and press F5 or click "Start Debugging".

### Accessing the Application

Once running, the application will be available at:

- **HTTP**: http://localhost:5151
- **HTTPS**: https://localhost:7051

The main 3D visualization can be accessed at: `/world`

### 🎮 Testing WebGL

If you're experiencing issues with the full 3D server visualization, try the Simple WebGL Test page first:

- **Simple WebGL Test**: http://localhost:5151/simple3d

This page provides:
- Basic WebGL functionality test
- WebGL driver and capability information
- Interactive 3D cube with controls
- Mouse and keyboard interaction testing
- CSP-compliant implementation

## 🔧 Development

### Hot Reload
The application supports hot reload during development. Use the following commands for the best hot reload experience:

#### Option 1: Using dotnet watch (Recommended)
```bash
# Start with hot reload enabled
dotnet watch run --project serverworld3d

# Alternative: Run from project directory
cd serverworld3d && dotnet watch run
```

#### Option 2: Using VS Code Task
- Press `Ctrl+Shift+P` (Cmd+Shift+P on Mac)
- Type "Tasks: Run Task"
- Select "Start with Hot Reload"

#### Hot Reload Features
- **Razor Components**: Changes to `.razor` files reload automatically
- **C# Code**: Backend changes trigger automatic rebuild and reload  
- **CSS/JavaScript**: Static file changes reload the browser
- **Configuration**: Changes to `appsettings.json` restart the application

#### Hot Reload Controls
- **Ctrl+R**: Force restart the application
- **Ctrl+C**: Stop the watch process

### Environment Configuration
The application uses `appsettings.json` for configuration. Development settings are in `appsettings.Development.json`.

### gRPC Service Development
Protocol Buffer definitions are in the `Protos/` folder. After modifying `.proto` files, rebuild the project to regenerate the C# classes.

## 📁 Key Components

- **World3D.razor**: Main 3D visualization component
- **ServerHub.cs**: SignalR hub for real-time communication
- **ServerMonitoringService**: gRPC service for server state management
- **servermonitoring.proto**: Protocol Buffer definitions for gRPC communication

## 🌐 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

WebGL support is required for 3D visualization features.

## 📝 Additional Commands

### Clean Build
```bash
dotnet clean
dotnet build
```

### Run in Release Mode
```bash
dotnet run --configuration Release --project serverworld3d
```

### Publish for Deployment
```bash
dotnet publish serverworld3d -c Release -o ./publish
```

## 🐛 Troubleshooting

### Common Issues

- **Port conflicts**: If default ports are in use, modify `applicationUrl` in `Properties/launchSettings.json`
- **gRPC issues**: Ensure Protocol Buffer files compile correctly with `dotnet build`
- **SignalR connection problems**: Check browser console for WebSocket connection errors

### Debugging with Edge DevTools

This project includes Microsoft Edge DevTools integration for advanced debugging:

1. **Launch with DevTools**: Use `F5` or the Debug menu and select "Debug GuiWorld with Edge DevTools"
2. **Check Console Tab**: Look for JavaScript errors and Three.js loading issues
3. **Monitor Network Tab**: Verify all resources (CSS, JS, fonts) are loading correctly
4. **Review Issues Tab**: Check for CSP violations, compatibility warnings, and performance issues
5. **Use Debug Controls**: The `/world` page includes debug buttons to test individual components

### Known Issues & Fixes

- **Three.js CDN Issues**: If Three.js fails to load, the application includes fallback CDNs
- **CSP Violations**: 
  - ✅ **FIXED**: Content Security Policy implemented to prevent `eval()` usage
  - ✅ **FIXED**: Inline scripts moved to external files for CSP compliance
  - ✅ **FIXED**: Inline event handlers (`onclick` attributes) removed and replaced with proper event listeners
  - The application now includes secure CSP headers that block `eval()` and inline scripts
  - Navigation menu and alert dialogs now use CSP-compliant event handling
  - For development, CSP allows `wasm-unsafe-eval` and `unsafe-hashes` for Blazor compatibility
- **CSS Compatibility**: Some older CSS properties may trigger warnings in modern browsers
  - Bootstrap's `-webkit-text-size-adjust` is supplemented with standard `text-size-adjust`
  - Check Edge DevTools Issues tab for compatibility warnings
- **WebGL Compatibility**: 
  - Use the Simple WebGL Test page (`/simple3d`) to diagnose WebGL issues
  - The test page provides detailed WebGL driver information
  - Includes mouse controls and interactive 3D rendering without external dependencies

### Performance Optimization

- **WebGL Support**: Ensure your browser supports WebGL for 3D visualization
- **Memory Usage**: Monitor browser memory when working with large server datasets
- **Network Bandwidth**: Real-time updates require stable internet connection

## 📄 License

[Add your license information here]

## 🤝 Contributing

[Add contributing guidelines here]