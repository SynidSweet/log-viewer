import { NextResponse } from 'next/server';
import { hasProjectLogs } from '@/lib/db';

// GET /api/projects/[id]/logs/check
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    
    // Check if project has logs
    const hasLogs = await hasProjectLogs(projectId);
    
    return NextResponse.json({ hasLogs });
  } catch (error) {
    console.error('Error checking project logs:', error);
    return NextResponse.json({ error: 'Failed to check project logs' }, { status: 500 });
  }
} 