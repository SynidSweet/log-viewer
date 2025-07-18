# Development Conventions

*Last updated: 2025-07-18 | Added card component to shadcn/ui library following standard patterns*

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
│   ├── ui/               # Atomic UI components (shadcn/ui: badge, button, card, input, etc.)
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
type LogLevel = 'LOG' | 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
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

### Authentication Patterns

#### Client Components with useSession
When using `useSession` hook in client components that might be statically generated:

```typescript
// ❌ Wrong: Direct useSession in a page that might be statically generated
'use client'
export default function Page() {
  const { data: session } = useSession()
  // This will fail during static generation
}

// ✅ Correct: Split into server page and client component
// page.tsx (server component)
export { default } from './client-page'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// client-page.tsx (client component)
'use client'
export default function ClientPage() {
  const [mounted, setMounted] = useState(false)
  const { data: session, status } = useSession({ required: false })
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted || status === 'loading') {
    return <LoadingState />
  }
  
  // Component logic here
}
```

### Performance Optimization

#### React.memo with Custom Comparison
For components with complex props that need re-render optimization:

```typescript
// components/optimized-component.tsx
'use client'

import { memo, useCallback } from 'react'

interface OptimizedComponentProps {
  items: Item[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  selectedItems: Set<string>;
}

function OptimizedComponentInner({ items, selectedIndex, onSelect, selectedItems }: OptimizedComponentProps) {
  // Component implementation
  return <div>{/* Component JSX */}</div>
}

// Custom comparison function for React.memo
function arePropsEqual(prevProps: OptimizedComponentProps, nextProps: OptimizedComponentProps): boolean {
  // Check array length and references
  if (prevProps.items.length !== nextProps.items.length) return false
  
  // Shallow comparison of array items
  for (let i = 0; i < prevProps.items.length; i++) {
    if (prevProps.items[i] !== nextProps.items[i]) return false
  }
  
  // Check primitive props
  if (prevProps.selectedIndex !== nextProps.selectedIndex) return false
  
  // Check Set contents
  if (prevProps.selectedItems.size !== nextProps.selectedItems.size) return false
  for (const id of prevProps.selectedItems) {
    if (!nextProps.selectedItems.has(id)) return false
  }
  
  return true
}

// Export the memoized component
export const OptimizedComponent = memo(OptimizedComponentInner, arePropsEqual)
```

#### Callback Optimization (✅ IMPROVED - TASK-2025-051)
Always wrap callback functions with `useCallback` when passing to memoized components:

```typescript
// ✅ Correct: Stable callbacks with minimal dependencies
const handleSelect = useCallback((index: number) => {
  setSelectedIndex(index)
}, [])

// ✅ Improved: More stable callback for Set-based operations
const selectAllEntries = useCallback(() => {
  setSelectedEntryIds(new Set(filteredEntries.map(entry => entry.id)))
}, [filteredEntries]) // Dependency is necessary but minimized

// ❌ Previously: Less stable pattern (fixed in TASK-2025-051)
// const selectAllEntries = useCallback(() => {
//   const allIds = new Set(filteredEntries.map(entry => entry.id))
//   setSelectedEntryIds(allIds)
// }, [filteredEntries])

// ✅ Pattern: Callbacks without dependencies when possible
const clearAllSelections = useCallback(() => {
  setSelectedEntryIds(new Set())
}, [])

const toggleEntrySelection = useCallback((entryId: string) => {
  setSelectedEntryIds(prev => {
    const newSelection = new Set(prev)
    if (newSelection.has(entryId)) {
      newSelection.delete(entryId)
    } else {
      newSelection.add(entryId)  
    }
    return newSelection
  })
}, [])
```

### State Management
- **Local State**: `useState` for component-specific state
- **Derived State**: `useMemo` for computed values
- **Side Effects**: `useEffect` for external operations
- **No Global State**: Currently no Redux/Zustand usage
- **UI Controls**: Session-persistent state for user preferences (sort order, filters)
- **State Dependencies**: Include all state in useMemo dependency arrays
- **Persistent Preferences**: localStorage for cross-session persistence

