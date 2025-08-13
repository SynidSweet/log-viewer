/**
 * Performance Tests  
 * Tests response times, throughput, and performance benchmarks
 */

import { TEST_CONFIG } from '../setup';
import { 
  executeTool, 
  benchmarkTool, 
  setupTestData, 
  cleanupTestData, 
  formatPerformanceResults 
} from '../utils/test-helpers';
import server from '../../src/index';

describe('MCP Performance Tests', () => {
  let testData: { project: any; log: any };
  
  beforeAll(async () => {
    testData = await setupTestData();
    
    // Warm up the server with some initial requests
    await executeTool(server, 'health_check');
    await executeTool(server, 'list_projects');
    
    console.log('🔥 Server warmed up for performance testing');
  });
  
  afterAll(async () => {
    await cleanupTestData();
  });
  
  describe('Response Time Benchmarks', () => {
    test('Health monitoring tools performance', async () => {
      const benchmarks = [];
      
      // Test basic health check
      benchmarks.push(await benchmarkTool(
        server, 
        'health_check', 
        {},
        15, // 15 iterations
        TEST_CONFIG.HEALTH_CHECK_THRESHOLD
      ));
      
      // Test detailed health check
      benchmarks.push(await benchmarkTool(
        server,
        'health_check',
        { 
          include_detailed_checks: true,
          check_database_performance: true 
        },
        10,
        TEST_CONFIG.HEALTH_CHECK_THRESHOLD * 2 // More lenient for detailed checks
      ));
      
      // Test metrics
      benchmarks.push(await benchmarkTool(
        server,
        'get_metrics',
        { include_trends: true, include_alerts: true },
        10,
        TEST_CONFIG.RESPONSE_TIME_THRESHOLD
      ));
      
      // Test alerts
      benchmarks.push(await benchmarkTool(
        server,
        'get_active_alerts',
        { severity_filter: 'all' },
        10,
        TEST_CONFIG.RESPONSE_TIME_THRESHOLD
      ));
      
      // Verify performance requirements
      const passedBenchmarks = benchmarks.filter(b => b.meetsThreshold);
      const passRate = (passedBenchmarks.length / benchmarks.length) * 100;
      
      console.log(formatPerformanceResults(benchmarks));
      
      expect(passRate).toBeGreaterThan(80); // 80% of health tools must meet threshold
    });
    
    test('Project management tools performance', async () => {
      const benchmarks = [];
      
      // Test project listing
      benchmarks.push(await benchmarkTool(
        server,
        'list_projects',
        {},
        20,
        TEST_CONFIG.RESPONSE_TIME_THRESHOLD
      ));
      
      // Test project retrieval
      benchmarks.push(await benchmarkTool(
        server,
        'get_project',
        { project_id: testData.project.id },
        20,
        TEST_CONFIG.RESPONSE_TIME_THRESHOLD
      ));
      
      // Test authentication validation
      benchmarks.push(await benchmarkTool(
        server,
        'validate_auth',
        { api_token: testData.project.apiKey },
        20,
        TEST_CONFIG.RESPONSE_TIME_THRESHOLD
      ));
      
      // Test project creation (fewer iterations due to database writes)
      benchmarks.push(await benchmarkTool(
        server,
        'create_project',
        { name: `Perf Test ${Date.now()}`, description: 'Performance test project' },
        5,
        TEST_CONFIG.RESPONSE_TIME_THRESHOLD * 2 // More lenient for creation
      ));
      
      const passedBenchmarks = benchmarks.filter(b => b.meetsThreshold);
      const passRate = (passedBenchmarks.length / benchmarks.length) * 100;
      
      console.log(formatPerformanceResults(benchmarks));
      
      expect(passRate).toBeGreaterThan(70); // 70% of project tools must meet threshold
    });
    
    test('Log management tools performance', async () => {
      const benchmarks = [];
      
      // Test log listing
      benchmarks.push(await benchmarkTool(
        server,
        'get_project_logs',
        { project_id: testData.project.id },
        15,
        TEST_CONFIG.RESPONSE_TIME_THRESHOLD
      ));
      
      // Test log content retrieval
      benchmarks.push(await benchmarkTool(
        server,
        'get_log_content',
        { log_id: testData.log.id },
        15,
        TEST_CONFIG.RESPONSE_TIME_THRESHOLD
      ));
      
      // Test log creation
      benchmarks.push(await benchmarkTool(
        server,
        'create_log_entry',
        { 
          project_id: testData.project.id,
          content: `[2025-08-13, 23:00:00] [INFO] Performance test log ${Date.now()}`,
          comment: 'Performance test'
        },
        8,
        TEST_CONFIG.RESPONSE_TIME_THRESHOLD * 2
      ));
      
      const passedBenchmarks = benchmarks.filter(b => b.meetsThreshold);
      const passRate = (passedBenchmarks.length / benchmarks.length) * 100;
      
      console.log(formatPerformanceResults(benchmarks));
      
      expect(passRate).toBeGreaterThan(70);
    });
    
    test('Log search tools performance', async () => {
      const benchmarks = [];
      
      // Test basic entry query
      benchmarks.push(await benchmarkTool(
        server,
        'entries_query',
        { 
          project_id: testData.project.id,
          search_query: 'database',
          verbosity: 'summary'
        },
        10,
        TEST_CONFIG.RESPONSE_TIME_THRESHOLD * 2 // Search operations can be slower
      ));
      
      // Test complex entry query
      benchmarks.push(await benchmarkTool(
        server,
        'entries_query',
        {
          project_id: testData.project.id,
          levels: 'ERROR,WARN',
          verbosity: 'full',
          context_lines: 3
        },
        8,
        TEST_CONFIG.RESPONSE_TIME_THRESHOLD * 3 // Complex queries can be much slower
      ));
      
      // Test convenience tool
      benchmarks.push(await benchmarkTool(
        server,
        'entries_latest',
        { 
          project_id: testData.project.id,
          limit: 10
        },
        15,
        TEST_CONFIG.RESPONSE_TIME_THRESHOLD
      ));
      
      const passedBenchmarks = benchmarks.filter(b => b.meetsThreshold);
      const passRate = (passedBenchmarks.length / benchmarks.length) * 100;
      
      console.log(formatPerformanceResults(benchmarks));
      
      expect(passRate).toBeGreaterThan(60); // Search tools are more complex, lower threshold
    });
    
    test('Alias tools performance parity', async () => {
      // Test that alias tools perform similar to their primary counterparts
      const aliasTests = [
        {
          primary: 'list_projects',
          alias: 'projects_list',
          params: {}
        },
        {
          primary: 'get_project', 
          alias: 'project_get',
          params: { project_id: testData.project.id }
        },
        {
          primary: 'get_project_logs',
          alias: 'logs_list',
          params: { project_id: testData.project.id }
        }
      ];
      
      const results = [];
      
      for (const test of aliasTests) {
        const primaryBenchmark = await benchmarkTool(
          server,
          test.primary,
          test.params,
          10,
          TEST_CONFIG.RESPONSE_TIME_THRESHOLD
        );
        
        const aliasBenchmark = await benchmarkTool(
          server,
          test.alias,
          test.params,
          10,
          TEST_CONFIG.RESPONSE_TIME_THRESHOLD
        );
        
        results.push({ primary: primaryBenchmark, alias: aliasBenchmark });
        
        // Alias should perform within 20% of primary tool
        const performanceRatio = aliasBenchmark.averageResponseTime / primaryBenchmark.averageResponseTime;
        expect(performanceRatio).toBeLessThan(1.2);
        
        console.log(`📊 ${test.primary} vs ${test.alias}:`);
        console.log(`   Primary: ${primaryBenchmark.averageResponseTime}ms`);
        console.log(`   Alias: ${aliasBenchmark.averageResponseTime}ms`);
        console.log(`   Ratio: ${performanceRatio.toFixed(2)}x\n`);
      }
      
      console.log('✅ Alias tools performance parity validated');
    });
  });
  
  describe('Throughput Tests', () => {
    test('Concurrent request handling', async () => {
      const concurrencyLevels = [5, 10, 20];
      const results = [];
      
      for (const concurrency of concurrencyLevels) {
        const startTime = Date.now();
        const promises = [];
        
        // Create concurrent health check requests
        for (let i = 0; i < concurrency; i++) {
          promises.push(executeTool(server, 'health_check'));
        }
        
        const responses = await Promise.all(promises);
        const totalTime = Date.now() - startTime;
        const successCount = responses.filter(r => r.success).length;
        const successRate = (successCount / concurrency) * 100;
        const throughput = (concurrency / totalTime) * 1000; // requests per second
        
        results.push({
          concurrency,
          totalTime,
          successRate,
          throughput: Math.round(throughput)
        });
        
        // All requests should succeed
        expect(successRate).toBeGreaterThan(95);
        
        console.log(`📊 Concurrency ${concurrency}: ${successRate.toFixed(1)}% success, ${throughput} req/sec`);
      }
      
      // Throughput should scale reasonably with concurrency
      const lowConcurrency = results.find(r => r.concurrency === 5);
      const highConcurrency = results.find(r => r.concurrency === 20);
      
      if (lowConcurrency && highConcurrency) {
        const throughputRatio = highConcurrency.throughput / lowConcurrency.throughput;
        expect(throughputRatio).toBeGreaterThan(1.5); // Should handle more concurrent requests efficiently
        
        console.log(`📊 Throughput scaling: ${throughputRatio.toFixed(2)}x improvement from 5 to 20 concurrent requests`);
      }
    });
    
    test('Sustained load performance', async () => {
      const duration = 10000; // 10 seconds
      const requestInterval = 100; // Request every 100ms
      const startTime = Date.now();
      const results = [];
      
      console.log(`🔄 Running sustained load test for ${duration/1000} seconds...`);
      
      while (Date.now() - startTime < duration) {
        const requestStart = Date.now();
        
        const result = await executeTool(server, 'list_projects');
        results.push({
          success: result.success,
          responseTime: result.responseTime,
          timestamp: Date.now()
        });
        
        // Wait for next interval
        const elapsed = Date.now() - requestStart;
        const waitTime = Math.max(0, requestInterval - elapsed);
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      // Analyze results
      const totalRequests = results.length;
      const successfulRequests = results.filter(r => r.success).length;
      const successRate = (successfulRequests / totalRequests) * 100;
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      const throughput = (totalRequests / duration) * 1000; // requests per second
      
      console.log(`📊 Sustained load results:`);
      console.log(`   Total requests: ${totalRequests}`);
      console.log(`   Success rate: ${successRate.toFixed(1)}%`);
      console.log(`   Avg response time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   Throughput: ${throughput.toFixed(1)} req/sec`);
      
      // Performance requirements for sustained load
      expect(successRate).toBeGreaterThan(95);
      expect(avgResponseTime).toBeLessThan(TEST_CONFIG.RESPONSE_TIME_THRESHOLD * 1.5);
      expect(throughput).toBeGreaterThan(5); // At least 5 requests per second
    });
    
    test('Database query performance under load', async () => {
      const queryTypes = [
        { tool: 'list_projects', params: {} },
        { tool: 'get_project', params: { project_id: testData.project.id } },
        { tool: 'get_project_logs', params: { project_id: testData.project.id } }
      ];
      
      const loadResults = [];
      
      for (const queryType of queryTypes) {
        const promises = [];
        const startTime = Date.now();
        
        // Execute 20 concurrent database operations
        for (let i = 0; i < 20; i++) {
          promises.push(executeTool(server, queryType.tool, queryType.params));
        }
        
        const results = await Promise.all(promises);
        const totalTime = Date.now() - startTime;
        const successCount = results.filter(r => r.success).length;
        const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
        
        loadResults.push({
          tool: queryType.tool,
          successRate: (successCount / 20) * 100,
          avgResponseTime,
          totalTime
        });
        
        // Database operations should handle concurrent load well
        expect(successCount).toBeGreaterThan(18); // Allow for 1-2 failures under heavy load
        expect(avgResponseTime).toBeLessThan(TEST_CONFIG.DATABASE_QUERY_THRESHOLD * 3);
        
        console.log(`📊 DB Load - ${queryType.tool}: ${avgResponseTime.toFixed(2)}ms avg, ${successCount}/20 success`);
      }
      
      console.log('✅ Database performance under load validated');
    });
  });
  
  describe('Memory and Resource Usage', () => {
    test('Memory usage remains stable under load', async () => {
      const memoryBefore = process.memoryUsage();
      
      // Generate significant load
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(executeTool(server, 'entries_query', {
          project_id: testData.project.id,
          search_query: 'test',
          verbosity: 'full',
          context_lines: 5
        }));
      }
      
      await Promise.all(promises);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const memoryAfter = process.memoryUsage();
      
      // Memory growth should be reasonable
      const heapGrowth = memoryAfter.heapUsed - memoryBefore.heapUsed;
      const heapGrowthMB = heapGrowth / 1024 / 1024;
      
      console.log(`📊 Memory usage:`);
      console.log(`   Before: ${(memoryBefore.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   After: ${(memoryAfter.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Growth: ${heapGrowthMB > 0 ? '+' : ''}${heapGrowthMB.toFixed(2)}MB`);
      
      // Memory growth should be less than 50MB for this load
      expect(heapGrowthMB).toBeLessThan(50);
      
      // Total heap usage should not be excessive
      expect(memoryAfter.heapUsed / 1024 / 1024).toBeLessThan(200); // Less than 200MB
    });
    
    test('Server handles repeated operations efficiently', async () => {
      const operationCounts = [10, 50, 100];
      const performanceResults = [];
      
      for (const count of operationCounts) {
        const startTime = Date.now();
        
        for (let i = 0; i < count; i++) {
          await executeTool(server, 'validate_auth', { 
            api_token: testData.project.apiKey 
          });
        }
        
        const totalTime = Date.now() - startTime;
        const avgTime = totalTime / count;
        
        performanceResults.push({
          count,
          totalTime,
          avgTime
        });
        
        console.log(`📊 ${count} operations: ${totalTime}ms total, ${avgTime.toFixed(2)}ms avg`);
      }
      
      // Performance should not significantly degrade with more operations
      const first = performanceResults[0];
      const last = performanceResults[performanceResults.length - 1];
      const degradationRatio = last.avgTime / first.avgTime;
      
      expect(degradationRatio).toBeLessThan(2.0); // Performance shouldn't degrade more than 2x
      
      console.log(`📊 Performance degradation ratio: ${degradationRatio.toFixed(2)}x`);
    });
  });
  
  describe('Performance Regression Prevention', () => {
    test('All tools meet baseline performance requirements', async () => {
      const toolsToTest = [
        { tool: 'health_check', params: {}, threshold: TEST_CONFIG.HEALTH_CHECK_THRESHOLD },
        { tool: 'get_metrics', params: {}, threshold: TEST_CONFIG.RESPONSE_TIME_THRESHOLD },
        { tool: 'list_projects', params: {}, threshold: TEST_CONFIG.RESPONSE_TIME_THRESHOLD },
        { tool: 'get_project', params: { project_id: testData.project.id }, threshold: TEST_CONFIG.RESPONSE_TIME_THRESHOLD },
        { tool: 'validate_auth', params: { api_token: testData.project.apiKey }, threshold: TEST_CONFIG.RESPONSE_TIME_THRESHOLD },
        { tool: 'get_project_logs', params: { project_id: testData.project.id }, threshold: TEST_CONFIG.RESPONSE_TIME_THRESHOLD }
      ];
      
      const results = [];
      
      for (const test of toolsToTest) {
        const benchmark = await benchmarkTool(
          server,
          test.tool,
          test.params,
          10,
          test.threshold
        );
        
        results.push(benchmark);
        
        // Each tool must meet its performance threshold
        expect(benchmark.meetsThreshold).toBe(true);
        expect(benchmark.failureRate).toBe(0);
      }
      
      console.log('📊 Baseline Performance Results:');
      results.forEach(result => {
        const status = result.meetsThreshold ? '✅' : '❌';
        console.log(`   ${status} ${result.tool}: ${result.averageResponseTime}ms (threshold: ${TEST_CONFIG.RESPONSE_TIME_THRESHOLD}ms)`);
      });
      
      const overallPassRate = (results.filter(r => r.meetsThreshold).length / results.length) * 100;
      expect(overallPassRate).toBe(100);
      
      console.log(`✅ Overall performance: ${overallPassRate}% of tools meet baseline requirements`);
    });
    
    test('Performance consistency across multiple runs', async () => {
      const tool = 'health_check';
      const runsCount = 5;
      const iterationsPerRun = 10;
      const runResults = [];
      
      for (let run = 0; run < runsCount; run++) {
        const benchmark = await benchmarkTool(
          server,
          tool,
          {},
          iterationsPerRun,
          TEST_CONFIG.HEALTH_CHECK_THRESHOLD
        );
        
        runResults.push(benchmark.averageResponseTime);
        
        // Brief pause between runs
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Calculate variance in performance
      const avgPerformance = runResults.reduce((sum, time) => sum + time, 0) / runResults.length;
      const maxDeviation = Math.max(...runResults.map(time => Math.abs(time - avgPerformance)));
      const variabilityPercent = (maxDeviation / avgPerformance) * 100;
      
      console.log(`📊 Performance consistency over ${runsCount} runs:`);
      console.log(`   Average: ${avgPerformance.toFixed(2)}ms`);
      console.log(`   Max deviation: ${maxDeviation.toFixed(2)}ms`);
      console.log(`   Variability: ${variabilityPercent.toFixed(1)}%`);
      
      // Performance should be consistent (variability < 50%)
      expect(variabilityPercent).toBeLessThan(50);
      
      console.log('✅ Performance consistency validated');
    });
  });
});