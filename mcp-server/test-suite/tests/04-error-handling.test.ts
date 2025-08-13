/**
 * Error Handling and Edge Case Tests
 * Tests error conditions, parameter validation, and edge cases
 */

import { TEST_CONFIG } from '../setup';
import { executeTool, setupTestData, cleanupTestData, generateTestData } from '../utils/test-helpers';
import server from '../../src/index';

describe('MCP Error Handling Tests', () => {
  let testData: { project: any; log: any };
  
  beforeAll(async () => {
    testData = await setupTestData();
  });
  
  afterAll(async () => {
    await cleanupTestData();
  });
  
  describe('Parameter Validation', () => {
    test('Missing required parameters', async () => {
      const requiredParamTests = [
        { 
          tool: 'validate_auth', 
          missingParam: 'api_token',
          validParams: { api_token: 'test-token' }
        },
        {
          tool: 'get_project',
          missingParam: 'project_id', 
          validParams: { project_id: testData.project.id }
        },
        {
          tool: 'create_project',
          missingParam: 'name',
          validParams: { name: 'Test Project' }
        },
        {
          tool: 'get_project_logs',
          missingParam: 'project_id',
          validParams: { project_id: testData.project.id }
        },
        {
          tool: 'get_log_content',
          missingParam: 'log_id',
          validParams: { log_id: testData.log.id }
        },
        {
          tool: 'create_log_entry',
          missingParam: 'project_id',
          validParams: { project_id: testData.project.id, content: 'test log' }
        },
        {
          tool: 'entries_query',
          missingParam: 'project_id',
          validParams: { project_id: testData.project.id }
        },
        {
          tool: 'entries_latest',
          missingParam: 'project_id',
          validParams: { project_id: testData.project.id }
        }
      ];
      
      for (const test of requiredParamTests) {
        // Test with missing parameter
        const invalidResult = await executeTool(server, test.tool, {});
        expect(invalidResult.success).toBe(false);
        expect(invalidResult.error?.toLowerCase()).toContain(test.missingParam.toLowerCase());
        
        // Test with valid parameters to ensure tool works
        const validResult = await executeTool(server, test.tool, test.validParams);
        // Note: Some may still fail due to non-existent resources, but shouldn't fail due to parameter validation
        expect(validResult.responseTime).toBeLessThan(TEST_CONFIG.RESPONSE_TIME_THRESHOLD);
      }
      
      console.log('✅ Required parameter validation completed');
    });
    
    test('Invalid parameter types and values', async () => {
      const invalidParamTests = [
        {
          tool: 'update_alert_thresholds',
          invalidParams: { error_rate: -5 }, // Negative value
          expectError: true
        },
        {
          tool: 'update_alert_thresholds', 
          invalidParams: { error_rate: 100 }, // Too high
          expectError: true
        },
        {
          tool: 'update_alert_thresholds',
          invalidParams: { response_time: 50 }, // Too low
          expectError: true
        },
        {
          tool: 'entries_query',
          invalidParams: { 
            project_id: testData.project.id,
            limit: -10 // Negative limit
          },
          expectError: true
        },
        {
          tool: 'entries_query',
          invalidParams: {
            project_id: testData.project.id,
            limit: 2000 // Exceeds maximum
          },
          expectError: true
        },
        {
          tool: 'entries_query',
          invalidParams: {
            project_id: testData.project.id,
            verbosity: 'invalid_verbosity'
          },
          expectError: true
        },
        {
          tool: 'entries_latest',
          invalidParams: {
            project_id: testData.project.id,
            limit: 150 // Exceeds maximum for this tool
          },
          expectError: true
        },
        {
          tool: 'get_active_alerts',
          invalidParams: {
            severity_filter: 'invalid_severity'
          },
          expectError: true
        }
      ];
      
      for (const test of invalidParamTests) {
        const result = await executeTool(server, test.tool, test.invalidParams);
        
        if (test.expectError) {
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        }
        
        // Should still respond quickly even with invalid parameters
        expect(result.responseTime).toBeLessThan(TEST_CONFIG.RESPONSE_TIME_THRESHOLD);
      }
      
      console.log('✅ Invalid parameter handling validated');
    });
    
    test('Boundary value testing', async () => {
      const boundaryTests = [
        {
          tool: 'update_alert_thresholds',
          params: { error_rate: 1 }, // Minimum valid value
          expectSuccess: true
        },
        {
          tool: 'update_alert_thresholds',
          params: { error_rate: 50 }, // Maximum valid value
          expectSuccess: true
        },
        {
          tool: 'update_alert_thresholds',
          params: { response_time: 100 }, // Minimum valid value
          expectSuccess: true
        },
        {
          tool: 'update_alert_thresholds',
          params: { response_time: 10000 }, // Maximum valid value
          expectSuccess: true
        },
        {
          tool: 'entries_query',
          params: { 
            project_id: testData.project.id,
            limit: 1 // Minimum valid limit
          },
          expectSuccess: true
        },
        {
          tool: 'entries_query',
          params: {
            project_id: testData.project.id,
            limit: 1000 // Maximum valid limit
          },
          expectSuccess: true
        },
        {
          tool: 'entries_latest',
          params: {
            project_id: testData.project.id,
            limit: 1 // Minimum valid limit
          },
          expectSuccess: true
        },
        {
          tool: 'entries_latest',
          params: {
            project_id: testData.project.id,
            limit: 100 // Maximum valid limit  
          },
          expectSuccess: true
        }
      ];
      
      for (const test of boundaryTests) {
        const result = await executeTool(server, test.tool, test.params);
        
        if (test.expectSuccess) {
          expect(result.success).toBe(true);
        }
        
        expect(result.responseTime).toBeLessThan(TEST_CONFIG.RESPONSE_TIME_THRESHOLD);
      }
      
      console.log('✅ Boundary value testing completed');
    });
  });
  
  describe('Resource Not Found Errors', () => {
    test('Non-existent project handling', async () => {
      const nonExistentProjectId = 'non-existent-project-12345';
      const projectTests = [
        'get_project',
        'project_get', // alias
        'get_project_logs',
        'logs_list', // alias
        'entries_query',
        'entries_latest'
      ];
      
      for (const tool of projectTests) {
        const result = await executeTool(server, tool, {
          project_id: nonExistentProjectId
        });
        
        // Tool should execute without crashing
        expect(result.success).toBe(true);
        expect(result.responseTime).toBeLessThan(TEST_CONFIG.RESPONSE_TIME_THRESHOLD);
        
        // But result should indicate project not found
        const parsedResult = JSON.parse(result.result as string);
        expect(parsedResult.success).toBe(false);
        expect(parsedResult.error.toLowerCase()).toContain('not found');
      }
      
      console.log('✅ Non-existent project handling validated');
    });
    
    test('Non-existent log handling', async () => {
      const nonExistentLogId = 'non-existent-log-12345';
      
      const result = await executeTool(server, 'get_log_content', {
        log_id: nonExistentLogId
      });
      
      expect(result.success).toBe(true);
      expect(result.responseTime).toBeLessThan(TEST_CONFIG.RESPONSE_TIME_THRESHOLD);
      
      const parsedResult = JSON.parse(result.result as string);
      expect(parsedResult.success).toBe(false);
      expect(parsedResult.error.toLowerCase()).toContain('not found');
      
      console.log('✅ Non-existent log handling validated');
    });
    
    test('Invalid API token handling', async () => {
      const invalidTokens = [
        'invalid-token-12345',
        '', // Empty token
        'a', // Too short
        'x'.repeat(200) // Too long
      ];
      
      for (const token of invalidTokens) {
        const result = await executeTool(server, 'validate_auth', {
          api_token: token
        });
        
        expect(result.success).toBe(true); // Tool executes
        expect(result.responseTime).toBeLessThan(TEST_CONFIG.RESPONSE_TIME_THRESHOLD);
        
        const parsedResult = JSON.parse(result.result as string);
        expect(parsedResult.valid).toBe(false);
      }
      
      console.log('✅ Invalid API token handling validated');
    });
  });
  
  describe('Malformed Input Handling', () => {
    test('Malformed log content', async () => {
      const malformedLogTests = [
        {
          content: '', // Empty content
          description: 'Empty log content'
        },
        {
          content: 'Invalid log format without timestamp or level',
          description: 'Invalid log format'
        },
        {
          content: '[2025-08-13] [INFO] Missing time component',
          description: 'Incomplete timestamp'
        },
        {
          content: '[2025-08-13, 23:00:00] Missing level and message',
          description: 'Missing level and message'
        },
        {
          content: '[Invalid-Date, 23:00:00] [INFO] Invalid date format',
          description: 'Invalid date format'
        }
      ];
      
      for (const test of malformedLogTests) {
        const result = await executeTool(server, 'create_log_entry', {
          project_id: testData.project.id,
          content: test.content,
          comment: test.description
        });
        
        // Tool should handle malformed input gracefully
        expect(result.success).toBe(true);
        expect(result.responseTime).toBeLessThan(TEST_CONFIG.RESPONSE_TIME_THRESHOLD * 2);
        
        // Log creation might succeed (server stores raw content)
        // but parsing during search might handle it differently
        console.log(`📋 ${test.description}: ${result.success ? 'Accepted' : 'Rejected'}`);
      }
    });
    
    test('Malformed JSON in log details', async () => {
      const malformedJsonTests = [
        '[2025-08-13, 23:15:00] [INFO] Test with invalid JSON - {invalid json}',
        '[2025-08-13, 23:15:01] [INFO] Test with truncated JSON - {"key": "val',
        '[2025-08-13, 23:15:02] [INFO] Test with escaped quotes - {"key": "val\\"ue"}',
        '[2025-08-13, 23:15:03] [INFO] Test with unicode - {"key": "val\\u0000ue"}'
      ];
      
      for (const content of malformedJsonTests) {
        // Create log entry
        const createResult = await executeTool(server, 'create_log_entry', {
          project_id: testData.project.id,
          content,
          comment: 'Malformed JSON test'
        });
        
        expect(createResult.success).toBe(true);
        
        // Try to search for it (this will test JSON parsing resilience)
        const searchResult = await executeTool(server, 'entries_query', {
          project_id: testData.project.id,
          search_query: 'invalid',
          verbosity: 'full'
        });
        
        // Search should not crash even with malformed JSON
        expect(searchResult.success).toBe(true);
      }
      
      console.log('✅ Malformed JSON handling validated');
    });
    
    test('Unicode and special character handling', async () => {
      const unicodeTests = [
        '[2025-08-13, 23:20:00] [INFO] Unicode test: café 中文 🚀 - {"emoji": "🎉", "unicode": "测试"}',
        '[2025-08-13, 23:20:01] [INFO] Special chars: !@#$%^&*() - {"special": "~`[]{}|\\:;\\\"\'<>?/"}',
        '[2025-08-13, 23:20:02] [INFO] Null bytes and control chars - {"control": "\\u0000\\u0001\\u001f"}',
        '[2025-08-13, 23:20:03] [INFO] Very long message: ' + 'x'.repeat(1000) + ' - {"long_field": "' + 'y'.repeat(500) + '"}'
      ];
      
      for (const content of unicodeTests) {
        const createResult = await executeTool(server, 'create_log_entry', {
          project_id: testData.project.id,
          content,
          comment: 'Unicode test'
        });
        
        expect(createResult.success).toBe(true);
        
        // Test retrieval and search
        if (createResult.success && createResult.result) {
          const logData = JSON.parse(createResult.result as string).log;
          
          const retrieveResult = await executeTool(server, 'get_log_content', {
            log_id: logData.id
          });
          
          expect(retrieveResult.success).toBe(true);
        }
      }
      
      console.log('✅ Unicode and special character handling validated');
    });
  });
  
  describe('Rate Limiting and Resource Protection', () => {
    test('Large request handling', async () => {
      // Test with very large search results
      const largeSearchResult = await executeTool(server, 'entries_query', {
        project_id: testData.project.id,
        limit: 1000, // Maximum allowed
        verbosity: 'full',
        context_lines: 10 // Maximum context
      });
      
      expect(largeSearchResult.success).toBe(true);
      // Should complete within reasonable time even for large results
      expect(largeSearchResult.responseTime).toBeLessThan(TEST_CONFIG.RESPONSE_TIME_THRESHOLD * 5);
      
      console.log(`📊 Large search completed in ${largeSearchResult.responseTime}ms`);
    });
    
    test('Rapid successive requests', async () => {
      const rapidRequests = [];
      const startTime = Date.now();
      
      // Make 50 rapid requests
      for (let i = 0; i < 50; i++) {
        rapidRequests.push(executeTool(server, 'health_check'));
      }
      
      const results = await Promise.all(rapidRequests);
      const totalTime = Date.now() - startTime;
      const successCount = results.filter(r => r.success).length;
      const successRate = (successCount / rapidRequests.length) * 100;
      
      // Should handle rapid requests gracefully
      expect(successRate).toBeGreaterThan(90);
      
      // Should complete in reasonable time
      expect(totalTime).toBeLessThan(10000); // 10 seconds for 50 requests
      
      console.log(`📊 Rapid requests: ${successRate.toFixed(1)}% success rate in ${totalTime}ms`);
    });
    
    test('Memory-intensive operations', async () => {
      const memoryBefore = process.memoryUsage();
      
      // Create multiple large log entries
      const largeContent = '[2025-08-13, 23:30:00] [INFO] Large content test - ' +
        JSON.stringify({ 
          data: 'x'.repeat(10000), 
          array: new Array(1000).fill('large_value'),
          nested: {
            deep: {
              structure: 'y'.repeat(5000)
            }
          }
        });
      
      const creationPromises = [];
      for (let i = 0; i < 10; i++) {
        creationPromises.push(executeTool(server, 'create_log_entry', {
          project_id: testData.project.id,
          content: largeContent,
          comment: `Large content test ${i}`
        }));
      }
      
      const results = await Promise.all(creationPromises);
      const successCount = results.filter(r => r.success).length;
      
      expect(successCount).toBeGreaterThan(8); // Allow some failures under memory pressure
      
      const memoryAfter = process.memoryUsage();
      const memoryGrowth = (memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024;
      
      console.log(`📊 Memory growth from large operations: ${memoryGrowth.toFixed(2)}MB`);
      
      // Memory growth should be reasonable
      expect(memoryGrowth).toBeLessThan(100); // Less than 100MB growth
    });
  });
  
  describe('Error Recovery', () => {
    test('Server stability after errors', async () => {
      // Generate various errors
      const errorGeneratingRequests = [
        executeTool(server, 'get_project', { project_id: 'non-existent' }),
        executeTool(server, 'get_log_content', { log_id: 'non-existent' }),
        executeTool(server, 'validate_auth', { api_token: 'invalid' }),
        executeTool(server, 'entries_query', { project_id: 'non-existent' }),
        executeTool(server, 'create_log_entry', { project_id: 'non-existent', content: 'test' })
      ];
      
      await Promise.all(errorGeneratingRequests);
      
      // Server should still be responsive after errors
      const healthResult = await executeTool(server, 'health_check');
      expect(healthResult.success).toBe(true);
      expect(healthResult.responseTime).toBeLessThan(TEST_CONFIG.HEALTH_CHECK_THRESHOLD);
      
      // Normal operations should still work
      const normalOperations = [
        executeTool(server, 'list_projects'),
        executeTool(server, 'get_project', { project_id: testData.project.id }),
        executeTool(server, 'get_metrics')
      ];
      
      const normalResults = await Promise.all(normalOperations);
      normalResults.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      console.log('✅ Server stability after errors validated');
    });
    
    test('Graceful degradation under stress', async () => {
      // Create mixed load with both valid and invalid requests
      const stressRequests = [];
      
      for (let i = 0; i < 100; i++) {
        if (i % 3 === 0) {
          // Invalid requests
          stressRequests.push(executeTool(server, 'get_project', { project_id: 'invalid' }));
        } else if (i % 3 === 1) {
          // Valid but resource-intensive requests
          stressRequests.push(executeTool(server, 'entries_query', { 
            project_id: testData.project.id,
            verbosity: 'full',
            context_lines: 3
          }));
        } else {
          // Light valid requests
          stressRequests.push(executeTool(server, 'health_check'));
        }
      }
      
      const startTime = Date.now();
      const results = await Promise.all(stressRequests);
      const totalTime = Date.now() - startTime;
      
      const successCount = results.filter(r => r.success).length;
      const successRate = (successCount / results.length) * 100;
      
      // Should maintain reasonable success rate even under mixed stress
      expect(successRate).toBeGreaterThan(80);
      
      // Should complete in reasonable time
      expect(totalTime).toBeLessThan(30000); // 30 seconds for 100 mixed requests
      
      console.log(`📊 Stress test: ${successRate.toFixed(1)}% success rate in ${totalTime}ms`);
      
      // Server should still be healthy after stress test
      const finalHealthCheck = await executeTool(server, 'health_check', {
        include_detailed_checks: true
      });
      
      expect(finalHealthCheck.success).toBe(true);
      
      console.log('✅ Graceful degradation under stress validated');
    });
  });
});