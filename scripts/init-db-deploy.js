#!/usr/bin/env node

/**
 * Database Initialization Script for Deployment
 * 
 * This script automatically initializes the database schema during deployment.
 * It's designed to be:
 * - Idempotent: Safe to run multiple times
 * - Fail-safe: Won't crash if database is already initialized
 * - Logged: Provides detailed output for deployment logs
 * - Environment-aware: Works in all deployment environments
 */

const { createClient } = require('@libsql/client');

// Environment configuration
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;
const NODE_ENV = process.env.NODE_ENV || 'development';
const VERCEL = process.env.VERCEL;

console.log('🚀 Starting database initialization for deployment...');
console.log(`Environment: ${NODE_ENV} ${VERCEL ? '(Vercel)' : '(Local)'}`);

// Environment validation
function validateEnvironment() {
  console.log('🔍 Validating environment variables...');
  
  const errors = [];
  
  if (!TURSO_DATABASE_URL) {
    errors.push('TURSO_DATABASE_URL is missing');
  } else if (!TURSO_DATABASE_URL.startsWith('libsql://')) {
    errors.push('TURSO_DATABASE_URL must start with "libsql://"');
  } else {
    console.log('✅ TURSO_DATABASE_URL is properly configured');
  }
  
  if (!TURSO_AUTH_TOKEN) {
    errors.push('TURSO_AUTH_TOKEN is missing');
  } else if (TURSO_AUTH_TOKEN.length < 32) {
    errors.push('TURSO_AUTH_TOKEN appears to be invalid (too short)');
  } else {
    console.log('✅ TURSO_AUTH_TOKEN is properly configured');
  }
  
  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    throw new Error(`Environment validation failed: ${errors.join(', ')}`);
  }
  
  console.log('✅ Environment validation passed');
}

// Database schema is now managed via migrations in scripts/migrations/

// Database initialization using migration system
async function initializeDatabase() {
  const { MigrationRunner } = require('./migrate.js');
  const runner = new MigrationRunner();
  
  try {
    console.log('🔌 Initializing migration runner...');
    await runner.initialize();
    
    console.log('🔗 Testing database connection...');
    // Connection test is handled by MigrationRunner.initialize()
    
    console.log('📊 Checking migration status...');
    const status = await runner.getStatus();
    
    console.log(`Current status: ${status.executed} executed, ${status.pending} pending migrations`);
    
    if (status.pending === 0) {
      console.log('✅ Database schema is up to date');
      return { 
        created: false, 
        verified: true, 
        migrations: status.executed,
        lastMigration: status.lastMigration?.id 
      };
    }
    
    console.log(`🚀 Running ${status.pending} pending migrations...`);
    const result = await runner.runMigrations();
    
    console.log('✅ Database initialization completed via migrations');
    
    return { 
      created: true, 
      verified: true, 
      migrations: result.executed,
      migrationResults: result.results 
    };
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    
    // Provide specific error guidance
    if (error.message.includes('UNAUTHORIZED') || error.message.includes('authentication')) {
      console.error('💡 Authentication failed. Check your TURSO_AUTH_TOKEN:');
      console.error('   1. Verify the token is correct in your environment');
      console.error('   2. Ensure the token has not expired');
      console.error('   3. Check that the token has write permissions');
    } else if (error.message.includes('connection') || error.message.includes('ENOTFOUND')) {
      console.error('💡 Connection failed. Check your TURSO_DATABASE_URL:');
      console.error('   1. Verify the URL format: libsql://[database-name]-[org].turso.io');
      console.error('   2. Ensure the database exists in your Turso account');
      console.error('   3. Check your network connectivity');
    } else if (error.message.includes('syntax') || error.message.includes('SQL')) {
      console.error('💡 SQL error occurred:');
      console.error('   1. Check the database schema syntax');
      console.error('   2. Verify SQLite compatibility');
      console.error('   3. Review the error details above');
    } else if (error.message.includes('Migration')) {
      console.error('💡 Migration error occurred:');
      console.error('   1. Check migration files in scripts/migrations/');
      console.error('   2. Verify migration syntax and logic');
      console.error('   3. Check migration dependencies');
    }
    
    throw error;
  } finally {
    await runner.close();
  }
}

// Migration tracking (for future use)
async function trackMigration(turso, migrationId, description) {
  try {
    // Create migrations table if it doesn't exist
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        executed_at TEXT NOT NULL,
        checksum TEXT
      )
    `);
    
    // Record this migration
    await turso.execute(
      'INSERT OR IGNORE INTO migrations (id, description, executed_at) VALUES (?, ?, ?)',
      [migrationId, description, new Date().toISOString()]
    );
    
    console.log(`📝 Migration recorded: ${migrationId}`);
  } catch (error) {
    console.warn('⚠️  Warning: Could not track migration:', error);
  }
}

// Main execution
async function main() {
  const startTime = Date.now();
  
  try {
    console.log('🎯 Database Deployment Initialization Starting...');
    
    // Step 1: Validate environment
    validateEnvironment();
    
    // Step 2: Initialize database
    const result = await initializeDatabase();
    
    // Step 3: Report results
    const duration = Date.now() - startTime;
    console.log('\n🎉 Database initialization completed successfully!');
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Status: ${result.created ? 'Schema Created' : 'Schema Already Existed'}`);
    console.log(`📋 Tables: projects, logs`);
    
    // Exit with success
    process.exit(0);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('\n💥 Database initialization failed!');
    console.error(`⏱️  Duration: ${duration}ms`);
    console.error(`❌ Error: ${error.message}`);
    
    // Provide deployment guidance
    console.error('\n🔧 Deployment Troubleshooting:');
    console.error('1. Check environment variables in your deployment platform');
    console.error('2. Verify Turso database is accessible from your deployment region');
    console.error('3. Ensure your Turso auth token has write permissions');
    console.error('4. Check deployment logs for additional error details');
    console.error('\n📖 For more help, see: /docs/deployment/troubleshooting.md');
    
    // Exit with failure
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { main, initializeDatabase, validateEnvironment };