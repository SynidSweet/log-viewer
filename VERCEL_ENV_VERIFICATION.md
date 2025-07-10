# Vercel Environment Variable Verification Guide

## Quick Start - Immediate Actions

### 1. Check Current Status

Visit these endpoints on your deployed app:

```bash
# Basic environment check
https://your-app.vercel.app/api/env-check

# Detailed database diagnostics
https://your-app.vercel.app/api/debug
```

### 2. Required Environment Variables

In your Vercel Dashboard, ensure these are set:

- `TURSO_DATABASE_URL` - Format: `libsql://your-database.turso.io`
- `TURSO_AUTH_TOKEN` - JWT token from Turso (300+ characters)

### 3. Common Fix Steps

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add the variables** if missing (copy from local `.env.local`)
3. **Important**: After adding/updating variables, you MUST **redeploy**
4. **Test** using the endpoints above

## Detailed Instructions

See `/docs/deployment/vercel-env-setup.md` for comprehensive setup guide.

## Verification Tools Added

1. **Environment Check Script**: `scripts/verify-env.js`
   - Run locally: `node scripts/verify-env.js`
   - Validates environment variable format

2. **API Endpoints**:
   - `/api/env-check` - Shows masked environment variable status
   - `/api/debug` - Comprehensive database connection testing

## What These Tools Do

### `/api/env-check`
- ✅ Checks if variables are set
- ✅ Validates URL and token formats
- ✅ Shows masked values for security
- ✅ Returns actionable error messages

### `/api/debug`
- ✅ Tests database client creation
- ✅ Verifies database connection
- ✅ Checks if tables exist
- ✅ Tests database operations
- ✅ Provides step-by-step diagnostics

## Emergency Checklist

- [ ] Variables set in Vercel dashboard?
- [ ] Redeployed after setting variables?
- [ ] Variables match local `.env.local`?
- [ ] No typos in variable names?
- [ ] Token is complete (no truncation)?
- [ ] Database URL starts with `libsql://`?

## Next Steps After Fixing

1. If tables don't exist: `POST /api/init-db`
2. Test health: `GET /api/health`
3. Create test project via UI

## Support

If issues persist, the debug endpoints will show exactly what's wrong.