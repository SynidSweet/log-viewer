# Data Models & Database Schema

*Last updated: 2025-07-10 | Turso SQLite schema and type definitions*

## Database Schema (Turso SQLite)

### Table Structure

Turso SQLite uses relational tables with proper foreign key constraints:

```sql
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    api_key TEXT NOT NULL UNIQUE
);

CREATE TABLE logs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    content TEXT NOT NULL,
    comment TEXT,
    timestamp TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_logs_project_id ON logs(project_id);
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_projects_api_key ON projects(api_key);
```

### Data Types

#### Project Data
**Table**: `projects`
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
**Table**: `logs`
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

#### Database Constraints
- **Primary Keys**: Unique identifiers for projects and logs
- **Foreign Keys**: logs.project_id references projects.id with CASCADE DELETE
- **Unique Constraints**: api_key must be unique across all projects
- **Indexes**: Optimized queries on project_id, timestamp, and api_key

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

### Resilience Wrapper
All database operations are wrapped with `withDatabaseOperation` which provides:
- Automatic database connection initialization
- Retry logic for transient failures
- Consistent error handling and logging
- Operation-specific error context

### Project Operations

#### Create Project
```typescript
async function createProject(name: string, description: string = ''): Promise<Project>
```
- Generates slug-based ID from name
- Creates 32-character nanoid API key
- Inserts into `projects` table with SQL INSERT
- Wrapped with withDatabaseOperation for resilience

#### Get Project
```typescript
async function getProject(id: string): Promise<Project | null>
```
- Executes SQL SELECT with prepared statement
- Returns null if not found
- Wrapped with withDatabaseOperation for resilience

#### Update Project
```typescript
async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null>
```
- Handles ID changes with data migration
- Updates log references if ID changed
- Uses SQL transactions for consistency
- Wrapped with withDatabaseOperation for resilience

#### Delete Project
```typescript
async function deleteProject(id: string): Promise<boolean>
```
- Executes SQL DELETE with prepared statement
- Cascades to delete all project logs via foreign key constraint
- Returns true if rows were affected
- Wrapped with withDatabaseOperation for resilience

### Log Operations

#### Create Log
```typescript
async function createLog(projectId: string, content: string, comment: string = ''): Promise<ProjectLog>
```
- Generates nanoid for log ID
- Inserts into `logs` table with SQL INSERT
- Sets initial `is_read: 0` (SQLite boolean)
- Wrapped with withDatabaseOperation for resilience

#### Get Project Logs
```typescript
async function getProjectLogs(projectId: string): Promise<ProjectLog[]>
```
- Executes SQL SELECT with WHERE clause on project_id
- Retrieves metadata for each log (no content)
- Returns sorted by timestamp DESC
- Wrapped with withDatabaseOperation for resilience

#### Get Log Details
```typescript
async function getLog(logId: string): Promise<ProjectLog | null>
```
- Executes SQL SELECT with all columns
- Fetches complete log including content
- Used for detailed log viewing
- Wrapped with withDatabaseOperation for resilience

#### Update Log
```typescript
async function updateLog(logId: string, updates: { isRead?: boolean }): Promise<ProjectLog | null>
```
- Executes SQL UPDATE with prepared statement
- Updates log metadata (primarily is_read status)
- Wrapped with withDatabaseOperation for resilience

#### Delete Log
```typescript
async function deleteLog(logId: string): Promise<boolean>
```
- Executes SQL DELETE with prepared statement
- Returns true if rows were affected
- Referential integrity maintained by foreign key constraints
- Wrapped with withDatabaseOperation for resilience

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
1. **List Projects**: `SELECT * FROM projects ORDER BY created_at DESC`
2. **Get Project Details**: `SELECT * FROM projects WHERE id = ?`
3. **List Project Logs**: `SELECT * FROM logs WHERE project_id = ? ORDER BY timestamp DESC`
4. **Get Log Content**: `SELECT * FROM logs WHERE id = ?`

## Migration & Versioning

### Schema Evolution
- No formal migration system currently
- Schema changes handled in application code
- Backward compatibility maintained through optional fields

### Data Consistency
- Atomic operations for related data
- Referential integrity maintained in application layer
- Foreign key constraints ensure referential integrity

### Backup Strategy
- Turso provides automated backups
- Data export through API endpoints
- SQLite database files for manual backup

## Performance Considerations

### Indexing
- Primary key lookups are O(log n) with B-tree indexes
- Secondary indexes on project_id, timestamp, and api_key
- Foreign key constraints ensure referential integrity

### Storage
- Data stored on disk with SQLite engine
- Content field can be large (full log text)
- Efficient storage with compression

### Query Optimization
- Use prepared statements for better performance
- Leverage indexes for fast lookups
- Batch operations with transactions
- Cache frequently accessed data client-side

This data model provides efficient access patterns for the log viewer while maintaining data integrity and supporting the application's use cases.