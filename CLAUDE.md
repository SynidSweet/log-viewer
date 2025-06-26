# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Universal Log Viewer is a Next.js 15 application that provides a web-based log management system. It allows external applications to send logs via REST API while providing a secure UI for viewing and analyzing them.

## Key Technologies

- **Next.js 15.3.1** with App Router and Turbopack
- **React 19** with TypeScript (strict mode)
- **Vercel KV** for data persistence (Redis-style key-value store)
- **NextAuth.js** for Google OAuth authentication
- **Tailwind CSS v4** with PostCSS
- **shadcn/ui** components built on Radix UI

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
└── lib/                  # Core utilities
    ├── db.ts             # Vercel KV database layer
    └── types.ts          # TypeScript type definitions
```

### Data Flow Patterns

1. **Log Submission**: External systems → POST /api/logs (with API key) → Vercel KV
2. **Log Viewing**: Authenticated user → Fetch logs → Parse client-side → Display
3. **Authentication**: Google OAuth → NextAuth.js → Session-based access

### Key Architectural Decisions

- **Hybrid Security**: UI requires Google auth, API uses project-specific keys
- **Client-Side Parsing**: Raw logs stored, parsed on-demand for flexibility
- **Repository Pattern**: Database operations abstracted in `lib/db.ts`
- **Component State**: Local React state, no global state management

## Database Schema

Vercel KV uses Redis-style operations with these key patterns:
- `project:{id}` - Project metadata (hashes)
- `project:{id}:logs` - Set of log IDs for a project
- `log:{id}` - Individual log entries (hashes)
- `user:{email}:projects` - Set of project IDs owned by a user

## Environment Variables

Required for deployment:
```
# Vercel KV
KV_URL
KV_REST_API_URL
KV_REST_API_TOKEN
KV_REST_API_READ_ONLY_TOKEN

# Authentication
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
NEXTAUTH_SECRET
NEXTAUTH_URL

# Access Control (optional)
ALLOWED_EMAILS    # Comma-separated list
ALLOWED_DOMAINS   # Comma-separated list
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

## Testing

Currently no test framework is configured. When implementing tests, consider:
- Component testing for the log-viewer components
- API route testing for authentication and log submission
- Integration tests for the full log submission/viewing flow