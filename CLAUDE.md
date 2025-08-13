# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Universal Log Viewer is a Next.js 15 application that provides a web-based log management system. It allows external applications to send logs via REST API while providing a secure UI for viewing and analyzing them.

## Key Technologies

- **Next.js 15.3.1** with App Router and Turbopack
- **React 19** with TypeScript (strict mode)
- **Turso (SQLite)** for data persistence with optimized query caching
- **NextAuth.js** for Google OAuth authentication
- **Tailwind CSS v4** with PostCSS
- **shadcn/ui** components built on Radix UI
- **FastMCP** framework for external programmatic access
- **Zod** for schema validation and type safety

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint

# MCP Server Commands
npm run mcp:dev     # Development mode
npm run mcp:start   # Production mode
npm run mcp:build   # Build server

# MCP Testing Commands
npm run test:quick                 # Basic validation (14 tests, ~4s)
npm run test:mcp:tools            # Tool validation (29 tests, ~7s)
npm run test:mcp:comprehensive    # Full suite with coverage
npm run test:mcp:integration      # End-to-end workflows
npm run test:mcp:performance      # Performance benchmarks
npm run test:mcp:errors           # Error handling validation
```

## Architecture Overview

### Directory Structure

```
/src
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # REST API endpoints
│   │   ├── auth/          # NextAuth.js endpoints
│   │   ├── logs/          # Public log submission endpoint
│   │   └── projects/      # Project management endpoints
│   ├── auth/              # Authentication pages
│   └── projects/          # Project-specific pages
├── components/            # React components
│   ├── ui/               # shadcn/ui atomic components
│   └── log-viewer/       # Complex log viewing system
├── lib/                  # Core utilities
│   ├── db-turso.ts       # Turso database layer with caching
│   ├── turso.ts          # Database connection and query optimization
│   └── types.ts          # TypeScript type definitions
└── mcp-server/           # MCP server infrastructure
    ├── src/              # MCP server source code
    │   ├── index.ts      # TypeScript MCP server
    │   ├── index.js      # JavaScript MCP server (compatibility)
    │   └── lib/          # Shared database integration
    ├── test-suite/       # Comprehensive Jest + TypeScript test framework
    │   ├── tests/        # Test files (basic validation, tool validation, integration, performance, error handling)
    │   ├── utils/        # Test helpers (SimpleTestRegistry, mocked database, performance measurement)
    │   ├── __mocks__/    # Module mocks (nanoid, ES modules)
    │   └── jest.config.js # Jest configuration with TypeScript and ES module support
    ├── package.json      # MCP server dependencies
    ├── README.md         # MCP server documentation
    └── start-server.sh   # Automated startup script
```

### Data Flow Patterns

1. **Log Submission**: External systems → POST /api/logs (with API key) → Turso database
2. **Log Viewing**: Authenticated user → Fetch logs → Parse client-side → Display
3. **Authentication**: Google OAuth → NextAuth.js → Session-based access
4. **MCP Integration**: External tools → MCP server → Database operations → Structured responses

### Key Architectural Decisions

- **Hybrid Security**: UI requires Google auth, API uses project-specific keys
- **Client-Side Parsing**: Raw logs stored, parsed on-demand for flexibility
- **Repository Pattern**: Database operations abstracted in `lib/db-turso.ts`
- **Component State**: Local React state, no global state management
- **MCP Architecture**: FastMCP v3.14.4 with stdio transport for MCP client integration
- **Database Optimization**: Turso with query caching and batch operations
- **API Compatibility**: Backwards-compatible alias tools for different naming conventions
- **Type Safety**: Comprehensive Zod schema validation and TypeScript integration

## Database Schema

Turso (SQLite) uses optimized relational schema with query caching:

**Tables:**
- `projects` - Project metadata with API keys
- `logs` - Individual log entries with full-text content
- Indexed by project_id, timestamp for performance

**MCP Tools Available (18 Total):**
- **Health & Monitoring**: `health_check`, `get_metrics`, `get_active_alerts`, `update_alert_thresholds`
- **Authentication**: `validate_auth`
- **Project Management**: `list_projects`, `get_project`, `create_project`
- **Log Management**: `get_project_logs`, `get_log_content`, `create_log_entry`
- **Log Search**: `entries_query` (unified search), `entries_latest` (convenience tool)
- **Alias Tools**: `projects_list`, `project_get`, `logs_list` (backwards compatibility)

## Environment Variables

Required for deployment:
```
# Turso Database
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN

