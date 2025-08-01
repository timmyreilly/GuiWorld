# GuiWorld - Dual Project Makefile
# Root makefile for managing both ServerWorld3D (C#/.NET) and ServerWorld (Python) projects

.PHONY: help run-serverworld-python run-serverworld3d install-serverworld install-serverworld3d clean

# Default target
help:
	@echo "GuiWorld Project Commands:"
	@echo "========================="
	@echo ""
	@echo "Python ServerWorld:"
	@echo "  run-serverworld-python    Run the Python WebGL serverworld project"
	@echo "  install-serverworld       Install Python serverworld dependencies"
	@echo ""
	@echo "C# ServerWorld3D:"
	@echo "  run-serverworld3d         Run the C#/.NET Blazor serverworld3d project"
	@echo "  install-serverworld3d     Restore C# serverworld3d dependencies"
	@echo ""
	@echo "General:"
	@echo "  clean                     Clean all build artifacts"
	@echo "  help                      Show this help message"

# Python ServerWorld commands
run-serverworld-python:
	@echo "Starting Python ServerWorld..."
	cd serverworld && make dev

install-serverworld:
	@echo "Installing Python ServerWorld dependencies..."
	cd serverworld && make install

# C# ServerWorld3D commands
run-serverworld3d:
	@echo "Starting C# ServerWorld3D..."
	cd serverworld3d && dotnet run

install-serverworld3d:
	@echo "Restoring C# ServerWorld3D dependencies..."
	cd serverworld3d && dotnet restore

# Clean up build artifacts
clean:
	@echo "Cleaning all projects..."
	cd serverworld && make clean || true
	cd serverworld3d && dotnet clean || true
	@echo "Clean complete!"
