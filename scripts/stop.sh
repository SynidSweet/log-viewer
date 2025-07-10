#!/bin/bash
# scripts/stop.sh - Stop Universal Log Viewer gracefully

source "$(dirname "$0")/config.sh"

if ! is_running; then
    log_warning "Application is not running"
    exit 0
fi

local pid=$(cat "$PID_FILE")
log_info "Stopping Universal Log Viewer (PID: $pid)..."

# Try graceful shutdown first
log_info "Sending SIGTERM signal..."
kill -TERM "$pid" 2>/dev/null

# Wait for graceful shutdown
local count=0
while kill -0 "$pid" 2>/dev/null && [ $count -lt 30 ]; do
    sleep 1
    count=$((count + 1))
    if [ $((count % 5)) -eq 0 ]; then
        log_info "Waiting for graceful shutdown... ($count/30 seconds)"
    fi
done

# Force kill if still running
if kill -0 "$pid" 2>/dev/null; then
    log_warning "Graceful shutdown failed. Force killing..."
    kill -KILL "$pid" 2>/dev/null
    sleep 2
fi

# Cleanup
rm -f "$PID_FILE"
rm -f "$PROJECT_ROOT/.app.status"

if kill -0 "$pid" 2>/dev/null; then
    log_error "Failed to stop application"
    exit 1
else
    log_success "Application stopped successfully"
    exit 0
fi