# Authentication
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
NEXTAUTH_SECRET
NEXTAUTH_URL

# Access Control (optional)
ALLOWED_EMAILS    # Comma-separated list
ALLOWED_DOMAINS   # Comma-separated list

# MCP Server (optional)
PROJECT_ID        # Default project identifier
API_TOKEN         # Default API token
PORT              # MCP server port (default: 3001)
```

## API Integration

Send logs to the system:
```javascript
POST /api/logs
{
  "projectId": "project-id",  // required
  "apiKey": "api-key",        // required
  "content": "[2025-04-29, 08:40:24] [LOG] Message - {\"data\": \"value\"}",  // required
  "comment": "optional"
}
```

### Log Format
- Pattern: `[YYYY-MM-DD, HH:MM:SS] [LEVEL] MESSAGE` or `[YYYY-MM-DD, HH:MM:SS] [LEVEL] MESSAGE - DATA`
- The `- DATA` portion is **optional** (implementation: src/app/api/logs/route.ts:10)
- DATA supports nested JSON objects of any complexity
- Supported levels: `LOG`, `ERROR`, `INFO`, `WARN`, `DEBUG`
- **Multi-line support**: Can send multiple log entries separated by newlines in a single request

### Important Implementation Details
- API validation regex: `/^\[\d{4}-\d{2}-\d{2}, \d{2}:\d{2}:\d{2}\] \[(LOG|ERROR|INFO|WARN|DEBUG)\] .+( - .+)?$/`
- UI parsing regex is more permissive: `/\[(.*?)\] \[(.*?)\] (.*?)( - (.*))?$/` (src/components/log-viewer/index.tsx:19)
- Extended data feature: Include `_extended` field in JSON data for separate "Extended Data" tab

## Component Patterns

- **Three-Column Layout**: Projects list → Logs list → Log details
- **Memoized Operations**: Filtering and parsing use React.useMemo
- **Client-Side Caching**: Log content cached to avoid re-fetching
- **Responsive Design**: Tailwind breakpoints handle mobile/desktop

## MCP Server Integration

The log viewer includes a comprehensive MCP server for programmatic access:

### Starting the MCP Server
```bash
# Quick start with automatic configuration
./mcp-server/start-server.sh

