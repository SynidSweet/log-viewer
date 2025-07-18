// lib/api-error-handler.ts
import { NextResponse } from 'next/server';
import { DatabaseError } from './turso';

export interface ApiErrorResponse {
  error: string;
  message: string;
  type: string;
  retryable?: boolean;
  timestamp: string;
  statusCode: number;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
}

// Standardized error classification and formatting
export function classifyAndFormatError(error: unknown): ApiErrorResponse {
  const timestamp = new Date().toISOString();
  
  // Handle database errors
  if (error && typeof error === 'object' && 'type' in error) {
    const dbError = error as DatabaseError;
    
    switch (dbError.type) {
      case 'connection':
        // Check if this is due to missing environment variables
        if (dbError.message?.includes('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN')) {
          return {
            error: 'Database configuration missing',
            message: 'Database environment variables not configured. In production, ensure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are set in Vercel dashboard and redeploy. Use /api/env-check to validate configuration.',
            type: 'database_configuration',
            retryable: false,
            timestamp,
            statusCode: 503
          };
        }
        
        // Check for timeout-specific errors
        if (dbError.message?.includes('timeout') || dbError.code === 'TIMEOUT') {
          return {
            error: 'Database connection timeout',
            message: 'Database connection timed out. This may indicate high load or network issues. Please try again in a few moments.',
            type: 'database_timeout',
            retryable: true,
            timestamp,
            statusCode: 504
          };
        }
        
        // Check for authentication errors
        if (dbError.message?.includes('authentication') || dbError.message?.includes('unauthorized') || dbError.code === 'UNAUTHORIZED') {
          return {
            error: 'Database authentication failed',
            message: 'Database authentication failed. Verify TURSO_AUTH_TOKEN is valid and has not expired. Check Turso dashboard for token status.',
            type: 'database_auth',
            retryable: false,
            timestamp,
            statusCode: 503
          };
        }
        
        // Generic connection failure
        return {
          error: 'Database connection failed',
          message: `Unable to connect to database. ${dbError.code ? `Error code: ${dbError.code}. ` : ''}Please verify database configuration and try again.`,
          type: 'database_connection',
          retryable: true,
          timestamp,
          statusCode: 503
        };
        
      case 'initialization':
        // Check for schema missing scenario
        if (dbError.message?.includes('missing tables') || dbError.message?.includes('no such table')) {
          return {
            error: 'Database schema not initialized',
            message: 'Database tables are missing. Run POST /api/init-db to initialize the database schema, or contact support if this persists.',
            type: 'database_schema_missing',
            retryable: false,
            timestamp,
            statusCode: 503
          };
        }
        
        // Retry count exceeded
        if (dbError.message?.includes('after') && dbError.message?.includes('attempts')) {
          return {
            error: 'Database initialization retry limit exceeded',
            message: 'Database initialization failed after multiple attempts. This indicates a persistent issue. Check database connectivity and configuration, or contact support.',
            type: 'database_init_retries_exhausted',
            retryable: false,
            timestamp,
            statusCode: 503
          };
        }
        
        return {
          error: 'Database initialization failed',
          message: `Database initialization in progress. ${dbError.code ? `Error: ${dbError.code}. ` : ''}Please wait a moment and try again. If this persists, check /api/health for more details.`,
          type: 'database_initialization',
          retryable: true,
          timestamp,
          statusCode: 503
        };
        
      case 'schema':
        // Check for foreign key violations
        if (dbError.message?.includes('foreign key') || dbError.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
          return {
            error: 'Foreign key constraint violation',
            message: 'Data integrity error: referenced record does not exist. Ensure all referenced projects exist before creating logs.',
            type: 'database_foreign_key',
            retryable: false,
            timestamp,
            statusCode: 400
          };
        }
        
        // Check for unique constraint violations
        if (dbError.message?.includes('unique') || dbError.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return {
            error: 'Unique constraint violation',
            message: 'Record already exists with this identifier. Use a different ID or update the existing record instead.',
            type: 'database_unique_constraint',
            retryable: false,
            timestamp,
            statusCode: 409
          };
        }
        
        return {
          error: 'Database schema validation failed',
          message: `Database schema integrity issue detected. ${dbError.code ? `Error: ${dbError.code}. ` : ''}This may require database maintenance. Contact support if this persists.`,
          type: 'database_schema',
          retryable: false,
          timestamp,
          statusCode: 500
        };
        
      case 'query':
        // Check for syntax errors
        if (dbError.message?.includes('syntax') || dbError.code === 'SQLITE_ERROR') {
          return {
            error: 'Database query syntax error',
            message: 'Internal query error detected. This is likely a system issue. Please try again or contact support if this persists.',
            type: 'database_syntax',
            retryable: false,
            timestamp,
            statusCode: 500
          };
        }
        
        // Check for lock/busy errors
        if (dbError.message?.includes('busy') || dbError.message?.includes('locked') || dbError.code === 'SQLITE_BUSY') {
          return {
            error: 'Database temporarily busy',
            message: 'Database is temporarily busy processing other requests. Please wait a moment and try again.',
            type: 'database_busy',
            retryable: true,
            timestamp,
            statusCode: 503
          };
        }
        
        return {
          error: 'Database query failed',
          message: `Database operation failed. ${dbError.code ? `Error code: ${dbError.code}. ` : ''}Please try again. If this persists, check system status.`,
          type: 'database_query',
          retryable: true,
          timestamp,
          statusCode: 500
        };
        
      case 'validation':
        return {
          error: 'Data validation failed',
          message: dbError.message || 'Invalid data provided. Please check your input and try again.',
          type: 'validation',
          retryable: false,
          timestamp,
          statusCode: 400
        };
    }
  }
  
  // Handle authentication errors (check before validation to avoid conflicts)
  if (error instanceof Error && (error.message?.includes('authentication') || error.message?.includes('unauthorized'))) {
    return {
      error: 'Authentication error',
      message: 'Invalid credentials or insufficient permissions',
      type: 'authentication',
      retryable: false,
      timestamp,
      statusCode: 401
    };
  }
  
  // Handle validation errors
  if (error instanceof Error && (error.message?.includes('validation') || error.message?.includes('Invalid'))) {
    return {
      error: 'Validation error',
      message: error.message || 'Invalid input data',
      type: 'validation',
      retryable: false,
      timestamp,
      statusCode: 400
    };
  }
  
  // Handle not found errors
  if (error instanceof Error && (error.message?.includes('not found') || error.message?.includes('404'))) {
    return {
      error: 'Resource not found',
      message: 'The requested resource was not found',
      type: 'not_found',
      retryable: false,
      timestamp,
      statusCode: 404
    };
  }
  
  // Handle timeout errors
  if (error instanceof Error && (error.message?.includes('timeout') || ('code' in error && error.code === 'TIMEOUT'))) {
    return {
      error: 'Request timeout',
      message: 'The request took too long to complete. Please try again.',
      type: 'timeout',
      retryable: true,
      timestamp,
      statusCode: 504
    };
  }
  
  // Generic server error
  return {
    error: 'Internal server error',
    message: 'An unexpected error occurred. Please try again later.',
    type: 'server_error',
    retryable: true,
    timestamp,
    statusCode: 500
  };
}

// Create standardized error response
export function createErrorResponse(error: unknown): NextResponse {
  const errorResponse = classifyAndFormatError(error);
  
  return NextResponse.json(errorResponse, { 
    status: errorResponse.statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

// Create standardized success response
export function createSuccessResponse<T>(data: T, status: number = 200): NextResponse {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json(response, { 
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// API route wrapper with standardized error handling
export async function withApiErrorHandling<T>(
  operation: () => Promise<T>
): Promise<NextResponse> {
  try {
    const result = await operation();
    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}

// Environment variable validation
export function validateEnvironmentVariables(required: string[]): void {
  const missing = required.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}