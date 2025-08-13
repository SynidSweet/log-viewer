/**
 * Comprehensive Database Operations Tests
 * 
 * Tests the database operation wrapper and error handling including:
 * - Database initialization retry logic
 * - Operation wrapper error handling
 * - Database connection failures
 * - Query execution error scenarios
 * 
 * Part of TEST-ERROR-001: Create comprehensive API error handling tests
 */

import { 
  ensureDatabaseReady, 
  createDatabaseError, 
  executeQuery, 
  executeBatch,
  DatabaseError 
} from '@/lib/turso';

import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  hasProjectLogs,
  getProjectLogs,
  createLog,
  getLog,
  updateLog,
  deleteLog
} from '@/lib/db-turso';

// Mock the turso module
jest.mock('@/lib/turso', () => ({
  ensureDatabaseReady: jest.fn(),
  createDatabaseError: jest.fn(),
  executeQuery: jest.fn(),
  executeBatch: jest.fn()
}));

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'mock-id-12345')
}));

const mockEnsureDatabaseReady = ensureDatabaseReady as jest.MockedFunction<typeof ensureDatabaseReady>;
const mockCreateDatabaseError = createDatabaseError as jest.MockedFunction<typeof createDatabaseError>;
const mockExecuteQuery = executeQuery as jest.MockedFunction<typeof executeQuery>;
const mockExecuteBatch = executeBatch as jest.MockedFunction<typeof executeBatch>;

