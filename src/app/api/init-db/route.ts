import { turso } from '@/lib/turso';
import { withApiErrorHandling } from '@/lib/api-error-handler';

export async function POST() {
  return withApiErrorHandling(async () => {
    
    // Check if turso client is available
    if (!turso) {
      throw new Error('Database client not initialized. Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables.');
    }
    
    // Check if tables exist first
    const tablesResult = await turso!.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('projects', 'logs')
    `);
    
    
    if (tablesResult.rows.length === 0) {
      
      // Create tables
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
      
      await turso!.executeMultiple(schema);
      
      return {
        success: true,
        message: 'Database schema created successfully',
        tables: ['projects', 'logs']
      };
    } else {
      
      return {
        success: true,
        message: 'Database schema already exists',
        existingTables: tablesResult.rows.map(row => row.name)
      };
    }
  });
}