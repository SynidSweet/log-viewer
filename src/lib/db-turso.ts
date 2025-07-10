// lib/db-turso.ts
import { turso } from './turso';
import { nanoid } from 'nanoid';
import { Project, ProjectLog } from './types';

// Project related functions
export async function getProjects(): Promise<Project[]> {
  try {
    const result = await turso.execute('SELECT * FROM projects ORDER BY created_at DESC');
    return result.rows.map(row => ({
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      createdAt: row.created_at as string,
      apiKey: row.api_key as string
    }));
  } catch (error) {
    console.error('Failed to get projects:', error);
    throw error;
  }
}

export async function getProject(id: string): Promise<Project | null> {
  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM projects WHERE id = ?',
      args: [id]
    });
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      createdAt: row.created_at as string,
      apiKey: row.api_key as string
    };
  } catch (error) {
    console.error('Failed to get project:', error);
    throw error;
  }
}

export async function createProject(name: string, description: string = ''): Promise<Project> {
  try {
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
    
    await turso.execute({
      sql: 'INSERT INTO projects (id, name, description, created_at, api_key) VALUES (?, ?, ?, ?, ?)',
      args: [id, name, description, createdAt, apiKey]
    });
    
    return project;
  } catch (error) {
    console.error('Failed to create project:', error);
    throw error;
  }
}

export async function updateProject(
  id: string, 
  updates: { name?: string; description?: string; id?: string }
): Promise<Project | null> {
  try {
    const project = await getProject(id);
    if (!project) return null;
    
    const updatedProject = { ...project, ...updates };
    
    // If ID was changed, we need to create a new record and delete the old one
    if (updates.id && updates.id !== id) {
      // Create new project record
      await turso.execute({
        sql: 'INSERT INTO projects (id, name, description, created_at, api_key) VALUES (?, ?, ?, ?, ?)',
        args: [updates.id, updatedProject.name, updatedProject.description, updatedProject.createdAt, updatedProject.apiKey]
      });
      
      // Update project_id in all logs
      await turso.execute({
        sql: 'UPDATE logs SET project_id = ? WHERE project_id = ?',
        args: [updates.id, id]
      });
      
      // Delete the old project record
      await turso.execute({
        sql: 'DELETE FROM projects WHERE id = ?',
        args: [id]
      });
      
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
      await turso.execute({
        sql: `UPDATE projects SET ${setClause.join(', ')} WHERE id = ?`,
        args
      });
    }
    
    return updatedProject;
  } catch (error) {
    console.error('Failed to update project:', error);
    throw error;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  try {
    const result = await turso.execute({
      sql: 'DELETE FROM projects WHERE id = ?',
      args: [id]
    });
    
    return result.rowsAffected > 0;
  } catch (error) {
    console.error('Failed to delete project:', error);
    throw error;
  }
}

export async function hasProjectLogs(id: string): Promise<boolean> {
  try {
    const result = await turso.execute({
      sql: 'SELECT COUNT(*) as count FROM logs WHERE project_id = ?',
      args: [id]
    });
    
    return (result.rows[0].count as number) > 0;
  } catch (error) {
    console.error('Failed to check project logs:', error);
    throw error;
  }
}

// Log related functions
export async function getProjectLogs(projectId: string): Promise<ProjectLog[]> {
  try {
    const result = await turso.execute({
      sql: 'SELECT id, project_id, timestamp, comment, is_read FROM logs WHERE project_id = ? ORDER BY timestamp DESC',
      args: [projectId]
    });
    
    return result.rows.map(row => ({
      id: row.id as string,
      projectId: row.project_id as string,
      timestamp: row.timestamp as string,
      comment: row.comment as string || '',
      isRead: Boolean(row.is_read)
    }));
  } catch (error) {
    console.error('Failed to get project logs:', error);
    throw error;
  }
}

export async function getLog(logId: string): Promise<ProjectLog | null> {
  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM logs WHERE id = ?',
      args: [logId]
    });
    
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
  } catch (error) {
    console.error('Failed to get log:', error);
    throw error;
  }
}

export async function createLog(projectId: string, content: string, comment: string = ''): Promise<ProjectLog> {
  try {
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
    
    await turso.execute({
      sql: 'INSERT INTO logs (id, project_id, content, comment, timestamp, is_read) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, projectId, content, comment, timestamp, false]
    });
    
    return log;
  } catch (error) {
    console.error('Failed to create log:', error);
    throw error;
  }
}

export async function updateLog(logId: string, updates: { isRead?: boolean }): Promise<ProjectLog | null> {
  try {
    const log = await getLog(logId);
    if (!log) return null;
    
    if (updates.isRead !== undefined) {
      await turso.execute({
        sql: 'UPDATE logs SET is_read = ? WHERE id = ?',
        args: [updates.isRead, logId]
      });
    }
    
    return {
      ...log,
      ...updates,
      content: undefined // Don't return content for efficiency
    };
  } catch (error) {
    console.error('Failed to update log:', error);
    throw error;
  }
}

export async function deleteLog(logId: string): Promise<boolean> {
  try {
    const result = await turso.execute({
      sql: 'DELETE FROM logs WHERE id = ?',
      args: [logId]
    });
    
    return result.rowsAffected > 0;
  } catch (error) {
    console.error('Failed to delete log:', error);
    throw error;
  }
}

// Utility function to get project by API key
export async function getProjectByApiKey(apiKey: string): Promise<Project | null> {
  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM projects WHERE api_key = ?',
      args: [apiKey]
    });
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      createdAt: row.created_at as string,
      apiKey: row.api_key as string
    };
  } catch (error) {
    console.error('Failed to get project by API key:', error);
    throw error;
  }
}