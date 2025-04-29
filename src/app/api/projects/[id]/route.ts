import { NextResponse } from 'next/server';
import { getProject, updateProject, deleteProject, hasProjectLogs } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const project = await getProject(id);
  
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  
  return NextResponse.json(project);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const project = await getProject(id);
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const data = await request.json();
    const { name, description, id: newId } = data;
    
    // Validate data
    if (newId && newId !== id) {
      // Check if we can change the ID (only if no logs exist)
      const hasLogs = await hasProjectLogs(id);
      if (hasLogs) {
        return NextResponse.json({ 
          error: 'Cannot change project ID after logs have been received' 
        }, { status: 400 });
      }
    }
    
    const updatedProject = await updateProject(id, { name, description, id: newId });
    return NextResponse.json(updatedProject);
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to update project',
      details: (error as Error).message
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const project = await getProject(id);
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Check if project has logs (we'll include this in response)
    const hasLogs = await hasProjectLogs(id);
    
    // Delete project
    await deleteProject(id);
    
    return NextResponse.json({ 
      success: true,
      hadLogs: hasLogs 
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to delete project',
      details: (error as Error).message
    }, { status: 500 });
  }
} 