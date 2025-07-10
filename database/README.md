# Turso Database Setup

This document explains how to set up and configure the Turso SQLite database for the Universal Log Viewer.

## Quick Setup

1. **Create a Turso account** at [turso.tech](https://turso.tech)
2. **Create a database** in your Turso dashboard
3. **Get your credentials**:
   - Database URL (e.g., `libsql://your-db-name.turso.io`)
   - Auth Token (from your Turso dashboard)
4. **Set environment variables**:
   ```bash
   export TURSO_DATABASE_URL="libsql://your-db-name.turso.io"
   export TURSO_AUTH_TOKEN="your-auth-token"
   ```
5. **Run the setup script**:
   ```bash
   node scripts/setup-turso.js
   ```

## Manual Setup

If you prefer to set up the database manually:

1. **Install the Turso CLI** (optional):
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```

2. **Create and configure database**:
   ```bash
   turso db create universal-log-viewer
   turso db tokens create universal-log-viewer
   ```

3. **Apply schema**:
   ```bash
   turso db shell universal-log-viewer < database/schema.sql
   ```

## Database Schema

The database uses two main tables:

### Projects Table
- `id` (TEXT PRIMARY KEY) - Unique project identifier
- `name` (TEXT NOT NULL) - Project display name
- `description` (TEXT) - Project description
- `created_at` (TEXT NOT NULL) - ISO timestamp of creation
- `api_key` (TEXT NOT NULL UNIQUE) - API key for log submission

### Logs Table
- `id` (TEXT PRIMARY KEY) - Unique log identifier
- `project_id` (TEXT NOT NULL) - Reference to projects table
- `content` (TEXT NOT NULL) - Raw log content
- `comment` (TEXT) - Optional comment
- `timestamp` (TEXT NOT NULL) - ISO timestamp of log creation
- `is_read` (BOOLEAN DEFAULT FALSE) - Read status

## Environment Variables

Add these to your `.env.local` file:

```env
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

## Health Check

Test your database connection:

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-07-10T12:00:00.000Z"
}
```

## Migration from Redis

If you're migrating from a Redis-based setup:

1. Export your existing data
2. Set up the new Turso database
3. Run the migration script (to be created)
4. Update your API routes to use the new database client
5. Test all functionality
6. Update environment variables and deploy

## Local Development

For local development, Turso provides a file-based SQLite option:

```env
TURSO_DATABASE_URL=file:local.db
# TURSO_AUTH_TOKEN not needed for local files
```

## Performance Considerations

- The database includes optimized indexes for common queries
- Connection pooling is handled automatically by the Turso client
- Consider implementing caching for frequently accessed data

## Troubleshooting

### Connection Issues
- Verify your database URL and auth token
- Check if your IP is allowed (Turso allows all IPs by default)
- Ensure the database exists in your Turso dashboard

### Schema Issues
- Run the setup script to ensure schema is up to date
- Check the health endpoint for database connectivity

### Performance Issues
- Monitor query performance in the Turso dashboard
- Consider adding additional indexes if needed

## Benefits of Turso

- **No inactivity timeouts** - Database stays active permanently
- **5GB free storage** - Generous free tier
- **Global edge deployment** - Low latency worldwide
- **SQL compatibility** - Standard SQLite syntax
- **Automatic backups** - Point-in-time recovery available