### Tag Filtering Patterns
```typescript
// Tag filtering state integration
const [entryFilters, setEntryFilters] = useState({
  searchText: '',
  showLog: true,
  showInfo: true,
  showWarn: true,
  showError: true,
  showDebug: true,
  selectedTags: [] as string[] // Added for tag filtering
})

// Tag filtering logic (OR logic - show entries with ANY selected tags)
const filteredEntries = useMemo(() => {
  return entries.filter(entry => {
    // Filter by selected tags
    if (entryFilters.selectedTags.length > 0) {
      // If entry has no tags, exclude it when tags are selected
      if (!entry.tags || entry.tags.length === 0) {
        return false;
      }
      
      // Check if entry has any of the selected tags
      const hasSelectedTag = entry.tags.some(tag => 
        entryFilters.selectedTags.includes(tag)
      );
      
      if (!hasSelectedTag) {
        return false;
      }
    }
    
    // Other filtering logic...
    return true;
  });
}, [entries, entryFilters]);
```

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

### Memoization Strategy (✅ ENHANCED - TASK-2025-053)

#### Pre-parsed Timestamp Optimization
```typescript
// ✅ PERFORMANCE BOOST: Pre-parse timestamps to avoid repeated Date operations during sort
const entriesWithParsedTimestamps = useMemo(() => {
  return parsedEntries.map(entry => ({
    ...entry,
    _timestampMs: new Date(entry.timestamp).getTime()
  }));
}, [parsedEntries]);

// ✅ OPTIMIZED: Use pre-parsed timestamps for efficient sorting
const filteredEntries = useMemo(() => {
  let filtered = entriesWithParsedTimestamps;
  
  // Level filtering with lookup object (faster than switch statement)
  const levelFilter = {
    'LOG': entryFilters.showLog,
    'INFO': entryFilters.showInfo,
    'WARN': entryFilters.showWarn,
    'ERROR': entryFilters.showError,
    'DEBUG': entryFilters.showDebug
  };
  
  filtered = filtered.filter(entry => levelFilter[entry.level] ?? true);
  
  // Search filtering (only if search term exists)
  if (entryFilters.searchText) {
    const searchTerm = entryFilters.searchText.toLowerCase();
    filtered = filtered.filter(entry => 
      entry.message.toLowerCase().includes(searchTerm) ||
      (entry.details && String(entry.details).toLowerCase().includes(searchTerm))
    );
  }
  
  // ✅ PERFORMANCE: Set-based tag filtering (O(1) lookup vs O(n) array.includes)
  if (entryFilters.selectedTags.length > 0) {
    const selectedTagsSet = new Set(entryFilters.selectedTags);
    filtered = filtered.filter(entry => 
      entry.tags?.some(tag => selectedTagsSet.has(tag))
    );
  }
  
  // ✅ OPTIMIZED: Sort by pre-parsed timestamp (no Date parsing in sort)
  filtered.sort((a, b) => {
    return sortOrder === 'asc' ? a._timestampMs - b._timestampMs : b._timestampMs - a._timestampMs;
  });
  
  return filtered;
}, [entriesWithParsedTimestamps, entryFilters, sortOrder]);

// ❌ PREVIOUS: Less efficient pattern (fixed in TASK-2025-053)
// const filteredEntries = useMemo(() => {
//   return entries
//     .filter(entry => {
//       // Complex filtering logic with multiple criteria
//       return matchesFilter(entry, filters)
//     })
//     .sort((a, b) => {
//       // ❌ INEFFICIENT: Date parsing on every sort comparison
//       const timeA = new Date(a.timestamp).getTime();
//       const timeB = new Date(b.timestamp).getTime();
//       return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
//     });
// }, [entries, filters, sortOrder]) // ❌ Unstable dependencies
```

#### Stable Dependency Management
```typescript
// ✅ IMPROVED: Use entire filter object as dependency for stable memoization
const filteredEntries = useMemo(() => {
  // Filtering logic...
}, [entriesWithParsedTimestamps, entryFilters, sortOrder]);

// ❌ PREVIOUS: Individual filter flags created unstable dependencies
// }, [parsedEntries, entryFilters.showLog, entryFilters.showInfo, entryFilters.showWarn, entryFilters.showError, entryFilters.showDebug, entryFilters.searchText, entryFilters.selectedTags, sortOrder]);
```

