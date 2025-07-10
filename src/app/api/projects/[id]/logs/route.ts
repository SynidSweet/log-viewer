import { getProjectLogs } from '@/lib/db-turso';
import { withApiErrorHandling } from '@/lib/api-error-handler';

// GET /api/projects/[id]/logs
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  return withApiErrorHandling(async () => {
    // Get all logs for this project
    const logs = await getProjectLogs(projectId);
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return logs;
  }, `GET /api/projects/${projectId}/logs`);
} 