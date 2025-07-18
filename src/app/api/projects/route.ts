// app/api/projects/route.ts
import { createProject, getProjects, getProject } from '@/lib/db-turso';
import { withApiErrorHandling } from '@/lib/api-error-handler';

export async function GET(request: Request) {
  return withApiErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const project = await getProject(id);
      if (!project) {
        throw new Error('not found: Project not found');
      }
      return project;
    }
    
    const projects = await getProjects();
    return projects;
  });
}

export async function POST(request: Request) {
  return withApiErrorHandling(async () => {
    
    let body;
    try {
      body = await request.json();
    } catch {
      throw new Error('validation: Invalid JSON payload');
    }
    
    const { name, description } = body;
    
    if (!name) {
      throw new Error('validation: Project name is required');
    }
    
    const project = await createProject(name, description || '');
    
    return project;
  });
}