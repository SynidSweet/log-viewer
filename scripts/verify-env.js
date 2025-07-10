#!/usr/bin/env node

/**
 * Environment Variable Verification Script
 * 
 * This script helps diagnose environment variable configuration issues
 * in different deployment environments.
 * 
 * Usage:
 * - Local: node scripts/verify-env.js
 * - Production: Can be run via API endpoint or build process
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Required environment variables for Turso database
const REQUIRED_TURSO_VARS = [
  'TURSO_DATABASE_URL',
  'TURSO_AUTH_TOKEN'
];

// Optional but recommended environment variables
const OPTIONAL_VARS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'ALLOWED_EMAILS',
  'ALLOWED_DOMAINS'
];

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function maskSensitiveValue(key, value) {
  if (!value) return '<not set>';
  
  // For URLs, show the structure but mask sensitive parts
  if (key.includes('URL')) {
    try {
      const url = new URL(value);
      return `${url.protocol}//${url.hostname.replace(/[a-z0-9]/g, '*')}`;
    } catch {
      return '<invalid URL>';
    }
  }
  
  // For tokens and secrets, show length and first few characters
  if (key.includes('TOKEN') || key.includes('SECRET') || key.includes('KEY')) {
    return `${value.substring(0, 8)}...<${value.length} chars>`;
  }
  
  // For other values, show partially
  if (value.length > 20) {
    return `${value.substring(0, 10)}...<${value.length} chars>`;
  }
  
  return value;
}

function validateTursoUrl(url) {
  if (!url) return { valid: false, error: 'URL is not set' };
  
  try {
    const parsed = new URL(url);
    
    // Check protocol
    if (!['libsql:', 'https:', 'http:'].includes(parsed.protocol)) {
      return { valid: false, error: `Invalid protocol: ${parsed.protocol}` };
    }
    
    // Check hostname format for Turso
    if (!parsed.hostname.includes('.turso.io') && !parsed.hostname.includes('localhost')) {
      return { valid: false, error: 'URL does not appear to be a valid Turso database URL' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Invalid URL format: ${error.message}` };
  }
}

function validateTursoToken(token) {
  if (!token) return { valid: false, error: 'Token is not set' };
  
  // Basic JWT structure validation
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Token does not appear to be a valid JWT (expected 3 parts)' };
  }
  
  // Check if it's a reasonable length
  if (token.length < 100) {
    return { valid: false, error: 'Token appears too short to be valid' };
  }
  
  return { valid: true };
}

function checkEnvironmentVariables() {
  log('\n=== Universal Log Viewer - Environment Variable Verification ===\n', 'cyan');
  
  // Check deployment environment
  const nodeEnv = process.env.NODE_ENV || 'development';
  const vercelEnv = process.env.VERCEL_ENV || 'not-vercel';
  log(`Environment: ${nodeEnv} (VERCEL_ENV: ${vercelEnv})`, 'blue');
  log(`Timestamp: ${new Date().toISOString()}\n`, 'blue');
  
  let hasErrors = false;
  
  // Check required Turso variables
  log('Required Turso Database Variables:', 'yellow');
  for (const varName of REQUIRED_TURSO_VARS) {
    const value = process.env[varName];
    const maskedValue = maskSensitiveValue(varName, value);
    
    if (!value) {
      log(`  ❌ ${varName}: ${maskedValue}`, 'red');
      hasErrors = true;
    } else {
      log(`  ✓ ${varName}: ${maskedValue}`, 'green');
      
      // Additional validation
      if (varName === 'TURSO_DATABASE_URL') {
        const validation = validateTursoUrl(value);
        if (!validation.valid) {
          log(`    ⚠️  Validation Error: ${validation.error}`, 'yellow');
          hasErrors = true;
        } else {
          log(`    ✓ URL format is valid`, 'green');
        }
      }
      
      if (varName === 'TURSO_AUTH_TOKEN') {
        const validation = validateTursoToken(value);
        if (!validation.valid) {
          log(`    ⚠️  Validation Error: ${validation.error}`, 'yellow');
          hasErrors = true;
        } else {
          log(`    ✓ Token format is valid`, 'green');
        }
      }
    }
  }
  
  // Check optional variables
  log('\nOptional Environment Variables:', 'yellow');
  for (const varName of OPTIONAL_VARS) {
    const value = process.env[varName];
    const maskedValue = maskSensitiveValue(varName, value);
    
    if (!value) {
      log(`  ⚠️  ${varName}: ${maskedValue}`, 'yellow');
    } else {
      log(`  ✓ ${varName}: ${maskedValue}`, 'green');
    }
  }
  
  // Check for .env files
  log('\nEnvironment File Check:', 'yellow');
  const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
  for (const envFile of envFiles) {
    const filePath = path.join(process.cwd(), envFile);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      log(`  ✓ ${envFile} exists (${stats.size} bytes)`, 'green');
    } else {
      log(`  - ${envFile} not found`, 'cyan');
    }
  }
  
  // Summary
  log('\n=== Summary ===', 'cyan');
  if (hasErrors) {
    log('❌ Environment configuration has errors!', 'red');
    log('\nRequired Actions:', 'yellow');
    log('1. Ensure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are set in Vercel dashboard', 'yellow');
    log('2. Verify the values match your Turso database credentials', 'yellow');
    log('3. Redeploy after updating environment variables', 'yellow');
    process.exit(1);
  } else {
    log('✅ All required environment variables are properly configured!', 'green');
    
    // Additional recommendations
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      log('\n⚠️  Note: Google OAuth is not configured. Authentication will not work.', 'yellow');
    }
  }
  
  log('\n');
}

// Run the check
checkEnvironmentVariables();