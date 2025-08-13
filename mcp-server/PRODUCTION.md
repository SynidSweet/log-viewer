# MCP Server Production Configuration

This guide covers production deployment and configuration for the Log Viewer MCP Server.

## Current Status

**✅ PRODUCTION READY** - MCP server v1.1.0 with comprehensive production configuration:
- Enhanced logging with structured output and configurable levels 
- Real-time monitoring dashboard with alerts and health visualization
- Deployment automation script with multiple deployment options (systemd, PM2, Docker)
- Production metrics collection with performance tracking and memory monitoring
- Comprehensive environment variable validation using Zod
- Graceful shutdown handlers for production reliability

## Quick Start

```bash
# 1. Deploy to production
npm run mcp:deploy

# 2. Configure environment
# Edit mcp-server/.env with your production values

# 3. Start server
npm run mcp:start

# 4. Monitor health
npm run mcp:monitor
```

## Production Environment Configuration

### Required Environment Variables

```bash
# Database (Required)
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# Environment
NODE_ENV=production
```

### Optional Production Settings

```bash
# Logging
LOG_LEVEL=info                    # error, warn, info, debug
LOG_REQUESTS=true                 # Log all requests

# Performance Monitoring
ENABLE_METRICS=true               # Collect performance metrics
HEALTH_CHECK_INTERVAL=30000       # Health check every 30 seconds

# Optimization
ENABLE_CACHING=true               # Enable response caching
CACHE_TTL=300                     # Cache TTL in seconds
MAX_CONNECTIONS=100               # Maximum concurrent connections

# Server
PORT=3001                         # Server port
PROJECT_ID=default-project        # Default project ID
API_TOKEN=your-api-token          # Default API token
```

## Production Features

### 1. Enhanced Health Monitoring

- **Automatic Health Checks**: Periodic database connectivity tests
- **Detailed Health Reports**: Database status, project count, environment info
- **Performance Metrics**: Request count, error rate, response times
- **Memory Monitoring**: Heap usage, RSS, memory leaks detection

**Health Check Tool**:
```json
{
  "tool": "health_check",
  "arguments": {}
}
```

**Response**:
```json
{
  "status": "healthy",
  "database": "connected",
  "projects_count": 5,
  "server_version": "1.1.0",
  "environment": {
    "node_env": "production",
    "metrics_enabled": true
  },
  "metrics": {
    "uptime_ms": 3600000,
    "request_count": 150,
    "error_count": 0,
    "average_response_time_ms": 45,
    "memory_usage": {...}
  }
}
```

### 2. Production Metrics

**Metrics Tool**:
```json
{
  "tool": "get_metrics",
  "arguments": {}
}
```

**Metrics Include**:
- **Server Info**: Version, environment, uptime, Node.js version
- **Performance**: Request/error counts, response times, requests per minute
- **Memory Usage**: Heap, RSS, external memory usage
- **Configuration**: Log level, caching status, connection limits

### 3. Production Logging

- **Structured Logging**: Timestamped, leveled log messages
- **Request Logging**: Optional detailed request/response logging
- **Error Tracking**: Automatic error counting and logging
- **Log Levels**: error, warn, info, debug

### 4. Performance Optimization

- **Response Caching**: Configurable TTL-based caching
- **Connection Limits**: Prevent resource exhaustion
- **Memory Management**: Automatic cleanup and monitoring
- **Graceful Shutdown**: Clean termination on SIGTERM/SIGINT

## Deployment Options

### Option 1: Systemd Service

```bash
# 1. Run deployment script (creates service file)
npm run mcp:deploy

# 2. Install service
sudo cp mcp-server/log-viewer-mcp.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable log-viewer-mcp
sudo systemctl start log-viewer-mcp

# 3. Check status
sudo systemctl status log-viewer-mcp
sudo journalctl -u log-viewer-mcp -f
```

### Option 2: PM2 Process Manager

```bash
# 1. Install PM2
npm install -g pm2

# 2. Deploy and start
npm run mcp:deploy
cd mcp-server
pm2 start ecosystem.config.js --env production

# 3. Monitor
pm2 status
pm2 logs log-viewer-mcp
pm2 monit
```

### Option 3: Docker (Custom)

```dockerfile
# Dockerfile for MCP Server
FROM node:18-alpine

WORKDIR /app
COPY mcp-server/package*.json ./
RUN npm ci --only=production

COPY mcp-server/dist ./dist
COPY mcp-server/.env ./

EXPOSE 3001
USER node

CMD ["npm", "start"]
```

