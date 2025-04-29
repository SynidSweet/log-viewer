// app/api/logs/route.ts
import { NextResponse } from 'next/server';
import { getProject, addLog, getLogs } from '@/lib/db';

// Regex for log validation
const LOG_PATTERN = /\[(.*?)\] \[(.*?)\] (.*?)( - (.*))?$/;

export async function POST(request: Request) {
  try {
    const { projectId, schemaVersion, logs } = await request.json();
    
    if (!projectId || !schemaVersion || !logs) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        details: 'projectId, schemaVersion, and logs are required' 
      }, { status: 400 });
    }
    
    // Validate project exists
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 404 });
    }
    
    // Validate schema version
    if (schemaVersion !== 'v1') {
      return NextResponse.json({ 
        error: 'Unsupported schema version',
        supportedVersions: ['v1']
      }, { status: 400 });
    }
    
    // Validate and parse logs
    const lines = logs.split('\n').filter((line: string) => line.trim());
    const parsedLogs = [];
    const invalidLogs = [];
    
    for (const line of lines) {
      const match = line.match(LOG_PATTERN);
      if (match) {
        const [, timestamp, level, message, , detailsStr] = match;
        
        let details = null;
        if (detailsStr) {
          try {
            details = JSON.parse(detailsStr);
          } catch {
            details = detailsStr;
          }
        }
        
        parsedLogs.push({
          timestamp: new Date(timestamp).toISOString(),
          level,
          message,
          details,
          schemaVersion
        });
      } else {
        invalidLogs.push(line);
      }
    }
    
    if (parsedLogs.length === 0) {
      return NextResponse.json({ 
        error: 'No valid logs found',
        invalidLogs
      }, { status: 400 });
    }
    
    // Store logs
    const savedLogs = await Promise.all(
      parsedLogs.map(log => addLog(projectId, log))
    );
    
    return NextResponse.json({
      success: true,
      savedCount: savedLogs.length,
      invalidCount: invalidLogs.length
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error processing logs:', error);
    return NextResponse.json({ 
      error: 'Failed to process logs',
      details: (error as Error).message
    }, { status: 500 });
  }
}

// app/api/logs/route.ts (add GET method)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    
    // Validate project exists
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 404 });
    }
    
    const logs = await getLogs(projectId);
    return NextResponse.json(logs);
  }