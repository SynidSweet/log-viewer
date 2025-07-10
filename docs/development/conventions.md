# Development Conventions

*Last updated: 2025-07-10 | Added defensive programming patterns for build scripts and property access safety*

## Code Organization

### Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── projects/          # Project-specific pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Atomic UI components (shadcn/ui)
│   ├── log-viewer/       # Complex feature components
│   └── *.tsx             # Shared components
└── lib/                  # Utilities and core logic
    ├── db-turso.ts       # Turso database operations
    ├── turso.ts          # Database client and initialization
    ├── api-error-handler.ts # Centralized error handling
    ├── types.ts          # Type definitions
    └── utils.ts          # Utility functions
```

### File Naming
- **React Components**: PascalCase (`LogViewer.tsx`)
- **API Routes**: `route.ts` (Next.js App Router convention)
- **Utilities**: camelCase (`utils.ts`)
- **Types**: camelCase (`types.ts`)
- **Constants**: UPPER_CASE when applicable

## TypeScript Patterns

### Interface Definitions
```typescript
// Use interfaces for object shapes
interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  apiKey: string;
}

// Use type for unions and computed types
type LogLevel = 'LOG' | 'WARN' | 'ERROR';
type ProjectUpdate = Partial<Pick<Project, 'name' | 'description'>>;
```

### Type Guards
```typescript
function isLogEntry(obj: unknown): obj is LogEntry {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'level' in obj
  );
}
```

### Generic Functions
```typescript
function recordToProject(record: Record<string, unknown>): Project {
  return record as unknown as Project;
}
```

## React Patterns

### Component Structure
```typescript
// components/example-component.tsx
'use client' // Only when needed

import { useState, useEffect, useMemo } from 'react'
import { ComponentProps } from '@/lib/types'

interface ExampleComponentProps {
  data: ComponentProps;
  onAction: (id: string) => void;
}

export function ExampleComponent({ data, onAction }: ExampleComponentProps) {
  // 1. State declarations
  const [loading, setLoading] = useState(false)
  
  // 2. Derived state (memoized)
  const processedData = useMemo(() => {
    return data.filter(item => item.active)
  }, [data])
  
  // 3. Event handlers
  const handleClick = (id: string) => {
    onAction(id)
  }
  
  // 4. Effects
  useEffect(() => {
    // Effect logic
  }, [])
  
  // 5. Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  )
}
```

### State Management
- **Local State**: `useState` for component-specific state
- **Derived State**: `useMemo` for computed values
- **Side Effects**: `useEffect` for external operations
- **No Global State**: Currently no Redux/Zustand usage

### Defensive Programming Patterns
```typescript
// Always validate arrays before setState to prevent .map() crashes
const fetchData = async () => {
  try {
    const response = await fetch('/api/endpoint')
    if (response.ok) {
      const data = await response.json()
      const items = data.success ? data.data : data
      // CRITICAL: Validate array before setting state
      setItems(Array.isArray(items) ? items : [])
    }
  } catch (error) {
    console.error('Failed to fetch data', error)
    setItems([]) // Always set safe fallback
  }
}

// Alternative pattern for complex validation
const handleApiResponse = (response: unknown) => {
  // Validate response structure first
  if (typeof response === 'object' && response !== null) {
    const items = 'data' in response ? response.data : response
    return Array.isArray(items) ? items : []
  }
  return []
}
```

### Memoization Strategy
```typescript
// Expensive computations
const filteredEntries = useMemo(() => {
  return entries.filter(entry => {
    // Complex filtering logic
    return matchesFilter(entry, filters)
  })
}, [entries, filters])

// Callback memoization
const handleSelectEntry = useCallback((index: number) => {
  setSelectedEntryIndex(index)
}, [])
```

## API Design Patterns

### Route Structure
```typescript
// app/api/resource/route.ts
export async function GET(request: NextRequest) {
  // Implementation
}

export async function POST(request: NextRequest) {
  // Implementation
}
```

### Error Handling (Updated Pattern)
```typescript
// Use centralized error handling wrapper
import { withApiErrorHandling } from '@/lib/api-error-handler'

