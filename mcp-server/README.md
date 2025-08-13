# Log Viewer MCP Server

This is the Model Context Protocol (MCP) server for the Log Viewer application, providing programmatic access to project and log management functionality.

## Overview

The MCP server exposes the following capabilities:
- **Health Check**: Server status and database connectivity validation
- **Authentication**: API token validation
- **Project Management**: Create, read, update, and delete projects
- **Log Management**: Create and retrieve log entries

## Quick Start

### 1. Environment Setup

Copy the environment template:
```bash
cp .env.example .env
```

Configure your environment variables:
```env
PROJECT_ID=your-project-id
API_TOKEN=your-api-token
PORT=3001
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build and Run

Development mode:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

Watch mode (auto-restart on changes):
```bash
npm run watch
```

## Available Tools

### Health & Authentication

- `health_check`: Check server status and database connectivity
- `get_metrics`: Get detailed production metrics, performance statistics, and health trends
- `get_active_alerts`: Get currently active alerts and health issues across all monitored subsystems
- `update_alert_thresholds`: Update monitoring alert thresholds for proactive system health management
- `validate_auth`: Validate API authentication tokens

### Project Management

- `list_projects`: Get all projects (without API keys)
- `projects_list`: Alias for list_projects (backwards compatibility)
- `get_project`: Get specific project details (including API key)  
- `project_get`: Alias for get_project (backwards compatibility)
- `create_project`: Create a new project with auto-generated API key

### Log Management

- `get_project_logs`: Get log entries for a project (metadata only)
- `logs_list`: Alias for get_project_logs (backwards compatibility)
- `get_log_content`: Get full content of a specific log entry
- `create_log_entry`: Create a new log entry for a project

### **NEW: Advanced Log Entry Search**

- `entries_query`: **Unified log entry search with comprehensive filtering options**
  - Text search in messages and details
  - Log level filtering (LOG, ERROR, INFO, WARN, DEBUG)
  - Tag-based filtering
  - Time-based filtering (ISO strings or relative formats like "1h", "30m")
  - Context lines (show surrounding log entries)
  - Verbosity levels (titles, summary, full)
  - Performance metrics and comprehensive error handling

- `entries_latest`: **Convenience tool for quick access to recent log entries**
  - Basic filtering with exclude_debug option
  - Recommends using entries_query for advanced searches

## Usage Examples

### Health Check
```json
{
  "tool": "health_check",
  "arguments": {}
}
```

### Create Project
```json
{
  "tool": "create_project", 
  "arguments": {
    "name": "My Application",
    "description": "Production application logs"
  }
}
```

### Create Log Entry
```json
{
  "tool": "create_log_entry",
  "arguments": {
    "project_id": "my-application",
    "content": "[2025-08-13, 20:30:00] [INFO] Application started successfully",
    "comment": "Server startup log"
  }
}
```

### **NEW: Advanced Log Entry Search**

#### Comprehensive Search with Multiple Filters
```json
{
  "tool": "entries_query",
  "arguments": {
    "project_id": "my-application",
    "search_query": "error",
    "levels": "ERROR,WARN",
    "time_from": "1h",
    "verbosity": "summary",
    "limit": 20,
    "context_lines": 2
  }
}
```

#### Quick Recent Entries
```json
{
  "tool": "entries_latest",
  "arguments": {
    "project_id": "my-application",
    "limit": 10,
    "exclude_debug": true
  }
}
```

#### Advanced Time-Based Search
```json
{
  "tool": "entries_query",
  "arguments": {
    "project_id": "my-application",
    "time_from": "2025-08-13T20:00:00Z",
    "time_to": "2025-08-13T21:00:00Z",
    "levels": "ERROR",
    "verbosity": "full"
  }
}
```

## Claude Code Integration

**✅ Ready for Claude Code**: This MCP server is fully compatible with Claude Code and provides natural language access to all log management features.

### Quick Setup

1. **Build the server**:
   ```bash
   npm run build
   ```

2. **Add to Claude Code configuration** (`~/.config/Claude/claude_desktop_config.json`):
   ```json
   {
     "mcpServers": {
       "log-viewer": {
         "command": "node",
         "args": ["path/to/log-viewer/mcp-server/dist/index.js"],
         "env": {
           "TURSO_DATABASE_URL": "your_database_url",
           "TURSO_AUTH_TOKEN": "your_auth_token",
           "NODE_ENV": "production",
           "ENABLE_METRICS": "true"
         }
       }
     }
   }
   ```

3. **Use with natural language**:
   - "Check log viewer server health"
   - "Create a new project for production logs"
   - "Find all ERROR logs from the last hour"
   - "Show me performance metrics"

📖 **Complete integration guide**: See [`CLAUDE_CODE_INTEGRATION.md`](./CLAUDE_CODE_INTEGRATION.md)  
📋 **Configuration examples**: See [`claude_desktop_config.example.json`](./claude_desktop_config.example.json)

## Integration

This MCP server is designed to work with the Log Viewer web application and shares the same database backend. It provides external tools and AI agents with programmatic access to log management functionality.

### Database Integration

The server uses the same Turso database as the main application, importing database functions from `../src/lib/db-turso.ts`.

### Authentication

Projects are authenticated using API keys that are auto-generated when creating projects. Use the `validate_auth` tool to verify API tokens before performing operations.

## Development

The server is built with:
- **FastMCP**: Modern MCP server framework
- **Zod**: Runtime type validation and schema definition
- **TypeScript**: Type safety and modern JavaScript features

## Environment Variables

- `PROJECT_ID`: Optional default project identifier
- `API_TOKEN`: Optional default API token for authentication
- `PORT`: Server port (default: 3001)
- Database variables are inherited from parent project environment

## Error Handling

All tools return standardized responses with:
- `success`: Boolean indicating operation result
- `error`: Error message (if applicable)
- `timestamp`: ISO timestamp of the operation
- Additional tool-specific data

## Validation & Quality Assurance

**Validation Framework**: ✅ Comprehensive MVP validation checklist created with 10 categories and 100+ validation points  
**Automation Templates**: ✅ Complete automation framework for validation scripts and CI/CD integration  
**Current Status**: 13+ MCP tools operational including advanced log entry search capabilities  
**Production Readiness**: Framework established for comprehensive production validation  
**Recent Updates**: ✅ Advanced log entry search tools implemented and validated  

**Validation Documentation**: See `/docs/validation/mcp-mvp-completion-checklist.md` for complete validation criteria

## Security Considerations

- API keys are only exposed in `get_project` tool responses
- Authentication validation is available via `validate_auth` tool
- Database operations use the same security model as the web application
- Environment variables should be secured in production deployments