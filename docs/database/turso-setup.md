# Turso Database Setup Guide

*Last updated: 2025-07-10 | TURSO-001 Task Documentation - Complete setup automation*

## Overview

This document provides step-by-step instructions for setting up a Turso database account and configuring the Universal Log Viewer application to use Turso SQLite.

## Prerequisites

- Turso CLI installed (completed)
- GitHub account (for authentication)
- Access to web browser (for account creation)

## Step 1: Create Turso Account

### Option 1: CLI Authentication (Recommended)
```bash
# Sign up for new account
turso auth signup

# Or login if you already have an account
turso auth login
```

### Option 2: Web Dashboard
1. Visit [https://app.turso.tech/](https://app.turso.tech/)
2. Click "Sign in with GitHub"
3. Authorize the Turso application
4. Complete account setup

## Step 2: Create Database

### Using CLI
```bash
# Create a new database
turso db create log-viewer

# Or create with specific location
turso db create log-viewer --location fra  # Frankfurt, Germany
```

### Available Locations
- `fra` - Frankfurt, Germany
- `lax` - Los Angeles, US
- `nrt` - Tokyo, Japan
- `syd` - Sydney, Australia
- `bos` - Boston, US
- `sin` - Singapore

## Step 3: Get Database Credentials

### Get Database URL
```bash
turso db show log-viewer
```

This will output something like:
```
Name:       log-viewer
URL:        libsql://log-viewer-<username>.turso.io
```

### Generate Auth Token
```bash
turso db tokens create log-viewer
```

This will generate an authentication token like:
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Configure Environment Variables

Update your `.env.local` file with the Turso credentials:

```env
# Turso Database Configuration
TURSO_DATABASE_URL=libsql://log-viewer-<username>.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

# Keep existing NextAuth and other configurations
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

## Step 5: Verify Database Connection

### Test Database Health
```bash
npm run dev
```

Then visit: `http://localhost:3000/api/health`

Expected response:
```json
{
  "status": "healthy",
  "database": {
    "healthy": true,
    "details": {
      "responseTime": 150,
      "tables": ["projects", "logs"],
      "initialized": true,
      "retryCount": 0
    }
  }
}
```

### Manual Database Test
```bash
# Connect to your database
turso db shell log-viewer

# Run test queries
SELECT name FROM sqlite_master WHERE type='table';
SELECT COUNT(*) FROM projects;
SELECT COUNT(*) FROM logs;

# Exit shell
.exit
```

## Step 6: Database Schema Verification

The application will automatically create the required schema on first run:

### Projects Table
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE
);
```

### Logs Table
```sql
CREATE TABLE logs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  content TEXT NOT NULL,
  comment TEXT DEFAULT '',
  timestamp TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

### Indexes
- `idx_logs_project_id` - For efficient log lookups by project
- `idx_logs_timestamp` - For chronological ordering
- `idx_logs_is_read` - For filtering read/unread logs
- `idx_projects_api_key` - For API key authentication

## Troubleshooting

### Common Issues

#### 1. Authentication Timeout
```bash
# If CLI signup times out, try web authentication
turso auth login
```

#### 2. Database Connection Errors
```bash
# Check database status
turso db show log-viewer

# Test connection
turso db shell log-viewer
```

#### 3. Token Expiration
```bash
# Generate new token
turso db tokens create log-viewer

# Update .env.local with new token
```

#### 4. Schema Issues
The application has automatic schema creation and validation. If issues persist:

```bash
# Access database shell
turso db shell log-viewer

# Check table structure
.schema projects
.schema logs

# Verify indexes
.indexes

# Check foreign keys
PRAGMA foreign_key_check;
```

## Security Considerations

1. **Keep tokens secure**: Never commit auth tokens to version control
2. **Use environment variables**: Store credentials in `.env.local`
3. **Regular token rotation**: Generate new tokens periodically
4. **Access control**: Use Turso's built-in access controls for production

## Production Deployment

### Environment Variables for Production
```env
TURSO_DATABASE_URL=libsql://log-viewer-<username>.turso.io
TURSO_AUTH_TOKEN=<production-token>
```

### Recommended Settings
- Use dedicated database for production
- Set up monitoring and alerting
- Enable database backups
- Use specific location closest to users

## Migration from Redis/Upstash

If migrating from existing Redis data:
1. Export existing data using migration script
2. Run database initialization
3. Import data using Turso CLI or API
4. Update environment variables
5. Test thoroughly before deploying

## Next Steps

After successful setup:
1. ✅ Complete TURSO-001 task
2. ➡️ Continue with TURSO-002: Create database schema
3. ➡️ Proceed with remaining migration tasks

## Support

- **Turso Documentation**: [https://docs.turso.tech/](https://docs.turso.tech/)
- **Turso Discord**: [https://discord.gg/turso](https://discord.gg/turso)
- **Project Issues**: Create issue in project repository

---

*This setup guide completes the TURSO-001 task for the Universal Log Viewer Turso migration.*