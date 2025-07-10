#!/bin/bash
# scripts/validate.sh - Pre-startup validation for Universal Log Viewer

source "$(dirname "$0")/config.sh"

log_info "Running pre-startup validation..."
ERRORS=0
WARNINGS=0

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    ERRORS=$((ERRORS + 1))
else
    log_success "Node.js is available: $(node --version)"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    log_error "npm is not installed"
    ERRORS=$((ERRORS + 1))
else
    log_success "npm is available: $(npm --version)"
fi

# Check if dependencies are installed
if [[ -f "$PROJECT_ROOT/package.json" ]]; then
    if [[ ! -d "$PROJECT_ROOT/node_modules" ]]; then
        log_error "Dependencies not installed. Run: npm install"
        ERRORS=$((ERRORS + 1))
    else
        log_success "Dependencies are installed"
    fi
fi

# Check for required environment variables
if [[ -f "$PROJECT_ROOT/.env.local" ]]; then
    log_success "Environment file (.env.local) exists"
    
    # Check for critical environment variables
    source "$PROJECT_ROOT/.env.local"
    
    if [[ -z "$TURSO_DATABASE_URL" ]]; then
        log_error "TURSO_DATABASE_URL not set in .env.local"
        ERRORS=$((ERRORS + 1))
    else
        log_success "TURSO_DATABASE_URL is configured"
    fi
    
    if [[ -z "$TURSO_AUTH_TOKEN" ]]; then
        log_error "TURSO_AUTH_TOKEN not set in .env.local"
        ERRORS=$((ERRORS + 1))
    else
        log_success "TURSO_AUTH_TOKEN is configured"
    fi
else
    log_warning ".env.local file not found. Using environment variables."
    WARNINGS=$((WARNINGS + 1))
fi

# Check write permissions for logs
if ! touch "$LOG_DIR/.test" 2>/dev/null; then
    log_error "Cannot write to log directory: $LOG_DIR"
    ERRORS=$((ERRORS + 1))
else
    rm -f "$LOG_DIR/.test"
    log_success "Log directory is writable"
fi

# Quick database connectivity test (with timeout)
if [[ -n "$TURSO_DATABASE_URL" ]] && command -v curl &> /dev/null; then
    log_info "Testing database connectivity..."
    if timeout 5s curl -s "$PROJECT_ROOT/api/health" >/dev/null 2>&1; then
        log_success "Database connectivity verified"
    else
        log_warning "Database connectivity test failed (non-critical)"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# Check if port is available (basic check)
if command -v lsof &> /dev/null; then
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "Port 3000 is already in use (will auto-select alternative)"
        WARNINGS=$((WARNINGS + 1))
    else
        log_success "Default port 3000 is available"
    fi
fi

# Check Next.js build status
if [[ -d "$PROJECT_ROOT/.next" ]]; then
    log_success "Next.js build cache exists"
else
    log_warning "No Next.js build cache found (first run may be slower)"
    WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
if [[ $ERRORS -gt 0 ]]; then
    log_error "Validation failed with $ERRORS errors and $WARNINGS warnings"
    exit 1
else
    log_success "Validation passed with $WARNINGS warnings"
    exit 0
fi