import { turso, ensureDatabaseReady } from '@/lib/turso';
import * as db from '@/lib/db-turso';
import { withApiErrorHandling } from '@/lib/api-error-handler';

interface DatabaseTestResult {
  step: string;
  status: 'success' | 'failed' | 'pending';
  message?: string;
  details?: Record<string, unknown>;
}

export async function GET() {
  return withApiErrorHandling(
    async () => {
      const tests: DatabaseTestResult[] = [];
      
      const info: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV || 'not-vercel',
        tursoConfig: {
          url: process.env.TURSO_DATABASE_URL ? 'Set' : 'Not set',
          urlFormat: process.env.TURSO_DATABASE_URL 
            ? validateTursoUrl(process.env.TURSO_DATABASE_URL) 
            : 'N/A',
          token: process.env.TURSO_AUTH_TOKEN ? 'Set' : 'Not set',
          tokenFormat: process.env.TURSO_AUTH_TOKEN 
            ? validateTursoToken(process.env.TURSO_AUTH_TOKEN)
            : 'N/A',
        },
        tests: tests,
      };

      // Test 1: Environment Variables
      tests.push({
        step: 'Environment Variables Check',
        status: (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) ? 'success' : 'failed',
        message: (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) 
          ? 'Both TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are set'
          : 'Missing required environment variables',
        details: {
          TURSO_DATABASE_URL: !!process.env.TURSO_DATABASE_URL,
          TURSO_AUTH_TOKEN: !!process.env.TURSO_AUTH_TOKEN,
        }
      });

      if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
        tests.push({
          step: 'Further tests skipped',
          status: 'failed',
          message: 'Cannot proceed without required environment variables'
        });
        // Return info with failed status
        return info;
      }

      try {
        // Test 2: Database Initialization
        await ensureDatabaseReady();
        tests.push({
          step: 'Database Initialization',
          status: 'success',
          message: 'Database client initialized successfully'
        });

        // Test 3: Basic Query
        try {
          if (!turso) {
            throw new Error('Database client not initialized');
          }
          
          const result = await turso!.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
          );
          tests.push({
            step: 'Database Connection Test',
            status: 'success',
            message: 'Successfully connected to database',
            details: {
              tables: result.rows.map((row) => row.name),
              tableCount: result.rows.length
            }
          });
        } catch (error) {
          tests.push({
            step: 'Database Connection Test',
            status: 'failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            details: {
              error: error instanceof Error ? error.toString() : 'Unknown error',
              hint: 'Check if database exists and credentials are correct'
            }
          });
          throw error;
        }

        // Test 4: Schema Validation
        try {
          if (!turso) {
            throw new Error('Database client not initialized');
          }
          
          const schemaResult = await turso!.execute(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name IN ('projects', 'logs')"
          );
          const hasProjects = schemaResult.rows.some((row) => 
            String(row.sql).includes('CREATE TABLE projects')
          );
          const hasLogs = schemaResult.rows.some((row) => 
            String(row.sql).includes('CREATE TABLE logs')
          );
          
          tests.push({
            step: 'Schema Validation',
            status: (hasProjects && hasLogs) ? 'success' : 'failed',
            message: (hasProjects && hasLogs) 
              ? 'Required tables exist'
              : 'Missing required tables',
            details: {
              hasProjectsTable: hasProjects,
              hasLogsTable: hasLogs,
              hint: !hasProjects || !hasLogs ? 'Run POST /api/init-db to create tables' : undefined
            }
          });
        } catch (error) {
          tests.push({
            step: 'Schema Validation',
            status: 'failed',
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        // Test 5: DB Module Functions
        try {
          const projects = await db.getProjects();
          tests.push({
            step: 'DB Module Test',
            status: 'success',
            message: 'Database module functions working correctly',
            details: {
              testQuery: 'getProjects',
              projectCount: projects.length
            }
          });
        } catch (error) {
          tests.push({
            step: 'DB Module Test',
            status: 'failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            details: {
              hint: 'Database module initialization may have failed'
            }
          });
        }

      } catch (error) {
        // Add a general error test if something unexpected happened
        tests.push({
          step: 'Unexpected Error',
          status: 'failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: {
            stack: error instanceof Error ? error.stack : undefined,
          }
        });
      }

      return info;
    },
    'debugDatabaseConnection'
  );
}

function validateTursoUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `Valid (${parsed.protocol}//${parsed.hostname})`;
  } catch {
    return 'Invalid URL format';
  }
}

function validateTursoToken(token: string): string {
  const parts = token.split('.');
  if (parts.length === 3 && token.length > 100) {
    return `Valid JWT (${token.length} chars)`;
  }
  return 'Invalid token format';
}