#!/bin/bash

# MCP Server Production Deployment Script
# This script builds and configures the MCP server for production deployment

set -e  # Exit on any error

echo "🚀 MCP Server Production Deployment"
echo "===================================="

# Check prerequisites
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -c2-)
REQUIRED_VERSION="18.0.0"

if ! node -e "process.exit(process.version.slice(1).split('.').map(Number).some((v,i) => v > '$REQUIRED_VERSION'.split('.')[i] || (v === parseInt('$REQUIRED_VERSION'.split('.')[i]) && i === 2)))"; then
    echo "❌ Node.js version $REQUIRED_VERSION or higher is required (found: $NODE_VERSION)"
    exit 1
fi

echo "✅ Node.js version check passed (v$NODE_VERSION)"

# Environment configuration
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "📋 Creating .env from .env.example..."
        cp .env.example .env
        echo "⚠️  Please configure your .env file with production values before running the server"
    else
        echo "❌ No .env.example file found. Creating basic template..."
        cat > .env << EOF
# Production Environment Configuration
NODE_ENV=production
LOG_LEVEL=info
LOG_REQUESTS=true
ENABLE_METRICS=true
ENABLE_CACHING=true
HEALTH_CHECK_INTERVAL=30000
PORT=3001

# Database Configuration - REQUIRED
# TURSO_DATABASE_URL=your-database-url
# TURSO_AUTH_TOKEN=your-auth-token

# Optional Configuration
# PROJECT_ID=default-project
# API_TOKEN=your-api-token
EOF
        echo "⚠️  Please configure your .env file with production values"
    fi
else
    echo "✅ .env file found"
fi

# Install dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production

# TypeScript compilation
echo "🔧 Compiling TypeScript to JavaScript..."
npm run build

if [ ! -f "dist/index.js" ]; then
    echo "❌ Build failed - dist/index.js not found"
    exit 1
fi

echo "✅ TypeScript compilation successful"

# Verify build
echo "🔍 Verifying build..."
node -e "require('./dist/index.js'); console.log('Build verification passed')" || {
    echo "❌ Build verification failed"
    exit 1
}

# Create systemd service file (optional)
cat > log-viewer-mcp.service << EOF
[Unit]
Description=Log Viewer MCP Server
After=network.target

[Service]
Type=simple
User=mcp-server
WorkingDirectory=$(pwd)
ExecStart=$(which node) dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=$(pwd)/.env

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$(pwd)

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Systemd service file created: log-viewer-mcp.service"

# Create PM2 ecosystem file (alternative process manager)
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'log-viewer-mcp',
    script: 'dist/index.js',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info',
      ENABLE_METRICS: 'true',
      ENABLE_CACHING: 'true'
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

echo "✅ PM2 ecosystem file created: ecosystem.config.js"

# Create logs directory
mkdir -p logs

# Create startup verification script
cat > verify-production.sh << 'EOF'
#!/bin/bash
echo "🔍 Production Verification"
echo "========================"

# Check if server starts
echo "Testing server startup..."
timeout 10s node dist/index.js --test-startup 2>&1 | head -20

if [ $? -eq 0 ]; then
    echo "✅ Server startup test passed"
else
    echo "❌ Server startup test failed"
    exit 1
fi

echo "✅ Production verification complete"
EOF

chmod +x verify-production.sh

echo ""
echo "🎉 Production deployment complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .env file with production database credentials"
echo "2. Choose a process manager:"
echo "   - Systemd: sudo cp log-viewer-mcp.service /etc/systemd/system/"
echo "   - PM2: npm install -g pm2 && pm2 start ecosystem.config.js --env production"
echo "3. Run verification: ./verify-production.sh"
echo "4. Start the server: npm start"
echo ""
echo "📊 Monitoring:"
echo "   - Health check: Use the health_check MCP tool"
echo "   - Metrics: Use the get_metrics MCP tool"
echo "   - Logs: Check ./logs/ directory or system logs"
echo ""
echo "🔧 Configuration files created:"
echo "   - .env (environment configuration)"
echo "   - log-viewer-mcp.service (systemd service)"
echo "   - ecosystem.config.js (PM2 configuration)"
echo "   - verify-production.sh (verification script)"
