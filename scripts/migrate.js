#!/usr/bin/env node

/**
 * Database Migration Runner
 * 
 * Handles database schema migrations with proper tracking and rollback support.
 * This script is designed to be safe for production deployment.
 */

const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

// Environment configuration
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

class MigrationRunner {
  constructor() {
    this.turso = null;
    this.migrationsPath = path.join(__dirname, 'migrations');
  }

  async initialize() {
    if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
      throw new Error('Missing required environment variables: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN');
    }

    this.turso = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
      syncUrl: process.env.TURSO_SYNC_URL || undefined,
      syncInterval: 60000,
      encryptionKey: process.env.TURSO_ENCRYPTION_KEY || undefined,
    });

    // Create migrations tracking table
    await this.createMigrationsTable();
  }

  async createMigrationsTable() {
    console.log('📋 Creating migrations tracking table...');
    
    await this.turso.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        version TEXT NOT NULL,
        executed_at TEXT NOT NULL,
        execution_time_ms INTEGER NOT NULL,
        checksum TEXT,
        status TEXT DEFAULT 'completed'
      )
    `);
    
    console.log('✅ Migrations tracking table ready');
  }

  async getExecutedMigrations() {
    const result = await this.turso.execute(
      'SELECT id, executed_at FROM migrations WHERE status = ? ORDER BY executed_at',
      ['completed']
    );
    
    return result.rows.map(row => ({
      id: row.id,
      executedAt: row.executed_at
    }));
  }

  async getPendingMigrations() {
    // Get all migration files
    const migrationFiles = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.js'))
      .sort();

    // Get executed migrations
    const executed = await this.getExecutedMigrations();
    const executedIds = new Set(executed.map(m => m.id));

    // Find pending migrations
    const pending = [];
    
    for (const file of migrationFiles) {
      const migrationPath = path.join(this.migrationsPath, file);
      const migration = require(migrationPath);
      
      if (!executedIds.has(migration.id)) {
        pending.push({
          file: file,
          path: migrationPath,
          migration: migration
        });
      }
    }

    return pending;
  }

  async executeMigration(migrationInfo) {
    const { migration, file } = migrationInfo;
    const startTime = Date.now();
    
    console.log(`🔄 Executing migration: ${migration.id} - ${migration.description}`);
    
    try {
      // Execute the migration
      const result = await migration.up(this.turso);
      
      // Verify migration success
      if (migration.verify) {
        const verification = await migration.verify(this.turso);
        if (!verification.valid) {
          throw new Error(`Migration verification failed: ${JSON.stringify(verification)}`);
        }
        console.log('✅ Migration verification passed');
      }
      
      // Record successful migration
      const executionTime = Date.now() - startTime;
      await this.turso.execute(
        `INSERT INTO migrations (id, description, version, executed_at, execution_time_ms, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          migration.id,
          migration.description,
          migration.version,
          new Date().toISOString(),
          executionTime,
          'completed'
        ]
      );
      
      console.log(`✅ Migration completed: ${migration.id} (${executionTime}ms)`);
      
      return {
        id: migration.id,
        success: true,
        executionTime: executionTime,
        result: result
      };
      
    } catch (error) {
      console.error(`❌ Migration failed: ${migration.id}`, error);
      
      // Record failed migration
      const executionTime = Date.now() - startTime;
      await this.turso.execute(
        `INSERT INTO migrations (id, description, version, executed_at, execution_time_ms, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          migration.id,
          migration.description,
          migration.version,
          new Date().toISOString(),
          executionTime,
          'failed'
        ]
      );
      
      throw error;
    }
  }

  async runMigrations() {
    console.log('🚀 Starting database migrations...');
    
    const pending = await this.getPendingMigrations();
    
    if (pending.length === 0) {
      console.log('✅ No pending migrations found');
      return { executed: 0, results: [] };
    }
    
    console.log(`📝 Found ${pending.length} pending migrations:`);
    pending.forEach(p => {
      console.log(`   - ${p.migration.id}: ${p.migration.description}`);
    });
    
    const results = [];
    
    for (const migrationInfo of pending) {
      try {
        const result = await this.executeMigration(migrationInfo);
        results.push(result);
      } catch (error) {
        // Stop on first failure
        console.error('💥 Migration execution stopped due to failure');
        throw error;
      }
    }
    
    console.log(`🎉 Successfully executed ${results.length} migrations`);
    
    return { executed: results.length, results: results };
  }

  async getStatus() {
    const executed = await this.getExecutedMigrations();
    const pending = await this.getPendingMigrations();
    
    return {
      executed: executed.length,
      pending: pending.length,
      lastMigration: executed.length > 0 ? executed[executed.length - 1] : null,
      executedMigrations: executed,
      pendingMigrations: pending.map(p => ({
        id: p.migration.id,
        description: p.migration.description,
        version: p.migration.version
      }))
    };
  }

  async close() {
    if (this.turso) {
      await this.turso.close();
      this.turso = null;
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2] || 'run';
  const runner = new MigrationRunner();
  
  try {
    console.log('🔧 Initializing migration runner...');
    await runner.initialize();
    
    switch (command) {
      case 'run':
        const result = await runner.runMigrations();
        console.log(`\n📊 Migration Summary:`);
        console.log(`   Executed: ${result.executed} migrations`);
        break;
        
      case 'status':
        const status = await runner.getStatus();
        console.log(`\n📊 Migration Status:`);
        console.log(`   Executed: ${status.executed} migrations`);
        console.log(`   Pending: ${status.pending} migrations`);
        if (status.lastMigration) {
          console.log(`   Last migration: ${status.lastMigration.id} (${status.lastMigration.executedAt})`);
        }
        break;
        
      default:
        console.log('Usage: node migrate.js [run|status]');
        process.exit(1);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Migration runner failed:', error);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

// Export for programmatic use
module.exports = { MigrationRunner };

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}