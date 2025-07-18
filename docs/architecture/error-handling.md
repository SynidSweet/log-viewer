# Error Handling Architecture

*Last updated: 2025-07-18 | Updated withApiErrorHandling usage - now takes single argument*

## Overview

The Universal Log Viewer implements a centralized error handling system for all API endpoints. This architecture ensures consistent error responses, better debugging capabilities, and improved user experience through actionable error messages.

## Core Components

### Error Handler Module

The centralized error handler is located at `/src/lib/api-error-handler.ts` and provides:

- **Wrapper Function**: `withApiErrorHandling` that wraps all API route handlers
- **Error Classification**: Automatic categorization of errors by type
- **Structured Responses**: Consistent error response format
- **Retry Guidance**: Flags indicating whether operations should be retried

### Error Response Format

All API errors follow this standardized structure:

```typescript
interface ApiErrorResponse {
  error: string;          // Error type (e.g., "Database Connection Failed")
  message: string;        // Human-readable message with guidance
  type: string;           // Error category (e.g., "database_error")
  retryable?: boolean;    // Whether the client should retry
  timestamp: string;      // ISO timestamp of the error
  statusCode: number;     // HTTP status code
}
```

### Success Response Format

Successful API responses follow this structure:

```typescript
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}
```

## Error Categories

### Database Errors (500)
- **Connection Failures**: Database unreachable or initialization failed
- **Query Failures**: SQL execution errors
- **Schema Issues**: Table or column missing
- **Retryable**: Usually `true` for transient failures

### Validation Errors (400)
- **Invalid Input**: Request body fails validation
- **Format Errors**: Data doesn't match expected format
- **Missing Fields**: Required parameters not provided
- **Retryable**: Always `false`

### Authentication Errors (401/403)
- **Invalid Credentials**: Wrong API key or expired session
- **Insufficient Permissions**: User lacks required access
- **Retryable**: `false` unless token refresh is possible

### Not Found Errors (404)
- **Resource Missing**: Requested entity doesn't exist
- **Retryable**: Always `false`

### Rate Limit Errors (429)
- **Too Many Requests**: Rate limit exceeded
- **Retryable**: `true` with backoff

## Implementation Pattern

### Basic Usage

```typescript
// src/app/api/example/route.ts
import { withApiErrorHandling } from '@/lib/api-error-handler'

export async function GET(request: NextRequest) {
  return withApiErrorHandling(async () => {
    // Your API logic here
    const result = await someOperation()
    
    // Return data directly - wrapper handles success response
    return result
  })
}
```

### Custom Error Types

```typescript
// Throw errors with type prefixes for automatic classification
throw new Error('validation: Email format is invalid')
throw new Error('not found: Project does not exist')
throw new Error('authentication: Invalid API key')
```

### Database Operations

```typescript
// Database operations with automatic retry
import { withDatabaseOperation } from '@/lib/db-turso'

export async function getProject(id: string) {
  return withDatabaseOperation(async () => {
    // Database query with automatic retry on failure
    const result = await turso.execute('SELECT * FROM projects WHERE id = ?', [id])
    return mapResultToProject(result)
  }, 'getProject')
}
```

## Error Handling Flow

1. **Request Received**: API endpoint receives request
2. **Wrapped Execution**: Handler wrapped in `withApiErrorHandling`
3. **Error Occurs**: Exception thrown during execution
4. **Classification**: Error analyzed and categorized
5. **Response Format**: Structured error response created
6. **Client Receives**: Consistent error format with retry guidance

## Client-Side Handling

### Example Client Implementation

```typescript
async function fetchData(url: string) {
  try {
    const response = await fetch(url)
    const data = await response.json()
    
    if (!response.ok) {
      // Handle structured error
      const error = data as ApiErrorResponse
      
      if (error.retryable) {
        // Implement retry logic with exponential backoff
        return retryWithBackoff(() => fetchData(url))
      }
      
      // Show user-friendly error message
      showError(error.message)
      return null
    }
    
    // Handle success
    return data.data
  } catch (error) {
    // Network or parsing error
    showError('Network error occurred')
    return null
  }
}
```

## Monitoring and Debugging

### Error Tracking

The error handler automatically captures and formats errors for consistent tracking:

```typescript
withApiErrorHandling(handler)
```

Error tracking includes:
- Automatic error classification by type
- Consistent error response format
- Stack traces in development mode

### Development vs Production

In development (`NODE_ENV === 'development'`):
- Full stack traces included in responses
- Detailed error information exposed

In production:
- Stack traces hidden from responses
- Generic messages for unknown errors
- Errors logged server-side only

## Special Cases

### NextAuth Endpoints

NextAuth.js endpoints should **NOT** use the error handling wrapper:

```typescript
// src/app/api/auth/[...nextauth]/route.ts
// DO NOT wrap NextAuth handlers - they have their own error handling
export { GET, POST } from '@/auth'
```

### Health Check Endpoints

Health checks return structured status information:

```typescript
export async function GET() {
  return withApiErrorHandling(async () => {
    const health = await checkDatabaseHealth()
    return {
      status: health.healthy ? 'healthy' : 'unhealthy',
      database: health.connected ? 'connected' : 'disconnected',
      details: health.details
    }
  })
}
```

## Best Practices

1. **Always Use the Wrapper**: Wrap all API endpoints (except NextAuth)
2. **Provide Operation Names**: Include descriptive operation names
3. **Throw Typed Errors**: Use error prefixes for classification
4. **Return Data Directly**: Let the wrapper handle response formatting
5. **Document Retryability**: Consider whether errors are transient
6. **Log Appropriately**: Use console.error for unexpected errors

## Validation and Testing

### Edge Case Testing (TURSO-014)
The error handling system has been comprehensively tested with 15 edge case scenarios:

**Key Validations**:
- ✅ Database connection failures and timeouts
- ✅ Invalid JSON payload handling returns proper 400 status
- ✅ Authentication vs validation error classification order fixed
- ✅ Health endpoint returns proper boolean `healthy` field
- ✅ Large payload handling (1MB+ JSON)
- ✅ Concurrent request handling (20 simultaneous requests)
- ✅ SQL injection and XSS prevention
- ✅ Multi-line log format validation
- ✅ Proper HTTP status codes for all error types

**Critical Fixes Applied**:
1. **Error Classification Order**: Authentication errors now checked before validation
2. **JSON Parsing**: Explicit try-catch blocks in API routes for malformed JSON
3. **Health Response Format**: Added explicit `healthy: boolean` field

**Performance Validation**:
- System handles 20 concurrent requests without degradation
- Large payloads (1MB+) processed successfully
- Response time consistency maintained under load

## Future Enhancements

- **Error Monitoring Integration**: Sentry or similar service
- **Metrics Collection**: Error rates and types
- **Circuit Breaker**: Automatic fallbacks for failing services
- **Error Recovery**: Automated recovery procedures
- **Custom Error Pages**: User-friendly error displays

This error handling architecture provides a robust foundation for reliable API operations and improved debugging capabilities.