export async function POST(request: NextRequest) {
  return withApiErrorHandling(async () => {
    // Your API logic here
    const result = await operation()
    return result // Wrapper handles success response
  }, 'POST /api/endpoint')
}

// For custom error types
throw new Error('validation: Invalid input data')
throw new Error('not found: Resource not found')
throw new Error('authentication: Invalid credentials')
```

### Validation Pattern
```typescript
function validateInput(data: unknown): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid input' }
  }
  
  return { valid: true }
}
```

## Database Patterns

### Repository Pattern with Resilience
```typescript
// lib/db-turso.ts
import { withDatabaseOperation } from './db-turso'

export async function getProjects(): Promise<Project[]> {
  return withDatabaseOperation(async () => {
    // Database operation with automatic retry
    const result = await turso.execute('SELECT * FROM projects')
    return mapResultsToProjects(result)
  }, 'getProjects')
}

// Database initialization guard
import { ensureDatabaseReady } from './turso'

// Called automatically before each operation
await ensureDatabaseReady()
```

### Type Conversion
```typescript
function recordToProject(record: Record<string, unknown>): Project {
  return record as unknown as Project;
}
```

### Database Error Classification
```typescript
// Structured error types
export interface DatabaseError {
  type: 'connection' | 'initialization' | 'schema' | 'query' | 'validation'
  message: string
  code?: string
  retryable: boolean
  details?: unknown
}

// Error creation helper
export function createDatabaseError(
  type: DatabaseError['type'],
  message: string,
  originalError?: unknown
): DatabaseError
```

## Styling Conventions

### Tailwind CSS Usage
```typescript
// Responsive design
className="w-full md:w-1/2 lg:w-1/3"

// State-based styling
className={`
  px-4 py-2 rounded
  ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-200'}
`}

// Complex conditions
className={clsx(
  'base-classes',
  isActive && 'active-classes',
  hasError && 'error-classes'
)}
```

### Component Styling
```typescript
// shadcn/ui pattern
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
}

const Button = ({ className, variant = 'default', ...props }: ButtonProps) => {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-md font-medium',
        variant === 'default' && 'bg-primary text-white',
        variant === 'outline' && 'border border-gray-300',
        className
      )}
      {...props}
    />
  )
}
```

## Defensive Programming Patterns

### Safe Property Access
**Problem**: Undefined property access errors in build scripts and runtime code
**Solution**: Defensive programming with validation and fallbacks

```javascript
// ❌ Dangerous: Direct property access
console.log(`Tables: ${result.tables.join(', ')}`);

// ✅ Safe: Defensive property access with fallback
function getTableList(result) {
  const defaultTables = ['projects', 'logs', 'migrations'];
  
  // Check if property exists and is an array
  if (result && Array.isArray(result.tables)) {
    return result.tables.join(', ');
  }
  
  // Fallback for expected return value structure
  if (result && result.migrationResults && Array.isArray(result.migrationResults)) {
    return defaultTables.join(', ');
  }
  
  // Safe fallback
  return defaultTables.join(', ');
}
```

### Return Value Contracts
Document function return values with JSDoc to prevent undefined access:

```javascript
/**
 * Initializes database schema during deployment
 * @returns {Object} result - Result object from database initialization
 * @returns {boolean} result.created - Whether schema was newly created
 * @returns {boolean} result.verified - Whether initialization was verified
 * @returns {number} result.migrations - Number of migrations executed
 * @returns {Array} [result.migrationResults] - Optional array of migration results
 */
