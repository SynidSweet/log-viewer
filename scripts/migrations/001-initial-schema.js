/**
 * Migration 001: Initial Database Schema
 * 
 * Creates the basic projects and logs tables with proper indexes
 * This migration is idempotent and safe to run multiple times
 */

const migration = {
  id: '001-initial-schema',
  description: 'Create initial database schema with projects and logs tables',
  version: '1.0.0',
  
  up: async (turso) => {
    console.log('🚀 Running migration: Initial Schema');
    
    // Create projects table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        api_key TEXT NOT NULL UNIQUE
      )
    `);
    
    console.log('✅ Created projects table');
    
    // Create logs table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        content TEXT NOT NULL,
        comment TEXT DEFAULT '',
        timestamp TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ Created logs table');
    
    // Create indexes
    await turso.execute('CREATE INDEX IF NOT EXISTS idx_logs_project_id ON logs(project_id)');
    await turso.execute('CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp)');
    await turso.execute('CREATE INDEX IF NOT EXISTS idx_logs_is_read ON logs(is_read)');
    await turso.execute('CREATE INDEX IF NOT EXISTS idx_projects_api_key ON projects(api_key)');
    
    console.log('✅ Created indexes');
    
    return {
      tablesCreated: ['projects', 'logs'],
      indexesCreated: ['idx_logs_project_id', 'idx_logs_timestamp', 'idx_logs_is_read', 'idx_projects_api_key']
    };
  },
  
  down: async (turso) => {
    // Drop tables in reverse order due to foreign key constraints
    await turso.execute('DROP INDEX IF EXISTS idx_projects_api_key');
    await turso.execute('DROP INDEX IF EXISTS idx_logs_is_read');
    await turso.execute('DROP INDEX IF EXISTS idx_logs_timestamp');
    await turso.execute('DROP INDEX IF EXISTS idx_logs_project_id');
    
    await turso.execute('DROP TABLE IF EXISTS logs');
    await turso.execute('DROP TABLE IF EXISTS projects');
    
    return {
      tablesDropped: ['logs', 'projects'],
      indexesDropped: ['idx_logs_project_id', 'idx_logs_timestamp', 'idx_logs_is_read', 'idx_projects_api_key']
    };
  },
  
  verify: async (turso) => {
    // Verify tables exist
    const tablesResult = await turso.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('projects', 'logs')
    `);
    
    const tables = tablesResult.rows.map(row => row.name);
    
    // Verify indexes exist
    const indexesResult = await turso.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name LIKE 'idx_%'
    `);
    
    const indexes = indexesResult.rows.map(row => row.name);
    
    const expectedTables = ['projects', 'logs'];
    const expectedIndexes = ['idx_logs_project_id', 'idx_logs_timestamp', 'idx_logs_is_read', 'idx_projects_api_key'];
    
    const missingTables = expectedTables.filter(table => !tables.includes(table));
    const missingIndexes = expectedIndexes.filter(index => !indexes.includes(index));
    
    return {
      valid: missingTables.length === 0 && missingIndexes.length === 0,
      tables: tables,
      indexes: indexes,
      missingTables: missingTables,
      missingIndexes: missingIndexes
    };
  }
};

module.exports = migration;