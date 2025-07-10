/**
 * Comprehensive Health Check API Tests
 * 
 * Tests the health check endpoint including:
 * - Database connectivity validation
 * - Error response handling
 * - API wrapper integration
 * - Various failure scenarios
 * 
 * Part of TEST-ERROR-001: Create comprehensive API error handling tests
 */

import { NextRequest } from 'next/server';
import { GET } from '../../../src/app/api/health/route';
import { withApiErrorHandling } from '../../../src/lib/api-error-handler';
import { ensureDatabaseReady, executeQuery, DatabaseError } from '../../../src/lib/turso';

// Mock dependencies
jest.mock('../../../src/lib/api-error-handler', () => ({
  withApiErrorHandling: jest.fn()
}));

jest.mock('../../../src/lib/turso', () => ({
  ensureDatabaseReady: jest.fn(),
  executeQuery: jest.fn()
}));

const mockWithApiErrorHandling = withApiErrorHandling as jest.MockedFunction<typeof withApiErrorHandling>;
const mockEnsureDatabaseReady = ensureDatabaseReady as jest.MockedFunction<typeof ensureDatabaseReady>;
const mockExecuteQuery = executeQuery as jest.MockedFunction<typeof executeQuery>;

describe('Health Check API Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock the API wrapper to execute the operation directly
    mockWithApiErrorHandling.mockImplementation(async (operation, name) => {
      try {
        const result = await operation();
        return {
          json: { success: true, data: result, timestamp: new Date().toISOString() },
          status: 200
        } as any;
      } catch (error) {
        return {
          json: { error: 'API Error', message: 'Operation failed', type: 'error', timestamp: new Date().toISOString(), statusCode: 500 },
          status: 500
        } as any;
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Successful Health Checks', () => {
    it('should return healthy status when database is accessible', async () => {
      mockEnsureDatabaseReady.mockResolvedValue(undefined);
      mockExecuteQuery.mockResolvedValue({ rows: [{ result: 1 }] });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(mockWithApiErrorHandling).toHaveBeenCalledWith(
        expect.any(Function),
        'health-check'
      );

      // Verify the operation function behavior
      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      const result = await operationFunction();

      expect(result).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        database: {
          status: 'connected',
          latency: expect.any(Number)
        },
        version: '1.0.0'
      });

      expect(mockEnsureDatabaseReady).toHaveBeenCalled();
      expect(mockExecuteQuery).toHaveBeenCalledWith('SELECT 1 as result');
    });

    it('should measure database latency accurately', async () => {
      mockEnsureDatabaseReady.mockResolvedValue(undefined);
      mockExecuteQuery.mockImplementation(async () => {
        // Simulate 50ms database latency
        await new Promise(resolve => setTimeout(resolve, 50));
        return { rows: [{ result: 1 }] };
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      await GET(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      const result = await operationFunction();

      expect(result.database.latency).toBeGreaterThanOrEqual(45);
      expect(result.database.latency).toBeLessThan(100);
    });

    it('should include correct timestamp format', async () => {
      mockEnsureDatabaseReady.mockResolvedValue(undefined);
      mockExecuteQuery.mockResolvedValue({ rows: [{ result: 1 }] });

      const request = new NextRequest('http://localhost:3000/api/health');
      await GET(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      const result = await operationFunction();

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Database Connection Failures', () => {
    it('should handle database initialization failures', async () => {
      const initError: DatabaseError = {
        type: 'initialization',
        message: 'Database initialization failed',
        originalError: new Error('Init failed')
      };
      mockEnsureDatabaseReady.mockRejectedValue(initError);

      const request = new NextRequest('http://localhost:3000/api/health');
      await GET(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      
      await expect(operationFunction()).rejects.toEqual(initError);
      expect(mockEnsureDatabaseReady).toHaveBeenCalled();
      expect(mockExecuteQuery).not.toHaveBeenCalled();
    });

    it('should handle database connection failures', async () => {
      const connectionError: DatabaseError = {
        type: 'connection',
        message: 'Connection failed',
        originalError: new Error('Network error')
      };
      mockEnsureDatabaseReady.mockResolvedValue(undefined);
      mockExecuteQuery.mockRejectedValue(connectionError);

      const request = new NextRequest('http://localhost:3000/api/health');
      await GET(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      
      await expect(operationFunction()).rejects.toEqual(connectionError);
      expect(mockEnsureDatabaseReady).toHaveBeenCalled();
      expect(mockExecuteQuery).toHaveBeenCalledWith('SELECT 1 as result');
    });

    it('should handle database timeout errors', async () => {
      const timeoutError: DatabaseError = {
        type: 'query',
        message: 'Query timeout',
        originalError: new Error('Timeout')
      };
      mockEnsureDatabaseReady.mockResolvedValue(undefined);
      mockExecuteQuery.mockRejectedValue(timeoutError);

      const request = new NextRequest('http://localhost:3000/api/health');
      await GET(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      
      await expect(operationFunction()).rejects.toEqual(timeoutError);
    });

    it('should handle database schema errors', async () => {
      const schemaError: DatabaseError = {
        type: 'schema',
        message: 'Schema validation failed',
        originalError: new Error('Schema error')
      };
      mockEnsureDatabaseReady.mockResolvedValue(undefined);
      mockExecuteQuery.mockRejectedValue(schemaError);

      const request = new NextRequest('http://localhost:3000/api/health');
      await GET(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      
      await expect(operationFunction()).rejects.toEqual(schemaError);
    });
  });

  describe('API Error Handling Integration', () => {
    it('should use withApiErrorHandling wrapper correctly', async () => {
      mockEnsureDatabaseReady.mockResolvedValue(undefined);
      mockExecuteQuery.mockResolvedValue({ rows: [{ result: 1 }] });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(mockWithApiErrorHandling).toHaveBeenCalledTimes(1);
      expect(mockWithApiErrorHandling).toHaveBeenCalledWith(
        expect.any(Function),
        'health-check'
      );

      const [operationFunction, operationName] = mockWithApiErrorHandling.mock.calls[0];
      expect(operationName).toBe('health-check');
      expect(typeof operationFunction).toBe('function');
    });

    it('should propagate errors through API wrapper', async () => {
      const dbError: DatabaseError = {
        type: 'connection',
        message: 'Connection failed',
        originalError: new Error('DB error')
      };
      
      // Mock the wrapper to actually handle the error
      mockWithApiErrorHandling.mockImplementation(async (operation, name) => {
        try {
          await operation();
          return { json: { success: true }, status: 200 } as any;
        } catch (error) {
          return {
            json: {
              error: 'Database connection failed',
              message: 'Unable to connect to database. Please try again later.',
              type: 'database_connection',
              retryable: true,
              timestamp: new Date().toISOString(),
              statusCode: 503
            },
            status: 503
          } as any;
        }
      });

      mockEnsureDatabaseReady.mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(mockWithApiErrorHandling).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Robustness', () => {
    it('should handle null database query results', async () => {
      mockEnsureDatabaseReady.mockResolvedValue(undefined);
      mockExecuteQuery.mockResolvedValue(null as any);

      const request = new NextRequest('http://localhost:3000/api/health');
      await GET(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      
      await expect(operationFunction()).rejects.toThrow();
    });

    it('should handle empty database query results', async () => {
      mockEnsureDatabaseReady.mockResolvedValue(undefined);
      mockExecuteQuery.mockResolvedValue({ rows: [] });

      const request = new NextRequest('http://localhost:3000/api/health');
      await GET(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      
      await expect(operationFunction()).rejects.toThrow();
    });

    it('should handle malformed database responses', async () => {
      mockEnsureDatabaseReady.mockResolvedValue(undefined);
      mockExecuteQuery.mockResolvedValue({ rows: [{ wrong_field: 'value' }] });

      const request = new NextRequest('http://localhost:3000/api/health');
      await GET(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      const result = await operationFunction();

      // Should still work even with unexpected response structure
      expect(result.status).toBe('healthy');
      expect(result.database.status).toBe('connected');
    });

    it('should handle very slow database responses', async () => {
      mockEnsureDatabaseReady.mockResolvedValue(undefined);
      mockExecuteQuery.mockImplementation(async () => {
        // Simulate very slow response (1 second)
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { rows: [{ result: 1 }] };
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      await GET(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      const result = await operationFunction();

      expect(result.database.latency).toBeGreaterThanOrEqual(1000);
      expect(result.status).toBe('healthy');
    });

    it('should handle concurrent health check requests', async () => {
      mockEnsureDatabaseReady.mockResolvedValue(undefined);
      mockExecuteQuery.mockResolvedValue({ rows: [{ result: 1 }] });

      const request = new NextRequest('http://localhost:3000/api/health');
      
      // Simulate concurrent requests
      const promises = Array.from({ length: 10 }, () => GET(request));
      const responses = await Promise.all(promises);

      expect(responses).toHaveLength(10);
      expect(mockWithApiErrorHandling).toHaveBeenCalledTimes(10);
      expect(mockEnsureDatabaseReady).toHaveBeenCalledTimes(10);
    });

    it('should handle unexpected errors during latency measurement', async () => {
      mockEnsureDatabaseReady.mockResolvedValue(undefined);
      
      // Mock Date.now to throw an error (edge case)
      const originalDateNow = Date.now;
      Date.now = jest.fn()
        .mockReturnValueOnce(1000) // First call succeeds
        .mockImplementation(() => { throw new Error('Time error'); }); // Second call fails

      mockExecuteQuery.mockResolvedValue({ rows: [{ result: 1 }] });

      const request = new NextRequest('http://localhost:3000/api/health');
      await GET(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      
      await expect(operationFunction()).rejects.toThrow();

      // Restore original function
      Date.now = originalDateNow;
    });
  });

  describe('Response Format Validation', () => {
    it('should return consistent response structure', async () => {
      mockEnsureDatabaseReady.mockResolvedValue(undefined);
      mockExecuteQuery.mockResolvedValue({ rows: [{ result: 1 }] });

      const request = new NextRequest('http://localhost:3000/api/health');
      await GET(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      const result = await operationFunction();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('version');
      
      expect(result.database).toHaveProperty('status');
      expect(result.database).toHaveProperty('latency');
      
      expect(typeof result.status).toBe('string');
      expect(typeof result.timestamp).toBe('string');
      expect(typeof result.database.status).toBe('string');
      expect(typeof result.database.latency).toBe('number');
      expect(typeof result.version).toBe('string');
    });

    it('should maintain consistent field types across responses', async () => {
      mockEnsureDatabaseReady.mockResolvedValue(undefined);
      mockExecuteQuery.mockResolvedValue({ rows: [{ result: 1 }] });

      const request = new NextRequest('http://localhost:3000/api/health');
      
      // Generate multiple responses
      const responses = await Promise.all([
        GET(request),
        GET(request),
        GET(request)
      ]);

      const results = await Promise.all(
        mockWithApiErrorHandling.mock.calls.map(([op]) => op())
      );

      results.forEach(result => {
        expect(result.status).toBe('healthy');
        expect(result.database.status).toBe('connected');
        expect(result.version).toBe('1.0.0');
        expect(typeof result.database.latency).toBe('number');
        expect(result.database.latency).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('HTTP Method Validation', () => {
    it('should only export GET method', () => {
      // Verify that only GET is exported from the route
      const module = require('../../../src/app/api/health/route');
      
      expect(module.GET).toBeDefined();
      expect(typeof module.GET).toBe('function');
      
      // Verify other methods are not exported
      expect(module.POST).toBeUndefined();
      expect(module.PUT).toBeUndefined();
      expect(module.DELETE).toBeUndefined();
      expect(module.PATCH).toBeUndefined();
    });

    it('should handle GET requests correctly', async () => {
      mockEnsureDatabaseReady.mockResolvedValue(undefined);
      mockExecuteQuery.mockResolvedValue({ rows: [{ result: 1 }] });

      const request = new NextRequest('http://localhost:3000/api/health', {
        method: 'GET'
      });
      
      const response = await GET(request);
      
      expect(mockWithApiErrorHandling).toHaveBeenCalled();
    });
  });
});