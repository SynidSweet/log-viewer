import { getLog, updateLog, deleteLog } from '@/lib/db-turso';
import { withApiErrorHandling } from '@/lib/api-error-handler';

// GET /api/logs/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: logId } = await params;
  return withApiErrorHandling(async () => {
    // Get the log
    const log = await getLog(logId);
    
    if (!log) {
      throw new Error('not found: Log not found');
    }
    
    return log;
  });
}

// PATCH /api/logs/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: logId } = await params;
  return withApiErrorHandling(async () => {
    const updateData = await request.json();
    
    // Only allow isRead to be updated
    const validUpdateFields = ['isRead'];
    const updates = Object.keys(updateData)
      .filter(key => validUpdateFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {} as Record<string, unknown>);
    
    if (Object.keys(updates).length === 0) {
      throw new Error('validation: No valid fields to update');
    }
    
    // Update the log
    const updatedLog = await updateLog(logId, updates as { isRead?: boolean });
    
    if (!updatedLog) {
      throw new Error('not found: Log not found');
    }
    
    return updatedLog;
  });
}

// DELETE /api/logs/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: logId } = await params;
  return withApiErrorHandling(async () => {
    // Delete the log
    const success = await deleteLog(logId);
    
    if (!success) {
      throw new Error('not found: Log not found');
    }
    
    return { success: true };
  });
} 