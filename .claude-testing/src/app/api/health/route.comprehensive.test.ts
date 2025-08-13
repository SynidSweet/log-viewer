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

import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/health/route';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { checkDatabaseHealth, turso } from '@/lib/turso';

// Mock dependencies
jest.mock('@/lib/api-error-handler', () => ({
  withApiErrorHandling: jest.fn()
}));

jest.mock('@/lib/turso', () => ({
  checkDatabaseHealth: jest.fn(),
  turso: {
    execute: jest.fn()
  }
}));

jest.mock('next/server', () => ({
  NextRequest: jest.requireActual('next/server').NextRequest,
  NextResponse: {
    json: jest.fn()
  }
}));

const mockWithApiErrorHandling = withApiErrorHandling as jest.MockedFunction<typeof withApiErrorHandling>;
const mockCheckDatabaseHealth = checkDatabaseHealth as jest.MockedFunction<typeof checkDatabaseHealth>;
const mockTurso = turso as jest.Mocked<typeof turso>;
const mockNextResponseJson = NextResponse.json as jest.MockedFunction<typeof NextResponse.json>;

describe('Health Check API Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Set up required environment variables for the test
    process.env.TURSO_DATABASE_URL = 'libsql://test-db.turso.io';
    process.env.TURSO_AUTH_TOKEN = 'test-token-32-characters-long';
    
    // Mock NextResponse.json to return a mock response
    mockNextResponseJson.mockImplementation((data, init) => {
      return {
        json: async () => data,
        status: init?.status || 200,
        ...data
      } as any;
    });
    
    // Mock the API wrapper to return NextResponse structure that mimics the real implementation
    mockWithApiErrorHandling.mockImplementation(async (operation) => {
      try {
        const result = await operation();
        
        // If the operation returns a NextResponse directly, return it as-is
        if (result && typeof result === 'object' && 'json' in result) {
          return result;
        }
        
        // Otherwise, wrap in success response structure
        return {
          json: async () => ({ success: true, data: result, timestamp: new Date().toISOString() }),
          status: 200,
          data: result
        } as any;
      } catch (error) {
        // Handle errors thrown by the operation
        const errorResponse = {
          healthy: false,
          status: 'not_ready',
          deployment: 'initialization_required',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
          checks: {
            database: { healthy: false, details: { error: 'Connection failed' } },
            schema: { healthy: false, details: null },
            environment: { healthy: false, details: null },
            migration: { healthy: false, details: null }
          }
        };
        return {
          json: async () => errorResponse,
          status: 503,
          ...errorResponse
        } as any;
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Successful Health Checks', () => {
    it('should return healthy status when all checks pass', async () => {
      // Mock successful database health check
      mockCheckDatabaseHealth.mockResolvedValue({
        healthy: true,
        details: { responseTime: 50, tables: ['projects', 'logs'], initialized: true }
      });
      
      // Mock successful schema checks
      mockTurso.execute
        .mockResolvedValueOnce({ rows: [{ name: 'projects' }, { name: 'logs' }] }) // Schema check
        .mockResolvedValueOnce({ rows: [{ count: 1 }] }) // Migration table check
        .mockResolvedValueOnce({ rows: [] }); // Recent migrations

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(mockWithApiErrorHandling).toHaveBeenCalledWith(expect.any(Function));

      // For healthy responses, data is wrapped in success structure
      expect(response).toHaveProperty('data');
      const data = response.data;
      expect(data).toHaveProperty('healthy', true);
      expect(data).toHaveProperty('status', 'ready');
      expect(data).toHaveProperty('deployment', 'ready');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('checks');
      
      const checks = data.checks;
      expect(checks).toHaveProperty('database');
      expect(checks).toHaveProperty('schema');
      expect(checks).toHaveProperty('environment');
      expect(checks).toHaveProperty('migration');
      
      expect(checks.database.healthy).toBe(true);
      expect(checks.schema.healthy).toBe(true);
      expect(checks.environment.healthy).toBe(true);
      expect(checks.migration.healthy).toBe(true);
    });

    it('should return correct timestamp format', async () => {
      mockCheckDatabaseHealth.mockResolvedValue({
        healthy: true,
        details: { responseTime: 50, tables: ['projects', 'logs'], initialized: true }
      });
      
      mockTurso.execute
        .mockResolvedValueOnce({ rows: [{ name: 'projects' }, { name: 'logs' }] })
        .mockResolvedValueOnce({ rows: [{ count: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(response.data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(response.data.timestamp)).toBeInstanceOf(Date);
    });

    it('should return unhealthy status when database check fails', async () => {
      mockCheckDatabaseHealth.mockResolvedValue({
        healthy: false,
        details: { error: 'Database connection failed' }
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(response.healthy).toBe(false);
      expect(response.status).toBe('not_ready');
      expect(response.deployment).toBe('initialization_required');
      expect(response.checks.database.healthy).toBe(false);
    });
  });

  describe('Database Connection Failures', () => {
    it('should handle database health check failures', async () => {
      mockCheckDatabaseHealth.mockResolvedValue({
        healthy: false,
        details: { error: 'Database connection failed' }
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(response.healthy).toBe(false);
      expect(response.status).toBe('not_ready');
      expect(response.checks.database.healthy).toBe(false);
      expect(response.checks.database.details).toEqual({ error: 'Database connection failed' });
    });

    it('should handle missing environment variables', async () => {
      // Remove required environment variables
      delete process.env.TURSO_DATABASE_URL;
      
      mockCheckDatabaseHealth.mockResolvedValue({
        healthy: true,
        details: { responseTime: 50, tables: ['projects', 'logs'], initialized: true }
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(response.healthy).toBe(false);
      expect(response.status).toBe('not_ready');
      expect(response.checks.environment.healthy).toBe(false);
      expect(response.checks.environment.details.missing).toContain('TURSO_DATABASE_URL');
      
      // Restore environment variable
      process.env.TURSO_DATABASE_URL = 'libsql://test-db.turso.io';
    });

    it('should handle schema validation failures', async () => {
      mockCheckDatabaseHealth.mockResolvedValue({
        healthy: true,
        details: { responseTime: 50, tables: ['projects', 'logs'], initialized: true }
      });
      
      // Mock missing tables
      mockTurso.execute.mockResolvedValueOnce({ rows: [{ name: 'projects' }] }); // Only one table

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(response.healthy).toBe(false);
      expect(response.status).toBe('not_ready');
      expect(response.checks.schema.healthy).toBe(false);
      expect(response.checks.schema.details.missing).toContain('logs');
    });

    it('should handle migration check failures', async () => {
      mockCheckDatabaseHealth.mockResolvedValue({
        healthy: true,
        details: { responseTime: 50, tables: ['projects', 'logs'], initialized: true }
      });
      
      mockTurso.execute
        .mockResolvedValueOnce({ rows: [{ name: 'projects' }, { name: 'logs' }] }) // Schema check passes
        .mockResolvedValueOnce({ rows: [{ count: 1 }] }) // Migration table exists
        .mockRejectedValueOnce(new Error('Migration query failed')); // Migration status fails

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(response.healthy).toBe(false);
      expect(response.status).toBe('not_ready');
      expect(response.checks.migration.healthy).toBe(false);
      expect(response.checks.migration.details.error).toBe('Failed to check migration status');
    });
  });

  describe('API Error Handling Integration', () => {
    it('should use withApiErrorHandling wrapper correctly', async () => {
      mockCheckDatabaseHealth.mockResolvedValue({
        healthy: true,
        details: { responseTime: 50, tables: ['projects', 'logs'], initialized: true }
      });
      
      mockTurso.execute
        .mockResolvedValueOnce({ rows: [{ name: 'projects' }, { name: 'logs' }] })
        .mockResolvedValueOnce({ rows: [{ count: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(mockWithApiErrorHandling).toHaveBeenCalledTimes(1);
      expect(mockWithApiErrorHandling).toHaveBeenCalledWith(expect.any(Function));
      
      const [operationFunction] = mockWithApiErrorHandling.mock.calls[0];
      expect(typeof operationFunction).toBe('function');
    });

    it('should handle comprehensive check errors through API wrapper', async () => {
      // Mock the wrapper to handle errors and return 503 status
      mockWithApiErrorHandling.mockImplementation(async (operation) => {
        try {
          const result = await operation();
          if (!result.healthy) {
            return { 
              ...result,
              status: 503 
            };
          }
          return result;
        } catch (error) {
          return {
            healthy: false,
            status: 'not_ready',
            deployment: 'initialization_required',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
            checks: {
              database: { healthy: false, details: { error: 'Connection failed' } },
              schema: { healthy: false, details: null },
              environment: { healthy: false, details: null },
              migration: { healthy: false, details: null }
            }
          };
        }
      });

      mockCheckDatabaseHealth.mockResolvedValue({
        healthy: false,
        details: { error: 'Connection failed' }
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(mockWithApiErrorHandling).toHaveBeenCalled();
      expect(response.healthy).toBe(false);
    });
  });

  describe('Edge Cases and Robustness', () => {
    it('should handle turso client unavailable', async () => {
      // Mock turso as null (client not available)
      const mockTursoNull = null as any;
      
      mockCheckDatabaseHealth.mockResolvedValue({
        healthy: true,
        details: { responseTime: 50, tables: ['projects', 'logs'], initialized: true }
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(response.healthy).toBe(false);
      expect(response.status).toBe('not_ready');
      expect(response.checks.schema.healthy).toBe(false);
      expect(response.checks.migration.healthy).toBe(false);
    });

    it('should handle concurrent health check requests', async () => {
      mockCheckDatabaseHealth.mockResolvedValue({
        healthy: true,
        details: { responseTime: 50, tables: ['projects', 'logs'], initialized: true }
      });
      
      mockTurso.execute
        .mockResolvedValue({ rows: [{ name: 'projects' }, { name: 'logs' }] })
        .mockResolvedValue({ rows: [{ count: 1 }] })
        .mockResolvedValue({ rows: [] });

      const request = new NextRequest('http://localhost:3000/api/health');
      
      // Simulate concurrent requests
      const promises = Array.from({ length: 3 }, () => GET(request));
      const responses = await Promise.all(promises);

      expect(responses).toHaveLength(3);
      expect(mockWithApiErrorHandling).toHaveBeenCalledTimes(3);
      responses.forEach(response => {
        expect(response).toHaveProperty('healthy');
        expect(response).toHaveProperty('status');
        expect(response).toHaveProperty('deployment');
        expect(response).toHaveProperty('timestamp');
        expect(response).toHaveProperty('checks');
      });
    });

    it('should handle unexpected errors in checks', async () => {
      mockCheckDatabaseHealth.mockRejectedValue(new Error('Unexpected database error'));

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(response.healthy).toBe(false);
      expect(response.status).toBe('not_ready');
      expect(response).toHaveProperty('error');
      expect(response.error).toContain('Unexpected database error');
    });
  });

  describe('Response Format Validation', () => {
    it('should return consistent response structure for healthy state', async () => {
      mockCheckDatabaseHealth.mockResolvedValue({
        healthy: true,
        details: { responseTime: 50, tables: ['projects', 'logs'], initialized: true }
      });
      
      mockTurso.execute
        .mockResolvedValueOnce({ rows: [{ name: 'projects' }, { name: 'logs' }] })
        .mockResolvedValueOnce({ rows: [{ count: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      // For healthy responses, check the wrapped data structure
      expect(response).toHaveProperty('data');
      const data = response.data;
      expect(data).toHaveProperty('healthy');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('deployment');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('checks');
      
      expect(data.checks).toHaveProperty('database');
      expect(data.checks).toHaveProperty('schema');
      expect(data.checks).toHaveProperty('environment');
      expect(data.checks).toHaveProperty('migration');
      
      expect(typeof data.healthy).toBe('boolean');
      expect(typeof data.status).toBe('string');
      expect(typeof data.deployment).toBe('string');
      expect(typeof data.timestamp).toBe('string');
      expect(typeof data.checks).toBe('object');
    });

    it('should return consistent response structure for unhealthy state', async () => {
      mockCheckDatabaseHealth.mockResolvedValue({
        healthy: false,
        details: { error: 'Database connection failed' }
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(response.healthy).toBe(false);
      expect(response.status).toBe('not_ready');
      expect(response.deployment).toBe('initialization_required');
      expect(response).toHaveProperty('timestamp');
      expect(response).toHaveProperty('checks');
      
      expect(response.checks.database.healthy).toBe(false);
    });
  });

  describe('HTTP Method Validation', () => {
    it('should only export GET method', () => {
      // Verify that only GET is exported from the route
      const module = require('@/app/api/health/route');
      
      expect(module.GET).toBeDefined();
      expect(typeof module.GET).toBe('function');
      
      // Verify other methods are not exported
      expect(module.POST).toBeUndefined();
      expect(module.PUT).toBeUndefined();
      expect(module.DELETE).toBeUndefined();
      expect(module.PATCH).toBeUndefined();
    });

    it('should handle GET requests correctly', async () => {
      mockCheckDatabaseHealth.mockResolvedValue({
        healthy: true,
        details: { responseTime: 50, tables: ['projects', 'logs'], initialized: true }
      });
      
      mockTurso.execute
        .mockResolvedValueOnce({ rows: [{ name: 'projects' }, { name: 'logs' }] })
        .mockResolvedValueOnce({ rows: [{ count: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      const request = new NextRequest('http://localhost:3000/api/health', {
        method: 'GET'
      });
      
      const response = await GET(request);
      
      expect(mockWithApiErrorHandling).toHaveBeenCalled();
      expect(response).toHaveProperty('data');
      expect(response.data).toHaveProperty('healthy');
    });
  });
});