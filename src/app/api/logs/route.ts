import { NextRequest, NextResponse } from 'next/server';
import { getProject, createLog } from '@/lib/db';

// Validate log entry format: [DATE, TIME] [LEVEL] MESSAGE - DATA
function validateLogFormat(logContent: string): { valid: boolean; error?: string } {
  const lines = logContent.trim().split('\n');
  
  for (const line of lines) {
    // Basic format validation using regex - data part is now optional
    const logPattern = /^\[\d{4}-\d{2}-\d{2}, \d{2}:\d{2}:\d{2}\] \[(LOG|ERROR|INFO|WARN|DEBUG)\] .+( - .+)?$/;
    
    if (!logPattern.test(line)) {
      return { 
        valid: false, 
        error: `Invalid log format. Expected: [YYYY-MM-DD, HH:MM:SS] [LEVEL] MESSAGE - DATA. Found: ${line}`
      };
    }
    
    // We'll only validate the basic structure, not the content format
    // This allows any data content after the hyphen as long as basic log structure is valid
  }
  
  return { valid: true };
}

// POST /api/logs - Upload a new log
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { projectId, comment, content, apiKey } = data;
    
    if (!projectId || !content) {
      return NextResponse.json({ error: 'Project ID and log content are required' }, { status: 400 });
    }
    
    // Validate project and API key
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 404 });
    }
    
    if (project.apiKey !== apiKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 403 });
    }
    
    // Validate log format
    const validation = validateLogFormat(content);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    
    // Create the log
    const log = await createLog(projectId, content, comment || '');
    
    // Return success with the log ID and timestamp
    return NextResponse.json({ 
      success: true, 
      logId: log.id,
      timestamp: log.timestamp
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating log:', error);
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
  }
} 