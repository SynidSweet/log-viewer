#!/bin/bash
# scripts/status.sh - Check Universal Log Viewer status

source "$(dirname "$0")/config.sh"

log_info "Universal Log Viewer Status Check"
echo "================================="

if is_running; then
    local pid=$(cat "$PID_FILE")
    log_success "Application is running (PID: $pid)"
    
    if [[ -f "$PROJECT_ROOT/.app.status" ]]; then
        echo ""
        log_info "Application Details:"
        cat "$PROJECT_ROOT/.app.status"
    fi
    
    local current_port=$(get_current_port)
    if [[ -n "$current_port" ]]; then
        echo ""
        log_info "Testing connectivity..."
        if curl -s "http://localhost:$current_port/api/health" >/dev/null 2>&1; then
            log_success "Health check passed"
        else
            log_warning "Health check failed"
        fi
    fi
    
    echo ""
    log_info "Recent logs (last 10 lines):"
    if [[ -f "$LOG_DIR/current.log" ]]; then
        tail -n 10 "$LOG_DIR/current.log"
    else
        log_warning "No log file found"
    fi
    
else
    log_warning "Application is not running"
    
    if [[ -f "$LOG_DIR/current.log" ]]; then
        echo ""
        log_info "Last log entries:"
        tail -n 10 "$LOG_DIR/current.log"
    fi
fi

echo ""
log_info "Available commands:"
echo "  ./scripts/start.sh   - Start the application"
echo "  ./scripts/stop.sh    - Stop the application"
echo "  ./scripts/restart.sh - Restart the application"
echo "  ./scripts/status.sh  - Show this status"
echo "  ./scripts/validate.sh - Run validation checks"