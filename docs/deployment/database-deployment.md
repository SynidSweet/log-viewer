# Database Deployment Guide

*Last updated: 2025-07-10 | Completed comprehensive migration system with automated deployment initialization*

## Overview

The Universal Log Viewer now includes automatic database initialization during deployment to prevent production failures. This system ensures that:

- Database schema is automatically created on first deployment
- Schema updates are applied via migrations during subsequent deployments
- The deployment process includes comprehensive validation
- Failed deployments are detected early and provide actionable error messages

## How It Works

### Automatic Initialization During Build

The database initialization happens automatically during the Vercel build process:

```bash
npm run build
# Runs: npm run db:init && next build
```

This ensures that the database is ready before the application starts serving traffic.

### Migration System

Database schema changes are managed through a versioned migration system:

- **Migration Files**: Located in `scripts/migrations/`
- **Migration Tracking**: Stored in `migrations` table in the database
- **Idempotent**: Safe to run multiple times
- **Rollback Support**: Each migration includes rollback instructions

### Deployment Validation

The enhanced `/api/health` endpoint validates deployment readiness:

- **Database Connection**: Tests connectivity to Turso
- **Environment Variables**: Validates required configuration
- **Schema Validation**: Confirms all required tables exist
- **Migration Status**: Tracks applied migrations

## Commands

### Local Development

```bash
# Check environment configuration
npm run verify-env

# Initialize database manually
npm run db:init

# Run pending migrations
npm run db:migrate

# Check migration status
npm run db:status

# Check deployment readiness
curl http://localhost:3000/api/health
```

### Production Deployment

Database initialization happens automatically during Vercel deployment:

1. **Pre-build**: Environment variables are validated
2. **Build**: `npm run db:init` runs before `next build`
3. **Post-deployment**: Health check validates readiness

## Migration System

### Creating New Migrations

Create a new migration file in `scripts/migrations/`:

```javascript
// scripts/migrations/002-add-new-feature.js
const migration = {
  id: '002-add-new-feature',
  description: 'Add new feature table',
  version: '1.1.0',
  
  up: async (turso) => {
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS new_feature (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        data TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )
    `);
    
    return { tablesCreated: ['new_feature'] };
  },
  
  down: async (turso) => {
    await turso.execute('DROP TABLE IF EXISTS new_feature');
    return { tablesDropped: ['new_feature'] };
  },
  
  verify: async (turso) => {
    const result = await turso.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='new_feature'
    `);
    
    return { valid: result.rows.length > 0 };
  }
};

module.exports = migration;
```

### Migration Naming Convention

- **Format**: `NNN-descriptive-name.js`
- **Sequential**: Use sequential numbers (001, 002, 003...)
- **Descriptive**: Clear description of changes
- **Lowercase**: Use lowercase with hyphens

## Environment Variables

Required for database operations:

```bash
# Turso Database Configuration
TURSO_DATABASE_URL=libsql://your-database-org.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# Optional Performance Configuration
TURSO_SYNC_URL=your-sync-url
TURSO_ENCRYPTION_KEY=your-encryption-key
```

### Setting Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the required variables:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
4. Deploy or redeploy your application

## Troubleshooting

### Common Issues

#### 1. Missing Environment Variables

**Error**: `Missing required environment variables: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN`

**Solution**:
- Verify variables are set in Vercel dashboard
- Check variable names are exactly correct
- Redeploy after adding variables

#### 2. Database Connection Failed

**Error**: `Database connection test failed`

**Solution**:
- Verify `TURSO_DATABASE_URL` format: `libsql://database-name-org.turso.io`
- Check auth token has not expired
- Ensure database exists in Turso dashboard

#### 3. Schema Initialization Failed

**Error**: `Schema creation incomplete`

**Solution**:
- Check Turso database permissions
- Verify auth token has write access
- Review migration syntax in deployment logs

#### 4. Migration Failures

**Error**: `Migration execution stopped due to failure`

**Solution**:
- Check migration file syntax
- Verify SQL compatibility with SQLite
- Review migration dependencies
- Check deployment logs for specific error

### Health Check Debugging

Use the health endpoint to diagnose issues:

```bash
# Check deployment readiness
curl https://your-app.vercel.app/api/health

# Response includes detailed status
{
  "healthy": false,
  "status": "not_ready",
  "deployment": "initialization_required",
  "checks": {
    "database": { "healthy": true, "details": {...} },
    "schema": { "healthy": false, "details": {...} },
    "environment": { "healthy": true, "details": {...} },
    "migration": { "healthy": true, "details": {...} }
  }
}
```

### Manual Recovery

If automatic initialization fails, you can run manual commands:

```bash
# From Vercel deployment environment or local with env vars
node scripts/migrate.js run

# Or use the API endpoint
curl -X POST https://your-app.vercel.app/api/init-db
```

## Architecture

### Files and Structure

```
scripts/
├── init-db-deploy.js     # Main deployment initialization
├── migrate.js            # Migration runner
├── migrations/           # Migration files
│   └── 001-initial-schema.js
└── verify-env.js         # Environment validation

src/app/api/
├── health/route.ts       # Deployment readiness validation
└── init-db/route.ts      # Manual initialization endpoint
```

### Integration Points

- **package.json**: Build scripts include database initialization
- **vercel.json**: Deployment configuration with function timeouts
- **Health Endpoint**: Validates all deployment requirements
- **Error Handling**: Comprehensive error messages with remediation steps

## Benefits

### Reliability

- **Zero Manual Steps**: Database setup is fully automated
- **Idempotent Operations**: Safe to run multiple times
- **Comprehensive Validation**: Catches issues before they impact users
- **Clear Error Messages**: Actionable guidance for issue resolution

### Maintainability

- **Version Control**: All schema changes tracked in migrations
- **Rollback Support**: Easy recovery from schema issues
- **Documentation**: Self-documenting migration history
- **Testing**: Can test migrations in development environment

### Operations

- **Monitoring**: Health endpoint provides deployment status
- **Debugging**: Detailed logs and error messages
- **Automation**: No manual intervention required
- **Scalability**: Supports future schema evolution

This deployment system ensures reliable database initialization and provides the foundation for safe, automated deployments.