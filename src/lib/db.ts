// lib/db.ts
import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';
import { Project, LogEntry } from './types';

// Projects
export async function getProjects(): Promise<Project[]> {
    const projectIds = await kv.smembers('projects') as string[];
    if (!projectIds || projectIds.length === 0) return [];
    
    const projects = await Promise.all(
      projectIds.map(id => kv.get(`project:${id}`))
    );
    
    return projects.filter(Boolean) as Project[];
  }
  
  export async function getProject(id: string): Promise<Project | null> {
    return await kv.get(`project:${id}`);
  }
  
  export async function createProject(name: string, description: string): Promise<Project> {
    const id = nanoid(10);
    const apiKey = nanoid(32);
    
    const project: Project = {
      id,
      name,
      description,
      createdAt: new Date().toISOString(),
      apiKey
    };
    
    await kv.set(`project:${id}`, project);
    await kv.sadd('projects', id);
    
    return project;
  }
  
  // Logs
  export async function getLogs(projectId: string): Promise<LogEntry[]> {
    const logIds = await kv.smembers(`logs:${projectId}`) as string[];
    if (!logIds || logIds.length === 0) return [];
    
    const logs = await Promise.all(
      logIds.map(id => kv.get(`log:${id}`))
    );
    
    return logs.filter(Boolean) as LogEntry[];
  }
  
  export async function addLog(projectId: string, log: Omit<LogEntry, 'id' | 'projectId'>): Promise<LogEntry> {
    const id = nanoid();
    
    const logEntry: LogEntry = {
      id,
      projectId,
      ...log
    };
    
    await kv.set(`log:${id}`, logEntry);
    await kv.sadd(`logs:${projectId}`, id);
    
    return logEntry;
  }