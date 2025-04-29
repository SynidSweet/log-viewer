// lib/types.ts
export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    apiKey: string; // For validating POST requests
  }

  export interface LogDetails {
    _extended?: unknown;
    [key: string]: unknown;
  }

  export interface LogEntry {
    id: string;
    projectId: string;
    timestamp: string;
    level: 'LOG' | 'WARN' | 'ERROR';
    message: string;
    details?: LogDetails;
    schemaVersion: string;
    submissionId?: string; // Reference to the submission this log belongs to
  }

  // Updated type for log submissions
  export interface LogSubmission {
    id: string;
    projectId: string;
    submittedAt: string;
    comment: string;
    entryCount: number;
    schemaVersion: string;
    isRead?: boolean; // Track if this submission has been read
  }

  // New simplified log type for the updated system
  export interface ProjectLog {
    id: string;
    projectId: string;
    timestamp: string;
    comment: string;
    isRead: boolean;
    content?: string; // Full log content as a string, only included when fetching a specific log
  }