// lib/db-turso.ts
import { ensureDatabaseReady, createDatabaseError, executeQuery, executeBatch } from './turso';
import { nanoid } from 'nanoid';
import { Project, ProjectLog } from './types';

// Database operation wrapper with error handling
async function withDatabaseOperation<T>(operation: () => Promise<T>, operationType: string): Promise<T> {
  try {
    await ensureDatabaseReady();
    return await operation();
  } catch (error) {
    console.error(`Database operation failed (${operationType}):`, error);
    
    if (error instanceof Error && 'type' in error) {
      throw error; // Re-throw database errors as-is
    }
    
    throw createDatabaseError('query', `${operationType} operation failed`, error);
  }
}

// Project related functions
export async function getProjects(): Promise<Project[]> {
  return withDatabaseOperation(async () => {
    // Use optimized query with caching for frequently accessed data
    const result = await executeQuery('SELECT * FROM projects ORDER BY created_at DESC', undefined, true);
    return result.rows.map(row => ({
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      createdAt: row.created_at as string,
      apiKey: row.api_key as string
    }));
  }, 'getProjects');
}

export async function getProject(id: string): Promise<Project | null> {
  return withDatabaseOperation(async () => {
    // Use optimized query with caching for single project lookups
    const result = await executeQuery('SELECT * FROM projects WHERE id = ?', [id], true);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      createdAt: row.created_at as string,
      apiKey: row.api_key as string
    };
  }, 'getProject');
}

export async function createProject(name: string, description: string = ''): Promise<Project> {
  return withDatabaseOperation(async () => {
    const id = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const apiKey = nanoid(32);
    const createdAt = new Date().toISOString();
    
    const project: Project = {
      id,
      name,
      description,
      createdAt,
      apiKey
    };
    
    // Use optimized query execution (no caching for writes)
    await executeQuery(
      'INSERT INTO projects (id, name, description, created_at, api_key) VALUES (?, ?, ?, ?, ?)',
      [id, name, description, createdAt, apiKey]
    );
    
    return project;
  }, 'createProject');
}

export async function updateProject(
  id: string, 
  updates: { name?: string; description?: string; id?: string }
): Promise<Project | null> {
  return withDatabaseOperation(async () => {
    const project = await getProject(id);
    if (!project) return null;
    
    const updatedProject = { ...project, ...updates };
    
    // If ID was changed, we need to create a new record and delete the old one
    if (updates.id && updates.id !== id) {
      // Use batch operations for better performance
      const operations = [
        {
          sql: 'INSERT INTO projects (id, name, description, created_at, api_key) VALUES (?, ?, ?, ?, ?)',
          args: [updates.id, updatedProject.name, updatedProject.description, updatedProject.createdAt, updatedProject.apiKey]
        },
        {
          sql: 'UPDATE logs SET project_id = ? WHERE project_id = ?',
          args: [updates.id, id]
        },
        {
          sql: 'DELETE FROM projects WHERE id = ?',
          args: [id]
        }
      ];
      
      await executeBatch(operations);
      return updatedProject;
    }
    
    // If no ID change, just update the existing record
    const setClause = [];
    const args = [];
    
    if (updates.name) {
      setClause.push('name = ?');
      args.push(updates.name);
    }
    
    if (updates.description !== undefined) {
      setClause.push('description = ?');
      args.push(updates.description);
    }
    
    if (setClause.length > 0) {
      args.push(id);
      await executeQuery(`UPDATE projects SET ${setClause.join(', ')} WHERE id = ?`, args);
    }
    
    return updatedProject;
  }, 'updateProject');
}

export async function deleteProject(id: string): Promise<boolean> {
  return withDatabaseOperation(async () => {
    // Use optimized query execution
    const result = await executeQuery('DELETE FROM projects WHERE id = ?', [id]);
    
    return result.rowsAffected > 0;
  }, 'deleteProject');
}

export async function hasProjectLogs(id: string): Promise<boolean> {
  return withDatabaseOperation(async () => {
    // Use optimized query with caching for count checks
    const result = await executeQuery('SELECT COUNT(*) as count FROM logs WHERE project_id = ?', [id], true);
    
    return (result.rows[0].count as number) > 0;
  }, 'hasProjectLogs');
}

// Log related functions
export async function getProjectLogs(projectId: string): Promise<ProjectLog[]> {
  return withDatabaseOperation(async () => {
    // Use optimized query with caching for log lists (frequently accessed)
    const result = await executeQuery(
      'SELECT id, project_id, timestamp, comment, is_read FROM logs WHERE project_id = ? ORDER BY timestamp DESC',
      [projectId],
      true
    );
    
    return result.rows.map(row => ({
      id: row.id as string,
      projectId: row.project_id as string,
      timestamp: row.timestamp as string,
      comment: row.comment as string || '',
      isRead: Boolean(row.is_read)
    }));
  }, 'getProjectLogs');
}