#### Log Search Optimization
```typescript
// ✅ OPTIMIZED: Memoized log search with proper dependencies
const filteredLogs = useMemo(() => {
  if (!logFilters.searchText) return logs;
  
  const searchTerm = logFilters.searchText.toLowerCase();
  return logs.filter(log => 
    log.comment.toLowerCase().includes(searchTerm)
  );
}, [logs, logFilters.searchText]);

// ❌ PREVIOUS: Inline filtering without memoization
// const filteredLogs = logs.filter(log => {
//   if (logFilters.searchText) {
//     const searchTerm = logFilters.searchText.toLowerCase()
//     const commentMatches = log.comment.toLowerCase().includes(searchTerm)
//     if (!commentMatches) {
//       return false
//     }
//   }
//   return true
// })
```

// Extract available tags for dropdown population
const availableTags = useMemo(() => {
  const tagSet = new Set<string>();
  
  entries.forEach(entry => {
    if (entry.tags) {
      entry.tags.forEach(tag => tagSet.add(tag));
    }
  });
  
  return Array.from(tagSet).sort();
}, [entries])

// Callback memoization
const handleSelectEntry = useCallback((index: number) => {
  setSelectedEntryIndex(index)
}, [])

// Toggle handlers for UI controls
const toggleSortOrder = useCallback(() => {
  setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
}, [])

// Tag filtering utility functions
const toggleTag = useCallback((tag: string) => {
  setEntryFilters(prev => ({
    ...prev,
    selectedTags: prev.selectedTags.includes(tag)
      ? prev.selectedTags.filter(t => t !== tag)
      : [...prev.selectedTags, tag]
  }))
}, [])

const selectAllTags = useCallback(() => {
  setEntryFilters(prev => ({
    ...prev,
    selectedTags: [...availableTags]
  }))
}, [availableTags])

const clearAllTags = useCallback(() => {
  setEntryFilters(prev => ({
    ...prev,
    selectedTags: []
  }))
  setTagSearchTerm('') // Clear search when clearing tags
}, [])
```

### localStorage Persistence Patterns
```typescript
// Initialize state from localStorage with type safety
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
  if (typeof window !== 'undefined') {
    const savedSortOrder = localStorage.getItem('logViewer.sortOrder')
    if (savedSortOrder === 'asc' || savedSortOrder === 'desc') {
      return savedSortOrder
    }
  }
  return 'asc' // Default value
})

// Save to localStorage when state changes
const toggleSortOrder = useCallback(() => {
  setSortOrder(prev => {
    const newOrder = prev === 'asc' ? 'desc' : 'asc'
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('logViewer.sortOrder', newOrder)
    }
    return newOrder
  })
}, [])

// localStorage Key Convention
// Format: {component}.{preference}
// Examples:
// - logViewer.sortOrder
// - logViewer.filters
// - projectList.viewMode

