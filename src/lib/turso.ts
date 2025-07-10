// lib/turso.ts
import { createClient } from '@libsql/client';

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL environment variable is required');
}

if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error('TURSO_AUTH_TOKEN environment variable is required');
}

export const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Auto-initialize database on import
console.log('Initializing Turso database...');
initializeDatabase()
  .then(() => {
    console.log('Database initialization completed successfully');
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    console.error('Database initialization error stack:', error.stack);
  });

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await turso.execute('SELECT 1');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

// Initialize database with schema
export async function initializeDatabase(): Promise<void> {
  try {
    // Check if tables exist
    const result = await turso.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('projects', 'logs')
    `);
    
    if (result.rows.length === 0) {
      // Tables don't exist, create them
      const schema = `
        CREATE TABLE projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT DEFAULT '',
          created_at TEXT NOT NULL,
          api_key TEXT NOT NULL UNIQUE
        );

        CREATE TABLE logs (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          content TEXT NOT NULL,
          comment TEXT DEFAULT '',
          timestamp TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE INDEX idx_logs_project_id ON logs(project_id);
        CREATE INDEX idx_logs_timestamp ON logs(timestamp);
        CREATE INDEX idx_logs_is_read ON logs(is_read);
        CREATE INDEX idx_projects_api_key ON projects(api_key);
      `;
      
      await turso.executeMultiple(schema);
      console.log('Database schema initialized successfully');
    } else {
      console.log('Database schema already exists');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}