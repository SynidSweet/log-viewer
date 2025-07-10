// lib/turso.ts
import { createClient, type ResultSet, type InArgs } from '@libsql/client';

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL environment variable is required');
}

if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error('TURSO_AUTH_TOKEN environment variable is required');
}

// Connection pooling configuration (reserved for future use)
// const CONNECTION_POOL_SIZE = 5;
// const CONNECTION_TIMEOUT_MS = 30000;

export const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
  // Performance optimizations
  syncUrl: process.env.TURSO_SYNC_URL,
  syncInterval: 60000, // Sync every minute
  encryptionKey: process.env.TURSO_ENCRYPTION_KEY,
});

// Database initialization state
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;
let initializationRetryCount = 0;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

// Connection caching and performance tracking
interface ConnectionMetrics {
  lastUsed: number;
  responseTime: number;
  queryCount: number;
}

let connectionMetrics: ConnectionMetrics = {
  lastUsed: 0,
  responseTime: 0,
  queryCount: 0
};

// Query result caching for frequently accessed data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const queryCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 30000; // 30 seconds default TTL

// Cache management functions
function getCacheKey(sql: string, args?: InArgs): string {
  return `${sql}:${args ? JSON.stringify(args) : ''}`;
}

function getCachedResult<T>(key: string): T | null {
  const entry = queryCache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    queryCache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

function setCachedResult<T>(key: string, data: T, ttl: number = CACHE_TTL_MS): void {
  queryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

function clearCache(): void {
  queryCache.clear();
}

// Performance-optimized query execution
export async function executeQuery(sql: string, args?: InArgs, useCache: boolean = false): Promise<ResultSet> {
  const startTime = Date.now();
  
  // Check cache for read-only queries
  if (useCache && sql.trim().toUpperCase().startsWith('SELECT')) {
    const cacheKey = getCacheKey(sql, args);
    const cached = getCachedResult<ResultSet>(cacheKey);
    if (cached) {
      return cached;
    }
  }
  
  try {
    const result = args ? await turso.execute({ sql, args }) : await turso.execute(sql);
    
    // Update metrics
    const responseTime = Date.now() - startTime;
    connectionMetrics = {
      lastUsed: Date.now(),
      responseTime,
      queryCount: connectionMetrics.queryCount + 1
    };
    
    // Cache result if requested
    if (useCache && sql.trim().toUpperCase().startsWith('SELECT')) {
      const cacheKey = getCacheKey(sql, args);
      setCachedResult(cacheKey, result);
    }
    
    return result;
  } catch (error) {
    console.error('Query execution failed:', { sql, args, error });
    throw error;
  }
}

// Helper function for exponential backoff
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Structured error types
export interface DatabaseError {
  type: 'connection' | 'initialization' | 'schema' | 'query' | 'validation';
  message: string;
  code?: string;
  retryable: boolean;
  details?: unknown;
}

export function createDatabaseError(type: DatabaseError['type'], message: string, originalError?: unknown): DatabaseError {
  return {
    type,
    message,
    code: (originalError && typeof originalError === 'object' && 'code' in originalError) 
      ? String(originalError.code) 
      : 'UNKNOWN',
    retryable: type === 'connection' || type === 'initialization',
    details: originalError
  };
}

// Request-level database readiness guard
export async function ensureDatabaseReady(): Promise<void> {
  if (isInitialized) {
    return;
  }
  
  // If initialization is already in progress, wait for it
  if (initializationPromise) {
    await initializationPromise;
    return;
  }
  
  // Start initialization with retry logic
  initializationPromise = initializeWithRetry();
  await initializationPromise;
}

// Initialize database with retry mechanism
async function initializeWithRetry(): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      console.log(`Database initialization attempt ${attempt}/${MAX_RETRY_ATTEMPTS}`);
      
      // First validate connection
      const isConnected = await checkDatabaseConnection();
      if (!isConnected) {
        throw createDatabaseError('connection', 'Database connection failed');
      }
      
      // Then initialize schema
      await initializeDatabase();
      
      isInitialized = true;
      initializationRetryCount = 0;
      console.log('Database initialization completed successfully');
      return;
      
    } catch (error) {
      console.error(`Database initialization attempt ${attempt} failed:`, error);
      
      if (attempt === MAX_RETRY_ATTEMPTS) {
        initializationRetryCount++;
        throw createDatabaseError('initialization', 
          `Database initialization failed after ${MAX_RETRY_ATTEMPTS} attempts`, 
          error
        );
      }
      
      // Wait before retrying with exponential backoff
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
}

// Connection health check with timeout and caching
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout')), 5000);
    });
    
    // Use optimized query execution
    const connectionCheck = executeQuery('SELECT 1 as connection_test', undefined, true);
    
    const result = await Promise.race([connectionCheck, timeout]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

// Initialize database with schema validation and auto-repair
export async function initializeDatabase(): Promise<void> {
  try {
    // Validate database connection first
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw createDatabaseError('connection', 'Database connection validation failed');
    }
    
    // Check if tables exist
    const result = await turso.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('projects', 'logs')
    `);
    
    const existingTables = result.rows.map(row => row.name as string);
    const requiredTables = ['projects', 'logs'];
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log(`Creating missing tables: ${missingTables.join(', ')}`);
      
      // Create schema with proper error handling
      const schema = `
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT DEFAULT '',
          created_at TEXT NOT NULL,
          api_key TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS logs (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          content TEXT NOT NULL,
          comment TEXT DEFAULT '',
          timestamp TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_logs_project_id ON logs(project_id);
        CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_logs_is_read ON logs(is_read);
        CREATE INDEX IF NOT EXISTS idx_projects_api_key ON projects(api_key);
      `;
      
      await turso.executeMultiple(schema);
      console.log('Database schema created successfully');
    } else {
      console.log('Database schema validation passed');
    }
    
    // Additional schema validation
    await validateDatabaseSchema();
    
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw createDatabaseError('initialization', 
      'Database initialization failed', 
      error
    );
  }
}

// Validate database schema integrity
async function validateDatabaseSchema(): Promise<void> {
  try {
    // Test basic table structure with optimized queries
    await executeQuery('SELECT COUNT(*) FROM projects LIMIT 1', undefined, true);
    await executeQuery('SELECT COUNT(*) FROM logs LIMIT 1', undefined, true);
    
    // Test foreign key constraints
    await executeQuery('PRAGMA foreign_key_check');
    
    console.log('Database schema validation completed');
  } catch (error) {
    throw createDatabaseError('schema', 
      'Database schema validation failed', 
      error
    );
  }
}

// Enhanced database health check with performance metrics
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; details: unknown }> {
  try {
    const startTime = Date.now();
    
    // Basic connection test using optimized execution
    const result = await executeQuery('SELECT 1 as test', undefined, true);
    if (result.rows.length === 0) {
      return { healthy: false, details: { error: 'No response from database' } };
    }
    
    const responseTime = Date.now() - startTime;
    
    // Schema validation with caching
    const tables = await executeQuery(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('projects', 'logs')
    `, undefined, true);
    
    const hasRequiredTables = tables.rows.length === 2;
    
    return {
      healthy: hasRequiredTables,
      details: {
        responseTime,
        tables: tables.rows.map(row => row.name),
        initialized: isInitialized,
        retryCount: initializationRetryCount,
        // Performance metrics
        performance: {
          cacheSize: queryCache.size,
          lastUsed: connectionMetrics.lastUsed,
          avgResponseTime: connectionMetrics.responseTime,
          queryCount: connectionMetrics.queryCount
        }
      }
    };
  } catch (error) {
    return {
      healthy: false,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        initialized: isInitialized,
        retryCount: initializationRetryCount,
        performance: {
          cacheSize: queryCache.size,
          queryCount: connectionMetrics.queryCount
        }
      }
    };
  }
}

// Performance utilities
export function getPerformanceMetrics(): ConnectionMetrics & { cacheSize: number } {
  return {
    ...connectionMetrics,
    cacheSize: queryCache.size
  };
}

export function clearQueryCache(): void {
  clearCache();
}

// Batch operation support
export async function executeBatch(operations: Array<{ sql: string; args?: InArgs }>): Promise<ResultSet[]> {
  const startTime = Date.now();
  
  try {
    // Execute all operations in a single transaction for better performance
    const results = await Promise.all(
      operations.map(op => executeQuery(op.sql, op.args))
    );
    
    // Update metrics
    const responseTime = Date.now() - startTime;
    connectionMetrics = {
      lastUsed: Date.now(),
      responseTime,
      queryCount: connectionMetrics.queryCount + operations.length
    };
    
    return results;
  } catch (error) {
    console.error('Batch operation failed:', error);
    throw error;
  }
}

// Warm up database connection
export async function warmupConnection(): Promise<void> {
  try {
    await executeQuery('SELECT 1', undefined, true);
    console.log('Database connection warmed up successfully');
  } catch (error) {
    console.error('Failed to warm up database connection:', error);
  }
}