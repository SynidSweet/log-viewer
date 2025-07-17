# API Reference

*Last updated: 2025-07-16 | Enhanced tag examples with comprehensive use cases and integration patterns*

## Overview

The Universal Log Viewer provides a REST API for log submission by external systems and project management through the web interface. The API uses a hybrid authentication model:

- **Log Submission**: Project-specific API keys for external systems
- **Project Management**: Google OAuth sessions for web interface users

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

### API Key Authentication
Used for log submission endpoints:
```http
POST /api/logs
Content-Type: application/json

{
  "projectId": "your-project-id",
  "apiKey": "your-api-key",
  "content": "log content"
}
```

### Session Authentication
Used for project management endpoints (automatic in web interface):
```http
GET /api/projects
Cookie: next-auth.session-token=...
```

## Log Management

### Submit Logs
Submit log entries to a project.

**Endpoint**: `POST /api/logs`

**Authentication**: API Key (in request body)

**Request Body**:
```json
{
  "projectId": "string",     // Required: Project identifier
  "apiKey": "string",        // Required: Project API key
  "content": "string",       // Required: Log content
  "comment": "string"        // Optional: Description
}
```

**Log Format Requirements**:
- Pattern: `[YYYY-MM-DD, HH:MM:SS] [LEVEL] MESSAGE - DATA`
- Supported levels: `LOG`, `ERROR`, `INFO`, `WARN`, `DEBUG`
- Multi-line support: Multiple entries separated by newlines
- Data section: Optional JSON data after ` - ` separator
- Tags support: Include `_tags` array in JSON data for tag-based filtering

**Example Request**:
```bash
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "my-app",
    "apiKey": "abc123def456",
    "content": "[2025-07-16, 14:30:00] [LOG] User login successful - {\"userId\": \"123\", \"ip\": \"192.168.1.1\"}",
    "comment": "Authentication logs"
  }'
```

**Multi-line Example**:
```bash
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "my-app",
    "apiKey": "abc123def456",
    "content": "[2025-07-16, 14:30:00] [INFO] Request started\n[2025-07-16, 14:30:01] [LOG] Processing data\n[2025-07-16, 14:30:02] [INFO] Request completed",
    "comment": "Request processing flow"
  }'
```

**Tags Examples**:

Single entry with tags:
```bash
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "my-app",
    "apiKey": "abc123def456",
    "content": "[2025-07-16, 14:30:00] [ERROR] Database connection failed - {\"error\": \"timeout\", \"_tags\": [\"database\", \"critical\", \"backend\"]}",
    "comment": "Database error with tags"
  }'
```

Multiple entries with different tag patterns:
```bash
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "my-app",
    "apiKey": "abc123def456",
    "content": "[2025-07-16, 14:30:00] [INFO] User login attempt - {\"userId\": \"user123\", \"success\": false, \"_tags\": [\"auth\", \"security\", \"login\"]}\n[2025-07-16, 14:30:02] [WARN] Multiple failed attempts - {\"userId\": \"user123\", \"attempts\": 3, \"_tags\": [\"auth\", \"security\", \"suspicious\"]}\n[2025-07-16, 14:30:05] [ERROR] Account locked - {\"userId\": \"user123\", \"_tags\": [\"auth\", \"security\", \"account-lock\"]}",
    "comment": "Authentication flow with progressive tag escalation"
  }'
```

Advanced tagging with environment and service information:
```bash
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "my-app",
    "apiKey": "abc123def456",
    "content": "[2025-07-16, 14:30:00] [LOG] Payment processed - {\"transactionId\": \"txn_123\", \"amount\": 99.99, \"currency\": \"USD\", \"_tags\": [\"payment\", \"transaction\", \"production\", \"api-gateway\"]}",
    "comment": "Payment processing with service and environment tags"
  }'
```

Development and debugging tags:
```bash
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "my-app",
    "apiKey": "abc123def456",
    "content": "[2025-07-16, 14:30:00] [DEBUG] Cache miss for key - {\"key\": \"user_profile_123\", \"ttl\": 3600, \"_tags\": [\"cache\", \"performance\", \"debug\", \"redis\"]}",
    "comment": "Debug information with technical tags"
  }'
```

