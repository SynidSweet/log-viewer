#!/bin/bash

# Log Viewer MCP Server Startup Script
# This script provides a simple way to start the MCP server with proper environment configuration

echo "🚀 Log Viewer MCP Server Startup Script"
echo "========================================"

# Check if environment file exists
if [ -f .env ]; then
    echo "📋 Loading environment variables from .env file..."
    export $(cat .env | xargs)
else
    echo "⚠️  No .env file found. Using default configuration."
    echo "   Create a .env file based on .env.example for custom configuration."
fi

# Set defaults if not configured
export PORT=${PORT:-3001}
export PROJECT_ID=${PROJECT_ID:-""}
export API_TOKEN=${API_TOKEN:-""}

echo "🔧 Configuration:"
echo "   Port: $PORT"
echo "   Project ID: $([ -n "$PROJECT_ID" ] && echo "configured" || echo "not configured")"
echo "   API Token: $([ -n "$API_TOKEN" ] && echo "configured" || echo "not configured")"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if FastMCP is available and working
echo "🔍 Testing MCP server compatibility..."

# Try to start with the JavaScript version first
if [ -f "src/index.js" ]; then
    echo "✅ Starting MCP server with JavaScript implementation..."
    echo "📝 Note: This version uses mock data for demonstration"
    echo "📚 See README.md for integration with the main database"
    echo ""
    node src/index.js
else
    echo "❌ JavaScript implementation not found. Attempting TypeScript..."
    
    # Fallback to TypeScript if available
    if command -v ts-node &> /dev/null && [ -f "src/index.ts" ]; then
        echo "✅ Starting MCP server with TypeScript implementation..."
        ts-node src/index.ts
    else
        echo "❌ No compatible implementation found."
        echo ""
        echo "Available options:"
        echo "1. Use the provided JavaScript implementation (src/index.js)"
        echo "2. Install ts-node and use TypeScript implementation"
        echo "3. Build the TypeScript version with: npm run build"
        echo ""
        exit 1
    fi
fi