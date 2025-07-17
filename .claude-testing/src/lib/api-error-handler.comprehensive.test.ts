/**
 * Comprehensive API Error Handling Tests
 * 
 * Tests the complete error handling system including:
 * - Database error classification and formatting
 * - Error response creation
 * - API wrapper error handling
 * - Environment variable validation
 * 
 * Part of TEST-ERROR-001: Create comprehensive API error handling tests
 */

import { NextResponse } from 'next/server';
import { 
  classifyAndFormatError, 
  createErrorResponse, 
  createSuccessResponse, 
  withApiErrorHandling,
  validateEnvironmentVariables,
  ApiErrorResponse,
  ApiSuccessResponse
} from '../../../src/lib/api-error-handler';
import { DatabaseError } from '../../../src/lib/turso';

// Mock Next.js dependencies
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: data,
      status: options?.status || 200,
      headers: options?.headers || {}
    }))
  }
}));

describe('API Error Handler Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Database Error Classification', () => {
    it('should classify connection errors correctly', () => {
      const connectionError: DatabaseError = {
        type: 'connection',
        message: 'Unable to connect to database',
        originalError: new Error('Connection failed')
      };

      const result = classifyAndFormatError(connectionError);

      expect(result).toEqual({
        error: 'Database connection failed',
        message: 'Unable to connect to database. Please verify database configuration and try again.',
        type: 'database_connection',
        retryable: true,
        timestamp: expect.any(String),
        statusCode: 503
      });
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should classify initialization errors correctly', () => {
      const initError: DatabaseError = {
        type: 'initialization',
        message: 'Database initialization failed',
        originalError: new Error('Init failed')
      };

      const result = classifyAndFormatError(initError);

      expect(result).toEqual({
        error: 'Database initialization failed',
        message: 'Database initialization in progress. Please wait a moment and try again. If this persists, check /api/health for more details.',
        type: 'database_initialization',
        retryable: true,
        timestamp: expect.any(String),
        statusCode: 503
      });
    });

    it('should classify schema errors correctly', () => {
      const schemaError: DatabaseError = {
        type: 'schema',
        message: 'Schema validation failed',
        originalError: new Error('Schema error')
      };

      const result = classifyAndFormatError(schemaError);

      expect(result).toEqual({
        error: 'Database schema validation failed',
        message: 'Database schema integrity issue detected. This may require database maintenance. Contact support if this persists.',
        type: 'database_schema',
        retryable: false,
        timestamp: expect.any(String),
        statusCode: 500
      });
    });

    it('should classify query errors correctly', () => {
      const queryError: DatabaseError = {
        type: 'query',
        message: 'Query failed',
        originalError: new Error('SQL error')
      };

      const result = classifyAndFormatError(queryError);

      expect(result).toEqual({
        error: 'Database query failed',
        message: 'Database operation failed. Please try again. If this persists, check system status.',
        type: 'database_query',
        retryable: true,
        timestamp: expect.any(String),
        statusCode: 500
      });
    });

    it('should classify validation errors correctly', () => {
      const validationError: DatabaseError = {
        type: 'validation',
        message: 'Invalid data provided',
        originalError: new Error('Validation failed')
      };

      const result = classifyAndFormatError(validationError);

      expect(result).toEqual({
        error: 'Data validation failed',
        message: 'Invalid data provided',
        type: 'validation',
        retryable: false,
        timestamp: expect.any(String),
        statusCode: 400
      });
    });
  });

  describe('Standard Error Classification', () => {
    it('should classify authentication errors', () => {
      const authError = new Error('authentication failed');

      const result = classifyAndFormatError(authError);

      expect(result).toEqual({
        error: 'Authentication error',
        message: 'Invalid credentials or insufficient permissions',
        type: 'authentication',
        retryable: false,
        timestamp: expect.any(String),
        statusCode: 401
      });
    });

    it('should classify unauthorized errors', () => {
      const unauthorizedError = new Error('unauthorized access');

      const result = classifyAndFormatError(unauthorizedError);

      expect(result).toEqual({
        error: 'Authentication error',
        message: 'Invalid credentials or insufficient permissions',
        type: 'authentication',
        retryable: false,
        timestamp: expect.any(String),
        statusCode: 401
      });
    });

    it('should classify validation errors from Error messages', () => {
      const validationError = new Error('validation failed: email is required');

      const result = classifyAndFormatError(validationError);

      expect(result).toEqual({
        error: 'Validation error',
        message: 'validation failed: email is required',
        type: 'validation',
        retryable: false,
        timestamp: expect.any(String),
        statusCode: 400
      });
    });

    it('should classify not found errors', () => {
      const notFoundError = new Error('Resource not found');

      const result = classifyAndFormatError(notFoundError);

      expect(result).toEqual({
        error: 'Resource not found',
        message: 'The requested resource was not found',
        type: 'not_found',
        retryable: false,
        timestamp: expect.any(String),
        statusCode: 404
      });
    });

    it('should classify timeout errors', () => {
      const timeoutError = new Error('timeout exceeded');

      const result = classifyAndFormatError(timeoutError);

      expect(result).toEqual({
        error: 'Request timeout',
        message: 'The request took too long to complete. Please try again.',
        type: 'timeout',
        retryable: true,
        timestamp: expect.any(String),
        statusCode: 504
      });
    });

    it('should classify timeout errors with code property', () => {
      const timeoutError = new Error('Request failed');
      (timeoutError as any).code = 'TIMEOUT';

      const result = classifyAndFormatError(timeoutError);

      expect(result).toEqual({
        error: 'Request timeout',
        message: 'The request took too long to complete. Please try again.',
        type: 'timeout',
        retryable: true,
        timestamp: expect.any(String),
        statusCode: 504
      });
    });

    it('should handle generic server errors', () => {
      const genericError = new Error('Something went wrong');

      const result = classifyAndFormatError(genericError);

      expect(result).toEqual({
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again later.',
        type: 'server_error',
        retryable: true,
        timestamp: expect.any(String),
        statusCode: 500
      });
    });

    it('should handle non-Error objects', () => {
      const nonError = 'string error';

      const result = classifyAndFormatError(nonError);

      expect(result).toEqual({
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again later.',
        type: 'server_error',
        retryable: true,
        timestamp: expect.any(String),
        statusCode: 500
      });
    });

    it('should handle null and undefined errors', () => {
      const nullResult = classifyAndFormatError(null);
      const undefinedResult = classifyAndFormatError(undefined);

      expect(nullResult.type).toBe('server_error');
      expect(undefinedResult.type).toBe('server_error');
    });
  });

  describe('Error Response Creation', () => {
    it('should create error response with correct structure', () => {
      const error = new Error('Test error');
      const response = createErrorResponse(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error',
          message: 'An unexpected error occurred. Please try again later.',
          type: 'server_error',
          retryable: true,
          timestamp: expect.any(String),
          statusCode: 500
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        }
      );
    });

    it('should log error for monitoring', () => {
      const error = new Error('Test error with stack');
      error.stack = 'Error: Test error\\n    at test';

      createErrorResponse(error);

      expect(console.error).toHaveBeenCalledWith('API Error Response:', {
        error: expect.any(Object),
        originalError: error,
        stack: error.stack
      });
    });

    it('should handle errors without stack traces', () => {
      const error = { message: 'No stack trace' };

      createErrorResponse(error);

      expect(console.error).toHaveBeenCalledWith('API Error Response:', {
        error: expect.any(Object),
        originalError: error,
        stack: undefined
      });
    });
  });

  describe('Success Response Creation', () => {
    it('should create success response with default status', () => {
      const data = { message: 'Success' };
      const response = createSuccessResponse(data);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: true,
          data,
          timestamp: expect.any(String)
        },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('should create success response with custom status', () => {
      const data = { id: 123 };
      const response = createSuccessResponse(data, 201);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: true,
          data,
          timestamp: expect.any(String)
        },
        {
          status: 201,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('should handle null data', () => {
      const response = createSuccessResponse(null);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: true,
          data: null,
          timestamp: expect.any(String)
        },
        expect.any(Object)
      );
    });
  });

  describe('API Wrapper Error Handling', () => {
    it('should handle successful operations', async () => {
      const mockData = { result: 'success' };
      const mockOperation = jest.fn().mockResolvedValue(mockData);

      const response = await withApiErrorHandling(mockOperation, 'test-operation');

      expect(mockOperation).toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: true,
          data: mockData,
          timestamp: expect.any(String)
        },
        expect.any(Object)
      );
    });

    it('should handle operation failures', async () => {
      const mockError = new Error('Operation failed');
      const mockOperation = jest.fn().mockRejectedValue(mockError);

      const response = await withApiErrorHandling(mockOperation, 'test-operation');

      expect(mockOperation).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'API operation failed (test-operation):',
        mockError
      );
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error',
          type: 'server_error'
        }),
        expect.any(Object)
      );
    });

    it('should handle database errors in operations', async () => {
      const databaseError: DatabaseError = {
        type: 'connection',
        message: 'Connection failed',
        originalError: new Error('DB error')
      };
      const mockOperation = jest.fn().mockRejectedValue(databaseError);

      const response = await withApiErrorHandling(mockOperation, 'db-operation');

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Database connection failed',
          type: 'database_connection',
          retryable: true,
          statusCode: 503
        }),
        { status: 503, headers: expect.any(Object) }
      );
    });

    it('should handle async operation timeouts', async () => {
      const timeoutError = new Error('Operation timeout');
      (timeoutError as any).code = 'TIMEOUT';
      const mockOperation = jest.fn().mockRejectedValue(timeoutError);

      const response = await withApiErrorHandling(mockOperation, 'timeout-operation');

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Request timeout',
          type: 'timeout',
          retryable: true,
          statusCode: 504
        }),
        { status: 504, headers: expect.any(Object) }
      );
    });
  });

  describe('Environment Variable Validation', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should validate required environment variables exist', () => {
      process.env.TEST_VAR = 'value';
      process.env.ANOTHER_VAR = 'another_value';

      expect(() => {
        validateEnvironmentVariables(['TEST_VAR', 'ANOTHER_VAR']);
      }).not.toThrow();
    });

    it('should throw error for missing environment variables', () => {
      delete process.env.MISSING_VAR;

      expect(() => {
        validateEnvironmentVariables(['MISSING_VAR']);
      }).toThrow('Missing required environment variables: MISSING_VAR');
    });

    it('should handle multiple missing environment variables', () => {
      delete process.env.FIRST_MISSING;
      delete process.env.SECOND_MISSING;

      expect(() => {
        validateEnvironmentVariables(['FIRST_MISSING', 'SECOND_MISSING']);
      }).toThrow('Missing required environment variables: FIRST_MISSING, SECOND_MISSING');
    });

    it('should handle empty array of required variables', () => {
      expect(() => {
        validateEnvironmentVariables([]);
      }).not.toThrow();
    });

    it('should handle environment variables with empty values', () => {
      process.env.EMPTY_VAR = '';

      expect(() => {
        validateEnvironmentVariables(['EMPTY_VAR']);
      }).toThrow('Missing required environment variables: EMPTY_VAR');
    });
  });

  describe('Error Type Consistency', () => {
    it('should maintain consistent error structure across all error types', () => {
      const errors = [
        new Error('authentication failed'),
        new Error('validation failed'),
        new Error('not found'),
        new Error('timeout'),
        { type: 'connection' } as DatabaseError,
        'string error',
        null,
        undefined
      ];

      errors.forEach(error => {
        const result = classifyAndFormatError(error);
        
        expect(result).toHaveProperty('error');
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('type');
        expect(result).toHaveProperty('timestamp');
        expect(result).toHaveProperty('statusCode');
        expect(typeof result.retryable).toBe('boolean');
        expect(typeof result.error).toBe('string');
        expect(typeof result.message).toBe('string');
        expect(typeof result.type).toBe('string');
        expect(typeof result.timestamp).toBe('string');
        expect(typeof result.statusCode).toBe('number');
      });
    });

    it('should have valid HTTP status codes', () => {
      const errors = [
        { type: 'connection' } as DatabaseError,
        { type: 'initialization' } as DatabaseError,
        { type: 'schema' } as DatabaseError,
        { type: 'query' } as DatabaseError,
        { type: 'validation' } as DatabaseError,
        new Error('authentication failed'),
        new Error('not found'),
        new Error('timeout'),
        new Error('generic error')
      ];

      errors.forEach(error => {
        const result = classifyAndFormatError(error);
        expect(result.statusCode).toBeGreaterThanOrEqual(400);
        expect(result.statusCode).toBeLessThan(600);
      });
    });
  });

  describe('Edge Cases and Robustness', () => {
    it('should handle circular reference errors', () => {
      const circularError: any = { message: 'circular' };
      circularError.self = circularError;

      expect(() => {
        classifyAndFormatError(circularError);
      }).not.toThrow();
    });

    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(10000);
      const error = new Error(longMessage);

      const result = classifyAndFormatError(error);
      expect(result.message).toBeDefined();
      expect(typeof result.message).toBe('string');
    });

    it('should handle errors with special characters', () => {
      const error = new Error('Error with special chars: àáâãäåæçèé €£¥');

      const result = classifyAndFormatError(error);
      expect(result.message).toBe('An unexpected error occurred. Please try again later.');
      expect(result.type).toBe('server_error');
    });

    it('should handle concurrent error processing', async () => {
      const errors = Array.from({ length: 100 }, (_, i) => new Error(`Error ${i}`));
      
      const promises = errors.map(error => 
        Promise.resolve().then(() => classifyAndFormatError(error))
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(100);
      results.forEach((result, index) => {
        expect(result.type).toBe('server_error');
        expect(result.timestamp).toBeDefined();
      });
    });
  });
});