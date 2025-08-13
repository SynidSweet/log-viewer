/**
 * Tool Validation Tests
 * Tests all MCP tools for parameter validation and basic functionality
 */

import { TEST_CONFIG } from '../setup';
import { validateToolResponse, setupTestData, cleanupTestData } from '../utils/test-helpers';
import { SimpleTestRegistry, TestResult } from '../utils/simple-test-framework';

describe('MCP Tool Validation Tests', () => {
  let testData: { project: any; log: any };
  let testRegistry: SimpleTestRegistry;
  
  // Helper function to execute tools using the test registry
  async function executeTool(toolName: string, parameters: any = {}): Promise<TestResult> {
    return await testRegistry.executeTool(toolName, parameters);
  }
  
  beforeAll(async () => {
    // Create test registry with all tools loaded
    testRegistry = new SimpleTestRegistry();
    
    // Setup test data
    testData = await setupTestData();
  }, 60000); // Increased timeout for setup
  
  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    
    // FastMCP doesn't have a close method in test mode
    // Server cleanup is handled automatically
  });

  describe('Health and Monitoring Tools', () => {
    test('health_check - basic functionality', async () => {
      const result = await executeTool('health_check');
      
      expect(result.success).toBe(true);
      expect(result.responseTime).toBeLessThan(TEST_CONFIG.HEALTH_CHECK_THRESHOLD);
      
      const validation = validateToolResponse(
        result.result,
        ['status', 'timestamp', 'database', 'server_version'],
        'health_check'
      );
      
      expect(validation.valid).toBe(true);
      if (!validation.valid) {
        console.error('Validation errors:', validation.errors);
      }
    });
    
    test('health_check - detailed checks', async () => {
      const result = await executeTool('health_check', {
        include_detailed_checks: true,
        check_database_performance: true
      });
      
      expect(result.success).toBe(true);
      
      const validation = validateToolResponse(
        result.result,
        ['status', 'timestamp', 'database', 'subsystems', 'alerts'],
        'health_check'
      );
      
      expect(validation.valid).toBe(true);
    });
    
    test('get_metrics - basic metrics', async () => {
      const result = await executeTool('get_metrics');
      
      expect(result.success).toBe(true);
      
      const validation = validateToolResponse(
        result.result,
        ['success', 'timestamp', 'server', 'performance'],
        'get_metrics'
      );
      
      expect(validation.valid).toBe(true);
    });
    
    test('get_metrics - with trends and alerts', async () => {
      const result = await executeTool('get_metrics', {
        include_trends: true,
        include_alerts: true
      });
      
      expect(result.success).toBe(true);
      
      const validation = validateToolResponse(
        result.result,
        ['success', 'timestamp', 'trends', 'alerts'],
        'get_metrics'
      );
      
      expect(validation.valid).toBe(true);
    });
    
    test('get_active_alerts - all alerts', async () => {
      const result = await executeTool('get_active_alerts');
      
      expect(result.success).toBe(true);
      
      const validation = validateToolResponse(
        result.result,
        ['success', 'timestamp', 'alerts'],
        'get_active_alerts'
      );
      
      expect(validation.valid).toBe(true);
    });
    
    test('get_active_alerts - severity filtering', async () => {
      const result = await executeTool('get_active_alerts', {
        severity_filter: 'failed',
        include_resolved: true
      });
      
      expect(result.success).toBe(true);
      
      const validation = validateToolResponse(
        result.result,
        ['success', 'timestamp', 'alerts'],
        'get_active_alerts'
      );
      
      expect(validation.valid).toBe(true);
    });
    
    test('update_alert_thresholds - valid updates', async () => {
      const result = await executeTool('update_alert_thresholds', {
        error_rate: 10,
        response_time: 2000,
        consecutive_errors: 5
      });
      
      expect(result.success).toBe(true);
      
      const validation = validateToolResponse(
        result.result,
        ['success', 'timestamp', 'new_thresholds'],
        'update_alert_thresholds'
      );
      
      expect(validation.valid).toBe(true);
    });
    
    test('update_alert_thresholds - parameter validation', async () => {
      // Test invalid parameters
      const invalidTests = [
        { error_rate: 0 }, // Too low
        { error_rate: 60 }, // Too high
        { response_time: 50 }, // Too low
        { consecutive_errors: 0 }, // Too low
      ];
      
      for (const params of invalidTests) {
        const result = await executeTool('update_alert_thresholds', params);
        // Should handle invalid parameters gracefully
        expect(result.responseTime).toBeLessThan(TEST_CONFIG.RESPONSE_TIME_THRESHOLD);
      }
    });
  });
  
  describe('Authentication Tools', () => {
    test('validate_auth - valid token', async () => {
      if (!testData.project?.apiKey) {
        throw new Error('Test project API key not available');
      }
      
      const result = await executeTool('validate_auth', {
        api_token: testData.project.apiKey
      });
      
      expect(result.success).toBe(true);
      
      const validation = validateToolResponse(
        result.result,
        ['valid', 'timestamp'],
        'validate_auth'
      );
      
      expect(validation.valid).toBe(true);
      
      // Parse result to check validation
      const parsedResult = JSON.parse(result.result as string);
      expect(parsedResult.valid).toBe(true);
      expect(parsedResult.project_id).toBe(testData.project.id);
    });
    
    test('validate_auth - invalid token', async () => {
      const result = await executeTool('validate_auth', {
        api_token: 'invalid-token-12345'
      });
      
      expect(result.success).toBe(true); // Tool executes successfully
      
      // Parse result to check validation result
      const parsedResult = JSON.parse(result.result as string);
      expect(parsedResult.valid).toBe(false);
    });
    
    test('validate_auth - missing parameter', async () => {
      const result = await executeTool('validate_auth', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('api_token');
    });
  });
  
  describe('Project Management Tools', () => {
    test('list_projects - basic functionality', async () => {
      const result = await executeTool('list_projects');
      
      expect(result.success).toBe(true);
      
      const validation = validateToolResponse(
        result.result,
        ['success', 'projects', 'count', 'timestamp'],
        'list_projects'
      );
      
      expect(validation.valid).toBe(true);
      
      // Verify our test project is in the list
      const parsedResult = JSON.parse(result.result as string);
      expect(parsedResult.success).toBe(true);
      expect(Array.isArray(parsedResult.projects)).toBe(true);
      expect(parsedResult.projects.length).toBeGreaterThan(0);
    });
    
    test('projects_list - alias functionality', async () => {
      const result = await executeTool('projects_list');
      
      expect(result.success).toBe(true);
      
      const validation = validateToolResponse(
        result.result,
        ['success', 'projects', 'count', 'timestamp'],
        'projects_list'
      );
      
      expect(validation.valid).toBe(true);
    });
    
    test('get_project - valid project', async () => {
      const result = await executeTool('get_project', {
        project_id: testData.project.id
      });
      
      expect(result.success).toBe(true);
      
      const validation = validateToolResponse(
        result.result,
        ['success', 'project', 'timestamp'],
        'get_project'
      );
      
      expect(validation.valid).toBe(true);
      
      // Verify project data
      const parsedResult = JSON.parse(result.result as string);
      expect(parsedResult.project.id).toBe(testData.project.id);
      expect(parsedResult.project.name).toBe(testData.project.name);
      expect(parsedResult.project.api_key).toBeDefined();
    });
    
    test('get_project - invalid project', async () => {
      const result = await executeTool('get_project', {
        project_id: 'non-existent-project'
      });
      
      expect(result.success).toBe(true); // Tool executes
      
      const parsedResult = JSON.parse(result.result as string);
      expect(parsedResult.success).toBe(false);
      expect(parsedResult.error).toContain('not found');
    });
    
    test('project_get - alias functionality', async () => {
      const result = await executeTool('project_get', {
        project_id: testData.project.id
      });
      
      expect(result.success).toBe(true);
      
      const validation = validateToolResponse(
        result.result,
        ['success', 'project', 'timestamp'],
        'project_get'
      );
      
      expect(validation.valid).toBe(true);
    });
    
    test('create_project - valid project', async () => {
      const projectName = `Test Project ${Date.now()}`;
      const result = await executeTool('create_project', {
        name: projectName,
        description: 'Test project for validation'
      });
      
      expect(result.success).toBe(true);
      
      const validation = validateToolResponse(
        result.result,
        ['success', 'project', 'message', 'timestamp'],
        'create_project'
      );
      
      expect(validation.valid).toBe(true);
      
      // Verify project creation
      const parsedResult = JSON.parse(result.result as string);
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.project.name).toBe(projectName);
      expect(parsedResult.project.api_key).toBeDefined();
    });
    
    test('create_project - missing name parameter', async () => {
      const result = await executeTool('create_project', {
        description: 'Project without name'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('name');
    });
  });
  
  describe('Log Management Tools', () => {
    test('get_project_logs - valid project', async () => {
      const result = await executeTool('get_project_logs', {
        project_id: testData.project.id
      });
      
      expect(result.success).toBe(true);
      
      const validation = validateToolResponse(
        result.result,
        ['success', 'project_id', 'logs', 'count', 'timestamp'],
        'get_project_logs'
      );
      
      expect(validation.valid).toBe(true);
      
      // Verify logs are present
      const parsedResult = JSON.parse(result.result as string);
      expect(parsedResult.success).toBe(true);
      expect(Array.isArray(parsedResult.logs)).toBe(true);
    });
    
    test('logs_list - alias functionality', async () => {
      const result = await executeTool('logs_list', {
        project_id: testData.project.id
      });
      
      expect(result.success).toBe(true);
      
      const validation = validateToolResponse(
        result.result,
        ['success', 'project_id', 'logs', 'count', 'timestamp'],
        'logs_list'
      );
      
      expect(validation.valid).toBe(true);
    });
    
    test('get_log_content - valid log', async () => {
      const result = await executeTool('get_log_content', {
        log_id: testData.log.id
      });
      
      expect(result.success).toBe(true);
      
      const validation = validateToolResponse(
        result.result,
        ['success', 'log', 'timestamp'],
        'get_log_content'
      );
      
      expect(validation.valid).toBe(true);
      
      // Verify log content
      const parsedResult = JSON.parse(result.result as string);
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.log.id).toBe(testData.log.id);
      expect(parsedResult.log.content).toBeDefined();
    });
    
    test('create_log_entry - valid entry', async () => {
      const logContent = '[2025-08-13, 21:30:00] [INFO] Validation test log entry';
      const result = await executeTool('create_log_entry', {
        project_id: testData.project.id,
        content: logContent,
        comment: 'Test validation log'
      });
      
      expect(result.success).toBe(true);
      
      const validation = validateToolResponse(
        result.result,
        ['success', 'log', 'message', 'timestamp'],
        'create_log_entry'
      );
      
      expect(validation.valid).toBe(true);
    });
  });
  
  describe('Log Search Tools', () => {
    test('entries_query - basic search', async () => {
      const result = await executeTool('entries_query', {
        project_id: testData.project.id,
        search_query: 'database',
        verbosity: 'summary',
        limit: 10
      });
      
      expect(result.success).toBe(true);
      
      const validation = validateToolResponse(
        result.result,
        ['success', 'project_id', 'entries', 'total_logs_searched', 'performance'],
        'entries_query'
      );
      
      expect(validation.valid).toBe(true);
    });
    
    test('entries_query - level filtering', async () => {
      const result = await executeTool('entries_query', {
        project_id: testData.project.id,
        levels: 'ERROR,WARN',
        verbosity: 'full'
      });
      
      expect(result.success).toBe(true);
      
      const validation = validateToolResponse(
        result.result,
        ['success', 'entries', 'filters_applied'],
        'entries_query'
      );
      
      expect(validation.valid).toBe(true);
    });
    
    test('entries_query - time filtering', async () => {
      const result = await executeTool('entries_query', {
        project_id: testData.project.id,
        time_from: '1h',
        verbosity: 'titles',
        context_lines: 2
      });
      
      expect(result.success).toBe(true);
      
      const validation = validateToolResponse(
        result.result,
        ['success', 'entries', 'performance'],
        'entries_query'
      );
      
      expect(validation.valid).toBe(true);
    });
    
    test('entries_query - invalid parameters', async () => {
      const result = await executeTool('entries_query', {
        project_id: testData.project.id,
        limit: 2000, // Exceeds maximum
        verbosity: 'invalid'
      });
      
      expect(result.success).toBe(false);
    });
    
    test('entries_latest - convenience tool', async () => {
      const result = await executeTool('entries_latest', {
        project_id: testData.project.id,
        limit: 5,
        exclude_debug: true
      });
      
      expect(result.success).toBe(true);
      
      const validation = validateToolResponse(
        result.result,
        ['success', 'project_id', 'recommended_tool'],
        'entries_latest'
      );
      
      expect(validation.valid).toBe(true);
    });
  });
  
  describe('Parameter Validation', () => {
    test('All tools handle missing required parameters', async () => {
      const toolsRequiringParams = [
        { tool: 'validate_auth', required: ['api_token'] },
        { tool: 'get_project', required: ['project_id'] },
        { tool: 'create_project', required: ['name'] },
        { tool: 'get_project_logs', required: ['project_id'] },
        { tool: 'get_log_content', required: ['log_id'] },
        { tool: 'create_log_entry', required: ['project_id', 'content'] },
        { tool: 'entries_query', required: ['project_id'] },
        { tool: 'entries_latest', required: ['project_id'] },
      ];
      
      for (const { tool, required } of toolsRequiringParams) {
        const result = await executeTool(tool, {});
        
        // Should fail due to missing parameters
        expect(result.success).toBe(false);
        
        // Error should mention missing parameters
        for (const param of required) {
          expect(result.error?.toLowerCase()).toContain(param.toLowerCase());
        }
      }
    });
    
    test('All tools respond within performance threshold', async () => {
      const allTools = [...TEST_CONFIG.CORE_TOOLS, ...TEST_CONFIG.ALIAS_TOOLS];
      const results = [];
      
      for (const toolName of allTools) {
        // Use minimal valid parameters
        let params = {};
        if (['get_project', 'get_project_logs', 'logs_list', 'entries_query', 'entries_latest'].includes(toolName)) {
          params = { project_id: testData.project.id };
        } else if (toolName === 'validate_auth') {
          params = { api_token: testData.project.apiKey };
        } else if (toolName === 'get_log_content') {
          params = { log_id: testData.log.id };
        } else if (toolName === 'create_project') {
          params = { name: `Test ${Date.now()}` };
        } else if (toolName === 'create_log_entry') {
          params = { 
            project_id: testData.project.id,
            content: '[2025-08-13, 21:45:00] [INFO] Performance test log'
          };
        }
        
        const result = await executeTool(toolName, params);
        results.push({ tool: toolName, ...result });
        
        expect(result.responseTime).toBeLessThan(TEST_CONFIG.RESPONSE_TIME_THRESHOLD);
      }
      
      console.log('📊 Tool Response Times:');
      results.forEach(r => {
        const status = r.success ? '✅' : '❌';
        console.log(`   ${status} ${r.tool}: ${r.responseTime}ms`);
      });
    });
  });
});