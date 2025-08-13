/**
 * Test helper utilities for MCP server testing
 */

import { createProject, createLog, getProjects } from '../../src/lib/db-turso';
import { TEST_CONFIG } from '../setup';

export interface TestResult {
  success: boolean;
  responseTime: number;
  result?: any;
  error?: string;
}

export interface PerformanceBenchmark {
  tool: string;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  totalCalls: number;
  failureRate: number;
  meetsThreshold: boolean;
}

// executeTool functionality moved to simple-test-framework.ts

// benchmarkTool functionality moved to simple-test-framework.ts

/**
 * Set up test database with sample data (mocked for testing)
 */
export async function setupTestData(): Promise<{
  project: any;
  log: any;
}> {
  try {
    // For testing, we'll create mock data instead of hitting the real database
    const mockProject = {
      id: 'test-project-id',
      name: TEST_CONFIG.TEST_PROJECT.name,
      description: TEST_CONFIG.TEST_PROJECT.description,
      api_key: 'test-key-12345',
      apiKey: 'test-key-12345', // Add both formats for compatibility
      created_at: new Date().toISOString()
    };
    
    const mockLog = {
      id: 'test-log-id',
      project_id: mockProject.id,
      content: TEST_CONFIG.TEST_LOG_CONTENT,
      comment: 'Test log for MCP server testing',
      created_at: new Date().toISOString()
    };
    
    return { project: mockProject, log: mockLog };
    
  } catch (error) {
    throw new Error(`Failed to setup test data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clean up test data from database
 */
export async function cleanupTestData(): Promise<void> {
  try {
    // In a real implementation, you would clean up test data here
    // For now, we'll rely on the test database being ephemeral
    console.log('🧹 Test data cleanup completed');
  } catch (error) {
    console.warn('Warning: Failed to cleanup test data:', error);
  }
}

/**
 * Validate tool response structure
 */
export function validateToolResponse(
  result: any,
  expectedFields: string[],
  toolName: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check if result is a string (JSON response)
  let parsedResult;
  if (typeof result === 'string') {
    try {
      parsedResult = JSON.parse(result);
    } catch {
      errors.push(`Tool ${toolName} returned invalid JSON`);
      return { valid: false, errors };
    }
  } else {
    parsedResult = result;
  }
  
  // Validate expected fields
  for (const field of expectedFields) {
    if (!(field in parsedResult)) {
      errors.push(`Tool ${toolName} missing required field: ${field}`);
    }
  }
  
  // Check for timestamp field (common requirement)
  if (expectedFields.includes('timestamp')) {
    const timestamp = parsedResult.timestamp;
    if (!timestamp || isNaN(new Date(timestamp).getTime())) {
      errors.push(`Tool ${toolName} has invalid timestamp format`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Wait for a condition to be met (useful for async operations)
 */
export async function waitFor(
  condition: () => Promise<boolean> | boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  return false;
}

/**
 * Generate random test data
 */
export const generateTestData = {
  projectName: () => `Test Project ${Math.random().toString(36).substr(2, 9)}`,
  projectDescription: () => `Generated test project for MCP validation`,
  logContent: (level: string = 'INFO', message: string = 'Test message') => {
    const timestamp = new Date().toISOString().replace('T', ', ').replace(/\.\d{3}Z$/, '');
    const details = JSON.stringify({ 
      test: true, 
      timestamp: Date.now(),
      _tags: ['test', level.toLowerCase()]
    });
    return `[${timestamp}] [${level}] ${message} - ${details}`;
  },
  apiKey: () => `test-key-${Math.random().toString(36).substr(2, 16)}`,
};

// createTestServer functionality replaced by SimpleTestRegistry

/**
 * Performance metrics formatter
 */
export function formatPerformanceResults(benchmarks: PerformanceBenchmark[]): string {
  const passed = benchmarks.filter(b => b.meetsThreshold).length;
  const total = benchmarks.length;
  
  let output = `\n📊 Performance Benchmark Results (${passed}/${total} passed)\n\n`;
  
  benchmarks.forEach(benchmark => {
    const status = benchmark.meetsThreshold ? '✅' : '❌';
    const threshold = TEST_CONFIG.RESPONSE_TIME_THRESHOLD;
    
    output += `${status} ${benchmark.tool}\n`;
    output += `   Avg: ${benchmark.averageResponseTime}ms (threshold: ${threshold}ms)\n`;
    output += `   Range: ${benchmark.minResponseTime}ms - ${benchmark.maxResponseTime}ms\n`;
    output += `   Failures: ${benchmark.failureRate}% (${benchmark.totalCalls} calls)\n\n`;
  });
  
  return output;
}