**Tag Structure and Usage**:
- Tags must be provided as a `_tags` array within the JSON data section
- Each tag should be a string without spaces (use hyphens or underscores for multi-word tags)
- Tags are case-sensitive and will be displayed exactly as provided
- Common tag patterns:
  - **Service/Component**: `api-gateway`, `database`, `cache`, `auth-service`
  - **Environment**: `production`, `staging`, `development`, `testing`
  - **Severity/Priority**: `critical`, `high`, `medium`, `low`, `debug`
  - **Domain/Feature**: `payment`, `user-management`, `reporting`, `analytics`
  - **Status/Type**: `error`, `success`, `warning`, `info`, `security`

**Tag Filtering in UI**:
- Tags appear as badges in the log entries list for quick visual identification
- Use the tags filter dropdown to select one or more tags for filtering
- Filter uses OR logic - entries matching ANY selected tag will be shown
- Combine with other filters (search, log level) for precise log analysis

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "log_abc123",
    "projectId": "my-app",
    "timestamp": "2025-07-16T14:30:00.000Z"
  },
  "timestamp": "2025-07-16T14:30:00.000Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid log format or missing required fields
- `401 Unauthorized`: Invalid API key
- `404 Not Found`: Project not found

### Get Log Details
Retrieve detailed information about a specific log entry.

**Endpoint**: `GET /api/logs/[id]`

**Authentication**: Session (web interface only)

**Example Request**:
```bash
curl http://localhost:3000/api/logs/log_abc123
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "log_abc123",
    "projectId": "my-app",
    "timestamp": "2025-07-16T14:30:00.000Z",
    "comment": "Authentication logs",
    "isRead": false,
    "content": "[2025-07-16, 14:30:00] [LOG] User login successful - {\"userId\": \"123\", \"ip\": \"192.168.1.1\"}"
  },
  "timestamp": "2025-07-16T14:30:00.000Z"
}
```

## Project Management

### List Projects
Get all projects for the authenticated user.

**Endpoint**: `GET /api/projects`

**Authentication**: Session

**Example Request**:
```bash
curl http://localhost:3000/api/projects \
  -H "Cookie: next-auth.session-token=..."
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "my-app",
      "name": "My Application",
      "description": "Production application logs",
      "createdAt": "2025-07-16T10:00:00.000Z",
      "apiKey": "abc123def456"
    }
  ],
  "timestamp": "2025-07-16T14:30:00.000Z"
}
```

### Create Project
Create a new project.

**Endpoint**: `POST /api/projects`

**Authentication**: Session

**Request Body**:
```json
{
  "name": "string",         // Required: Project name
  "description": "string"   // Optional: Project description
}
```

**Example Request**:
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "name": "New Project",
    "description": "Description of the new project"
  }'
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "new-project",
    "name": "New Project",
    "description": "Description of the new project",
    "createdAt": "2025-07-16T14:30:00.000Z",
    "apiKey": "xyz789uvw012"
  },
  "timestamp": "2025-07-16T14:30:00.000Z"
}
```

### Get Project Details
Get details of a specific project.

**Endpoint**: `GET /api/projects/[id]`

**Authentication**: Session

**Example Request**:
```bash
curl http://localhost:3000/api/projects/my-app \
  -H "Cookie: next-auth.session-token=..."
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "my-app",
    "name": "My Application",
    "description": "Production application logs",
    "createdAt": "2025-07-16T10:00:00.000Z",
    "apiKey": "abc123def456"
  },
  "timestamp": "2025-07-16T14:30:00.000Z"
}
```

### Update Project
Update an existing project.

**Endpoint**: `PUT /api/projects/[id]`

**Authentication**: Session

**Request Body**:
```json
{
  "name": "string",         // Optional: New project name
  "description": "string"   // Optional: New project description
}
```

**Example Request**:
```bash
curl -X PUT http://localhost:3000/api/projects/my-app \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "name": "Updated Project Name",
    "description": "Updated description"
  }'
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "my-app",
    "name": "Updated Project Name",
    "description": "Updated description",
    "createdAt": "2025-07-16T10:00:00.000Z",
    "apiKey": "abc123def456"
  },
  "timestamp": "2025-07-16T14:30:00.000Z"
}
```

### Delete Project
Delete a project and all its logs.

**Endpoint**: `DELETE /api/projects/[id]`

**Authentication**: Session

**Example Request**:
```bash
curl -X DELETE http://localhost:3000/api/projects/my-app \
  -H "Cookie: next-auth.session-token=..."
