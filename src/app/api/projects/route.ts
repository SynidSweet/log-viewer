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
  }, 'GET /api/projects');
}

export async function POST(request: Request) {
  return withApiErrorHandling(async () => {
    console.log('POST /api/projects - Starting request');
    
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.log('Invalid JSON payload:', error);
      throw new Error('validation: Invalid JSON payload');
    }
    
    const { name, description } = body;
    console.log('Request data:', { name, description });
    
    if (!name) {
      console.log('Missing project name');
      throw new Error('validation: Project name is required');
    }
    
    console.log('Attempting to create project...');
    const project = await createProject(name, description || '');
    console.log('Project created successfully:', project.id);
    
    return project;
  }, 'POST /api/projects');
}