async function initializeDatabase() {
  // Implementation with documented contract
}
```

### Build Script Reliability
Apply defensive patterns to all build and deployment scripts:

```javascript
// Safe result handling pattern
function reportResults(result, duration) {
  // Validate result object exists and has expected structure
  if (!result || typeof result !== 'object') {
    console.warn('⚠️  Warning: Invalid result object received');
    result = { created: false, verified: false, migrations: 0 };
  }
  
  // Safe property access throughout
  console.log(`Status: ${result.created ? 'Created' : 'Existed'}`);
  console.log(`Tables: ${getTableList(result)}`);
  
  // Optional properties with existence checks
  if (result.migrations && result.migrations > 0) {
    console.log(`Migrations: ${result.migrations}`);
  }
}
```

### Property Validation Utilities
Create reusable validation functions:

```javascript
// Utility for safe array access
function safeArrayJoin(array, separator = ', ', fallback = 'N/A') {
  if (Array.isArray(array) && array.length > 0) {
    return array.join(separator);
  }
  return fallback;
}

// Utility for safe object property access
function safeGet(obj, path, fallback = null) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : fallback;
  }, obj);
}
```

## Error Handling

### Client-Side Errors
```typescript
try {
  const response = await fetch('/api/endpoint')
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`)
  }
  const data = await response.json()
} catch (error) {
  console.error('Operation failed:', error)
  toast.error('Failed to load data')
}
```

### Server-Side Errors (Updated Pattern)
```typescript
// Standardized API response format
export interface ApiErrorResponse {
  error: string
  message: string
  type: string
  retryable?: boolean
  timestamp: string
  statusCode: number
}

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  timestamp: string
}

// Health check pattern
export async function GET() {
  return withApiErrorHandling(async () => {
    const health = await checkDatabaseHealth()
    return {
      status: health.healthy ? 'healthy' : 'unhealthy',
      database: 'connected',
      details: health.details
    }
  }, 'GET /api/health')
}
```

## Testing Patterns

### Component Testing (when implemented)
```typescript
// components/__tests__/LogViewer.test.tsx
import { render, screen } from '@testing-library/react'
import { LogViewer } from '../LogViewer'

describe('LogViewer', () => {
  it('renders log entries', () => {
    render(<LogViewer projectId="test" />)
    expect(screen.getByText('Loading logs...')).toBeInTheDocument()
  })
})
```

### API Testing (when implemented)
```typescript
// app/api/__tests__/logs.test.ts
import { POST } from '../logs/route'

describe('/api/logs', () => {
  it('creates log entry', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'test',
        content: '[2025-01-01, 12:00:00] [LOG] Test message'
      })
    })
    
    const response = await POST(request)
    expect(response.status).toBe(201)
  })
})
```

## Performance Patterns

### Client-Side Optimization
```typescript
// Memoization for expensive operations
const parsedEntries = useMemo(() => {
  return parseLogContent(logContent)
}, [logContent])

// Caching to avoid repeated fetches
const logCache: Record<string, string> = {}
```

### Server-Side Optimization
```typescript
// Batch operations
const projects = await Promise.all(
  projectIds.map(id => getProject(id))
)

// Lazy database initialization
let isInitialized = false
let initializationPromise: Promise<void> | null = null

export async function ensureDatabaseReady(): Promise<void> {
  if (isInitialized) return
  if (initializationPromise) {
    await initializationPromise
    return
  }
  initializationPromise = initializeWithRetry()
  await initializationPromise
}

// Connection pooling and retry
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY_MS = 1000
```

## Security Patterns

### API Security
```typescript
// API key validation
const project = await getProject(projectId)
if (!project || project.apiKey !== apiKey) {
  return NextResponse.json(
    { error: 'Invalid API key' },
    { status: 403 }
  )
}
```

### Input Validation
```typescript
// Strict format validation
const LOG_PATTERN = /^\[\d{4}-\d{2}-\d{2}, \d{2}:\d{2}:\d{2}\] \[(LOG|ERROR|INFO|WARN|DEBUG)\] .+( - .+)?$/

function validateLogFormat(content: string): ValidationResult {
  const lines = content.trim().split('\n')
  for (const line of lines) {
    if (!LOG_PATTERN.test(line)) {
      return { valid: false, error: `Invalid format: ${line}` }
    }
  }
  return { valid: true }
}
```

These conventions ensure consistent code quality and maintainability across the project.