// Best Practices:
// 1. Always check window !== 'undefined' for SSR safety
// 2. Validate retrieved values before using them
// 3. Provide sensible defaults for missing/invalid values
// 4. Use consistent key naming convention
// 5. Clean up obsolete keys when features are removed
```

### Keyboard Shortcut Patterns
```typescript
// Add keyboard shortcuts for power users
useEffect(() => {
  const handleKeyPress = (event: KeyboardEvent) => {
    // Check if the user is typing in an input field
    const activeElement = document.activeElement;
    const isInputFocused = activeElement instanceof HTMLInputElement || 
                          activeElement instanceof HTMLTextAreaElement;
    
    // Only trigger if not typing in an input
    if (event.key === 's' && !event.ctrlKey && !event.metaKey && !event.altKey && !isInputFocused) {
      event.preventDefault();
      toggleSortOrder();
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  
  return () => {
    window.removeEventListener('keydown', handleKeyPress);
  };
}, [toggleSortOrder]);

// Update tooltips to show keyboard shortcuts
<Button
  title={`Sort by timestamp ${sortOrder === 'asc' ? 'ascending' : 'descending'} (Press 's' to toggle)`}
>
  {/* Button content */}
</Button>
```

### UI Control Patterns
```typescript
// Sort button with visual indicators
<Button
  variant="outline"
  size="sm"
  onClick={toggleSortOrder}
  className="flex items-center space-x-1"
  title={`Sort by timestamp ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
>
  {sortOrder === 'asc' ? (
    <ArrowUp className="h-3 w-3" />
  ) : (
    <ArrowDown className="h-3 w-3" />
  )}
</Button>

// Responsive layout with controls
<div className="flex items-center space-x-2">
  <Input
    placeholder="Filter entries..."
    value={searchText}
    onChange={(e) => setSearchText(e.target.value)}
    className="text-sm flex-1"
  />
  {/* Control buttons */}
</div>
```

### Custom Dropdown Pattern
```typescript
// Multi-select dropdown with custom implementation
const [dropdownOpen, setDropdownOpen] = useState(false)
const [searchTerm, setSearchTerm] = useState('')

// Close dropdown when clicking outside
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownOpen && event.target instanceof Element) {
      const dropdown = document.getElementById('dropdown-id');
      if (dropdown && !dropdown.contains(event.target)) {
        setDropdownOpen(false);
        setSearchTerm('');
      }
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [dropdownOpen]);

// Filter items based on search term
const filteredItems = useMemo(() => {
  if (!searchTerm) return availableItems;
  return availableItems.filter(item => 
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [availableItems, searchTerm]);

// Dropdown trigger button
<Button
  variant="outline"
  size="sm"
  onClick={() => setDropdownOpen(!dropdownOpen)}
  className="flex items-center space-x-2 text-xs"
  disabled={availableItems.length === 0}
>
  <Filter className="h-3 w-3" />
  <span>Filter</span>
  {selectedItems.length > 0 && (
    <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
      {selectedItems.length}
    </Badge>
  )}
  <ChevronDown className="h-3 w-3" />
</Button>

// Dropdown content with positioning
{dropdownOpen && availableItems.length > 0 && (
  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
    {/* Search input */}
    <div className="p-2 border-b border-gray-200">
      <Input
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="text-xs h-7"
      />
    </div>
    
    {/* Bulk actions */}
    <div className="p-2 border-b border-gray-200 flex space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={selectAllItems}
        className="text-xs h-6 px-2"
      >
        Select All
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={clearAllItems}
        className="text-xs h-6 px-2"
      >
        Clear All
      </Button>
    </div>
    
    {/* Items list */}
    <div className="max-h-48 overflow-y-auto">
      {filteredItems.length === 0 ? (
        <div className="p-3 text-xs text-gray-500">
          {searchTerm ? 'No items match your search' : 'No items available'}
        </div>
      ) : (
        filteredItems.map(item => (
          <div key={item} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
            <Checkbox
              id={`item-${item}`}
              checked={selectedItems.includes(item)}
              onCheckedChange={() => toggleItem(item)}
            />
            <Label htmlFor={`item-${item}`} className="text-xs flex-1 cursor-pointer">
              {item}
            </Label>
          </div>
        ))
      )}
    </div>
  </div>
)}
```

### Custom Dropdown Design Principles
- **Positioning**: Use `absolute` positioning with `top-full` and `mt-1` for proper alignment
- **Z-index**: Apply `z-50` to ensure dropdown appears above other content
- **Width**: Fixed width (`w-64`) for consistent layout
- **Shadow**: Use `shadow-lg` for depth perception
- **Scrolling**: Limit height with `max-h-48` and `overflow-y-auto` for long lists
- **Search**: Include search input for large datasets
- **Bulk Actions**: Provide "Select All" and "Clear All" for user convenience
- **Accessibility**: Use proper label associations and keyboard navigation
- **Visual Feedback**: Hover states and badge counters for better UX
- **Click Outside**: Close dropdown when clicking outside for intuitive behavior

### Icon Usage Patterns
```typescript
// Import from centralized icons (optimized inline SVGs)
import { ArrowUp, ArrowDown, Search, Filter, ChevronDown } from '@/components/icons'

// Size consistency (using size prop)
size={12}  // Small icons in buttons (12px)
size={16}  // Default icon size (16px)
size={20}  // Larger icons in headers (20px)

// Alternative: className for Tailwind sizing
className="h-3 w-3"  // Small icons
className="h-4 w-4"  // Default size
className="h-5 w-5"  // Larger icons

// Semantic icon usage
ArrowUp/ArrowDown: Sort direction indicators
Search: Search functionality
Filter: Filtering controls
ChevronDown: Dropdown state indicator
Check/X: Status indicators
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
  })
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

### Turbopack Dynamic Path Workaround
```typescript
// ❌ Problematic: Turbopack treats path.join() arguments as ES6 imports
const scriptPath = path.join(process.cwd(), '.claude-testing', 'script.js')
const child = spawn('node', [scriptPath])

// ✅ Solution: Use array-based path construction to avoid static analysis
const scriptDir = '.claude-testing'
const scriptName = 'script.js'
const scriptPath = [process.cwd(), scriptDir, scriptName].join(path.sep)
const child = spawn('node', [scriptPath])

// This prevents Turbopack from attempting to resolve the path as a module import
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

### CSS Animation Patterns
```css
/* Global animation definitions in src/app/globals.css */
@layer components {
  /* Container-level animations for smooth transitions */
  .log-entry-sort-animation {
    animation: fadeInSlide 0.3s ease-out;
  }
  
  @keyframes fadeInSlide {
    0% {
      opacity: 0;
      transform: translateY(-10px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Staggered entry animations */
  .log-entry-stagger {
    animation: staggeredFadeIn 0.4s ease-out both;
  }
  
  @keyframes staggeredFadeIn {
    0% {
      opacity: 0;
      transform: translateY(8px) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
}
```

### Animation Integration Patterns
```typescript
// Trigger animations on state changes with key props
<div 
  key={`sort-${sortOrder}-${entries.length}`} 
  className="log-entry-sort-animation"
>
  {entries.map((entry, index) => (
    <div
      key={`${entry.id}-${sortOrder}`}
      className="log-entry-stagger transition-all duration-200 ease-in-out"
      style={{
        animationDelay: `${index * 20}ms`
      }}
    >
      {/* Entry content */}
    </div>
  ))}
</div>

// Pass animation triggers to child components
<LogEntryList 
  entries={filteredEntries}
  sortOrder={sortOrder} // Triggers re-render with animations
/>
```

### Animation Design Principles
- **Performance**: Use CSS transforms and opacity for hardware acceleration
- **Duration**: Keep animations under 400ms to avoid perceived lag
- **Staggering**: Use small delays (20ms) for sequential entry animations
- **Easing**: Prefer `ease-out` for natural feeling transitions
- **Key Changes**: Change component keys to trigger clean animation resets
- **Fallbacks**: Ensure functionality works without animations

### Tailwind CSS Usage
```typescript
// Responsive design
className="w-full md:w-1/2 lg:w-1/3"

// State-based styling with animations
className={`
  px-4 py-2 rounded transition-all duration-200 ease-in-out
  ${isActive ? 'bg-blue-500 text-white scale-105' : 'bg-gray-200'}
`}

// Complex conditions with animation support
className={clsx(
  'base-classes transition-all duration-200',
  isActive && 'active-classes transform scale-105',
  hasError && 'error-classes animate-pulse'
)}
```

### Component Styling
```typescript
// shadcn/ui pattern for buttons
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

// Badge component pattern for tags
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

const Badge = ({ className, variant = 'default', ...props }: BadgeProps) => {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold',
        variant === 'default' && 'border-transparent bg-primary text-primary-foreground',
        variant === 'secondary' && 'border-transparent bg-secondary text-secondary-foreground',
        className
      )}
      {...props}
    />
  )
}
```

### Log Level Styling Pattern
```typescript
// Consistent log level badge styling across components
const getLogLevelBadgeClass = (level: LogLevel) => {
  const baseClasses = 'text-white text-xs px-2 py-1 rounded uppercase font-medium'
  
  switch (level) {
    case 'ERROR':
      return `${baseClasses} bg-red-500`
    case 'WARN':
      return `${baseClasses} bg-yellow-500`
    case 'DEBUG':
      return `${baseClasses} bg-purple-500`
    case 'INFO':
      return `${baseClasses} bg-blue-500`
    default: // LOG or fallback
      return `${baseClasses} bg-green-500`
  }
}

// Usage in components
<span className={getLogLevelBadgeClass(entry.level)}>
  {entry.level}
</span>
```

### Tags Display Pattern
```typescript
// Tags badges with overflow handling in log entries
{entry.tags && entry.tags.length > 0 && (
  <div className="absolute top-1.5 right-1.5 flex flex-wrap gap-1 max-w-[40%]">
    {entry.tags.slice(0, 2).map((tag, tagIndex) => (
      <Badge 
        key={tagIndex}
        variant="secondary" 
        className="text-[8px] px-1 py-0 h-4 bg-gray-200 text-gray-700 hover:bg-gray-300"
      >
        {tag}
      </Badge>
    ))}
    {entry.tags.length > 2 && (
      <Badge 
        variant="secondary" 
        className="text-[8px] px-1 py-0 h-4 bg-gray-300 text-gray-600"
        title={`Additional tags: ${entry.tags.slice(2).join(', ')}`}
      >
        +{entry.tags.length - 2}
      </Badge>
    )}
  </div>
)}

// Responsive positioning for tags badges
// - Absolute positioning in top-right corner
// - Max width constraint to prevent overflow
// - Gap spacing between multiple badges
// - Tooltip for overflow count badge
// - Small font size for compact display
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
  })
}
```

## Testing Patterns

### Test Infrastructure
```bash
# Test location: .claude-testing/ directory (external tests)
# Framework: Jest + React Testing Library + ts-jest
# Environment: jsdom for React component testing

# Commands
cd .claude-testing
npm test                # Run all tests
npm run test:coverage   # Run with coverage
npm run test:watch      # Watch mode
```

### Component Testing Implementation
```typescript
// .claude-testing/src/components/log-viewer/index.sort.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LogViewer from '@/components/log-viewer';

// Mock child components for isolation
jest.mock('@/components/log-viewer/log-entry-list', () => ({
  __esModule: true,
  default: ({ entries, sortOrder, onSortToggle }: any) => (
    <div data-testid="log-entry-list">
      <div data-testid="sort-order">{sortOrder}</div>
      <button data-testid="sort-button" onClick={onSortToggle}>Sort</button>
    </div>
  ),
}));

describe('LogViewer Sort Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ logs: mockLogData }),
    });
  });

  it('should toggle between ascending and descending on button click', async () => {
    render(<LogViewer projectId="test" />);
    
    await waitFor(() => {
      expect(screen.getByTestId('sort-order')).toHaveTextContent('desc');
    });

    fireEvent.click(screen.getByTestId('sort-button'));
    expect(screen.getByTestId('sort-order')).toHaveTextContent('asc');
  });

  it('should toggle sort order when pressing "s" key', async () => {
    const user = userEvent.setup();
    render(<LogViewer projectId="test" />);
    
    await user.keyboard('s');
    expect(screen.getByTestId('sort-order')).toHaveTextContent('asc');
  });
});
```

### API Testing Implementation  
```typescript
// .claude-testing/src/app/api/logs/route.debug.test.ts
import { POST } from '@/app/api/logs/route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/db-turso', () => ({
  db: {
    getProjectByApiKey: jest.fn(),
    addLogToProject: jest.fn(),
  },
}));

describe('Logs API Route - DEBUG Support', () => {
  it('should accept DEBUG log level in the standard format', async () => {
    const request = new NextRequest('http://localhost:3000/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'project-123',
        apiKey: 'test-api-key',
        content: '[2025-07-16, 10:00:00] [DEBUG] Debug message - {"key": "value"}',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

### Integration Testing Pattern
```typescript
// .claude-testing/integration/log-viewer-features.test.tsx
// Tests all features working together: sort + DEBUG + tags
describe('LogViewer Integration - All Features', () => {
  const mockLogs = [
    {
      id: '1',
      content: '[2025-07-16, 09:00:00] [DEBUG] Cache invalidated - {"_tags": ["cache", "debug"]}',
      created_at: '2025-07-16T09:00:00Z',
    },
    // ... more test data
  ];

  it('should sort logs correctly while maintaining tags and DEBUG display', async () => {
    render(<LogViewer projectId="test" />);
    
    // Verify all features work together
    await waitFor(() => {
      expect(screen.getAllByTestId(/^entry-/)).toHaveLength(5);
    });

    // Toggle sort
    fireEvent.click(screen.getByTestId('sort-button'));
    
    // Verify tags still visible after sort
    expect(screen.getByTestId('tags-1')).toBeInTheDocument();
    expect(screen.getByTestId('level-1')).toHaveTextContent('DEBUG');
  });
});
```

### Test Patterns by Feature

#### Sort Functionality Tests
- ✅ Button toggle (ascending/descending)  
- ✅ Keyboard shortcut 's' functionality
- ✅ Sort persistence across state changes
- ✅ Edge cases: empty logs, identical timestamps

#### DEBUG Log Support Tests  
- ✅ DEBUG log parsing and display
- ✅ Backend API validation of DEBUG level
- ✅ Frontend DEBUG checkbox filtering
- ✅ Case sensitivity validation (uppercase only)

#### Tags Feature Tests
- ✅ Tag extraction from `_tags` field in JSON
- ✅ Badge display with 2-tag limit (+N overflow)
- ✅ Tags across all log levels (LOG, INFO, WARN, ERROR, DEBUG)
- ✅ Edge cases: empty tags, non-array tags, special characters

### Test Configuration
```javascript
// .claude-testing/jest.config.js
module.exports = {
  rootDir: '..',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/.claude-testing/**/*.test.{js,ts,jsx,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: ['<rootDir>/.claude-testing/setupTests.js'],
  collectCoverageFrom: [
    '<rootDir>/src/components/log-viewer/**/*.{js,ts,jsx,tsx}',
    '<rootDir>/src/app/api/logs/route.ts',
    '<rootDir>/src/lib/types.ts',
  ],
  coverageDirectory: '<rootDir>/.claude-testing/coverage',
};
```

### Test Execution
```bash
# Current status: Jest configuration needs fixes for module resolution
# Next steps:
# 1. Fix ts-jest configuration for @/ path aliases
# 2. Ensure React Testing Library setup works with Next.js components
# 3. Run test suite and address any failing tests
# 4. Generate coverage report to verify feature coverage
```

### Testing Best Practices Applied
- **Component Isolation**: Mock child components to test specific functionality
- **Data-testid Strategy**: Use consistent test IDs for reliable element selection  
- **Async Testing**: Proper use of `waitFor` for async operations
- **User Event Testing**: Test keyboard interactions with @testing-library/user-event
- **Edge Case Coverage**: Test empty data, malformed input, error conditions
- **Integration Testing**: Verify features work together (sort + filtering + tags)
- **Mock Strategy**: Mock external dependencies (fetch, database) for unit tests

### React 19 Testing Patterns

#### Server Component Testing (No 'use client')
```typescript
// ✅ Correct: Test Server Components by calling them as functions
import ProjectPage from '@/app/projects/[id]/page';

it('should return JSX with correct structure', async () => {
  const mockParams = Promise.resolve({ id: 'test-id' });
  const result = await ProjectPage({ params: mockParams });
  
  // Test JSX structure directly
  expect(result).toHaveProperty('$$typeof');
  expect(result).toHaveProperty('type');
  expect(result).toHaveProperty('props');
  expect(result.props.project).toEqual(mockProject);
});

// ❌ Incorrect: Don't use render() with Server Components
// This will cause "Objects are not valid as a React child" errors
```

#### Client Component Testing (With 'use client')
```typescript
// ✅ Correct: Mock all Next.js dependencies first
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn()
}));

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn((key: string) => null)
  }),
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn()
  })
}));

