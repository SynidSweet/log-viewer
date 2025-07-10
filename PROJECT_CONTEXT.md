# Project Context & AI Agent Guide

*Last updated: 2025-07-10 | Added comprehensive API error handling test suite with 22 test scenarios*

## 🎯 Project Overview

### Core Purpose
Universal Log Viewer is a Next.js web application that provides secure log management via REST API with Google OAuth authentication and multi-project support.

**Current Status**: Production-ready with fully validated Turso migration and comprehensive API testing

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
npm install
npm run dev    # Development with Turbopack
npm run build  # Production build
npm run lint   # ESLint validation
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

### Database Schema (Turso SQLite)
- `projects` table - Project metadata with API keys
- `logs` table - Log entries with foreign key to projects
- Indexes on project_id, timestamp, and api_key for performance
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

### Development Notes
- **Testing Infrastructure**: Claude Testing Infrastructure v2.0 setup in `.claude-testing/`
- **Test Coverage**: 22 comprehensive error handling tests with 100% pass rate
- **Turbopack**: Used for development server performance
- **Tailwind v4**: PostCSS configuration for styling
- **shadcn/ui**: Radix UI-based component library
- **Client-Side State**: Local React state, no global state management

## Recent Updates
- **2025-07-10**: Completed TEST-ERROR-001 - Comprehensive API error handling test suite: 22 test scenarios with 100% pass rate, external testing infrastructure setup, robust error classification validation
- **2025-07-10**: Completed TURSO-014 - Comprehensive edge case testing: 15 test scenarios with 100% success rate, fixed critical health endpoint and error handling bugs
- **2025-07-10**: Completed TURSO-013 - Comprehensive API endpoint validation: all 11 endpoints tested with positive/negative scenarios, confirming successful Turso migration
- **2025-07-10**: Completed TURSO-011 - Database performance optimizations: added query result caching, batch operations, connection optimization, and performance monitoring

## 📊 Current Task Status

### Implementation Backlog
- **Total tasks**: 94 remaining
- **Critical priority**: 3 tasks remaining (production deployment, rollback procedures)
- **High priority**: 50 tasks (enhanced features, performance, security)
- **Medium priority**: 25 tasks (search, export, monitoring)
- **Low priority**: 16 tasks (multi-user, optimization)
- **Next up**: TURSO-016 - Create rollback procedures (Critical, ~30 mins)

### Refactoring Backlog
- **Total tasks**: 48 remaining 
- **Critical priority**: 11 tasks (database connection reliability patterns)
- **High priority**: 12 tasks (server-side parsing, testing, schema flexibility)
- **Medium priority**: 10 tasks (error handling, state management, rate limiting)
- **Low priority**: 7 tasks (CSS organization, bundle optimization)
- **Future enhancements**: 8 tasks (real-time streaming, advanced analysis)
- **Next up**: REF-DB-001 - Refactor database connection layer with connection pooling (Critical, ~4-6 hours)

This documentation serves as the central navigation hub - detailed implementation information is available in the `/docs/` modules.