## Monitoring and Maintenance

### Real-time Monitoring Dashboard

```bash
# Start interactive monitoring
npm run mcp:monitor

# Custom refresh interval (10 seconds)
cd mcp-server && node monitor.js --interval 10
```

**Dashboard Features**:
- Real-time server status and health
- Performance metrics visualization
- Memory usage tracking
- Alert notifications for threshold breaches
- Recent alerts history

### Health Checks

```bash
# Quick health check
npm run mcp:health

# Detailed metrics
npm run mcp:metrics

# Verification script
npm run mcp:verify
```

### Log Management

Production logs are written to:
- **Console**: Structured JSON logs for log aggregators
- **Files**: `./logs/` directory (when using PM2)
- **System**: systemd journal (when using systemd)

### Alerting Thresholds

Default alert thresholds in monitoring dashboard:
- **Error Rate**: > 5%
- **Response Time**: > 1000ms
- **Memory Usage**: > 80%

Customize in `monitor.js` `CONFIG.alertThresholds`.

## Security Considerations

### Environment Variables
- Store sensitive values in `.env` file (not in code)
- Use proper file permissions (600) for `.env`
- Consider using secret management systems

### Process Security
- Run with dedicated user account
- Use systemd security settings
- Limit file system access

### Network Security
- MCP uses stdio transport (no network exposure)
- Database connections use TLS (Turso)
- Validate all input through Zod schemas

## Troubleshooting

### Common Issues

**Server Won't Start**
```bash
# Check environment
node -e "console.log(process.env.NODE_ENV)"

# Verify build
npm run mcp:build
ls -la mcp-server/dist/

# Test configuration
cd mcp-server && node -e "require('./dist/index.js')"
```

**Database Connection Issues**
```bash
# Verify environment variables
echo $TURSO_DATABASE_URL
echo $TURSO_AUTH_TOKEN

# Test database connectivity
cd mcp-server && node -e "require('./dist/lib/turso.js').getProjects().then(console.log)"
```

**Memory Issues**
```bash
# Monitor memory usage
npm run mcp:monitor

# Check for memory leaks
node --expose-gc --inspect mcp-server/dist/index.js
```

**Performance Issues**
```bash
# Enable debug logging
echo "LOG_LEVEL=debug" >> mcp-server/.env

# Monitor detailed metrics
npm run mcp:metrics

# Check request patterns
tail -f logs/combined.log | grep "Request completed"
```

## Maintenance Scripts

### Daily Maintenance
```bash
#!/bin/bash
# daily-maintenance.sh
npm run mcp:health
npm run mcp:metrics | jq '.memory'
```

### Log Rotation
```bash
# logrotate configuration
/path/to/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 mcp-server mcp-server
    postrotate
        systemctl reload log-viewer-mcp
    endscript
}
```

### Backup Strategy
- Database backups handled by Turso
- Configuration files: backup `.env`, service files
- Application code: version controlled

## Performance Benchmarks

Typical production performance:
- **Cold Start**: < 2 seconds
- **Health Check**: < 50ms
- **Project List**: < 100ms
- **Log Retrieval**: < 200ms
- **Memory Usage**: < 50MB RSS
- **Error Rate**: < 0.1%

## Updates and Upgrades

```bash
# 1. Stop server
sudo systemctl stop log-viewer-mcp

# 2. Update code
git pull

# 3. Rebuild
npm run mcp:build

# 4. Verify
npm run mcp:verify

# 5. Restart
sudo systemctl start log-viewer-mcp

# 6. Check health
npm run mcp:health
```

## Support

For production issues:
1. Check monitoring dashboard alerts
2. Review logs for error patterns
3. Verify environment configuration
4. Test database connectivity
5. Check system resources

**Log Collection for Support**:
```bash
# Collect diagnostic information
echo "=== MCP Server Diagnostics ===" > diagnostic.log
echo "Date: $(date)" >> diagnostic.log
echo "Node Version: $(node --version)" >> diagnostic.log
echo "Environment:" >> diagnostic.log
cat mcp-server/.env >> diagnostic.log
echo "Health Check:" >> diagnostic.log
npm run mcp:health >> diagnostic.log 2>&1
echo "Metrics:" >> diagnostic.log
npm run mcp:metrics >> diagnostic.log 2>&1
echo "Recent Logs:" >> diagnostic.log
tail -50 logs/combined.log >> diagnostic.log 2>&1
```
