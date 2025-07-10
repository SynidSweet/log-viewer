# Project Context & AI Agent Guide

*Last updated: 2025-07-10 | Lean navigation hub - details in /docs/ modules*

## 🎯 Project Overview

### Core Purpose
Universal Log Viewer is a Next.js web application that provides secure log management via REST API with Google OAuth authentication and multi-project support.

**Current Status**: Production-ready with comprehensive logging system

## 🏗️ Architecture & Technical Stack

### Quick Overview
**Stack**: Next.js 15.3.1, React 19, TypeScript, Vercel KV, NextAuth.js, Tailwind CSS v4, shadcn/ui components

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
- **Data Storage**: Vercel KV (Redis) with specific key patterns
- **Client-Side Parsing**: Raw logs stored, parsed in browser for flexibility

## 📍 Where to Find Things

### Key Files & Locations
- **API Routes**: `/src/app/api/` - REST endpoints for logs and projects
- **Core Components**: `/src/components/log-viewer/` - Main UI system
- **Database Layer**: `/src/lib/db.ts` - Vercel KV operations
- **Type Definitions**: `/src/lib/types.ts` - TypeScript interfaces
- **Authentication**: `/src/middleware.ts` - NextAuth.js integration

### Database Schema (Vercel KV)
- `project:{id}` - Project metadata
- `project:{id}:logs` - Set of log IDs for project
- `log:{id}` - Individual log entries
- `projects` - Set of all project IDs

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
- **Repository Pattern**: All DB operations in `/src/lib/db.ts`

### API Integration
- **Log Submission**: External systems POST to `/api/logs` with API key
- **Log Viewing**: Authenticated users fetch via `/api/projects/{id}/logs`
- **Multi-line Support**: Single request can contain multiple log entries
- **Extended Data**: Include `_extended` field in JSON for separate tab display

### Security Model
- **Public API**: `/api/logs` accepts logs with project API key validation
- **Protected UI**: All UI routes require Google OAuth except auth pages
- **Middleware**: `/src/middleware.ts` handles authentication routing
- **Environment Variables**: Google OAuth, Vercel KV, and access control settings

### Development Notes
- **No Test Framework**: Currently configured - add tests as needed
- **Turbopack**: Used for development server performance
- **Tailwind v4**: PostCSS configuration for styling
- **shadcn/ui**: Radix UI-based component library
- **Client-Side State**: Local React state, no global state management

This documentation serves as the central navigation hub - detailed implementation information is available in the `/docs/` modules.