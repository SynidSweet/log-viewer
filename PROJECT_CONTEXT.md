# Project Context & AI Agent Guide

*Last updated: 2025-07-10 | Verified Turso database connection is working - project is production-ready*

## 🎯 Project Overview

### Core Purpose
Universal Log Viewer is a Next.js web application that provides secure log management via REST API with Google OAuth authentication and multi-project support.

**Current Status**: Production-ready with validated Turso database connection (44ms response time) and complete schema

## 🏗️ Architecture & Technical Stack

### Quick Overview
**Stack**: Next.js 15.3.1, React 19, TypeScript, Turso SQLite, NextAuth.js, Tailwind CSS v4, shadcn/ui components

**Key Features**:
- Public REST API for log submission with API key authentication
- Google OAuth-secured UI for log viewing
- Multi-project support with isolated log storage
- Real-time log parsing and filtering
- Three-column UI: Projects → Logs → Log Details

📖 **See detailed architecture**: [`./docs/architecture/overview.md`](./docs/architecture/overview.md)

## 🔧 Quick Start & Key Commands

**Setup**:
```bash
npm install        # Includes automatic database initialization
npm run dev        # Development with Turbopack
npm run build      # Production build with database setup
npm run lint       # ESLint validation
npm run verify-env # Environment variable validation
npm run db:init    # Manual database initialization
npm run db:migrate # Run pending migrations
npm run db:status  # Check migration status
```

**API Usage**:
```bash
POST /api/logs
{
  "projectId": "project-id",
  "apiKey": "api-key", 
  "content": "[2025-04-29, 08:40:24] [LOG] Message - {\"data\": \"value\"}",
  "comment": "optional"
}
```

📖 **See development workflow**: [`./docs/development/workflow.md`](./docs/development/workflow.md)

## ⚠️ Critical Constraints

- **Hybrid Security**: UI requires Google OAuth, API uses project-specific keys
- **Log Format**: Strict regex validation on submission: `[YYYY-MM-DD, HH:MM:SS] [LEVEL] MESSAGE - DATA`
- **Data Storage**: Turso (SQLite) with automatic retry and resilience patterns via withDatabaseOperation wrapper
- **Client-Side Parsing**: Raw logs stored, parsed in browser for flexibility
- **Database Resilience**: Lazy initialization with automatic retry mechanisms

## 📍 Where to Find Things

### Key Files & Locations
- **API Routes**: `/src/app/api/` - REST endpoints for logs and projects
- **Core Components**: `/src/components/log-viewer/` - Main UI system
- **Database Layer**: `/src/lib/db-turso.ts` - Turso database operations
- **Error Handling**: `/src/lib/api-error-handler.ts` - Centralized API error handling with structured responses
- **Type Definitions**: `/src/lib/types.ts` - TypeScript interfaces
- **Authentication**: `/src/middleware.ts` - NextAuth.js integration
- **Debug Endpoints**: `/src/app/api/env-check/` & `/src/app/api/debug/` - Production debugging tools with environment validation
- **Deployment Scripts**: `/scripts/init-db-deploy.js`, `/scripts/migrate.js` - Automated database initialization and migration system
- **Migration Files**: `/scripts/migrations/` - Versioned database schema changes
- **Environment Scripts**: `/scripts/verify-env.js` - Environment validation utility

### Database Schema (Turso SQLite)
- `projects` table - Project metadata with API keys
- `logs` table - Log entries with foreign key to projects
- `migrations` table - Migration tracking with execution history
- Indexes on project_id, timestamp, and api_key for performance
- **Automated initialization** via deployment scripts and migration system
- **All operations wrapped** with withDatabaseOperation for resilience

📖 **See planning**: [`./docs/planning/`](./docs/planning/) for current tasks

## 💡 AI Agent Guidelines

### Essential Workflow
1. Read this PROJECT_CONTEXT.md first for navigation
2. Check `/docs/` modules for detailed information
3. Follow patterns in `/docs/development/conventions.md`
4. Test with both `npm run lint` and `npm run build`

### Component Patterns
- **Three-Column Layout**: Projects list → Logs list → Log details
- **Client-Side Caching**: Log content cached to avoid re-fetching
- **Memoized Operations**: Heavy parsing operations use React.useMemo
- **Repository Pattern**: All DB operations in `/src/lib/db-turso.ts`
- **Error Handling**: Standardized API error responses via `withApiErrorHandling` wrapper

### API Integration
- **Log Submission**: External systems POST to `/api/logs` with API key
- **Log Viewing**: Authenticated users fetch via `/api/projects/{id}/logs`
- **Multi-line Support**: Single request can contain multiple log entries
- **Extended Data**: Include `_extended` field in JSON for separate tab display

### Security Model
- **Public API**: `/api/logs` accepts logs with project API key validation
- **Protected UI**: All UI routes require Google OAuth except auth pages
- **Middleware**: `/src/middleware.ts` handles authentication routing
- **Environment Variables**: Google OAuth, Turso database, and access control settings

### ✅ Recently Resolved Production Issues
- **Database Connection**: Fixed environment variable handling with graceful fallbacks
- **Error Reporting**: Added comprehensive error messages with actionable guidance
- **Deployment Process**: Created environment validation tools and documentation
- **Debugging**: Added `/api/env-check` and enhanced `/api/debug` endpoints

📖 **See critical tasks**: [`./docs/planning/IMPLEMENTATION_PLAN.md`](./docs/planning/IMPLEMENTATION_PLAN.md) for immediate action items

### Development Notes
- **Testing Infrastructure**: Claude Testing Infrastructure v2.0 setup in `.claude-testing/`
- **Test Coverage**: 22 comprehensive error handling tests with 100% pass rate
- **Turbopack**: Used for development server performance
- **Tailwind v4**: PostCSS configuration for styling
- **shadcn/ui**: Radix UI-based component library
- **Client-Side State**: Local React state, no global state management

## Recent Updates
- **2025-07-10**: Verified Turso database connection is working correctly - project is fully operational with 44ms response times, complete schema (projects, logs tables), and healthy status across all systems
- **2025-07-10**: Completed IMPL-PROD-002 - Enhanced Database Error Reporting: Added 12 specific database error types with actionable guidance, enhanced error classification in api-error-handler.ts and turso.ts, comprehensive error responses with remediation steps
- **2025-07-10**: Completed IMPL-PROD-001B - Environment validation tools: Added `/api/env-check` and enhanced `/api/debug` endpoints, created `verify-env` script, comprehensive Vercel deployment documentation
- **2025-07-10**: Completed TEST-ERROR-001 - Comprehensive API error handling test suite: 22 test scenarios with 100% pass rate, external testing infrastructure setup, robust error classification validation

## 📊 Current Task Status

### Database Connection Status
- **✅ VERIFIED**: Turso database is connected and fully operational
- **Database**: `log-petter-ai-synidsweet.aws-eu-west-1.turso.io` 
- **Performance**: 44ms response time, all health checks passing
- **Schema**: Complete with `projects` and `logs` tables
- **Status**: Ready for production use

### Implementation Backlog (Core Improvements Only)
**Project Status**: ✅ **FULLY FUNCTIONAL** - Database connected, APIs working, ready for production use

**Note**: Previous task estimates were scope creep. The project is working as intended. Any remaining tasks are optional enhancements, not blockers.

### Optional Enhancement Areas
**Current Priority**: None - project is fully operational

Areas for future improvement (not required):
- Performance optimizations
- Additional testing
- Code organization improvements

This documentation serves as the central navigation hub - detailed implementation information is available in the `/docs/` modules.