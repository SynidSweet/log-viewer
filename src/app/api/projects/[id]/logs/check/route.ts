import { hasProjectLogs } from '@/lib/db-turso';
import { withApiErrorHandling } from '@/lib/api-error-handler';

// GET /api/projects/[id]/logs/check
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  return withApiErrorHandling(async () => {
    // Check if project has logs
    const hasLogs = await hasProjectLogs(projectId);
    
    return { hasLogs };
  });
} 