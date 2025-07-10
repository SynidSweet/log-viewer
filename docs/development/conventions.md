# Development Conventions

*Last updated: 2025-07-10 | Code standards and patterns used in the project*

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
    ├── db.ts             # Database operations
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

### Error Handling
```typescript
try {
  const result = await operation()
  return NextResponse.json(result)
} catch (error) {
  console.error('Operation failed:', error)
  return NextResponse.json(
    { error: 'Operation failed' },
    { status: 500 }
  )
}
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

### Repository Pattern
```typescript
// lib/db.ts
export async function getProjects(): Promise<Project[]> {
  // Implementation details abstracted
}

export async function createProject(name: string, description: string): Promise<Project> {
  // Validation and creation logic
}
```

### Type Conversion
```typescript
function recordToProject(record: Record<string, unknown>): Project {
  return record as unknown as Project;
}
```

### Error Handling
```typescript
export async function getProject(id: string): Promise<Project | null> {
  const record = await kv.hgetall(`project:${id}`);
  return record ? recordToProject(record) : null;
}
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

### Server-Side Errors
```typescript
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    // Process data
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
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

// Efficient database queries
const logIds = await kv.smembers(`project:${projectId}:logs`)
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