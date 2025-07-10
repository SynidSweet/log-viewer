#!/bin/bash
# scripts/restart.sh - Restart Universal Log Viewer

source "$(dirname "$0")/config.sh"

log_info "Restarting Universal Log Viewer..."

# Stop the application
"$SCRIPT_DIR/stop.sh"

# Wait a moment
sleep 2

# Start the application
"$SCRIPT_DIR/start.sh"