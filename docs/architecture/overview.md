# Architecture Overview

*Last updated: 2025-07-18 | Replaced lucide-react with optimized inline SVG icons, reducing bundle size by 48.66 MB*

## System Architecture

### High-Level Design

The Universal Log Viewer implements a **hybrid security model** with public API access for log submission and authenticated UI access for log viewing. The system uses a **three-tier architecture**:

1. **Presentation Layer**: React 19 components with Next.js 15 App Router
2. **API Layer**: REST endpoints with middleware authentication
3. **Data Layer**: Turso SQLite with relational schema and resilience wrappers

### Technology Stack

#### Core Framework
- **Next.js 15.3.1**: React framework with App Router and Turbopack
- **React 19**: UI library with concurrent features
- **TypeScript**: Strict type checking enabled
- **Turso SQLite**: Distributed SQLite database with global edge hosting

#### UI & Styling
- **Tailwind CSS v4**: Utility-first styling with PostCSS
- **shadcn/ui**: Component library built on Radix UI primitives with Badge component for tags
- **Radix UI**: Accessible component primitives
- **Optimized Icons**: Custom inline SVG components (~15 KB, replaced lucide-react 48.66 MB)
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
All database operations are abstracted through `/src/lib/db-turso.ts`:
- Centralized data access layer
- Type-safe operations with TypeScript interfaces
- Consistent error handling and validation via withDatabaseOperation wrapper
- Abstraction over Turso SQLite operations
- **Performance optimizations**: Query result caching, batch operations, and connection monitoring

#### Performance Architecture
- **Query Caching**: Intelligent caching for frequently accessed read operations (30-second TTL)
- **Batch Operations**: Reduced database round trips through `executeBatch()` functionality
- **Connection Optimization**: Performance metrics tracking and connection warmup capabilities
- **Monitoring**: Real-time database performance metrics and health checks

#### Component Architecture
- **Atomic Design**: UI components organized by complexity
- **Composition Pattern**: Complex components built from simpler ones  
- **Modular Extraction**: Large components broken down for maintainability
  - **LogViewer**: Reduced from 762 lines to 400 lines (47.5% reduction)
  - **LogEntryFilters**: Extracted 289-line component for filtering UI
  - **useLogOperations**: Extracted 173-line hook for API operations
- **Memoization**: Performance optimization for heavy operations
  - **Date Formatting**: LogEntryList uses `useMemo` to cache formatted timestamps, preventing re-computation on every render
  - **Component Memoization**: LogEntryList and LogItem use React.memo for optimized rendering
- **Custom Hooks**: Separation of concerns with reusable logic extraction
- **Client-Side State**: Local React state without global state management

#### API Design
- **REST Conventions**: Standard HTTP methods and status codes
- **Resource-Based**: Clear resource hierarchy `/api/projects/{id}/logs`
- **Validation Layer**: Input validation at API boundaries
- **Error Handling**: Centralized error handling via `withApiErrorHandling` wrapper
- **Structured Responses**: Consistent `ApiErrorResponse` format with retryability flags

### Data Flow Architecture

#### Log Submission Flow
```
External System → POST /api/logs → Validation → Turso SQLite → Response
```

1. **Request Validation**: Project ID, API key, and log format validation
2. **Authentication**: Project-specific API key verification
3. **Data Processing**: Multi-line log parsing and storage
4. **Persistence**: Atomic operations to Turso SQLite with retry logic
5. **Response**: Success confirmation with log ID and timestamp

#### Log Viewing Flow
```
User → Authentication → UI → API → Turso SQLite → Client-Side Parsing → Display
```

1. **Authentication**: Google OAuth session validation
2. **Data Fetching**: Authenticated API calls for log data
3. **Client-Side Processing**: Log parsing with _tags field extraction and filtering in browser
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
- **Secure Storage**: Turso SQLite provides encrypted data at rest

### Component Architecture

#### Three-Column Layout
```
Projects List (1/5) | Log Entries (1/5) | Log Details (3/5)
```

