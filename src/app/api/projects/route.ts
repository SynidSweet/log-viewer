// app/api/projects/route.ts
import { NextResponse } from 'next/server';
import { createProject, getProjects, getProject } from '@/lib/db-turso';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (id) {
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json(project);
  }
  
  const projects = await getProjects();
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/projects - Starting request');
    
    const { name, description } = await request.json();
    console.log('Request data:', { name, description });
    
    if (!name) {
      console.log('Missing project name');
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }
    
    console.log('Attempting to create project...');
    const project = await createProject(name, description || '');
    console.log('Project created successfully:', project.id);
    
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Failed to create project - Full error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({ 
      error: 'Failed to create project',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}