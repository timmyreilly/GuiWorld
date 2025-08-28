# ServerWorld Python WebGL Project
# Development and production commands for the FastAPI + WebGL application

.PHONY: install dev prod format lint typecheck test clean setup-hooks help

# Default target
help:
	@echo "Available commands:"
	@echo "  install      - Install all dependencies with Poetry"
	@echo "  dev          - Run development server with hot reload"
	@echo "  prod         - Run production server"
	@echo "  format       - Format code with black and isort"
	@echo "  lint         - Run linting checks with flake8"
	@echo "  typecheck    - Run type checking with mypy"
	@echo "  test         - Run tests with pytest"
	@echo "  clean        - Clean up generated files and caches"
	@echo "  setup-hooks  - Setup pre-commit hooks"

# Install dependencies
install:
	@echo "Installing dependencies with Poetry..."
	poetry install
	@echo "Dependencies installed successfully!"

# Development server with hot reload
dev:
	@echo "Starting development server..."
	poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production server
prod:
	@echo "Starting production server..."
	poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Format code
format:
	@echo "Formatting code with black and isort..."
	poetry run black .
	poetry run isort .
	@echo "Code formatting complete!"

# Linting
lint:
	@echo "Running linting checks..."
	poetry run flake8 app/ api/ utils/ tests/
	@echo "Linting checks complete!"

# Type checking
typecheck:
	@echo "Running type checking..."
	poetry run mypy app/ api/ utils/
	@echo "Type checking complete!"

# Run tests
test:
	@echo "Running tests..."
	poetry run pytest tests/ -v
	@echo "Tests complete!"

# Run tests with coverage
test-cov:
	@echo "Running tests with coverage..."
	poetry run pytest --cov=app --cov=api --cov=utils tests/ -v
	@echo "Tests with coverage complete!"

# Clean up
clean:
	@echo "Cleaning up generated files..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	@echo "Cleanup complete!"

# Setup pre-commit hooks
setup-hooks:
	@echo "Setting up pre-commit hooks..."
	poetry run pre-commit install
	@echo "Pre-commit hooks installed!"

# Quick development setup (install + run)
quick:
	@echo "Quick setup: installing dependencies and starting dev server..."
	make install
	make dev

# Docker commands (optional)
docker-build:
	@echo "Building Docker image..."
	docker build -t serverworld .

docker-run:
	@echo "Running Docker container..."
	docker run -p 8000:8000 serverworld

# Check if Poetry is installed
check-poetry:
	@which poetry > /dev/null || (echo "Poetry not found. Install it with: curl -sSL https://install.python-poetry.org | python3 -" && exit 1)
