/**
 * Comprehensive Logs API Tests
 * 
 * Tests the logs API endpoint including:
 * - API key validation and authentication
 * - Log content validation and parsing
 * - Error response handling via API wrapper
 * - Multi-line log support
 * - Database operation error scenarios
 * 
 * Part of TEST-ERROR-001: Create comprehensive API error handling tests
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/logs/route';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { getProject, createLog } from '@/lib/db-turso';
import { DatabaseError } from '@/lib/turso';

// Mock dependencies
jest.mock('@/lib/api-error-handler', () => ({
  withApiErrorHandling: jest.fn()
}));

jest.mock('@/lib/db-turso', () => ({
  getProject: jest.fn(),
  createLog: jest.fn()
}));

const mockWithApiErrorHandling = withApiErrorHandling as jest.MockedFunction<typeof withApiErrorHandling>;
const mockGetProject = getProject as jest.MockedFunction<typeof getProject>;
const mockCreateLog = createLog as jest.MockedFunction<typeof createLog>;

describe('Logs API Comprehensive Tests', () => {
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
        throw error; // Let the operation handle its own errors
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Successful Log Submission', () => {
    it('should accept valid log with proper format', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        description: 'Test',
        timestamp: '2025-01-01T00:00:00Z',
        apiKey: 'valid-api-key'
      };
      const mockCreatedLog = {
        id: 'log-1',
        projectId: 'project-1',
        content: '[2025-01-01, 10:30:00] [LOG] Test message',
        comment: 'Test comment',
        timestamp: '2025-01-01T00:00:00Z'
      };

      mockGetProject.mockResolvedValue(mockProject);
      mockCreateLog.mockResolvedValue(mockCreatedLog);

      const requestBody = {
        projectId: 'project-1',
        apiKey: 'valid-api-key',
        content: '[2025-01-01, 10:30:00] [LOG] Test message',
        comment: 'Test comment'
      };

      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      await POST(request);

      expect(mockWithApiErrorHandling).toHaveBeenCalledWith(
        expect.any(Function),
        'POST /api/logs'
      );

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      const result = await operationFunction();

      expect(result).toEqual({
        success: true,
        logId: 'log-1',
        timestamp: expect.any(String)
      });

      expect(mockGetProject).toHaveBeenCalledWith('project-1');
      expect(mockCreateLog).toHaveBeenCalledWith(
        'project-1',
        '[2025-01-01, 10:30:00] [LOG] Test message',
        'Test comment'
      );
    });

    it('should accept log without optional comment', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        description: 'Test',
        timestamp: '2025-01-01T00:00:00Z',
        apiKey: 'valid-api-key'
      };
      const mockCreatedLog = {
        id: 'log-1',
        projectId: 'project-1',
        content: '[2025-01-01, 10:30:00] [INFO] Info message',
        timestamp: '2025-01-01T00:00:00Z'
      };

      mockGetProject.mockResolvedValue(mockProject);
      mockCreateLog.mockResolvedValue(mockCreatedLog);

      const requestBody = {
        projectId: 'project-1',
        apiKey: 'valid-api-key',
        content: '[2025-01-01, 10:30:00] [INFO] Info message'
      };

      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      await POST(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      const result = await operationFunction();

      expect(mockCreateLog).toHaveBeenCalledWith(
        'project-1',
        '[2025-01-01, 10:30:00] [INFO] Info message',
        ''
      );
    });

    it('should accept multi-line log content', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        description: 'Test',
        timestamp: '2025-01-01T00:00:00Z',
        apiKey: 'valid-api-key'
      };
      const mockCreatedLog = {
        id: 'log-1',
        projectId: 'project-1',
        content: '[2025-01-01, 10:30:00] [LOG] First message\n[2025-01-01, 10:30:01] [ERROR] Second message',
        timestamp: '2025-01-01T00:00:00Z'
      };

      mockGetProject.mockResolvedValue(mockProject);
      mockCreateLog.mockResolvedValue(mockCreatedLog);

      const requestBody = {
        projectId: 'project-1',
        apiKey: 'valid-api-key',
        content: '[2025-01-01, 10:30:00] [LOG] First message\n[2025-01-01, 10:30:01] [ERROR] Second message'
      };

      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      await POST(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      const result = await operationFunction();

      expect(result.success).toBe(true);
      expect(result.logId).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should accept logs with JSON data', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        description: 'Test',
        timestamp: '2025-01-01T00:00:00Z',
        apiKey: 'valid-api-key'
      };
      const mockCreatedLog = {
        id: 'log-1',
        projectId: 'project-1',
        content: '[2025-01-01, 10:30:00] [LOG] Message - {"key": "value", "nested": {"data": 123}}',
        timestamp: '2025-01-01T00:00:00Z'
      };

      mockGetProject.mockResolvedValue(mockProject);
      mockCreateLog.mockResolvedValue(mockCreatedLog);

      const requestBody = {
        projectId: 'project-1',
        apiKey: 'valid-api-key',
        content: '[2025-01-01, 10:30:00] [LOG] Message - {"key": "value", "nested": {"data": 123}}'
      };

      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      await POST(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      const result = await operationFunction();

      expect(result.success).toBe(true);
      expect(result.logId).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('Validation Errors', () => {
    it('should reject requests with missing projectId', async () => {
      const requestBody = {
        apiKey: 'valid-api-key',
        content: '[2025-01-01, 10:30:00] [LOG] Test message'
      };

      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      await POST(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      
      await expect(operationFunction()).rejects.toEqual(
        expect.objectContaining({
          type: 'validation',
          message: expect.stringContaining('projectId')
        })
      );
    });

    it('should reject requests with missing apiKey', async () => {
      const requestBody = {
        projectId: 'project-1',
        content: '[2025-01-01, 10:30:00] [LOG] Test message'
      };

      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      await POST(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      
      await expect(operationFunction()).rejects.toEqual(
        expect.objectContaining({
          type: 'validation',
          message: expect.stringContaining('apiKey')
        })
      );
    });

    it('should reject requests with missing content', async () => {
      const requestBody = {
        projectId: 'project-1',
        apiKey: 'valid-api-key'
      };

      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      await POST(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      
      await expect(operationFunction()).rejects.toEqual(
        expect.objectContaining({
          type: 'validation',
          message: expect.stringContaining('content')
        })
      );
    });

    it('should reject requests with invalid log format', async () => {
      const requestBody = {
        projectId: 'project-1',
        apiKey: 'valid-api-key',
        content: 'Invalid log format without timestamp and level'
      };

      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      await POST(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      
      await expect(operationFunction()).rejects.toEqual(
        expect.objectContaining({
          type: 'validation',
          message: expect.stringContaining('Invalid log format')
        })
      );
    });

    it('should reject empty content', async () => {
      const requestBody = {
        projectId: 'project-1',
        apiKey: 'valid-api-key',
        content: ''
      };

      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      await POST(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      
      await expect(operationFunction()).rejects.toEqual(
        expect.objectContaining({
          type: 'validation',
          message: expect.stringContaining('content')
        })
      );
    });

    it('should reject malformed JSON requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        body: 'invalid json{',
        headers: { 'Content-Type': 'application/json' }
      });

      await POST(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      
      await expect(operationFunction()).rejects.toThrow();
    });
  });

  describe('Authentication Errors', () => {
    it('should reject requests with non-existent project', async () => {
      mockGetProject.mockResolvedValue(null);

      const requestBody = {
        projectId: 'non-existent-project',
        apiKey: 'some-api-key',
        content: '[2025-01-01, 10:30:00] [LOG] Test message'
      };

      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      await POST(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      
      await expect(operationFunction()).rejects.toEqual(
        expect.objectContaining({
          type: 'authentication',
          message: expect.stringContaining('Invalid project ID or API key')
        })
      );
    });

    it('should reject requests with invalid API key', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        description: 'Test',
        timestamp: '2025-01-01T00:00:00Z',
        apiKey: 'valid-api-key'
      };
      mockGetProject.mockResolvedValue(mockProject);

      const requestBody = {
        projectId: 'project-1',
        apiKey: 'invalid-api-key',
        content: '[2025-01-01, 10:30:00] [LOG] Test message'
      };

      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      await POST(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      
      await expect(operationFunction()).rejects.toEqual(
        expect.objectContaining({
          type: 'authentication',
          message: expect.stringContaining('Invalid project ID or API key')
        })
      );
    });
  });

  describe('Database Error Handling', () => {
    it('should handle database connection errors during project lookup', async () => {
      const connectionError: DatabaseError = {
        type: 'connection',
        message: 'Connection failed',
        originalError: new Error('DB connection error')
      };
      mockGetProject.mockRejectedValue(connectionError);

      const requestBody = {
        projectId: 'project-1',
        apiKey: 'valid-api-key',
        content: '[2025-01-01, 10:30:00] [LOG] Test message'
      };

      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      await POST(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      
      await expect(operationFunction()).rejects.toEqual(connectionError);
    });

    it('should handle database connection errors during log creation', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        description: 'Test',
        timestamp: '2025-01-01T00:00:00Z',
        apiKey: 'valid-api-key'
      };
      const createError: DatabaseError = {
        type: 'query',
        message: 'Insert failed',
        originalError: new Error('SQL error')
      };

      mockGetProject.mockResolvedValue(mockProject);
      mockCreateLog.mockRejectedValue(createError);

      const requestBody = {
        projectId: 'project-1',
        apiKey: 'valid-api-key',
        content: '[2025-01-01, 10:30:00] [LOG] Test message'
      };

      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      await POST(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      
      await expect(operationFunction()).rejects.toEqual(createError);
    });

    it('should handle database timeout errors', async () => {
      const timeoutError: DatabaseError = {
        type: 'query',
        message: 'Query timeout',
        originalError: new Error('Timeout')
      };
      mockGetProject.mockRejectedValue(timeoutError);

      const requestBody = {
        projectId: 'project-1',
        apiKey: 'valid-api-key',
        content: '[2025-01-01, 10:30:00] [LOG] Test message'
      };

      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      await POST(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      
      await expect(operationFunction()).rejects.toEqual(timeoutError);
    });
  });

  describe('Log Format Validation', () => {
    const validLogFormats = [
      '[2025-01-01, 10:30:00] [LOG] Simple message',
      '[2025-01-01, 10:30:00] [ERROR] Error message',
      '[2025-01-01, 10:30:00] [INFO] Info message',
      '[2025-01-01, 10:30:00] [WARN] Warning message',
      '[2025-01-01, 10:30:00] [DEBUG] Debug message',
      '[2025-01-01, 10:30:00] [LOG] Message with data - {"key": "value"}',
      '[2025-01-01, 10:30:00] [LOG] Message - Complex data object here',
    ];

    const invalidLogFormats = [
      'No timestamp or level',
      '[Invalid timestamp] [LOG] Message',
      '[2025-01-01, 10:30:00] [INVALID] Message',
      '[2025-01-01, 10:30:00] Message without level',
      'Just a plain text message',
      '[2025-01-01, 10:30:00]',
      '[LOG] Message without timestamp',
    ];

    validLogFormats.forEach((content, index) => {
      it(`should accept valid log format ${index + 1}: ${content.substring(0, 50)}...`, async () => {
        const mockProject = {
          id: 'project-1',
          name: 'Test Project',
          description: 'Test',
          timestamp: '2025-01-01T00:00:00Z',
          apiKey: 'valid-api-key'
        };
        const mockCreatedLog = {
          id: `log-${index + 1}`,
          projectId: 'project-1',
          content,
          timestamp: '2025-01-01T00:00:00Z'
        };

        mockGetProject.mockResolvedValue(mockProject);
        mockCreateLog.mockResolvedValue(mockCreatedLog);

        const requestBody = {
          projectId: 'project-1',
          apiKey: 'valid-api-key',
          content
        };

        const request = new NextRequest('http://localhost:3000/api/logs', {
          method: 'POST',
          body: JSON.stringify(requestBody)
        });

        await POST(request);

        const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
        const result = await operationFunction();

        expect(result.success).toBe(true);
      expect(result.logId).toBeDefined();
      expect(result.timestamp).toBeDefined();
        jest.clearAllMocks();
      });
    });

    invalidLogFormats.forEach((content, index) => {
      it(`should reject invalid log format ${index + 1}: ${content}`, async () => {
        const requestBody = {
          projectId: 'project-1',
          apiKey: 'valid-api-key',
          content
        };

        const request = new NextRequest('http://localhost:3000/api/logs', {
          method: 'POST',
          body: JSON.stringify(requestBody)
        });

        await POST(request);

        const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
        
        await expect(operationFunction()).rejects.toEqual(
          expect.objectContaining({
            type: 'validation',
            message: expect.stringContaining('Invalid log format')
          })
        );
        jest.clearAllMocks();
      });
    });
  });

  describe('Edge Cases and Robustness', () => {
    it('should handle very large log content', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        description: 'Test',
        timestamp: '2025-01-01T00:00:00Z',
        apiKey: 'valid-api-key'
      };
      const largeContent = '[2025-01-01, 10:30:00] [LOG] ' + 'A'.repeat(100000);
      const mockCreatedLog = {
        id: 'log-1',
        projectId: 'project-1',
        content: largeContent,
        timestamp: '2025-01-01T00:00:00Z'
      };

      mockGetProject.mockResolvedValue(mockProject);
      mockCreateLog.mockResolvedValue(mockCreatedLog);

      const requestBody = {
        projectId: 'project-1',
        apiKey: 'valid-api-key',
        content: largeContent
      };

      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      await POST(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      const result = await operationFunction();

      expect(result.success).toBe(true);
      expect(result.logId).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should handle special characters in log content', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        description: 'Test',
        timestamp: '2025-01-01T00:00:00Z',
        apiKey: 'valid-api-key'
      };
      const specialContent = '[2025-01-01, 10:30:00] [LOG] Special chars: àáâãäåæçèé €£¥ 中文 🚀';
      const mockCreatedLog = {
        id: 'log-1',
        projectId: 'project-1',
        content: specialContent,
        timestamp: '2025-01-01T00:00:00Z'
      };

      mockGetProject.mockResolvedValue(mockProject);
      mockCreateLog.mockResolvedValue(mockCreatedLog);

      const requestBody = {
        projectId: 'project-1',
        apiKey: 'valid-api-key',
        content: specialContent
      };

      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      await POST(request);

      const operationFunction = mockWithApiErrorHandling.mock.calls[0][0];
      const result = await operationFunction();

      expect(result.success).toBe(true);
      expect(result.logId).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should handle concurrent log submissions', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        description: 'Test',
        timestamp: '2025-01-01T00:00:00Z',
        apiKey: 'valid-api-key'
      };

      mockGetProject.mockResolvedValue(mockProject);
      mockCreateLog.mockImplementation(async (data) => ({
        id: `log-${Date.now()}`,
        projectId: data.projectId,
        content: data.content,
        comment: data.comment,
        createdAt: new Date().toISOString()
      }));

      const requests = Array.from({ length: 10 }, (_, i) => {
        const requestBody = {
          projectId: 'project-1',
          apiKey: 'valid-api-key',
          content: `[2025-01-01, 10:30:00] [LOG] Concurrent message ${i + 1}`
        };

        return new NextRequest('http://localhost:3000/api/logs', {
          method: 'POST',
          body: JSON.stringify(requestBody)
        });
      });

      const responses = await Promise.all(requests.map(request => POST(request)));

      expect(responses).toHaveLength(10);
      expect(mockWithApiErrorHandling).toHaveBeenCalledTimes(10);
    });
  });

  describe('API Wrapper Integration', () => {
    it('should use withApiErrorHandling wrapper correctly', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        description: 'Test',
        timestamp: '2025-01-01T00:00:00Z',
        apiKey: 'valid-api-key'
      };
      mockGetProject.mockResolvedValue(mockProject);
      mockCreateLog.mockResolvedValue({
        id: 'log-1',
        projectId: 'project-1',
        content: '[2025-01-01, 10:30:00] [LOG] Test',
        timestamp: '2025-01-01T00:00:00Z'
      });

      const requestBody = {
        projectId: 'project-1',
        apiKey: 'valid-api-key',
        content: '[2025-01-01, 10:30:00] [LOG] Test message'
      };

      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      await POST(request);

      expect(mockWithApiErrorHandling).toHaveBeenCalledTimes(1);
      expect(mockWithApiErrorHandling).toHaveBeenCalledWith(
        expect.any(Function),
        'POST /api/logs'
      );

      const [operationFunction, operationName] = mockWithApiErrorHandling.mock.calls[0];
      expect(operationName).toBe('POST /api/logs');
      expect(typeof operationFunction).toBe('function');
    });
  });
});