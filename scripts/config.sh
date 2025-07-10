#!/bin/bash
# scripts/config.sh - Shared configuration for Universal Log Viewer scripts

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_ROOT/.app.pid"
LOG_DIR="$PROJECT_ROOT/logs"

# Create log directory if needed
mkdir -p "$LOG_DIR"

# Function to find available port
find_available_port() {
    local start=$1
    local end=$2
    while true; do
        port=$(shuf -i $start-$end -n 1)
        if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo $port
            return
        fi
    done
}

# Function to check if process is running
is_running() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# Function to get current port from logs
get_current_port() {
    if [[ -f "$LOG_DIR/current.log" ]]; then
        grep -o "port [0-9]*" "$LOG_DIR/current.log" | tail -1 | cut -d' ' -f2
    fi
}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}