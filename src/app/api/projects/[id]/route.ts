import { getProject, updateProject, deleteProject, hasProjectLogs } from '@/lib/db-turso';
import { withApiErrorHandling } from '@/lib/api-error-handler';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withApiErrorHandling(async () => {
    const project = await getProject(id);
    
    if (!project) {
      throw new Error('not found: Project not found');
    }
    
    return project;
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withApiErrorHandling(async () => {
    const project = await getProject(id);
    
    if (!project) {
      throw new Error('not found: Project not found');
    }
    
    const data = await request.json();
    const { name, description, id: newId } = data;
    
    // Validate data
    if (newId && newId !== id) {
      // Check if we can change the ID (only if no logs exist)
      const hasLogs = await hasProjectLogs(id);
      if (hasLogs) {
        throw new Error('validation: Cannot change project ID after logs have been received');
      }
    }
    
    const updatedProject = await updateProject(id, { name, description, id: newId });
    return updatedProject;
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withApiErrorHandling(async () => {
    const project = await getProject(id);
    
    if (!project) {
      throw new Error('not found: Project not found');
    }
    
    // Check if project has logs (we'll include this in response)
    const hasLogs = await hasProjectLogs(id);
    
    // Delete project
    await deleteProject(id);
    
    return { 
      success: true,
      hadLogs: hasLogs 
    };
  });
} 