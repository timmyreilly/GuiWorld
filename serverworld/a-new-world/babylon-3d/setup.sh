#!/bin/bash

# Babylon.js 3D Scene Setup Script

echo "🚀 Setting up Babylon.js 3D Scene..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed  
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🏗️  Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Project built successfully!"
else
    echo "❌ Failed to build project"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Available commands:"
echo "  npm run dev      - Development mode with file watching"
echo "  npm run serve    - Start development server"
echo "  npm run build    - Build for production"
echo ""
echo "Open index.html in your browser to see the Babylon.js scene!"
echo "Open comparison.html to see side-by-side comparison with WebGL!"