```

**Success Response** (204 No Content):
```
(Empty response body)
```

### Get Project Logs
Get all logs for a specific project.

**Endpoint**: `GET /api/projects/[id]/logs`

**Authentication**: Session

**Query Parameters**:
- `limit`: Maximum number of logs to return (default: 100)

**Example Request**:
```bash
curl http://localhost:3000/api/projects/my-app/logs?limit=50 \
  -H "Cookie: next-auth.session-token=..."
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "log_abc123",
      "projectId": "my-app",
      "timestamp": "2025-07-16T14:30:00.000Z",
      "comment": "Authentication logs",
      "isRead": false
    }
  ],
  "timestamp": "2025-07-16T14:30:00.000Z"
}
```

### Check Project Logs
Check if a project has any logs.

**Endpoint**: `GET /api/projects/[id]/logs/check`

**Authentication**: Session

**Example Request**:
```bash
curl http://localhost:3000/api/projects/my-app/logs/check \
  -H "Cookie: next-auth.session-token=..."
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "hasLogs": true,
    "count": 42
  },
  "timestamp": "2025-07-16T14:30:00.000Z"
}
```

## System Endpoints

### Health Check
Check the system health and database connectivity.

**Endpoint**: `GET /api/health`

**Authentication**: None

**Example Request**:
```bash
curl http://localhost:3000/api/health
```

**Success Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2025-07-16T14:30:00.000Z",
  "checks": {
    "database": {
      "healthy": true,
      "responseTime": 45
    }
  }
}
```

### Environment Check
Verify environment configuration (development/debugging).

**Endpoint**: `GET /api/env-check`

**Authentication**: None

**Example Request**:
```bash
curl http://localhost:3000/api/env-check
```

**Success Response** (200 OK):
```json
{
  "environment": "development",
  "database": {
    "configured": true,
    "connected": true
  },
  "authentication": {
    "google": {
      "configured": true
    }
  },
  "timestamp": "2025-07-16T14:30:00.000Z"
}
```

### Debug Information
Get detailed system information for debugging.

**Endpoint**: `GET /api/debug`

**Authentication**: None

**Example Request**:
```bash
curl http://localhost:3000/api/debug
```

**Success Response** (200 OK):
```json
{
  "system": {
    "nodeVersion": "18.17.0",
    "environment": "development"
  },
  "database": {
    "status": "connected",
    "responseTime": 23,
    "lastQuery": "2025-07-16T14:29:55.000Z"
  },
  "timestamp": "2025-07-16T14:30:00.000Z"
}
```

### Database Initialization
Initialize the database schema (deployment only).

**Endpoint**: `POST /api/init-db`

**Authentication**: None (deployment context)

**Example Request**:
```bash
curl -X POST http://localhost:3000/api/init-db
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "initialized": true,
    "tablesCreated": ["projects", "logs", "migrations"],
    "migrationsRun": 3
  },
  "timestamp": "2025-07-16T14:30:00.000Z"
}
```

## Error Handling

### Error Response Format
All API errors follow a consistent format:

```json
{
  "error": "validation",
  "message": "Project ID is required",
  "type": "validation",
  "retryable": false,
  "timestamp": "2025-07-16T14:30:00.000Z",
  "statusCode": 400
}
```

### Error Types
- **validation**: Invalid input data (400 Bad Request)
- **authentication**: Invalid credentials (401 Unauthorized)
- **not found**: Resource not found (404 Not Found)
- **database**: Database operation failed (500 Internal Server Error)
- **timeout**: Request timeout (504 Gateway Timeout)
- **rate limit**: Too many requests (429 Too Many Requests)

### Common Error Responses

#### Invalid Log Format
```json
{
  "error": "validation",
  "message": "Invalid log format. Expected: [YYYY-MM-DD, HH:MM:SS] [LEVEL] MESSAGE - DATA",
  "type": "validation",
  "retryable": false,
  "timestamp": "2025-07-16T14:30:00.000Z",
  "statusCode": 400
}
```

