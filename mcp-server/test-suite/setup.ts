/**
 * Global test setup for MCP server test suite
 */

import { config } from 'dotenv';
import path from 'path';

// Load test environment variables
config({ path: path.join(__dirname, '.env.test') });

// Set test environment defaults
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce noise during tests
process.env.ENABLE_METRICS = 'true';
process.env.HEALTH_CHECK_INTERVAL = '0'; // Disable periodic checks during tests
process.env.LOG_REQUESTS = 'false';

// Database setup for testing
if (!process.env.TURSO_DATABASE_URL) {
  process.env.TURSO_DATABASE_URL = 'file:test-mcp.db';
}
if (!process.env.TURSO_AUTH_TOKEN) {
  process.env.TURSO_AUTH_TOKEN = 'test-token';
}

// Test configuration
export const TEST_CONFIG = {
  // Performance thresholds (ms)
  RESPONSE_TIME_THRESHOLD: 1000,
  HEALTH_CHECK_THRESHOLD: 500,
  DATABASE_QUERY_THRESHOLD: 200,
  
  // Test data
  TEST_PROJECT: {
    id: 'test-project-mcp',
    name: 'MCP Test Project',
    description: 'Project for MCP server testing',
  },
  
  TEST_LOG_CONTENT: `[2025-08-13, 21:00:00] [INFO] Test application started - {"version": "1.0.0", "_tags": ["startup", "info"]}
[2025-08-13, 21:00:01] [ERROR] Database connection failed - {"error": "Connection timeout", "_tags": ["database", "error"]}
[2025-08-13, 21:00:02] [WARN] Retrying database connection - {"attempt": 2, "_tags": ["database", "retry"]}
[2025-08-13, 21:00:03] [INFO] Database connected successfully - {"latency_ms": 150, "_tags": ["database", "success"]}
[2025-08-13, 21:00:04] [DEBUG] Processing user request - {"user_id": "test-123", "endpoint": "/api/data", "_tags": ["request", "debug"]}
[2025-08-13, 21:00:05] [LOG] User authenticated - {"user_id": "test-123", "role": "admin", "_extended": {"session_data": "detailed_session_info"}}`,
  
  // Tool lists for validation
  CORE_TOOLS: [
    'health_check',
    'get_metrics', 
    'get_active_alerts',
    'update_alert_thresholds',
    'validate_auth',
    'list_projects',
    'get_project',
    'create_project',
    'get_project_logs',
    'get_log_content',
    'create_log_entry',
    'entries_query',
    'entries_latest'
  ],
  
  ALIAS_TOOLS: [
    'projects_list',
    'project_get', 
    'logs_list'
  ]
};

// Global test timeout
jest.setTimeout(30000);

// Suppress console output during tests unless LOG_LEVEL=debug
if (process.env.LOG_LEVEL !== 'debug') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

console.log('🧪 MCP Server test suite initialized');
console.log(`📊 Performance thresholds: Response: ${TEST_CONFIG.RESPONSE_TIME_THRESHOLD}ms, DB: ${TEST_CONFIG.DATABASE_QUERY_THRESHOLD}ms`);
console.log(`🗄️  Database: ${process.env.TURSO_DATABASE_URL}`);
console.log(`🔧 Testing ${TEST_CONFIG.CORE_TOOLS.length} core tools + ${TEST_CONFIG.ALIAS_TOOLS.length} aliases`);