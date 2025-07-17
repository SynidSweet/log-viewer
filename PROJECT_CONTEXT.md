# Project Context & AI Agent Guide

*Last updated: 2025-07-17 | Completed smooth sort animations implementation, sprint now 92.3% complete*

## 🎯 Project Overview

### Core Purpose
Universal Log Viewer is a Next.js web application that provides secure log management - external applications send logs via REST API while authenticated users view and analyze them through a web interface.

**Current Status**: Active development with core features implemented

### Key Value Proposition
- **Hybrid Security**: UI requires Google OAuth, API uses project-specific keys
- **Multi-line Log Support**: Handle complex log submissions with multiple entries
- **Real-time Analysis**: Client-side parsing for flexible log format handling
- **Scalable Architecture**: Built on Turso SQLite for performance and reliability

## 🏗️ Architecture & Technical Stack

### Quick Overview
**Stack**: Next.js 15.3.1, React 19, TypeScript, Turso SQLite, NextAuth.js, Tailwind CSS v4, shadcn/ui

**Key Patterns**:
- **App Router** with server-side rendering
- **Repository Pattern** for database abstraction
- **Client-side Parsing** for log format flexibility
- **Component-based UI** with shadcn/ui atomic components

📖 **See detailed architecture**: [`./docs/architecture/overview.md`](./docs/architecture/overview.md)

## 🔧 Quick Start & Key Commands

**Setup**:
```bash
npm install
npm run dev        # Development server with Turbopack
```

**Main Commands**:
```bash
npm run build      # Production build with DB init
npm run start      # Production server
npm run lint       # ESLint validation
npm run db:init    # Initialize database
npm run db:migrate # Run migrations
```

📖 **See development workflow**: [`./docs/development/workflow.md`](./docs/development/workflow.md)  
📖 **See testing guide**: [`./docs/development/testing.md`](./docs/development/testing.md)

## ⚠️ Critical Constraints

- **Database**: Turso SQLite with specific initialization requirements
- **Authentication**: Google OAuth for UI access, API keys for log submission
- **Log Format**: Strict validation pattern required: `[YYYY-MM-DD, HH:MM:SS] [LEVEL] MESSAGE - DATA`
- **Multi-line Support**: Single API calls can contain multiple log entries separated by newlines

## 📍 Where to Find Things

### Key Files & Locations
- **API Routes**: `src/app/api/` - REST endpoints for logs and projects
- **Database Layer**: `src/lib/db-turso.ts` - All database operations
- **Log Viewer**: `src/components/log-viewer/` - Complex log viewing system
- **Authentication**: `src/app/api/auth/[...nextauth]/route.ts` - NextAuth.js setup
- **Types**: `src/lib/types.ts` - TypeScript definitions
- **Tests**: `.claude-testing/` - Comprehensive test suite (Jest + React Testing Library)
- **Test Helpers**: `.claude-testing/test-helpers/` - Server Component testing utilities

### Database Schema
- **Projects**: `id, name, description, created_at, api_key`
- **Logs**: `id, project_id, timestamp, comment, is_read, content`
- **Migrations**: Automated schema management with tracking

📖 **See data models**: [`./docs/architecture/data-models.md`](./docs/architecture/data-models.md)

## 🔌 API Integration

### Log Submission Endpoint
```javascript
POST /api/logs
{
  "projectId": "project-id",
  "apiKey": "api-key", 
  "content": "[2025-07-16, 14:30:00] [LOG] User login successful - {\"userId\": \"123\", \"ip\": \"192.168.1.1\", \"_tags\": [\"auth\", \"user-action\"]}",
  "comment": "Optional description"
}
```

### Log Format Requirements
- **Pattern**: `[YYYY-MM-DD, HH:MM:SS] [LEVEL] MESSAGE - DATA`
- **Levels**: LOG, ERROR, INFO, WARN, DEBUG - ✅ DEBUG validated with purple badges
- **Multi-line**: Multiple entries separated by newlines in single request
- **Data Section**: Optional JSON data after hyphen delimiter
- **Tag Support**: Include `_tags` array in JSON data for tag-based filtering

📖 **See API reference**: [`./docs/commands/api-reference.md`](./docs/commands/api-reference.md)

## 🎨 UI Architecture

