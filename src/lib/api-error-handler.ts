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
        return {
          error: 'Database connection failed',
          message: 'Unable to connect to database. Please try again later.',
          type: 'database_connection',
          retryable: true,
          timestamp,
          statusCode: 503
        };
        
      case 'initialization':
        return {
          error: 'Database initialization failed',
          message: 'Database is not ready. Please wait a moment and try again.',
          type: 'database_initialization',
          retryable: true,
          timestamp,
          statusCode: 503
        };
        
      case 'schema':
        return {
          error: 'Database schema validation failed',
          message: 'Database schema is corrupted. Please contact support.',
          type: 'database_schema',
          retryable: false,
          timestamp,
          statusCode: 500
        };
        
      case 'query':
        return {
          error: 'Database query failed',
          message: 'Unable to process request. Please try again.',
          type: 'database_query',
          retryable: true,
          timestamp,
          statusCode: 500
        };
        
      case 'validation':
        return {
          error: 'Data validation failed',
          message: dbError.message || 'Invalid data provided',
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
  console.error('Unhandled error:', error);
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
  
  // Log error for monitoring
  console.error('API Error Response:', {
    error: errorResponse,
    originalError: error,
    stack: error instanceof Error ? error.stack : undefined
  });
  
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
  operation: () => Promise<T>,
  operationName: string
): Promise<NextResponse> {
  try {
    const result = await operation();
    return createSuccessResponse(result);
  } catch (error) {
    console.error(`API operation failed (${operationName}):`, error);
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