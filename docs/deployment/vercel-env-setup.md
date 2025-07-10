# Vercel Environment Variable Setup Guide

*Last updated: 2025-07-10 | Added comprehensive debugging tools and validation methods*

## Overview

This guide helps resolve environment variable configuration issues in Vercel deployments, specifically for the Turso database connection. The application now includes enhanced debugging tools to help diagnose configuration issues.

## Required Environment Variables

### Critical Variables (Database)

These MUST be set for the application to function:

1. **`TURSO_DATABASE_URL`**
   - Format: `libsql://your-database-name.turso.io`
   - Example: `libsql://log-petter-ai-synidsweet.aws-eu-west-1.turso.io`
   - Get this from your Turso dashboard

2. **`TURSO_AUTH_TOKEN`**
   - Format: JWT token (3 parts separated by dots, ~300+ characters)
   - Example: `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...`
   - Get this from Turso dashboard > Database > Get connection URL

### Optional Variables (Authentication)

These are needed for Google OAuth functionality:

3. **`GOOGLE_CLIENT_ID`**
4. **`GOOGLE_CLIENT_SECRET`**
5. **`NEXTAUTH_SECRET`**
6. **`NEXTAUTH_URL`**

## Step-by-Step Setup in Vercel

### 1. Access Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Navigate to your project
3. Click on "Settings" tab
4. Select "Environment Variables" from the left sidebar

### 2. Add Environment Variables

For each variable:

1. Click "Add New"
2. Enter the key (e.g., `TURSO_DATABASE_URL`)
3. Enter the value
4. Select environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click "Save"

### 3. Verify Variables Are Set

After adding all variables:

1. Check that both `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` appear in the list
2. Ensure they're enabled for all environments
3. Values should show as encrypted (••••••)

### 4. Redeploy Your Application

**Important**: Environment variables are only loaded at build time!

1. Go to the "Deployments" tab
2. Click the three dots on the latest deployment
3. Select "Redeploy"
4. Or trigger a new deployment by pushing to your repository

## Verification Methods

### Method 1: Using Debug Endpoints (Recommended)

After deployment, check these endpoints:

1. **Environment Check**: `GET /api/env-check`
   ```bash
   curl https://your-app.vercel.app/api/env-check
   ```

2. **Database Debug**: `GET /api/debug`
   ```bash
   curl https://your-app.vercel.app/api/debug
   ```

### Method 2: Using Vercel CLI

```bash
# Install Vercel CLI if needed
npm i -g vercel

# List environment variables
vercel env ls

# Pull environment variables locally
vercel env pull
```

### Method 3: Check Build Logs

1. Go to Vercel Dashboard > Deployments
2. Click on a deployment
3. Check "Build Logs" for any environment warnings

## Common Issues and Solutions

### Issue 1: Variables Not Loading

**Symptoms**: 
- API returns "Environment variables not set"
- 500 errors on all database operations

**Solutions**:
1. Verify variables are set in Vercel dashboard
2. Ensure you redeployed after adding variables
3. Check variable names for typos (case-sensitive!)

### Issue 2: Invalid Token Format

**Symptoms**:
- "Invalid token format" errors
- Database connection failures

**Solutions**:
1. Ensure you copied the FULL token (it's very long)
2. Check for accidental spaces or line breaks
3. Regenerate token in Turso if needed

### Issue 3: Wrong Database URL

**Symptoms**:
- "Invalid URL format" errors
- Connection timeouts

**Solutions**:
1. Verify URL starts with `libsql://`
2. Check the database name matches your Turso database
3. Ensure no trailing slashes or spaces

## Quick Verification Script

Run this locally to verify your configuration:

```bash
# Run the verification script
node scripts/verify-env.js
```

## Environment Variable Template

Copy this template and fill in your values:

```env
# Turso Database Configuration
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# NextAuth.js Configuration (if using auth)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-app.vercel.app
```

## Security Notes

1. **Never commit** environment variables to your repository
2. **Use different tokens** for development and production
3. **Rotate tokens** periodically for security
4. **Limit token permissions** in Turso to read/write only

## Getting Turso Credentials

1. **Sign in** to [Turso Dashboard](https://turso.tech)
2. **Select** your database
3. **Click** "Get connection URL"
4. **Copy** both the URL and token
5. **Important**: Use the "LIBSQL URL" format, not HTTP

## Troubleshooting Checklist

- [ ] Both `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set in Vercel
- [ ] Values are copied correctly (no extra spaces or missing characters)
- [ ] Environment variables are enabled for Production environment
- [ ] Application was redeployed after adding variables
- [ ] Database exists and is active in Turso dashboard
- [ ] Token has not expired or been revoked

## Next Steps

After setting up environment variables:

1. **Initialize Database**: If this is a fresh database, run:
   ```bash
   curl -X POST https://your-app.vercel.app/api/init-db
   ```

2. **Test Health Check**:
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

3. **Create First Project**: Use the UI or API to create a test project

## Support

If issues persist after following this guide:

1. Check Vercel deployment logs for specific errors
2. Use the `/api/debug` endpoint for detailed diagnostics
3. Verify Turso database is active and accessible
4. Check Turso dashboard for any service issues