describe('Database Operations Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Default successful database ready state
    mockEnsureDatabaseReady.mockResolvedValue(undefined);
    
    // Default error creation
    mockCreateDatabaseError.mockImplementation((type, message, originalError) => ({
      type,
      message,
      originalError
    } as DatabaseError));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Database Operation Wrapper', () => {
    it('should ensure database is ready before operations', async () => {
      mockExecuteQuery.mockResolvedValue({ rows: [] });

      await getProjects();

      expect(mockEnsureDatabaseReady).toHaveBeenCalledTimes(1);
      expect(mockExecuteQuery).toHaveBeenCalledAfter(mockEnsureDatabaseReady as jest.Mock);
    });

    it('should handle database initialization failures', async () => {
      const initError = new Error('Database initialization failed');
      mockEnsureDatabaseReady.mockRejectedValue(initError);

      await expect(getProjects()).rejects.toThrow();
      
      expect(console.error).toHaveBeenCalledWith(
        'Database operation failed (getProjects):',
        initError
      );
    });

    it('should handle database errors and re-throw them', async () => {
      const dbError: DatabaseError = {
        type: 'connection',
        message: 'Connection failed',
        originalError: new Error('DB connection error')
      };
      mockExecuteQuery.mockRejectedValue(dbError);

      await expect(getProjects()).rejects.toEqual(dbError);
      
      expect(console.error).toHaveBeenCalledWith(
        'Database operation failed (getProjects):',
        dbError
      );
    });

    it('should wrap non-database errors with createDatabaseError', async () => {
      const genericError = new Error('Generic error');
      const wrappedError = { type: 'query', message: 'getProjects operation failed' };
      
      mockExecuteQuery.mockRejectedValue(genericError);
      mockCreateDatabaseError.mockReturnValue(wrappedError as DatabaseError);

      await expect(getProjects()).rejects.toEqual(wrappedError);
      
      expect(mockCreateDatabaseError).toHaveBeenCalledWith(
        'query',
        'getProjects operation failed',
        genericError
      );
    });
  });

  describe('Project Operations', () => {
    describe('getProjects', () => {
      it('should retrieve and format projects correctly', async () => {
        const mockRows = [
          {
            id: 'project-1',
            name: 'Test Project',
            description: 'Test Description',
            created_at: '2025-01-01T00:00:00Z',
            api_key: 'test-api-key'
          }
        ];
        mockExecuteQuery.mockResolvedValue({ rows: mockRows });

        const result = await getProjects();

        expect(mockExecuteQuery).toHaveBeenCalledWith(
          'SELECT * FROM projects ORDER BY created_at DESC',
          undefined,
          true
        );
        expect(result).toEqual([{
          id: 'project-1',
          name: 'Test Project',
          description: 'Test Description',
          createdAt: '2025-01-01T00:00:00Z',
          apiKey: 'test-api-key'
        }]);
      });

      it('should handle empty project list', async () => {
        mockExecuteQuery.mockResolvedValue({ rows: [] });

        const result = await getProjects();

        expect(result).toEqual([]);
      });

      it('should use caching for optimization', async () => {
        mockExecuteQuery.mockResolvedValue({ rows: [] });

        await getProjects();

        expect(mockExecuteQuery).toHaveBeenCalledWith(
          expect.any(String),
          undefined,
          true // caching enabled
        );
      });
    });

    describe('getProject', () => {
      it('should retrieve single project by id', async () => {
        const mockRow = {
          id: 'project-1',
          name: 'Test Project',
          description: 'Test Description',
          created_at: '2025-01-01T00:00:00Z',
          api_key: 'test-api-key'
        };
        mockExecuteQuery.mockResolvedValue({ rows: [mockRow] });

        const result = await getProject('project-1');

        expect(mockExecuteQuery).toHaveBeenCalledWith(
          'SELECT * FROM projects WHERE id = ?',
          ['project-1'],
          true
        );
        expect(result).toEqual({
          id: 'project-1',
          name: 'Test Project',
          description: 'Test Description',
          createdAt: '2025-01-01T00:00:00Z',
          apiKey: 'test-api-key'
        });
      });

      it('should return null for non-existent project', async () => {
        mockExecuteQuery.mockResolvedValue({ rows: [] });

        const result = await getProject('non-existent');

        expect(result).toBeNull();
      });
    });

    describe('createProject', () => {
      it('should create project with generated API key', async () => {
        const projectData = {
          name: 'New Project',
          description: 'New Description'
        };
        const mockCreatedProject = {
          id: 'mock-id-12345',
          name: 'New Project',
          description: 'New Description',
          created_at: '2025-01-01T00:00:00Z',
          api_key: expect.stringMatching(/^mock-id-12345_/)
        };
        
        mockExecuteQuery.mockResolvedValue({ rows: [mockCreatedProject] });

        const result = await createProject(projectData);

        expect(mockExecuteQuery).toHaveBeenCalledWith(
          'INSERT INTO projects (id, name, description, api_key, created_at) VALUES (?, ?, ?, ?, ?) RETURNING *',
          [
            'mock-id-12345',
            'New Project',
            'New Description',
            expect.stringMatching(/^mock-id-12345_/),
            expect.any(String)
          ]
        );
        expect(result).toEqual({
          id: 'mock-id-12345',
          name: 'New Project',
          description: 'New Description',
          createdAt: '2025-01-01T00:00:00Z',
          apiKey: expect.stringMatching(/^mock-id-12345_/)
        });
      });

      it('should handle creation failures', async () => {
        const projectData = { name: 'Test', description: 'Test' };
        const dbError: DatabaseError = {
          type: 'query',
          message: 'Insert failed',
          originalError: new Error('Constraint violation')
        };
        
        mockExecuteQuery.mockRejectedValue(dbError);

        await expect(createProject(projectData)).rejects.toEqual(dbError);
      });
    });

    describe('updateProject', () => {
      it('should update project successfully', async () => {
        const updateData = { name: 'Updated Name', description: 'Updated Description' };
        const mockUpdatedProject = {
          id: 'project-1',
          name: 'Updated Name',
          description: 'Updated Description',
          created_at: '2025-01-01T00:00:00Z',
          api_key: 'existing-api-key'
        };
        
        mockExecuteQuery.mockResolvedValue({ rows: [mockUpdatedProject] });

        const result = await updateProject('project-1', updateData);

        expect(mockExecuteQuery).toHaveBeenCalledWith(
          'UPDATE projects SET name = ?, description = ? WHERE id = ? RETURNING *',
          ['Updated Name', 'Updated Description', 'project-1']
        );
        expect(result).toEqual({
          id: 'project-1',
          name: 'Updated Name',
          description: 'Updated Description',
          createdAt: '2025-01-01T00:00:00Z',
          apiKey: 'existing-api-key'
        });
      });

      it('should return null for non-existent project update', async () => {
        mockExecuteQuery.mockResolvedValue({ rows: [] });

        const result = await updateProject('non-existent', { name: 'Test' });

        expect(result).toBeNull();
      });
    });

    describe('deleteProject', () => {
      it('should delete project and return success', async () => {
        mockExecuteQuery.mockResolvedValue({ changes: 1 });

        const result = await deleteProject('project-1');

        expect(mockExecuteQuery).toHaveBeenCalledWith(
          'DELETE FROM projects WHERE id = ?',
          ['project-1']
        );
        expect(result).toBe(true);
      });

      it('should return false for non-existent project deletion', async () => {
        mockExecuteQuery.mockResolvedValue({ changes: 0 });

        const result = await deleteProject('non-existent');

        expect(result).toBe(false);
      });
    });
  });

  describe('Log Operations', () => {
    describe('hasProjectLogs', () => {
      it('should return true when project has logs', async () => {
        mockExecuteQuery.mockResolvedValue({ rows: [{ count: 5 }] });

        const result = await hasProjectLogs('project-1');

        expect(mockExecuteQuery).toHaveBeenCalledWith(
          'SELECT COUNT(*) as count FROM logs WHERE project_id = ?',
          ['project-1']
        );
        expect(result).toBe(true);
      });

      it('should return false when project has no logs', async () => {
        mockExecuteQuery.mockResolvedValue({ rows: [{ count: 0 }] });

        const result = await hasProjectLogs('project-1');

        expect(result).toBe(false);
      });
    });

    describe('getProjectLogs', () => {
      it('should retrieve project logs with pagination', async () => {
        const mockLogs = [
          {
            id: 'log-1',
            project_id: 'project-1',
            content: 'Log content',
            comment: 'Test comment',
            created_at: '2025-01-01T00:00:00Z'
          }
        ];
        mockExecuteQuery.mockResolvedValue({ rows: mockLogs });

        const result = await getProjectLogs('project-1', 10, 0);

        expect(mockExecuteQuery).toHaveBeenCalledWith(
          'SELECT * FROM logs WHERE project_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
          ['project-1', 10, 0],
          true
        );
        expect(result).toEqual([{
          id: 'log-1',
          projectId: 'project-1',
          content: 'Log content',
          comment: 'Test comment',
          createdAt: '2025-01-01T00:00:00Z'
        }]);
      });

      it('should handle default pagination parameters', async () => {
        mockExecuteQuery.mockResolvedValue({ rows: [] });

        await getProjectLogs('project-1');

        expect(mockExecuteQuery).toHaveBeenCalledWith(
          expect.any(String),
          ['project-1', 100, 0],
          true
        );
      });
    });

    describe('createLog', () => {
      it('should create log entry', async () => {
        const logData = {
          projectId: 'project-1',
          content: 'Log content',
          comment: 'Test comment'
        };
        const mockCreatedLog = {
          id: 'mock-id-12345',
          project_id: 'project-1',
          content: 'Log content',
          comment: 'Test comment',
          created_at: '2025-01-01T00:00:00Z'
        };
        
        mockExecuteQuery.mockResolvedValue({ rows: [mockCreatedLog] });

        const result = await createLog(logData);

        expect(mockExecuteQuery).toHaveBeenCalledWith(
          'INSERT INTO logs (id, project_id, content, comment, created_at) VALUES (?, ?, ?, ?, ?) RETURNING *',
          [
            'mock-id-12345',
            'project-1',
            'Log content',
            'Test comment',
            expect.any(String)
          ]
        );
        expect(result).toEqual({
          id: 'mock-id-12345',
          projectId: 'project-1',
          content: 'Log content',
          comment: 'Test comment',
          createdAt: '2025-01-01T00:00:00Z'
        });
      });

      it('should handle optional comment field', async () => {
        const logData = {
          projectId: 'project-1',
          content: 'Log content'
        };
        const mockCreatedLog = {
          id: 'mock-id-12345',
          project_id: 'project-1',
          content: 'Log content',
          comment: null,
          created_at: '2025-01-01T00:00:00Z'
        };
        
        mockExecuteQuery.mockResolvedValue({ rows: [mockCreatedLog] });

        const result = await createLog(logData);

        expect(mockExecuteQuery).toHaveBeenCalledWith(
          expect.any(String),
          [
            'mock-id-12345',
            'project-1',
            'Log content',
            undefined,
            expect.any(String)
          ]
        );
      });
    });

    describe('getLog', () => {
      it('should retrieve single log by id', async () => {
        const mockLog = {
          id: 'log-1',
          project_id: 'project-1',
          content: 'Log content',
          comment: 'Test comment',
          created_at: '2025-01-01T00:00:00Z'
        };
        mockExecuteQuery.mockResolvedValue({ rows: [mockLog] });

        const result = await getLog('log-1');

        expect(mockExecuteQuery).toHaveBeenCalledWith(
          'SELECT * FROM logs WHERE id = ?',
          ['log-1']
        );
        expect(result).toEqual({
          id: 'log-1',
          projectId: 'project-1',
          content: 'Log content',
          comment: 'Test comment',
          createdAt: '2025-01-01T00:00:00Z'
        });
      });

      it('should return null for non-existent log', async () => {
        mockExecuteQuery.mockResolvedValue({ rows: [] });

        const result = await getLog('non-existent');

        expect(result).toBeNull();
      });
    });

    describe('updateLog', () => {
      it('should update log successfully', async () => {
        const updateData = { content: 'Updated content', comment: 'Updated comment' };
        const mockUpdatedLog = {
          id: 'log-1',
          project_id: 'project-1',
          content: 'Updated content',
          comment: 'Updated comment',
          created_at: '2025-01-01T00:00:00Z'
        };
        
        mockExecuteQuery.mockResolvedValue({ rows: [mockUpdatedLog] });

        const result = await updateLog('log-1', updateData);

        expect(mockExecuteQuery).toHaveBeenCalledWith(
          'UPDATE logs SET content = ?, comment = ? WHERE id = ? RETURNING *',
          ['Updated content', 'Updated comment', 'log-1']
        );
        expect(result).toEqual({
          id: 'log-1',
          projectId: 'project-1',
          content: 'Updated content',
          comment: 'Updated comment',
          createdAt: '2025-01-01T00:00:00Z'
        });
      });

      it('should return null for non-existent log update', async () => {
        mockExecuteQuery.mockResolvedValue({ rows: [] });

        const result = await updateLog('non-existent', { content: 'Test' });

        expect(result).toBeNull();
      });
    });

    describe('deleteLog', () => {
      it('should delete log and return success', async () => {
        mockExecuteQuery.mockResolvedValue({ changes: 1 });

        const result = await deleteLog('log-1');

        expect(mockExecuteQuery).toHaveBeenCalledWith(
          'DELETE FROM logs WHERE id = ?',
          ['log-1']
        );
        expect(result).toBe(true);
      });

      it('should return false for non-existent log deletion', async () => {
        mockExecuteQuery.mockResolvedValue({ changes: 0 });

        const result = await deleteLog('non-existent');

        expect(result).toBe(false);
      });
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle database timeout errors', async () => {
      const timeoutError = new Error('Query timeout');
      (timeoutError as any).code = 'TIMEOUT';
      mockExecuteQuery.mockRejectedValue(timeoutError);

      await expect(getProjects()).rejects.toThrow();
      
      expect(console.error).toHaveBeenCalledWith(
        'Database operation failed (getProjects):',
        timeoutError
      );
    });

    it('should handle connection pool exhaustion', async () => {
      const poolError = new Error('Connection pool exhausted');
      mockEnsureDatabaseReady.mockRejectedValue(poolError);

      await expect(getProjects()).rejects.toThrow();
      
      expect(console.error).toHaveBeenCalledWith(
        'Database operation failed (getProjects):',
        poolError
      );
    });

    it('should handle malformed query responses', async () => {
      mockExecuteQuery.mockResolvedValue(null as any);

      await expect(getProjects()).rejects.toThrow();
    });

    it('should handle unexpected error formats', async () => {
      const weirdError = { unexpected: 'format' };
      mockExecuteQuery.mockRejectedValue(weirdError);

      await expect(getProjects()).rejects.toThrow();
      
      expect(mockCreateDatabaseError).toHaveBeenCalledWith(
        'query',
        'getProjects operation failed',
        weirdError
      );
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent read operations', async () => {
      mockExecuteQuery.mockResolvedValue({ rows: [] });

      const promises = [
        getProjects(),
        getProject('project-1'),
        getProjectLogs('project-1'),
        hasProjectLogs('project-1')
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(4);
      expect(mockEnsureDatabaseReady).toHaveBeenCalledTimes(4);
    });

    it('should handle concurrent write operations', async () => {
      mockExecuteQuery.mockResolvedValue({ rows: [{ id: 'test' }] });

      const promises = [
        createProject({ name: 'Test 1', description: 'Desc 1' }),
        createProject({ name: 'Test 2', description: 'Desc 2' }),
        createLog({ projectId: 'project-1', content: 'Log 1' }),
        createLog({ projectId: 'project-1', content: 'Log 2' })
      ];

      const results = await Promise.allSettled(promises);

      expect(results.every(r => r.status === 'fulfilled')).toBe(true);
    });
  });
});