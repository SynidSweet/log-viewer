import { NextResponse } from 'next/server';
import { checkDatabaseHealth, turso } from '@/lib/turso';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { 
  DeploymentReadinessCheck, 
  HealthCheck, 
  EnvironmentHealthDetails, 
  SchemaHealthDetails, 
  MigrationHealthDetails 
} from '@/lib/types';

// Comprehensive deployment readiness check
async function checkDeploymentReadiness(): Promise<DeploymentReadinessCheck> {
  const checks: {
    database: HealthCheck;
    schema: HealthCheck;
    environment: HealthCheck;
    migration: HealthCheck;
  } = {
    database: { healthy: false, details: null },
    schema: { healthy: false, details: null },
    environment: { healthy: false, details: null },
    migration: { healthy: false, details: null }
  };

  try {
    // 1. Database connection health
    const dbHealth = await checkDatabaseHealth();
    checks.database = dbHealth;

    if (!dbHealth.healthy) {
      return { healthy: false, checks };
    }

    // 2. Environment variables check
    const envVars = ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN'];
    const missingVars = envVars.filter(varName => !process.env[varName]);
    
    checks.environment = {
      healthy: missingVars.length === 0,
      details: {
        required: envVars,
        missing: missingVars,
        present: envVars.filter(varName => !!process.env[varName])
      } as EnvironmentHealthDetails
    };

    if (missingVars.length > 0) {
      return { healthy: false, checks };
    }

    // 3. Schema validation - check required tables exist
    if (turso) {
      const tablesResult = await turso.execute(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('projects', 'logs')
      `);
      
      const existingTables = tablesResult.rows.map(row => row.name as string);
      const requiredTables = ['projects', 'logs'];
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));

      checks.schema = {
        healthy: missingTables.length === 0,
        details: {
          required: requiredTables,
          existing: existingTables,
          missing: missingTables
        } as SchemaHealthDetails
      };

      // 4. Migration status check
      try {
        const migrationsResult = await turso.execute(`
          SELECT COUNT(*) as count FROM sqlite_master 
          WHERE type='table' AND name='migrations'
        `);
        
        const hasMigrationsTable = (migrationsResult.rows[0]?.count as number) > 0;
        
        if (hasMigrationsTable) {
          const migrationStatusResult = await turso.execute(
            'SELECT id, status, executed_at FROM migrations ORDER BY executed_at DESC LIMIT 5'
          );
          
          checks.migration = {
            healthy: true,
            details: {
              tracking: true,
              recentMigrations: migrationStatusResult.rows.map(row => ({
                id: row.id,
                status: row.status,
                executedAt: row.executed_at
              }))
            } as MigrationHealthDetails
          };
        } else {
          checks.migration = {
            healthy: true, // OK if no migrations table yet
            details: {
              tracking: false,
              message: 'Migration tracking not yet initialized'
            } as MigrationHealthDetails
          };
        }
      } catch (migrationError: unknown) {
        checks.migration = {
          healthy: false,
          details: {
            error: 'Failed to check migration status',
            message: migrationError instanceof Error ? migrationError.message : 'Unknown error'
          } as MigrationHealthDetails
        };
      }
    } else {
      checks.schema.healthy = false;
      checks.schema.details = { error: 'Database client not available' } as SchemaHealthDetails;
      
      checks.migration.healthy = false;
      checks.migration.details = { error: 'Database client not available' } as MigrationHealthDetails;
    }

    const allHealthy = Object.values(checks).every(check => check.healthy);
    return { healthy: allHealthy, checks };

  } catch (error: unknown) {
    return {
      healthy: false,
      checks,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function GET() {
  return withApiErrorHandling(async () => {
    const readinessCheck = await checkDeploymentReadiness();
    
    const response = {
      healthy: readinessCheck.healthy,
      status: readinessCheck.healthy ? 'ready' : 'not_ready',
      deployment: readinessCheck.healthy ? 'ready' : 'initialization_required',
      timestamp: new Date().toISOString(),
      checks: readinessCheck.checks,
      ...(readinessCheck.error && { error: readinessCheck.error })
    };
    
    if (readinessCheck.healthy) {
      return response;
    } else {
      // Return detailed error information for deployment debugging
      return NextResponse.json(response, { status: 503 });
    }
  }, 'GET /api/health');
}