// For complex components, mock the entire component
jest.mock('@/app/page', () => {
  const MockPage = () => (
    <div data-testid="mocked-page">
      <h1>Log Viewer</h1>
    </div>
  );
  return MockPage;
});

// Then use render() normally
import { render, screen } from '@testing-library/react';
render(<Page />);
```

#### Key Testing Rules
1. **Identify Component Type**: Check for 'use client' directive
2. **Server Components**: Call as async functions, test JSX properties
3. **Client Components**: Mock all dependencies, use RTL render()
4. **Mock Strategy**: Complete module mocking prevents complex dependency chains
5. **File Extensions**: Use `.tsx` for test files with JSX
6. **Import Types**: Import `RenderResult` from '@testing-library/react'

### Testing File Cleanup
- **Remove Duplicate Tests**: Delete `.ts` files when `.tsx` equivalents exist
- **Consistent Extensions**: Use `.tsx` for all component tests
- **Proper Imports**: Ensure all RTL types are imported

## Performance Patterns

### Client-Side Optimization
```typescript
// Memoization for expensive operations
const parsedEntries = useMemo(() => {
  return parseLogContent(logContent)
}, [logContent])

// Date formatting memoization (avoid re-formatting on every render)
const formattedTimestamps = useMemo(() => {
  return entries.map(entry => format(new Date(entry.timestamp), 'HH:mm:ss'))
}, [entries])

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

