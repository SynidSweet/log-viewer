# Architecture Overview

*Last updated: 2025-07-10 | Comprehensive system architecture documentation*

## System Architecture

### High-Level Design

The Universal Log Viewer implements a **hybrid security model** with public API access for log submission and authenticated UI access for log viewing. The system uses a **three-tier architecture**:

1. **Presentation Layer**: React 19 components with Next.js 15 App Router
2. **API Layer**: REST endpoints with middleware authentication
3. **Data Layer**: Vercel KV (Redis) with structured key patterns

### Technology Stack

#### Core Framework
- **Next.js 15.3.1**: React framework with App Router and Turbopack
- **React 19**: UI library with concurrent features
- **TypeScript**: Strict type checking enabled
- **Vercel KV**: Redis-compatible key-value store for persistence

#### UI & Styling
- **Tailwind CSS v4**: Utility-first styling with PostCSS
- **shadcn/ui**: Component library built on Radix UI primitives
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Sonner**: Toast notifications

#### Authentication & Security
- **NextAuth.js v4**: Google OAuth integration
- **Middleware**: Route protection and authentication routing
- **API Key Authentication**: Project-specific keys for log submission

#### Development Tools
- **ESLint**: Code linting with Next.js configuration
- **Husky**: Git hooks for pre-commit validation
- **lint-staged**: Staged file linting

### Architectural Patterns

#### Repository Pattern
All database operations are abstracted through `/src/lib/db.ts`:
- Centralized data access layer
- Type-safe operations with TypeScript interfaces
- Consistent error handling and validation
- Abstraction over Vercel KV operations

#### Component Architecture
- **Atomic Design**: UI components organized by complexity
- **Composition Pattern**: Complex components built from simpler ones
- **Memoization**: Performance optimization for heavy operations
- **Client-Side State**: Local React state without global state management

#### API Design
- **REST Conventions**: Standard HTTP methods and status codes
- **Resource-Based**: Clear resource hierarchy `/api/projects/{id}/logs`
- **Validation Layer**: Input validation at API boundaries
- **Error Handling**: Consistent error responses with proper HTTP codes

### Data Flow Architecture

#### Log Submission Flow
```
External System → POST /api/logs → Validation → Vercel KV → Response
```

1. **Request Validation**: Project ID, API key, and log format validation
2. **Authentication**: Project-specific API key verification
3. **Data Processing**: Multi-line log parsing and storage
4. **Persistence**: Atomic operations to Vercel KV
5. **Response**: Success confirmation with log ID and timestamp

#### Log Viewing Flow
```
User → Authentication → UI → API → Vercel KV → Client-Side Parsing → Display
```

1. **Authentication**: Google OAuth session validation
2. **Data Fetching**: Authenticated API calls for log data
3. **Client-Side Processing**: Log parsing and filtering in browser
4. **Caching**: Client-side content caching to avoid re-fetching
5. **Real-Time Updates**: Read status updates and log management

### Security Architecture

#### Dual Authentication Model
- **Public API**: Project-specific API keys for external log submission
- **Protected UI**: Google OAuth for human users viewing logs
- **Middleware Protection**: Route-level authentication enforcement

#### Access Control
- **Project Isolation**: Each project has separate API key and log storage
- **User Restrictions**: Optional email domain/address filtering
- **API Rate Limiting**: Handled at Vercel platform level

#### Data Protection
- **Environment Variables**: Sensitive configuration stored securely
- **No Secret Logging**: System designed to prevent secret exposure
- **Secure Storage**: Vercel KV provides encrypted data at rest

### Component Architecture

#### Three-Column Layout
```
Projects List (1/5) | Log Entries (1/5) | Log Details (3/5)
```

**Projects List**: Project selection and search
**Log Entries**: Individual log submissions with filtering
**Log Details**: Parsed log content with syntax highlighting

#### Key Components
- **LogViewer**: Main orchestration component
- **LogEntryList**: Virtualized list for performance
- **LogEntryDetails**: Detailed view with JSON tree rendering
- **Project Management**: CRUD operations for projects

### Performance Optimizations

#### Client-Side Optimizations
- **Memoization**: `React.useMemo` for expensive filtering operations
- **Caching**: Client-side log content cache
- **Lazy Loading**: Content loaded on demand
- **Debounced Search**: Search input debouncing

#### Server-Side Optimizations
- **Turbopack**: Fast development builds
- **Static Generation**: Where applicable with Next.js
- **Edge Runtime**: Middleware runs on Vercel Edge

### Integration Points

#### External Systems
- **Log Submission**: HTTP POST to `/api/logs` endpoint
- **Multi-line Support**: Single request can contain multiple log entries
- **Flexible Format**: Strict validation with optional data section

#### Internal Systems
- **NextAuth.js**: Google OAuth provider configuration
- **Vercel KV**: Redis-compatible data operations
- **Middleware**: Authentication and routing logic

### Deployment Architecture

#### Vercel Platform
- **Serverless Functions**: API routes deployed as functions
- **Edge Network**: Global CDN for static assets
- **Environment Management**: Secure configuration handling

#### Environment Variables
- **Vercel KV**: Database connection and authentication
- **Google OAuth**: Client ID and secret configuration
- **NextAuth**: Session management and security
- **Access Control**: Optional user restrictions

### Scalability Considerations

#### Current Limitations
- **Single Database**: Vercel KV as single point of storage
- **Client-Side Parsing**: Heavy processing in browser
- **No Pagination**: Full log loading (manageable for typical use cases)

#### Future Scalability
- **Database Sharding**: Project-based data distribution
- **Server-Side Parsing**: Move processing to API layer
- **Caching Layer**: Redis caching for frequently accessed data
- **Real-Time Features**: WebSocket support for live log streaming

This architecture provides a solid foundation for log management with clear separation of concerns and robust security model.