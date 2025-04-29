// lib/types.ts
export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    apiKey: string; // For validating POST requests
  }

  export interface LogEntry {
    id: string;
    projectId: string;
    timestamp: string;
    level: 'LOG' | 'WARN' | 'ERROR';
    message: string;
    details?: any;
    schemaVersion: string;
  }