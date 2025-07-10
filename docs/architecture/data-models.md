# Data Models & Database Schema

*Last updated: 2025-07-10 | Vercel KV data structure and type definitions*

## Database Schema (Vercel KV)

### Key Patterns

Vercel KV uses Redis-style key-value operations with the following patterns:

```
projects                    → Set of all project IDs
project:{id}               → Hash containing project metadata
project:{id}:logs          → Set of log IDs for the project
log:{id}                   → Hash containing log entry data
```

### Data Types

#### Project Data
**Key**: `project:{id}`
**Type**: Hash
**Fields**:
```typescript
{
  id: string;           // Project identifier (slug format)
  name: string;         // Display name
  description: string;  // Optional description
  createdAt: string;    // ISO timestamp
  apiKey: string;       // 32-character nanoid for API access
}
```

#### Log Data
**Key**: `log:{id}`
**Type**: Hash
**Fields**:
```typescript
{
  id: string;           // Log identifier (nanoid)
  projectId: string;    // Reference to parent project
  timestamp: string;    // ISO timestamp of submission
  comment: string;      // Optional submission comment
  isRead: boolean;      // Read status flag
  content: string;      // Raw log content (multi-line)
}
```

#### Project Registry
**Key**: `projects`
**Type**: Set
**Members**: All project IDs

#### Project Log Index
**Key**: `project:{id}:logs`
**Type**: Set
**Members**: All log IDs for the project

## TypeScript Interfaces

### Core Data Models

```typescript
// Project entity
interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  apiKey: string;
}

// Simplified log entity for API operations
interface ProjectLog {
  id: string;
  projectId: string;
  timestamp: string;
  comment: string;
  isRead: boolean;
  content?: string; // Only included when fetching specific log
}

// Extended log details for parsed content
interface LogDetails {
  _extended?: unknown;
  [key: string]: unknown;
}

// Individual log entry (parsed from content)
interface LogEntry {
  id: string;
  projectId: string;
  timestamp: string;
  level: 'LOG' | 'WARN' | 'ERROR';
  message: string;
  details?: LogDetails;
  schemaVersion: string;
  submissionId?: string;
}

// Historical log submission (legacy)
interface LogSubmission {
  id: string;
  projectId: string;
  submittedAt: string;
  comment: string;
  entryCount: number;
  schemaVersion: string;
  isRead?: boolean;
}
```

## Database Operations

### Project Operations

#### Create Project
```typescript
async function createProject(name: string, description: string = ''): Promise<Project>
```
- Generates slug-based ID from name
- Creates 32-character nanoid API key
- Stores as hash in `project:{id}`
- Adds ID to `projects` set

#### Get Project
```typescript
async function getProject(id: string): Promise<Project | null>
```
- Fetches hash from `project:{id}`
- Returns null if not found

#### Update Project
```typescript
async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null>
```
- Handles ID changes with data migration
- Updates log references if ID changed
- Atomic operations for consistency

#### Delete Project
```typescript
async function deleteProject(id: string): Promise<boolean>
```
- Removes from `projects` set
- Deletes `project:{id}` hash
- Cascades to delete all project logs
- Cleans up `project:{id}:logs` set

### Log Operations

#### Create Log
```typescript
async function createLog(projectId: string, content: string, comment: string = ''): Promise<ProjectLog>
```
- Generates nanoid for log ID
- Stores as hash in `log:{id}`
- Adds ID to `project:{projectId}:logs` set
- Sets initial `isRead: false`

#### Get Project Logs
```typescript
async function getProjectLogs(projectId: string): Promise<ProjectLog[]>
```
- Fetches log IDs from `project:{projectId}:logs`
- Retrieves metadata for each log (no content)
- Returns sorted by timestamp

#### Get Log Details
```typescript
async function getLog(logId: string): Promise<ProjectLog | null>
```
- Fetches complete log including content
- Used for detailed log viewing

#### Update Log
```typescript
async function updateLog(logId: string, updates: { isRead?: boolean }): Promise<ProjectLog | null>
```
- Updates log metadata
- Primarily used for read status tracking

#### Delete Log
```typescript
async function deleteLog(logId: string): Promise<boolean>
```
- Removes from parent project's log set
- Deletes log hash
- Maintains referential integrity

## Data Validation

### Log Format Validation
```typescript
const LOG_PATTERN = /^\[\d{4}-\d{2}-\d{2}, \d{2}:\d{2}:\d{2}\] \[(LOG|ERROR|INFO|WARN|DEBUG)\] .+( - .+)?$/;
```

**Required Format**: `[YYYY-MM-DD, HH:MM:SS] [LEVEL] MESSAGE - DATA`
- DATE: ISO date format
- TIME: 24-hour format
- LEVEL: One of LOG, ERROR, INFO, WARN, DEBUG
- MESSAGE: Any text content
- DATA: Optional JSON or text after " - "

### Multi-line Support
- Single submission can contain multiple log entries
- Each line validated independently
- Lines split by `\n` character
- Empty lines filtered out

## Data Relationships

### Project → Logs (One-to-Many)
```
project:my-app → project:my-app:logs → {log1, log2, log3}
                                   ↓
                              log:log1, log:log2, log:log3
```

### Access Patterns
1. **List Projects**: `SMEMBERS projects`
2. **Get Project Details**: `HGETALL project:{id}`
3. **List Project Logs**: `SMEMBERS project:{id}:logs`
4. **Get Log Content**: `HGETALL log:{id}`

## Migration & Versioning

### Schema Evolution
- No formal migration system currently
- Schema changes handled in application code
- Backward compatibility maintained through optional fields

### Data Consistency
- Atomic operations for related data
- Referential integrity maintained in application layer
- No foreign key constraints (Redis limitation)

### Backup Strategy
- Vercel KV provides automated backups
- Data export through API endpoints
- Manual backup via database operations

## Performance Considerations

### Indexing
- Redis sets provide O(1) membership testing
- Hash operations are O(1) for field access
- No secondary indexes available

### Memory Usage
- All data stored in memory (Redis model)
- Content field can be large (full log text)
- Consider pagination for large projects

### Query Optimization
- Minimize round trips with batch operations
- Use pipeline operations where possible
- Cache frequently accessed data client-side

This data model provides efficient access patterns for the log viewer while maintaining data integrity and supporting the application's use cases.