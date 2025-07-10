// lib/db.ts
import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';
import { Project, ProjectLog } from './types';

// Helper functions for type conversion
function recordToProject(record: Record<string, unknown>): Project {
  return record as unknown as Project;
}

// Project related functions
export async function getProjects(): Promise<Project[]> {
  const projectIds = await kv.smembers('projects') as string[];
  if (!projectIds || projectIds.length === 0) return [];
  
  const projects: Project[] = [];
  for (const id of projectIds) {
    const record = await kv.hgetall(`project:${id}`);
    if (record) {
      projects.push(recordToProject(record));
    }
  }
  
  return projects;
}

export async function getProject(id: string): Promise<Project | null> {
  const record = await kv.hgetall(`project:${id}`);
  return record ? recordToProject(record) : null;
}

export async function createProject(name: string, description: string = ''): Promise<Project> {
  const id = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const apiKey = nanoid(32); // Generate a unique API key
  
  const project: Project = {
    id,
    name,
    description,
    createdAt: new Date().toISOString(),
    apiKey
  };
  
  // Store as hash - cast to Record<string, unknown> for type compatibility
  await kv.hset(`project:${id}`, project as unknown as Record<string, unknown>);
  await kv.sadd('projects', id);
  
  return project;
}

export async function updateProject(
  id: string, 
  updates: { name?: string; description?: string; id?: string }
): Promise<Project | null> {
  const project = await getProject(id);
  if (!project) return null;
  
  const updatedProject = { ...project, ...updates };
  
  // If ID was changed, we need to create a new record and delete the old one
  if (updates.id && updates.id !== id) {
    // Store the project with the new ID
    await kv.hset(`project:${updates.id}`, updatedProject as unknown as Record<string, unknown>);
    await kv.sadd('projects', updates.id);
    
    // Copy log references to the new ID
    const logIds = await kv.smembers(`project:${id}:logs`) as string[];
    if (logIds && logIds.length > 0) {
      // Add each log ID individually rather than using spread operator
      for (const logId of logIds) {
        await kv.sadd(`project:${updates.id}:logs`, logId);
      }
      
      // Update project ID in each log
      for (const logId of logIds) {
        await kv.hset(`log:${logId}`, { projectId: updates.id });
      }
      
      await kv.del(`project:${id}:logs`);
    }
    
    // Delete the old project record
    await kv.del(`project:${id}`);
    await kv.srem('projects', id);
    
    return updatedProject;
  }
  
  // If no ID change, just update the existing record
  await kv.hset(`project:${id}`, updatedProject as unknown as Record<string, unknown>);
  return updatedProject;
}

export async function deleteProject(id: string): Promise<boolean> {
  const exists = await kv.exists(`project:${id}`);
  if (!exists) return false;
  
  await kv.del(`project:${id}`);
  await kv.srem('projects', id);
  
  // Delete all logs for the project
  const logIds = await kv.smembers(`project:${id}:logs`) as string[];
  if (logIds && logIds.length > 0) {
    await Promise.all(logIds.map(logId => kv.del(`log:${logId}`)));
    await kv.del(`project:${id}:logs`);
  }
  
  return true;
}

export async function hasProjectLogs(id: string): Promise<boolean> {
  const logCount = await kv.scard(`project:${id}:logs`);
  return logCount > 0;
}

// Logs
export async function getProjectLogs(projectId: string): Promise<ProjectLog[]> {
  const logIds = await kv.smembers(`project:${projectId}:logs`) as string[];
  if (!logIds || logIds.length === 0) return [];
  
  const logs: ProjectLog[] = [];
  for (const id of logIds) {
    const record = await kv.hgetall(`log:${id}`);
    if (record) {
      logs.push({
        id,
        projectId,
        timestamp: record.timestamp as string,
        comment: record.comment as string || '',
        isRead: record.isRead as boolean || false
      });
    }
  }
  
  return logs;
}

export async function getLog(logId: string): Promise<ProjectLog | null> {
  const record = await kv.hgetall(`log:${logId}`);
  if (!record) return null;
  
  return {
    id: logId,
    projectId: record.projectId as string,
    timestamp: record.timestamp as string,
    comment: record.comment as string || '',
    isRead: record.isRead as boolean || false,
    content: record.content as string || ''
  };
}

export async function createLog(projectId: string, content: string, comment: string = ''): Promise<ProjectLog> {
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
  
  // Store log with hash - cast to Record<string, unknown> for type compatibility
  await kv.hset(`log:${id}`, log as unknown as Record<string, unknown>);
  
  // Add to project's log set
  await kv.sadd(`project:${projectId}:logs`, id);
  
  return log;
}

export async function updateLog(logId: string, updates: { isRead?: boolean }): Promise<ProjectLog | null> {
  const log = await getLog(logId);
  if (!log) return null;
  
  // Update the log
  await kv.hset(`log:${logId}`, updates as unknown as Record<string, unknown>);
  
  // Return the updated log (without content for efficiency)
  return {
    ...log,
    ...updates,
    content: undefined
  };
}

export async function deleteLog(logId: string): Promise<boolean> {
  const log = await getLog(logId);
  if (!log) return false;
  
  // Remove from project's log set
  await kv.srem(`project:${log.projectId}:logs`, logId);
  
  // Delete the log itself
  await kv.del(`log:${logId}`);
  
  return true;
}