**Projects List**: Project selection and search
**Log Entries**: Individual log submissions with filtering
**Log Details**: Parsed log content with syntax highlighting

#### Key Components
- **LogViewer**: Main orchestration component (400 lines) with sort state management and component composition
- **LogEntryFilters**: Extracted filtering UI component (289 lines) with tag management, copy operations, and level controls
- **LogEntryList**: Virtualized list for performance with timestamp sorting and tags display
- **LogEntryDetails**: Detailed view with JSON tree rendering
- **useLogOperations**: Custom hook (173 lines) managing all log API operations (fetch, cache, mark as read, delete)
- **Project Management**: CRUD operations for projects
- **Badge**: Atomic UI component for tag visualization with overflow handling

#### UI Features
- **Sort Control**: Toggle button for ascending/descending timestamp order
- **Keyboard Shortcuts**: Press 's' to toggle sort order (disabled when input focused)
- **Visual Indicators**: Arrow icons (ArrowUp/ArrowDown) show current sort direction
- **Session Persistence**: Sort preference maintained during user session
- **Responsive Layout**: Sort controls integrated into column headers
- **Tags Display**: Visual badges in log entries with overflow handling (show first 2 + count)
- **Accessibility**: Keyboard navigation support for power users

### Performance Optimizations

#### Client-Side Optimizations
- **Memoization**: `React.useMemo` for expensive filtering and sorting operations
- **Caching**: Client-side log content cache
- **Lazy Loading**: Content loaded on demand
- **Debounced Search**: Search input debouncing
- **Efficient Sorting**: Timestamp-based sorting with minimal recalculation

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
- **Turso Database**: SQLite operations with global edge hosting and resilience wrappers
- **Middleware**: Authentication and routing logic
- **Error Handler**: Centralized API error management

### Error Handling Architecture

#### Centralized Error Management
The system uses a unified error handling pattern across all API endpoints (except NextAuth handlers):

```typescript
// All API endpoints wrapped with error handling
export async function POST(request: NextRequest) {
  return withApiErrorHandling(async () => {
    // API logic here
  }, 'POST /api/endpoint')
}
```

#### Error Response Structure
```typescript
interface ApiErrorResponse {
  error: string          // Error type classification
  message: string        // Human-readable error message
  type: string          // Error category
  retryable?: boolean   // Whether client should retry
  timestamp: string     // ISO timestamp
  statusCode: number    // HTTP status code
}
```

#### Error Classification
- **Database Errors**: Connection, initialization, query failures
- **Validation Errors**: Input validation and format issues
- **Authentication Errors**: Invalid credentials or permissions
- **Not Found Errors**: Resource not found
- **Rate Limit Errors**: Too many requests
- **Unknown Errors**: Unclassified errors with stack traces (dev only)

### Deployment Architecture

#### Vercel Platform
- **Serverless Functions**: API routes deployed as functions
- **Edge Network**: Global CDN for static assets
- **Environment Management**: Secure configuration handling

#### Environment Variables
- **Turso Database**: Database connection and authentication
- **Google OAuth**: Client ID and secret configuration
- **NextAuth**: Session management and security
- **Access Control**: Optional user restrictions

### Scalability Considerations

#### Current Limitations
- **Single Database**: Turso SQLite as single point of storage
- **Client-Side Parsing**: Enhanced processing in browser including tags extraction
- **No Pagination**: Full log loading (manageable for typical use cases)

#### Future Scalability
- **Database Sharding**: Project-based data distribution
- **Server-Side Parsing**: Move processing to API layer
- **Caching Layer**: Redis caching for frequently accessed data
- **Real-Time Features**: WebSocket support for live log streaming

This architecture provides a solid foundation for log management with clear separation of concerns and robust security model.

## Related Documentation

- [Error Handling Architecture](./error-handling.md) - Detailed guide to API error handling
- [Data Models](./data-models.md) - Database schema and type definitions