export async function getLog(logId: string): Promise<ProjectLog | null> {
  return withDatabaseOperation(async () => {
    // Use optimized query with caching for individual log details
    const result = await executeQuery('SELECT * FROM logs WHERE id = ?', [logId], true);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      id: row.id as string,
      projectId: row.project_id as string,
      timestamp: row.timestamp as string,
      comment: row.comment as string || '',
      isRead: Boolean(row.is_read),
      content: row.content as string
    };
  }, 'getLog');
}

export async function createLog(projectId: string, content: string, comment: string = ''): Promise<ProjectLog> {
  return withDatabaseOperation(async () => {
    const id = nanoid();
    const timestamp = new Date().toISOString();
    
    const log: ProjectLog = {
      id,
      projectId,
      timestamp,
      comment,
      isRead: false,
      content
    };
    
    // Use optimized query execution
    await executeQuery(
      'INSERT INTO logs (id, project_id, content, comment, timestamp, is_read) VALUES (?, ?, ?, ?, ?, ?)',
      [id, projectId, content, comment, timestamp, false]
    );
    
    return log;
  }, 'createLog');
}

export async function updateLog(logId: string, updates: { isRead?: boolean }): Promise<ProjectLog | null> {
  return withDatabaseOperation(async () => {
    const log = await getLog(logId);
    if (!log) return null;
    
    if (updates.isRead !== undefined) {
      // Use optimized query execution
      await executeQuery('UPDATE logs SET is_read = ? WHERE id = ?', [updates.isRead, logId]);
    }
    
    return {
      ...log,
      ...updates,
      content: undefined // Don't return content for efficiency
    };
  }, 'updateLog');
}

export async function deleteLog(logId: string): Promise<boolean> {
  return withDatabaseOperation(async () => {
    // Use optimized query execution
    const result = await executeQuery('DELETE FROM logs WHERE id = ?', [logId]);
    
    return result.rowsAffected > 0;
  }, 'deleteLog');
}

// Performance monitoring and optimization utilities
export async function getPerformanceStats(): Promise<{
  database: {
    queryCount: number;
    avgResponseTime: number;
    cacheSize: number;
    lastUsed: number;
  };
  operations: {
    totalOperations: number;
    averageLatency: number;
    cacheHitRate: string;
  };
}> {
  return withDatabaseOperation(async () => {
    const { getPerformanceMetrics } = await import('./turso');
    const metrics = getPerformanceMetrics();
    
    return {
      database: {
        queryCount: metrics.queryCount,
        avgResponseTime: metrics.responseTime,
        cacheSize: metrics.cacheSize,
        lastUsed: metrics.lastUsed
      },
      operations: {
        totalOperations: metrics.queryCount,
        averageLatency: metrics.responseTime,
        cacheHitRate: metrics.cacheSize > 0 ? 'cached' : 'not cached'
      }
    };
  }, 'getPerformanceStats');
}

// Batch operations for better performance
export async function createMultipleLogs(logs: Array<{
  projectId: string;
  content: string;
  comment?: string;
}>): Promise<ProjectLog[]> {
  return withDatabaseOperation(async () => {
    const timestamp = new Date().toISOString();
    const createdLogs: ProjectLog[] = [];
    
    // Prepare batch operations
    const operations = logs.map(logData => {
      const id = nanoid();
      const log: ProjectLog = {
        id,
        projectId: logData.projectId,
        timestamp,
        comment: logData.comment || '',
        isRead: false,
        content: logData.content
      };
      
      createdLogs.push(log);
      
      return {
        sql: 'INSERT INTO logs (id, project_id, content, comment, timestamp, is_read) VALUES (?, ?, ?, ?, ?, ?)',
        args: [id, logData.projectId, logData.content, logData.comment || '', timestamp, false]
      };
    });
    
    // Execute batch operation
    await executeBatch(operations);
    
    return createdLogs;
  }, 'createMultipleLogs');
}

// Cache management utilities
export async function clearDatabaseCache(): Promise<void> {
  const { clearQueryCache } = await import('./turso');
  clearQueryCache();
}

export async function warmupDatabaseConnection(): Promise<void> {
  const { warmupConnection } = await import('./turso');
  await warmupConnection();
}

// Utility function to get project by API key
export async function getProjectByApiKey(apiKey: string): Promise<Project | null> {
  return withDatabaseOperation(async () => {
    // Use optimized query with caching for API key lookups (frequently accessed)
    const result = await executeQuery('SELECT * FROM projects WHERE api_key = ?', [apiKey], true);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      createdAt: row.created_at as string,
      apiKey: row.api_key as string
    };
  }, 'getProjectByApiKey');
}