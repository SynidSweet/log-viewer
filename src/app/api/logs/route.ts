import { NextRequest } from 'next/server';
import { getProject, createLog } from '@/lib/db-turso';
import { withApiErrorHandling } from '@/lib/api-error-handler';

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
  return withApiErrorHandling(async () => {
    const data = await request.json();
    const { projectId, comment, content, apiKey } = data;
    
    if (!projectId || !content) {
      throw new Error('validation: Project ID and log content are required');
    }
    
    if (!apiKey) {
      throw new Error('validation: API key is required');
    }
    
    // Validate project and API key
    const project = await getProject(projectId);
    if (!project) {
      throw new Error('not found: Invalid project ID');
    }
    
    if (project.apiKey !== apiKey) {
      throw new Error('authentication: Invalid API key');
    }
    
    // Validate log format
    const validation = validateLogFormat(content);
    if (!validation.valid) {
      throw new Error(`validation: ${validation.error}`);
    }
    
    // Create the log
    const log = await createLog(projectId, content, comment || '');
    
    // Return success with the log ID and timestamp
    return { 
      success: true, 
      logId: log.id,
      timestamp: log.timestamp
    };
  }, 'POST /api/logs');
} 