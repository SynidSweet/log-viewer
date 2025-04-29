import { NextResponse } from 'next/server';
import { getLog, updateLog, deleteLog } from '@/lib/db';

// GET /api/logs/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: logId } = await params;
    
    // Get the log
    const log = await getLog(logId);
    
    if (!log) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }
    
    return NextResponse.json(log);
  } catch (error) {
    console.error('Error retrieving log:', error);
    return NextResponse.json({ error: 'Failed to retrieve log' }, { status: 500 });
  }
}

// PATCH /api/logs/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: logId } = await params;
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
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    
    // Update the log
    const updatedLog = await updateLog(logId, updates as { isRead?: boolean });
    
    if (!updatedLog) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedLog);
  } catch (error) {
    console.error('Error updating log:', error);
    return NextResponse.json({ error: 'Failed to update log' }, { status: 500 });
  }
}

// DELETE /api/logs/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: logId } = await params;
    
    // Delete the log
    const success = await deleteLog(logId);
    
    if (!success) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting log:', error);
    return NextResponse.json({ error: 'Failed to delete log' }, { status: 500 });
  }
} 