#!/bin/bash
# scripts/start.sh - Start Universal Log Viewer in background

source "$(dirname "$0")/config.sh"

# Check if already running
if is_running; then
    local current_port=$(get_current_port)
    log_warning "Application is already running (PID: $(cat "$PID_FILE"))"
    if [[ -n "$current_port" ]]; then
        log_info "Current URL: http://localhost:$current_port"
    fi
    exit 0
fi

# Run validation
log_info "Running pre-startup validation..."
if ! "$SCRIPT_DIR/validate.sh"; then
    log_error "Validation failed. Aborting startup."
    exit 1
fi

# Find available port
log_info "Finding available port..."
PORT=$(find_available_port 3000 9999)
export PORT

log_info "Starting Universal Log Viewer..."
log_info "Port: $PORT"
log_info "Log file: $LOG_DIR/current.log"

# Ensure we're in the project root
cd "$PROJECT_ROOT" || exit 1

# Start the application in background
# Use npm start which runs the production build
log_info "Starting Next.js application..."
nohup npm run build > "$LOG_DIR/build-$(date +%Y%m%d-%H%M%S).log" 2>&1 && \
nohup npm start > "$LOG_DIR/current.log" 2>&1 &

# Store PID
echo $! > "$PID_FILE"

# Wait a moment for startup
sleep 3

# Verify startup
if is_running; then
    local pid=$(cat "$PID_FILE")
    log_success "Application started successfully!"
    log_info "PID: $pid"
    log_info "Port: $PORT"
    log_info "URL: http://localhost:$PORT"
    log_info "Health check: http://localhost:$PORT/api/health"
    log_info "Logs: tail -f $LOG_DIR/current.log"
    
    # Create status file
    cat > "$PROJECT_ROOT/.app.status" << EOF
PID=$pid
PORT=$PORT
URL=http://localhost:$PORT
STARTED=$(date)
EOF
    
else
    log_error "Application failed to start. Check logs: $LOG_DIR/current.log"
    exit 1
fi