# Or manual start
cd mcp-server && npm run dev     # Development
cd mcp-server && npm start       # Production
```

### MCP Tools Usage Examples

**Basic Health Check**:
```json
{"tool": "health_check", "arguments": {}}
```

**Detailed Health Check with Subsystem Monitoring**:
```json
{
  "tool": "health_check",
  "arguments": {
    "include_detailed_checks": true,
    "check_database_performance": true
  }
}
```

**Advanced Metrics with Trends and Alerts**:
```json
{
  "tool": "get_metrics",
  "arguments": {
    "include_trends": true,
    "include_alerts": true
  }
}
```

**Create Project**:
```json
{
  "tool": "create_project",
  "arguments": {
    "name": "My Application", 
    "description": "Production logs"
  }
}
```

**Get Project Logs**:
```json
{
  "tool": "get_project_logs",
  "arguments": {"project_id": "my-application"}
}
```

### Integration Notes
- **Database Sharing**: MCP server uses same Turso database as web app
- **Authentication**: API key validation available via `validate_auth` tool
- **Performance**: Query caching and batch operations for efficiency
- **Compatibility**: Both TypeScript and JavaScript implementations available

## 📚 Work History
*Work history tracked in journal system - use MCP tools for detailed session information*

📖 **Recent work**: `mcp__claude-tasks__journal_get_recent --limit 5`  
📖 **Search history**: `mcp__claude-tasks__journal_search --query "monitoring"`  
📖 **Milestones**: `mcp__claude-tasks__journal_get_milestones`  
📖 **Full changelog**: `./docs/CHANGELOG.md`

## Current System Status

**MCP Server**: ✅ Production-ready v1.2.0 with enhanced monitoring and health check capabilities  
**Claude Code Integration**: ✅ Complete integration with documentation, configuration examples, and automated setup script  
**Monitoring System**: ✅ Comprehensive subsystem monitoring with real-time alerts, configurable thresholds, and trend analysis  
**Validation Framework**: ✅ Complete automation framework with checklist progress tracking, CI/CD pipeline, and intelligent orchestration  
**Testing Infrastructure**: ✅ Production-ready Jest + TypeScript test suite with 43 passing tests (14 basic + 29 tool validation)  
**Performance Benchmarking**: ✅ Configurable thresholds (500ms health checks, 1s general operations) with real-time measurement  
**Test Automation**: ✅ Automated test runner with 6 execution modes (quick, tools, integration, performance, errors, comprehensive)  
**Database**: ✅ Turso backend with performance monitoring and comprehensive mocked test layer  
**API Tools**: ✅ 18 MCP tools (15 core + 3 aliases) with comprehensive log entry search and sophisticated filtering  
**Log Entry Search**: ✅ Advanced search tools with entries_query (unified search) and entries_latest (convenience tool) featuring text search, level filtering, tag filtering, time-based filtering, context lines, and performance metrics  
**Integration**: ✅ TypeScript compilation and stdio transport with graceful shutdown handlers  
**CI/CD Ready**: ✅ Jest configuration with coverage reporting, TypeScript compilation, and automated execution  
**Sprint**: ✅ MCP MVP Completion Sprint COMPLETED - 100% complete with comprehensive test suite  
**Test Coverage**: ✅ All 18 MCP tools validated with parameter testing, response structure validation, and performance benchmarks

## Testing

**MCP Test Suite**: ✅ Production-ready Jest + TypeScript framework with:
- **43 Passing Tests**: 14 basic validation + 29 comprehensive tool validation tests
- **18 Tool Coverage**: All MCP tools (15 core + 3 aliases) with parameter validation and response structure testing
- **Performance Validation**: Sub-4 second execution with configurable thresholds (500ms health, 1s general)
- **Mocked Database**: Complete test isolation with realistic project and log data simulation
- **TypeScript Integration**: Full type safety with ES module support and nanoid mocking

**Available Commands**:
```bash
# MCP Server Testing
npm run test:quick                 # Basic validation (14 tests)
npm run test:mcp:comprehensive     # Full suite with coverage
npm run test:mcp:tools            # Tool functionality tests
npm run test:mcp:integration      # End-to-end workflow tests
npm run test:mcp:performance      # Performance benchmarks
npm run test:mcp:errors           # Error handling validation

# Legacy Validation Commands (maintained for compatibility)
npm run validate:mcp           # Complete validation suite
npm run validate:mcp:quick     # Quick health check
```

**MCP Test Infrastructure**: ✅ Complete testing framework with:
- **SimpleTestRegistry**: Custom test execution framework bypassing FastMCP complexity
- **Tool Validation**: 29 tests covering parameter validation, response structure, and performance for all 18 tools
- **Basic Validation**: 14 tests for environment setup, framework integration, and infrastructure verification
- **Performance Benchmarking**: Real-time response time measurement with configurable thresholds
- **Automated Test Runner**: 6 execution modes (quick, tools, integration, performance, errors, comprehensive)
- **CI/CD Ready**: Jest configuration with coverage reporting, TypeScript compilation, and automated execution

**Web Application Testing**: Not currently configured. When implementing, consider:
- Component testing for log-viewer components
- API route testing for authentication and log submission  
- Integration tests for full log submission/viewing flow