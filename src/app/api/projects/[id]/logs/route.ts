import { NextResponse } from 'next/server';
import { getProjectLogs } from '@/lib/db-turso';

// GET /api/projects/[id]/logs
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    
    // Get all logs for this project
    const logs = await getProjectLogs(projectId);
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error retrieving logs:', error);
    return NextResponse.json({ error: 'Failed to retrieve logs' }, { status: 500 });
  }
} 