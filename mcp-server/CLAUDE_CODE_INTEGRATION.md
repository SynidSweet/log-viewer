# Claude Code Integration

This document provides step-by-step instructions for integrating the Log Viewer MCP Server with Claude Code.

## Overview

The Log Viewer MCP Server provides comprehensive log management capabilities for Claude Code through the Model Context Protocol (MCP). Once configured, you can use natural language to interact with your log data, create projects, search logs, and monitor server health directly from Claude Code.

## Quick Setup

### 1. Configuration File Setup

Create or update your Claude Code configuration file at `~/.config/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "log-viewer": {
      "command": "node",
      "args": [
        "/path/to/log-viewer/mcp-server/dist/index.js"
      ],
      "env": {
        "TURSO_DATABASE_URL": "your_turso_database_url",
        "TURSO_AUTH_TOKEN": "your_turso_auth_token",
        "NODE_ENV": "production",
        "LOG_LEVEL": "info",
        "ENABLE_METRICS": "true"
      }
    }
  }
}
```

### 2. Alternative: TypeScript Development Configuration

For development with TypeScript support:

```json
{
  "mcpServers": {
    "log-viewer-dev": {
      "command": "npx",
      "args": [
        "ts-node", 
        "/path/to/log-viewer/mcp-server/src/index.ts"
      ],
      "env": {
        "TURSO_DATABASE_URL": "your_turso_database_url",
        "TURSO_AUTH_TOKEN": "your_turso_auth_token",
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug",
        "ENABLE_METRICS": "true",
        "LOG_REQUESTS": "true"
      }
    }
  }
}
```

### 3. Minimal Configuration (JavaScript with Mock Data)

For testing without database setup:

```json
{
  "mcpServers": {
    "log-viewer-test": {
      "command": "node",
      "args": [
        "/path/to/log-viewer/mcp-server/src/index.js"
      ],
      "env": {
        "NODE_ENV": "development",
        "PROJECT_ID": "test-project",
        "API_TOKEN": "test-token"
      }
    }
  }
}
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `TURSO_DATABASE_URL` | Turso database connection URL | Yes (unless using mock) | - |
| `TURSO_AUTH_TOKEN` | Turso authentication token | Yes (unless using mock) | - |
| `NODE_ENV` | Environment mode | No | `development` |
| `LOG_LEVEL` | Logging level (error, warn, info, debug) | No | `info` |
| `PROJECT_ID` | Default project identifier | No | - |
| `API_TOKEN` | Default API token | No | - |
| `ENABLE_METRICS` | Enable performance metrics | No | `false` |
| `LOG_REQUESTS` | Log all MCP requests | No | `false` |
| `HEALTH_CHECK_INTERVAL` | Health check interval (ms) | No | `30000` |
| `ENABLE_CACHING` | Enable response caching | No | `false` |

## Build Requirements

Before using the MCP server, ensure it's built:

```bash
cd /path/to/log-viewer/mcp-server
npm install
npm run build
```

## Available Tools

Once configured, Claude Code will have access to these tools:

### Core Tools
- **health_check** - Server status and database connectivity
- **get_metrics** - Performance metrics and monitoring data  
- **get_active_alerts** - Current system alerts and issues
- **validate_auth** - API token validation

### Project Management
- **list_projects** - Get all projects
- **get_project** - Get specific project details
- **create_project** - Create new projects

### Log Management
- **get_project_logs** - Get log entries for a project
- **get_log_content** - Get full content of specific log entries
- **create_log_entry** - Create new log entries
- **entries_query** - Advanced log search with filtering
- **entries_latest** - Quick access to recent log entries

## Usage Examples

### Basic Health Check
```
Check if the log viewer MCP server is healthy
```

### Project Management
```
Create a new project called "Production API" with description "Main API server logs"
```

### Log Search
```
Find all ERROR level logs from the last hour in project "production-api" that contain "database"
```

### Advanced Monitoring
```
Show me the current performance metrics and any active alerts for the log viewer system
```

## Troubleshooting

### Common Issues

1. **Server not starting**: Ensure the built JavaScript files exist in `dist/`
2. **Database connection errors**: Verify `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
3. **Permission errors**: Check file permissions on the MCP server directory
4. **Path issues**: Use absolute paths in the configuration

### Debug Mode

Enable debug logging to troubleshoot issues:

```json
{
  "env": {
    "LOG_LEVEL": "debug",
    "LOG_REQUESTS": "true"
  }
}
```

### Health Check

Test the MCP server directly:

```bash
cd /path/to/log-viewer/mcp-server
npm run health
```

## Production Considerations

For production use:

1. Set `NODE_ENV=production`
2. Enable metrics with `ENABLE_METRICS=true`
3. Use appropriate log levels (`info` or `warn`)
4. Set up proper error monitoring
5. Consider enabling caching for better performance

## Security Notes

- API keys are only exposed through the `get_project` tool
- The server validates all API tokens before operations
- Environment variables should be secured
- Consider network restrictions in production deployments

## Integration Benefits

With Claude Code integration, you can:

- **Natural Language Queries**: Ask questions about your logs in plain English
- **Automated Analysis**: Get insights and patterns from your log data
- **Real-time Monitoring**: Check system health and performance metrics
- **Efficient Management**: Create and manage projects without leaving Claude Code
- **Advanced Search**: Use sophisticated filtering and search capabilities
- **Performance Insights**: Monitor server performance and get alerts

## Support

For issues related to:
- **MCP Server**: Check the `README.md` in the `mcp-server/` directory
- **Database Setup**: See `docs/database/turso-setup.md`
- **Claude Code Configuration**: Refer to the Claude Code documentation
- **Integration Problems**: Check the troubleshooting section above

---

**Version**: Log Viewer MCP Server v1.2.0  
**Last Updated**: 2025-08-13  
**Claude Code Compatibility**: All versions with MCP support