#### Invalid API Key
```json
{
  "error": "authentication",
  "message": "Invalid API key",
  "type": "authentication",
  "retryable": false,
  "timestamp": "2025-07-16T14:30:00.000Z",
  "statusCode": 401
}
```

#### Database Connection Error
```json
{
  "error": "database",
  "message": "Database connection failed",
  "type": "database",
  "retryable": true,
  "timestamp": "2025-07-16T14:30:00.000Z",
  "statusCode": 500
}
```

## Rate Limiting

### Current Limits
- **Log Submission**: Limited by Vercel platform (varies by plan)
- **Project Management**: Limited by session-based authentication
- **System Endpoints**: No explicit limits

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642780800
```

## Integration Examples

### JavaScript/Node.js
```javascript
// Log submission
async function submitLog(projectId, apiKey, content, comment) {
  const response = await fetch('/api/logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectId,
      apiKey,
      content,
      comment
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
}

// Usage - Basic log
try {
  await submitLog(
    'my-app',
    'abc123def456',
    '[2025-07-16, 14:30:00] [LOG] User action - {"action": "login"}',
    'User authentication'
  );
} catch (error) {
  console.error('Failed to submit log:', error.message);
}

// Usage - Log with tags
try {
  await submitLog(
    'my-app',
    'abc123def456',
    '[2025-07-16, 14:30:00] [ERROR] Payment failed - {"transactionId": "txn_123", "error": "insufficient_funds", "_tags": ["payment", "error", "critical"]}',
    'Payment processing error'
  );
} catch (error) {
  console.error('Failed to submit log:', error.message);
}
```

### Python
```python
import requests
import json

def submit_log(project_id, api_key, content, comment=""):
    """Submit a log entry to the Universal Log Viewer"""
    url = "http://localhost:3000/api/logs"
    
    data = {
        "projectId": project_id,
        "apiKey": api_key,
        "content": content,
        "comment": comment
    }
    
    response = requests.post(url, json=data)
    response.raise_for_status()
    
    return response.json()

# Usage - Basic log
try:
    result = submit_log(
        "my-app",
        "abc123def456",
        "[2025-07-16, 14:30:00] [LOG] User action - {\"action\": \"login\"}",
        "User authentication"
    )
    print(f"Log submitted successfully: {result['data']['id']}")
except requests.exceptions.RequestException as e:
    print(f"Failed to submit log: {e}")

# Usage - Log with tags
try:
    result = submit_log(
        "my-app", 
        "abc123def456",
        "[2025-07-16, 14:30:00] [WARN] High CPU usage - {\"cpu_percent\": 85, \"process\": \"web-server\", \"_tags\": [\"performance\", \"monitoring\", \"warning\"]}",
        "Performance monitoring alert"
    )
    print(f"Tagged log submitted: {result['data']['id']}")
except requests.exceptions.RequestException as e:
    print(f"Failed to submit log: {e}")
```

### cURL
```bash
# Submit a log
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "my-app",
    "apiKey": "abc123def456",
    "content": "[2025-07-16, 14:30:00] [LOG] Application started",
    "comment": "Startup logs"
  }'

# Check health
curl http://localhost:3000/api/health

# Get projects (requires session)
curl http://localhost:3000/api/projects \
  -H "Cookie: next-auth.session-token=..."
```

## Extended Data Feature

### Basic Usage
Include `_extended` field in log data for additional UI panel:

```json
{
  "projectId": "my-app",
  "apiKey": "abc123def456",
  "content": "[2025-07-16, 14:30:00] [LOG] User login - {\"userId\": \"123\", \"success\": true, \"_extended\": {\"userAgent\": \"Mozilla/5.0...\", \"ipAddress\": \"192.168.1.1\", \"sessionId\": \"abc123\"}}",
  "comment": "Authentication with extended data"
}
```

### Extended Data Structure
```json
{
  "userId": "123",
  "success": true,
  "_extended": {
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "ipAddress": "192.168.1.1",
    "sessionId": "abc123def456",
    "requestHeaders": {
      "authorization": "Bearer ...",
      "accept": "application/json"
    },
    "responseTime": 145,
    "stackTrace": "Error: ...\n  at function1 ...\n  at function2 ..."
  }
}
```

This API provides comprehensive access to all log management and project administration features of the Universal Log Viewer system.