### Component Structure
- **Three-Column Layout**: Projects → Logs → Details
- **Responsive Design**: Tailwind breakpoints for mobile/desktop
- **State Management**: React local state, no global state library
- **Memoized Operations**: Filtering and parsing optimized with useMemo
- **Keyboard Navigation**: Shortcuts for power users (press 's' to toggle sort) - ✅ Validated working

### Key Components
- **LogViewer**: Main interface at `src/components/log-viewer/index.tsx`
- **ProjectList**: Project selection and management
- **LogEntryList**: Filterable log display with sort controls, tag badges, and smooth animations
- **JsonTree**: Structured data visualization
- **localStorage Persistence**: User preferences saved across sessions

### Animation Features
- **Sort Transitions**: Smooth CSS animations for log reordering (300ms fadeInSlide + 400ms staggered entries)
- **Visual Polish**: Hardware-accelerated transforms with subtle hover effects
- **Keyboard Integration**: Animations work seamlessly with 's' key sort toggle

### Tag Support
- **Tag Parsing**: Extracts `_tags` from JSON log details automatically
- **Tag Display**: Shows tags as badges in log entry list (top-right corner)
- **Tag Filtering**: ✅ **Complete** - Multi-select dropdown with full functionality
  - **OR Logic**: Shows entries with ANY selected tags
  - **Multi-select UI**: Dropdown with checkboxes, search, and bulk actions
  - **Performance**: Memoized filtering with `useMemo`
  - **State Management**: Integrated with existing `entryFilters`
  - **User Experience**: Badge count indicator, click-outside-to-close, keyboard accessible
  - **Validation**: ✅ Confirmed working with multi-select, search, and bulk operations

## 🚀 Environment & Deployment

### Required Environment Variables
```bash
# Database
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN

# Authentication  
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
NEXTAUTH_SECRET
NEXTAUTH_URL

# Optional Access Control
ALLOWED_EMAILS
ALLOWED_DOMAINS
```

### Deployment Process
1. Set environment variables
2. Run `npm run build` (includes DB initialization)
3. Deploy to Vercel or compatible platform
4. Verify health endpoints: `/api/health`, `/api/env-check`

📖 **See deployment details**: [`./docs/deployment/`](./docs/deployment/)

## 💡 AI Agent Guidelines

### Essential Workflow
1. **Read this PROJECT_CONTEXT.md** first for navigation
2. **Check `/docs/` modules** for detailed information  
3. **Follow patterns** in `/docs/development/conventions.md`
4. **Test API endpoints** with proper authentication
5. **Validate log formats** before submission

### Development Best Practices
- **Database Operations**: Always use repository pattern in `lib/db-turso.ts`
- **Error Handling**: Implement proper error boundaries and API responses
- **Type Safety**: Leverage TypeScript strictly throughout
- **Component Patterns**: Follow shadcn/ui conventions for UI components
- **Testing**: Use comprehensive testing infrastructure in `.claude-testing/` directory
- **Server Component Testing**: Test as functions, not with render() - check JSX structure directly
- **Client Component Testing**: Mock all Next.js dependencies before rendering

### Critical Integration Points
- **Database Initialization**: Required before any database operations
- **Authentication Flow**: NextAuth.js handles OAuth, API keys for external access
- **Log Parsing**: Client-side parsing allows flexible log format handling
- **Multi-line Processing**: Handle complex log submissions with multiple entries
- **Testing Infrastructure**: Claude-testing-infrastructure v2.0 with JSX/TypeScript support configured

📖 **See planning**: [`./docs/planning/`](./docs/planning/) for current tasks and roadmap

## 📊 Current Task Status

### Sprint Status
- **Current Sprint**: Frontend Log Viewer Enhancements (SPRINT-2025-Q3-DEV01)
- **Sprint Progress**: 92.3% complete (24/26 tasks)
- **Focus**: Enhanced user experience with sorting, filtering, and visual organization
- **Validation Status**: ✅ All core features + smooth animations validated and tested

### Task Backlog
- **Total pending**: 14 tasks
- **Critical priority**: 0 tasks
- **High priority**: 0 tasks
- **Medium priority**: 10 tasks (backlog)
- **Low priority**: 4 tasks (2 in sprint, 2 in backlog)
- **In progress**: 0 tasks
- **Next up**: TASK-2025-015 - Add visual feedback when keyboard shortcut is used (Low, Sprint task)

### System Health
- **Task System**: Available and operational
- **Data Validation**: Valid
- **Configuration**: Project-specific MCP integration

---

*This navigation hub stays lean - detailed information lives in `/docs/` modules*