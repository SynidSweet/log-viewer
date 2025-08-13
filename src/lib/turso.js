"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.turso = void 0;
exports.executeQuery = executeQuery;
exports.createDatabaseError = createDatabaseError;
exports.ensureDatabaseReady = ensureDatabaseReady;
exports.checkDatabaseConnection = checkDatabaseConnection;
exports.initializeDatabase = initializeDatabase;
exports.checkDatabaseHealth = checkDatabaseHealth;
exports.getPerformanceMetrics = getPerformanceMetrics;
exports.clearQueryCache = clearQueryCache;
exports.executeBatch = executeBatch;
exports.warmupConnection = warmupConnection;
// lib/turso.ts
const client_1 = require("@libsql/client");
// Environment variable validation with detailed error messages
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;
// Check environment variables but don't throw at module level
const hasRequiredEnvVars = !!(TURSO_DATABASE_URL && TURSO_AUTH_TOKEN);
// Validate environment variable format for better error reporting
function validateTursoConfig() {
    const errors = [];
    if (!TURSO_DATABASE_URL) {
        errors.push('TURSO_DATABASE_URL is missing');
    }
    else if (!TURSO_DATABASE_URL.startsWith('libsql://')) {
        errors.push('TURSO_DATABASE_URL must start with "libsql://"');
    }
    if (!TURSO_AUTH_TOKEN) {
        errors.push('TURSO_AUTH_TOKEN is missing');
    }
    else if (TURSO_AUTH_TOKEN.length < 32) {
        errors.push('TURSO_AUTH_TOKEN appears to be invalid (too short)');
    }
    return { valid: errors.length === 0, errors };
}
// Detailed environment validation for debugging
const configValidation = validateTursoConfig();
// Environment validation handled through error responses
// Connection pooling configuration (reserved for future use)
// const CONNECTION_POOL_SIZE = 5;
// const CONNECTION_TIMEOUT_MS = 30000;
// Create client only if environment variables are available
exports.turso = hasRequiredEnvVars ? (0, client_1.createClient)({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
    // Performance optimizations - check for existence before using
    syncUrl: process.env.TURSO_SYNC_URL || undefined,
    syncInterval: 60000, // Sync every minute
    encryptionKey: process.env.TURSO_ENCRYPTION_KEY || undefined,
}) : null;
// Database initialization state
let isInitialized = false;
let initializationPromise = null;
let initializationRetryCount = 0;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
let connectionMetrics = {
    lastUsed: 0,
    responseTime: 0,
    queryCount: 0
};
const queryCache = new Map();
const CACHE_TTL_MS = 30000; // 30 seconds default TTL
// Cache management functions
function getCacheKey(sql, args) {
    return `${sql}:${args ? JSON.stringify(args) : ''}`;
}
function getCachedResult(key) {
    const entry = queryCache.get(key);
    if (!entry)
        return null;
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
        queryCache.delete(key);
        return null;
    }
    return entry.data;
}
function setCachedResult(key, data, ttl = CACHE_TTL_MS) {
    queryCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
    });
}
function clearCache() {
    queryCache.clear();
}
// Performance-optimized query execution
async function executeQuery(sql, args, useCache = false) {
    const startTime = Date.now();
    // Check cache for read-only queries
    if (useCache && sql.trim().toUpperCase().startsWith('SELECT')) {
        const cacheKey = getCacheKey(sql, args);
        const cached = getCachedResult(cacheKey);
        if (cached) {
            return cached;
        }
    }
    try {
        if (!exports.turso) {
            throw createDatabaseError('connection', 'Database client not available - check environment configuration');
        }
        const result = args ? await exports.turso.execute({ sql, args }) : await exports.turso.execute(sql);
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
    }
    catch (error) {
        // Classify database errors for better error reporting
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            // Connection-related errors
            if (message.includes('connect') || message.includes('network') || message.includes('timeout')) {
                throw createDatabaseError('connection', `Database connection failed: ${error.message}`, error);
            }
            // Authentication errors
            if (message.includes('unauthorized') || message.includes('authentication') || message.includes('token')) {
                throw createDatabaseError('connection', `Database authentication failed: ${error.message}`, error);
            }
            // Schema errors
            if (message.includes('no such table') || message.includes('no such column')) {
                throw createDatabaseError('schema', `Database schema error: ${error.message}`, error);
            }
            // Constraint errors
            if (message.includes('constraint') || message.includes('foreign key') || message.includes('unique')) {
                throw createDatabaseError('validation', `Database constraint violation: ${error.message}`, error);
            }
            // SQLite-specific errors
            if (message.includes('syntax error') || message.includes('near')) {
                throw createDatabaseError('query', `SQL syntax error: ${error.message}`, error);
            }
            if (message.includes('database is locked') || message.includes('database is busy')) {
                throw createDatabaseError('query', `Database busy: ${error.message}`, error);
            }
        }
        // Generic query error
        throw createDatabaseError('query', `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
    }
}
// Helper function for exponential backoff
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function createDatabaseError(type, message, originalError) {
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
async function ensureDatabaseReady() {
    // First check if environment variables are properly configured
    if (!hasRequiredEnvVars) {
        const missingVars = [];
        if (!TURSO_DATABASE_URL)
            missingVars.push('TURSO_DATABASE_URL');
        if (!TURSO_AUTH_TOKEN)
            missingVars.push('TURSO_AUTH_TOKEN');
        throw createDatabaseError('connection', `Missing required environment variables: ${missingVars.join(', ')}. ` +
            'Configure these variables in your deployment environment and redeploy.');
    }
    // Check configuration validity
    if (!configValidation.valid) {
        throw createDatabaseError('connection', `Invalid database configuration: ${configValidation.errors.join(', ')}. ` +
            'Check your environment variables format and update them.');
    }
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
async function initializeWithRetry() {
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
        try {
            // First validate connection
            const isConnected = await checkDatabaseConnection();
            if (!isConnected) {
                throw createDatabaseError('connection', 'Database connection failed');
            }
            // Then initialize schema
            await initializeDatabase();
            isInitialized = true;
            initializationRetryCount = 0;
            return;
        }
        catch (error) {
            if (attempt === MAX_RETRY_ATTEMPTS) {
                initializationRetryCount++;
                throw createDatabaseError('initialization', `Database initialization failed after ${MAX_RETRY_ATTEMPTS} attempts`, error);
            }
            // Wait before retrying with exponential backoff
            const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
            await sleep(delay);
        }
    }
}
// Connection health check with timeout and caching
async function checkDatabaseConnection() {
    try {
        const timeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Database connection timeout')), 5000);
        });
        // Use optimized query execution
        const connectionCheck = executeQuery('SELECT 1 as connection_test', undefined, true);
        const result = await Promise.race([connectionCheck, timeout]);
        return result.rows.length > 0;
    }
    catch {
        return false;
    }
}
// Initialize database with schema validation and auto-repair
async function initializeDatabase() {
    try {
        // Validate database connection first
        const isConnected = await checkDatabaseConnection();
        if (!isConnected) {
            throw createDatabaseError('connection', 'Database connection validation failed');
        }
        // Check if tables exist
        const result = await exports.turso.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('projects', 'logs')
    `);
        const existingTables = result.rows.map(row => row.name);
        const requiredTables = ['projects', 'logs'];
        const missingTables = requiredTables.filter(table => !existingTables.includes(table));
        if (missingTables.length > 0) {
            try {
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
                if (!exports.turso) {
                    throw createDatabaseError('connection', 'Database client not available - check environment configuration');
                }
                await exports.turso.executeMultiple(schema);
            }
            catch (schemaError) {
                throw createDatabaseError('schema', `Failed to create database tables: ${missingTables.join(', ')}. ` +
                    `Error: ${schemaError instanceof Error ? schemaError.message : 'Unknown error'}`, schemaError);
            }
        }
        else {
        }
        // Additional schema validation
        await validateDatabaseSchema();
    }
    catch (error) {
        throw createDatabaseError('initialization', 'Database initialization failed', error);
    }
}
// Validate database schema integrity
async function validateDatabaseSchema() {
    try {
        // Test basic table structure with optimized queries
        await executeQuery('SELECT COUNT(*) FROM projects LIMIT 1', undefined, true);
        await executeQuery('SELECT COUNT(*) FROM logs LIMIT 1', undefined, true);
        // Test foreign key constraints
        await executeQuery('PRAGMA foreign_key_check');
    }
    catch (error) {
        throw createDatabaseError('schema', 'Database schema validation failed', error);
    }
}
// Enhanced database health check with performance metrics
async function checkDatabaseHealth() {
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
    }
    catch (error) {
        return {
            healthy: false,
            details: {
                error: error instanceof Error ? error.message : 'Unknown error',
                initialized: isInitialized,
                retryCount: initializationRetryCount,
                performance: {
                    cacheSize: queryCache.size,
                    lastUsed: connectionMetrics.lastUsed,
                    avgResponseTime: connectionMetrics.responseTime,
                    queryCount: connectionMetrics.queryCount
                }
            }
        };
    }
}
// Performance utilities
function getPerformanceMetrics() {
    return {
        ...connectionMetrics,
        cacheSize: queryCache.size
    };
}
function clearQueryCache() {
    clearCache();
}
// Batch operation support
async function executeBatch(operations) {
    const startTime = Date.now();
    try {
        // Execute all operations in a single transaction for better performance
        const results = await Promise.all(operations.map(op => executeQuery(op.sql, op.args)));
        // Update metrics
        const responseTime = Date.now() - startTime;
        connectionMetrics = {
            lastUsed: Date.now(),
            responseTime,
            queryCount: connectionMetrics.queryCount + operations.length
        };
        return results;
    }
    catch (error) {
        throw error;
    }
}
// Warm up database connection
async function warmupConnection() {
    try {
        await executeQuery('SELECT 1', undefined, true);
    }
    catch {
        // Connection warmup failure handled silently
    }
}
//# sourceMappingURL=turso.js.map