// Mock turso database client and operations
const mockClient = {
  execute: jest.fn(),
  executeMultiple: jest.fn(),
  close: jest.fn(),
  sync: jest.fn(),
  transaction: jest.fn(),
  batch: jest.fn()
};

// Mock database state
let mockInitialized = false;
let mockConnectionHealthy = true;
let mockMetrics = {
  queryCount: 0,
  responseTime: 0,
  cacheSize: 0,
  lastUsed: 0
};

// Mock the turso client
const turso = mockClient;

// Mock database operations
const executeQuery = jest.fn().mockImplementation(async (sql, args, useCache) => {
  mockMetrics.queryCount++;
  mockMetrics.responseTime = Math.random() * 10; // Random response time
  mockMetrics.lastUsed = Date.now();
  
  // Simulate different query responses
  if (sql.includes('SELECT 1')) {
    return { rows: [{ test: 1 }], rowsAffected: 0 };
  }
  
  if (sql.includes('sqlite_master')) {
    return { rows: [{ name: 'projects' }, { name: 'logs' }], rowsAffected: 0 };
  }
  
  if (sql.includes('COUNT(*)')) {
    return { rows: [{ count: 0 }], rowsAffected: 0 };
  }
  
  if (sql.includes('INSERT INTO')) {
    return { rows: [], rowsAffected: 1 };
  }
  
  if (sql.includes('UPDATE')) {
    return { rows: [], rowsAffected: 1 };
  }
  
  if (sql.includes('DELETE')) {
    return { rows: [], rowsAffected: 1 };
  }
  
  if (sql.includes('SELECT * FROM projects')) {
    return { rows: [], rowsAffected: 0 };
  }
  
  if (sql.includes('SELECT * FROM logs')) {
    return { rows: [], rowsAffected: 0 };
  }
  
  return { rows: [], rowsAffected: 0 };
});

const executeBatch = jest.fn().mockImplementation(async (operations) => {
  return operations.map(() => ({ rows: [], rowsAffected: 1 }));
});

const ensureDatabaseReady = jest.fn().mockImplementation(async () => {
  if (!mockInitialized) {
    mockInitialized = true;
  }
  return Promise.resolve();
});

const checkDatabaseConnection = jest.fn().mockImplementation(async () => {
  return mockConnectionHealthy;
});

const initializeDatabase = jest.fn().mockImplementation(async () => {
  mockInitialized = true;
  return Promise.resolve();
});

const checkDatabaseHealth = jest.fn().mockImplementation(async () => {
  return {
    healthy: mockConnectionHealthy,
    details: {
      responseTime: mockMetrics.responseTime,
      tables: ['projects', 'logs'],
      initialized: mockInitialized,
      retryCount: 0,
      performance: {
        cacheSize: mockMetrics.cacheSize,
        lastUsed: mockMetrics.lastUsed,
        avgResponseTime: mockMetrics.responseTime,
        queryCount: mockMetrics.queryCount
      }
    }
  };
});

const getPerformanceMetrics = jest.fn().mockImplementation(() => {
  return mockMetrics;
});

const clearQueryCache = jest.fn().mockImplementation(() => {
  mockMetrics.cacheSize = 0;
});

const warmupConnection = jest.fn().mockImplementation(async () => {
  return Promise.resolve();
});

const createDatabaseError = jest.fn().mockImplementation((type, message, originalError) => {
  return {
    type,
    message,
    code: 'MOCK_ERROR',
    retryable: type === 'connection' || type === 'initialization',
    details: originalError
  };
});

// Test utilities
const __setMockInitialized = (value) => {
  mockInitialized = value;
};

const __setMockConnectionHealthy = (value) => {
  mockConnectionHealthy = value;
};

const __getMockMetrics = () => mockMetrics;

const __resetMocks = () => {
  mockInitialized = false;
  mockConnectionHealthy = true;
  mockMetrics = {
    queryCount: 0,
    responseTime: 0,
    cacheSize: 0,
    lastUsed: 0
  };
  jest.clearAllMocks();
};
module.exports = {
  turso,
  executeQuery,
  executeBatch,
  ensureDatabaseReady,
  checkDatabaseConnection,
  initializeDatabase,
  checkDatabaseHealth,
  getPerformanceMetrics,
  clearQueryCache,
  warmupConnection,
  createDatabaseError,
  __setMockInitialized,
  __setMockConnectionHealthy,
  __getMockMetrics,
  __resetMocks
};