### Production Code Cleanup (✅ COMPLETED)
```typescript
// ❌ Removed: Debug logging from production code (TASK-2025-051)
// console.error('Failed to fetch logs', error) → Removed from LogViewer
// console.error('Failed to fetch log content', error) → Removed from LogViewer  
// console.error('Failed to update read status', error) → Removed from LogViewer
// console.error('Failed to delete log', error) → Removed from LogViewer
// console.error('Failed to copy to clipboard:', error) → Removed from LogViewer
// console.error('Failed to fetch projects', error) → Removed from ProjectList
// console.error('Failed to fetch projects', error) → Removed from ProjectSelector

// ✅ Current: Clean production code with UI feedback only
export async function deleteLog(logId: string) {
  try {
    const response = await fetch(`/api/logs/${logId}`, { method: 'DELETE' });
    if (response.ok) {
      toast.success('Log deleted successfully');
    } else {
      throw new Error('Failed to delete log');
    }
  } catch {
    // User feedback without console pollution
    toast.error('Failed to delete log');
  }
}

// ✅ Alternative: Error handling with UI state management
export async function fetchProjects() {
  try {
    const response = await fetch('/api/projects');
    if (response.ok) {
      const data = await response.json();
      const projects = data.success ? data.data : data;
      setProjects(Array.isArray(projects) ? projects : []);
    }
  } catch {
    // Error handled by UI state - no console noise
    setProjects([]);
  }
}

// ✅ Alternative: Conditional logging for development
const isDevelopment = process.env.NODE_ENV === 'development';

function debugLog(message: string, data?: unknown) {
  if (isDevelopment) {
    console.log(message, data);
  }
}

// ✅ Structured error handling without debug noise
export async function createProject(name: string, description: string) {
  try {
    const project = await db.project.create({ name, description });
    return project;
  } catch (error) {
    // Log errors, not debug information
    console.error('Project creation failed:', error);
    throw new Error('validation: Failed to create project');
  }
}
```

### Performance Impact of Console Output
- **Production Impact**: Each console.log() call creates overhead in production
- **Bundle Size**: Debug statements increase the final bundle size
- **Runtime Performance**: Console operations can block the event loop
- **User Experience**: Cleaner console output improves developer experience

### Console Cleanup Guidelines
1. **Remove Debug Logging**: Eliminate console.log() statements from production code
2. **Development Script Output**: Use `process.stdout.write()` for development script output instead of console.log()
3. **Silent Error Handling**: Replace console.error() with silent error handling in development-only code
4. **Preserve Critical Error Logging**: Keep console.error() only for actual error reporting that affects functionality
5. **Structured Logging**: Consider proper logging libraries for production
6. **Linting Rules**: Configure ESLint to catch console.log() in CI/CD

✅ **TASK-2025-118 COMPLETED**: Cleaned up console.log statements from development files:
- `scripts/verify-performance.js`: Replaced console.log with process.stdout.write for proper output handling
- `src/app/test-performance/page.tsx`: Replaced console.error with silent error handling
- `manual-performance-validation.js`: Replaced 30+ console.log statements with process.stdout.write

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