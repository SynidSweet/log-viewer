#!/usr/bin/env node

/**
 * Setup script for Turso database
 * This script helps initialize the database with proper schema
 */

const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

async function setupTurso() {
  // Check for required environment variables
  if (!process.env.TURSO_DATABASE_URL) {
    console.error('❌ TURSO_DATABASE_URL environment variable is required');
    console.log('Please set up your Turso database at https://turso.tech and add the URL to your environment');
    process.exit(1);
  }

  if (!process.env.TURSO_AUTH_TOKEN) {
    console.error('❌ TURSO_AUTH_TOKEN environment variable is required');
    console.log('Please get your auth token from your Turso dashboard');
    process.exit(1);
  }

  try {
    console.log('🔧 Setting up Turso database...');
    
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // Test connection
    console.log('🔍 Testing database connection...');
    const testResult = await client.execute('SELECT 1');
    console.log('✅ Database connection successful');

    // Check if tables exist
    const tablesResult = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('projects', 'logs')
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('📦 Creating database schema...');
      
      // Read schema file
      const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Execute schema
      await client.executeMultiple(schema);
      console.log('✅ Database schema created successfully');
    } else {
      console.log('✅ Database schema already exists');
    }

    // Verify schema
    console.log('🔍 Verifying database schema...');
    const projectsResult = await client.execute('SELECT COUNT(*) as count FROM projects');
    const logsResult = await client.execute('SELECT COUNT(*) as count FROM logs');
    
    console.log(`📊 Database statistics:`);
    console.log(`   Projects: ${projectsResult.rows[0].count}`);
    console.log(`   Logs: ${logsResult.rows[0].count}`);

    console.log('🎉 Turso database setup complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update your API routes to use the new database');
    console.log('2. Test the health check endpoint: GET /api/health');
    console.log('3. Migrate existing data if needed');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupTurso();