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
    level: 'LOG' | 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
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

  // Health check type definitions
  export interface HealthCheckDetails {
    [key: string]: unknown;
  }

  export interface HealthCheck {
    healthy: boolean;
    details: HealthCheckDetails | null;
  }

  export interface DatabaseHealthDetails extends HealthCheckDetails {
    responseTime?: number;
    tables?: string[];
    initialized?: boolean;
    retryCount?: number;
    performance?: {
      cacheSize: number;
      lastUsed: number;
      avgResponseTime: number;
      queryCount: number;
    };
    error?: string;
  }

  export interface EnvironmentHealthDetails extends HealthCheckDetails {
    required?: string[];
    missing?: string[];
    present?: string[];
    error?: string;
  }

  export interface SchemaHealthDetails extends HealthCheckDetails {
    required?: string[];
    existing?: string[];
    missing?: string[];
    error?: string;
  }

  export interface MigrationHealthDetails extends HealthCheckDetails {
    tracking?: boolean;
    message?: string;
    recentMigrations?: Array<{
      id: unknown;
      status: unknown;
      executedAt: unknown;
    }>;
    error?: string;
  }

  export interface DeploymentReadinessCheck {
    healthy: boolean;
    checks: {
      database: HealthCheck;
      schema: HealthCheck;
      environment: HealthCheck;
      migration: HealthCheck;
    };
    error?: string;
  }