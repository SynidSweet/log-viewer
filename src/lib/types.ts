// lib/types.ts
export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    apiKey: string; // For validating POST requests
  }

  export interface LogDetails {
    _extended?: any;
    [key: string]: any;
  }

  export interface LogEntry {
    id: string;
    projectId: string;
    timestamp: string;
    level: 'LOG' | 'WARN' | 'ERROR';
    message: string;
    details?: LogDetails;
    schemaVersion: string;
  }