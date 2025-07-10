# Application Scripts Documentation

*Universal Log Viewer - Intelligent Startup Management*

## Overview

This project uses standardized scripts for application lifecycle management with automatic port allocation, validation, and background execution. The scripts ensure reliable startup without CLI timeouts and handle port conflicts gracefully.

## Scripts Directory Structure

```
scripts/
├── config.sh        # Shared configuration and utilities
├── start.sh         # Main startup script (background execution)
├── stop.sh          # Graceful shutdown script
├── restart.sh       # Stop + Start combination
├── status.sh        # Application status checker
├── validate.sh      # Pre-flight validation checks
└── setup-turso.js   # Database setup utility
```

## Core Scripts

### start.sh
**Purpose**: Starts the Universal Log Viewer in background with automatic port selection

**Features**:
- ✅ Background execution (non-blocking)
- ✅ Automatic port selection (3000-9999 range)
- ✅ Pre-startup validation
- ✅ PID tracking for process management
- ✅ Timestamped logging
- ✅ Health check verification

**Usage**:
```bash
./scripts/start.sh
```

**Output**:
```
[INFO] Running pre-startup validation...
[SUCCESS] Validation passed with 0 warnings
[INFO] Finding available port...
[INFO] Starting Universal Log Viewer...
[INFO] Port: 3842
[SUCCESS] Application started successfully!
[INFO] URL: http://localhost:3842
[INFO] Health check: http://localhost:3842/api/health
```

### stop.sh
**Purpose**: Gracefully stops the application with proper cleanup

**Features**:
- ✅ Graceful shutdown (SIGTERM first)
- ✅ Force kill fallback after 30 seconds
- ✅ PID file cleanup
- ✅ Status file cleanup

**Usage**:
```bash
./scripts/stop.sh
```

### restart.sh
**Purpose**: Executes stop followed by start with proper timing

**Usage**:
```bash
./scripts/restart.sh
```

### status.sh
**Purpose**: Comprehensive application status checker

**Features**:
- ✅ Process status verification
- ✅ Port and URL information
- ✅ Health check testing
- ✅ Recent log display
- ✅ Available commands list

**Usage**:
```bash
./scripts/status.sh
```

### validate.sh
**Purpose**: Pre-flight validation checks (runs in under 10 seconds)

**Validation Checks**:
- ✅ Node.js and npm availability
- ✅ Dependencies installation
- ✅ Environment variables (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN)
- ✅ File permissions for logs
- ✅ Database connectivity (with timeout)
- ✅ Port availability check
- ✅ Next.js build cache status

**Usage**:
```bash
./scripts/validate.sh
```

## Configuration

### Automatic Port Selection
- **Range**: 3000-9999 (randomly selected)
- **Conflict Resolution**: Automatic retry on port conflicts
- **Reporting**: Selected port displayed in startup logs

### File Locations
- **PID File**: `./.app.pid` (process ID tracking)
- **Status File**: `./.app.status` (runtime information)
- **Logs Directory**: `./logs/` (all application logs)
- **Current Log**: `./logs/current.log` (active session)
- **Build Logs**: `./logs/build-TIMESTAMP.log` (build output)

### Environment Requirements
- **Database**: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in `.env.local`
- **Dependencies**: Node.js, npm, and installed packages
- **Permissions**: Write access to logs directory

## Usage Examples

### Basic Operations
```bash
# Start application
./scripts/start.sh

# Check status
./scripts/status.sh

# View live logs
tail -f logs/current.log

# Stop application
./scripts/stop.sh

# Restart application
./scripts/restart.sh
```

### Development Workflow
```bash
# Validate environment before starting
./scripts/validate.sh

# Start for development
./scripts/start.sh

# Monitor health
curl http://localhost:$(cat .app.status | grep PORT | cut -d= -f2)/api/health

# Restart after changes
./scripts/restart.sh
```

### Troubleshooting
```bash
# Check what's wrong
./scripts/status.sh

# View detailed logs
cat logs/current.log

# Re-validate environment
./scripts/validate.sh

# Force restart
./scripts/stop.sh && ./scripts/start.sh
```

## Integration with Other Commands

### Development Commands
- **`/user:carry-on`**: Uses scripts for reliable application testing
- **`/user:document`**: References script documentation
- **Testing workflows**: Scripts provide stable environment for tests

### CI/CD Integration
```bash
# In deployment scripts
./scripts/validate.sh || exit 1
./scripts/start.sh
./scripts/status.sh
```

## Best Practices

### Script Usage
- ✅ Always use `./scripts/start.sh` instead of `npm start` directly
- ✅ Check status before starting: `./scripts/status.sh`
- ✅ Use restart for code changes: `./scripts/restart.sh`
- ✅ Monitor logs: `tail -f logs/current.log`

### Development Workflow
- ✅ Run validation before reporting issues
- ✅ Use scripts for consistent environment
- ✅ Check logs for debugging information
- ✅ Restart after environment changes

### Production Deployment
- ✅ Scripts work in any environment
- ✅ Automatic port selection prevents conflicts
- ✅ Health checks verify successful deployment
- ✅ Graceful shutdown for maintenance

## Technical Details

### Background Execution
All scripts use proper background execution patterns:
- `nohup command > logs/output.log 2>&1 &`
- PID tracking for process management
- Non-blocking CLI operation

### Error Handling
- Graceful failure with clear error messages
- Validation prevents common startup issues
- Automatic cleanup on failure
- Detailed logging for debugging

### Performance Considerations
- Validation runs in under 10 seconds
- Efficient port scanning algorithm
- Minimal resource overhead
- Fast startup and shutdown

## Troubleshooting Guide

### Common Issues

**Port Already in Use**
```bash
# Scripts automatically handle this
./scripts/start.sh
# Will select alternative port automatically
```

**Database Connection Issues**
```bash
# Check environment and connectivity
./scripts/validate.sh
# Will report specific database issues
```

**Application Won't Start**
```bash
# Check detailed status
./scripts/status.sh
# View logs for errors
cat logs/current.log
```

**Permission Errors**
```bash
# Ensure scripts are executable
chmod +x scripts/*.sh
# Check log directory permissions
ls -la logs/
```

### Getting Help
1. Run `./scripts/status.sh` for overview
2. Check `./scripts/validate.sh` for environment issues
3. Review `logs/current.log` for detailed errors
4. Use `./scripts/restart.sh` for fresh start

## Success Indicators

✅ **Startup**: Application starts without CLI timeout
✅ **Port**: Random port selected and reported
✅ **Health**: Health check endpoint responds
✅ **Logs**: Output properly logged to files
✅ **Management**: Start/stop/restart work reliably
✅ **Validation**: Pre-flight checks prevent issues

The script system ensures reliable application management across different environments while preventing common issues like port conflicts and CLI timeouts.