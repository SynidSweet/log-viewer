/**
 * Test server setup utility
 * Loads all MCP tools for testing without starting the main server
 */

import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { getProjects, getProject, createProject } from '../../src/lib/db-turso';
import { getProjectLogs, getLog, createLog } from '../../src/lib/db-turso';
import { getProjectByApiKey } from '../../src/lib/db-turso';

/**
 * Set up all MCP tools on a test server instance
 */
export async function setupMcpTools(server: FastMCP): Promise<void> {
  // Test-specific metrics tracking (simplified)
  const testMetrics = {
    requestCount: 0,
    errorCount: 0,
    totalResponseTime: 0,
    startTime: Date.now()
  };

  // Health Check Tool
  server.addTool({
    name: 'health_check',
    description: 'Check MCP server health status with optional detailed checks',
    inputSchema: z.object({
      include_detailed_checks: z.boolean().optional().default(false),
      check_database_performance: z.boolean().optional().default(false)
    }),
    handler: async (params) => {
      const startTime = Date.now();
      
      try {
        // Basic health check
        const health = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: { status: 'connected', response_time: '<1ms' },
          server_version: '1.0.0-test'
        };

        // Add detailed checks if requested
        if (params.include_detailed_checks) {
          health['subsystems'] = {
            authentication: { status: 'operational' },
            logging: { status: 'operational' },
            metrics: { status: 'operational' }
          };
          health['alerts'] = [];
        }

        testMetrics.requestCount++;
        testMetrics.totalResponseTime += (Date.now() - startTime);
        
        return JSON.stringify(health);
      } catch (error) {
        testMetrics.errorCount++;
        return JSON.stringify({
          status: 'error',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // Metrics Tool
  server.addTool({
    name: 'get_metrics',
    description: 'Get performance metrics with optional trends and alerts',
    inputSchema: z.object({
      include_trends: z.boolean().optional().default(false),
      include_alerts: z.boolean().optional().default(false)
    }),
    handler: async (params) => {
      const uptime = Date.now() - testMetrics.startTime;
      const avgResponseTime = testMetrics.requestCount > 0 ? 
        testMetrics.totalResponseTime / testMetrics.requestCount : 0;

      const metrics = {
        success: true,
        timestamp: new Date().toISOString(),
        server: {
          uptime_ms: uptime,
          request_count: testMetrics.requestCount,
          error_count: testMetrics.errorCount,
          error_rate: testMetrics.requestCount > 0 ? 
            (testMetrics.errorCount / testMetrics.requestCount) * 100 : 0
        },
        performance: {
          average_response_time: Math.round(avgResponseTime),
          memory_usage: process.memoryUsage()
        }
      };

      if (params.include_trends) {
        metrics['trends'] = { response_time_trend: 'stable' };
      }

      if (params.include_alerts) {
        metrics['alerts'] = [];
      }

      testMetrics.requestCount++;
      return JSON.stringify(metrics);
    }
  });

  // Active Alerts Tool
  server.addTool({
    name: 'get_active_alerts',
    description: 'Get active system alerts with severity filtering',
    inputSchema: z.object({
      severity_filter: z.string().optional(),
      include_resolved: z.boolean().optional().default(false)
    }),
    handler: async () => {
      testMetrics.requestCount++;
      return JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        alerts: []
      });
    }
  });

  // Update Alert Thresholds Tool
  server.addTool({
    name: 'update_alert_thresholds',
    description: 'Update alerting thresholds for monitoring',
    inputSchema: z.object({
      error_rate: z.number().min(1).max(50).optional(),
      response_time: z.number().min(100).max(10000).optional(),
      consecutive_errors: z.number().min(1).max(20).optional()
    }),
    handler: async (params) => {
      testMetrics.requestCount++;
      return JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        new_thresholds: params
      });
    }
  });

  // Authentication Validation Tool
  server.addTool({
    name: 'validate_auth',
    description: 'Validate API token and return associated project information',
    inputSchema: z.object({
      api_token: z.string()
    }),
    handler: async (params) => {
      testMetrics.requestCount++;
      
      try {
        // In test environment, we'll create a simple validation
        const isValid = params.api_token.startsWith('test-key-');
        
        if (isValid) {
          return JSON.stringify({
            valid: true,
            timestamp: new Date().toISOString(),
            project_id: 'test-project',
            project_name: 'Test Project'
          });
        } else {
          return JSON.stringify({
            valid: false,
            timestamp: new Date().toISOString(),
            error: 'Invalid API token'
          });
        }
      } catch (error) {
        testMetrics.errorCount++;
        return JSON.stringify({
          valid: false,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // Project Management Tools
  server.addTool({
    name: 'list_projects',
    description: 'List all projects with their metadata',
    inputSchema: z.object({}),
    handler: async () => {
      testMetrics.requestCount++;
      
      try {
        const projects = await getProjects();
        return JSON.stringify({
          success: true,
          projects: projects || [],
          count: projects?.length || 0,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        testMetrics.errorCount++;
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  server.addTool({
    name: 'get_project',
    description: 'Get project details including API key',
    inputSchema: z.object({
      project_id: z.string()
    }),
    handler: async (params) => {
      testMetrics.requestCount++;
      
      try {
        const project = await getProject(params.project_id);
        
        if (project) {
          return JSON.stringify({
            success: true,
            project,
            timestamp: new Date().toISOString()
          });
        } else {
          return JSON.stringify({
            success: false,
            error: 'Project not found',
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        testMetrics.errorCount++;
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  server.addTool({
    name: 'create_project',
    description: 'Create a new project with auto-generated API key',
    inputSchema: z.object({
      name: z.string(),
      description: z.string().optional()
    }),
    handler: async (params) => {
      testMetrics.requestCount++;
      
      try {
        const project = await createProject(params.name, params.description || '');
        
        return JSON.stringify({
          success: true,
          project,
          message: 'Project created successfully',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        testMetrics.errorCount++;
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  // Log Management Tools
  server.addTool({
    name: 'get_project_logs',
    description: 'Get logs for a specific project',
    inputSchema: z.object({
      project_id: z.string(),
      limit: z.number().optional().default(100)
    }),
    handler: async (params) => {
      testMetrics.requestCount++;
      
      try {
        const logs = await getProjectLogs(params.project_id, params.limit);
        
        return JSON.stringify({
          success: true,
          project_id: params.project_id,
          logs: logs || [],
          count: logs?.length || 0,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        testMetrics.errorCount++;
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  server.addTool({
    name: 'get_log_content',
    description: 'Get full content of a specific log entry',
    inputSchema: z.object({
      log_id: z.string()
    }),
    handler: async (params) => {
      testMetrics.requestCount++;
      
      try {
        const log = await getLog(params.log_id);
        
        if (log) {
          return JSON.stringify({
            success: true,
            log,
            timestamp: new Date().toISOString()
          });
        } else {
          return JSON.stringify({
            success: false,
            error: 'Log not found',
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        testMetrics.errorCount++;
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  server.addTool({
    name: 'create_log_entry',
    description: 'Create a new log entry for a project',
    inputSchema: z.object({
      project_id: z.string(),
      content: z.string(),
      comment: z.string().optional()
    }),
    handler: async (params) => {
      testMetrics.requestCount++;
      
      try {
        const log = await createLog(
          params.project_id,
          params.content,
          params.comment || ''
        );
        
        return JSON.stringify({
          success: true,
          log,
          message: 'Log entry created successfully',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        testMetrics.errorCount++;
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  // Log Search Tools (Simplified versions for testing)
  server.addTool({
    name: 'entries_query',
    description: 'Advanced log entry search with filtering and context',
    inputSchema: z.object({
      project_id: z.string(),
      search_query: z.string().optional(),
      levels: z.string().optional(),
      time_from: z.string().optional(),
      limit: z.number().optional().default(50).max(1000),
      verbosity: z.enum(['titles', 'summary', 'full']).optional().default('summary'),
      context_lines: z.number().optional().default(0)
    }),
    handler: async (params) => {
      testMetrics.requestCount++;
      
      // Simplified search for testing
      return JSON.stringify({
        success: true,
        project_id: params.project_id,
        entries: [],
        total_logs_searched: 0,
        filters_applied: {
          search_query: params.search_query,
          levels: params.levels?.split(',') || [],
          time_from: params.time_from
        },
        performance: {
          search_time_ms: 10,
          results_processed: 0
        },
        timestamp: new Date().toISOString()
      });
    }
  });

  server.addTool({
    name: 'entries_latest',
    description: 'Convenience tool for getting latest log entries',
    inputSchema: z.object({
      project_id: z.string(),
      limit: z.number().optional().default(10),
      exclude_debug: z.boolean().optional().default(false)
    }),
    handler: async (params) => {
      testMetrics.requestCount++;
      
      return JSON.stringify({
        success: true,
        project_id: params.project_id,
        recommended_tool: 'entries_query',
        message: 'Use entries_query for more advanced filtering options',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Alias Tools for backward compatibility (using direct tool logic)
  server.addTool({
    name: 'projects_list',
    description: 'Alias for list_projects',
    inputSchema: z.object({}),
    handler: async () => {
      testMetrics.requestCount++;
      
      try {
        const projects = await getProjects();
        return JSON.stringify({
          success: true,
          projects: projects || [],
          count: projects?.length || 0,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        testMetrics.errorCount++;
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  server.addTool({
    name: 'project_get',
    description: 'Alias for get_project',
    inputSchema: z.object({
      project_id: z.string()
    }),
    handler: async (params) => {
      testMetrics.requestCount++;
      
      try {
        const project = await getProject(params.project_id);
        
        if (project) {
          return JSON.stringify({
            success: true,
            project,
            timestamp: new Date().toISOString()
          });
        } else {
          return JSON.stringify({
            success: false,
            error: 'Project not found',
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        testMetrics.errorCount++;
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  server.addTool({
    name: 'logs_list',
    description: 'Alias for get_project_logs',
    inputSchema: z.object({
      project_id: z.string(),
      limit: z.number().optional().default(100)
    }),
    handler: async (params) => {
      testMetrics.requestCount++;
      
      try {
        const logs = await getProjectLogs(params.project_id, params.limit);
        
        return JSON.stringify({
          success: true,
          project_id: params.project_id,
          logs: logs || [],
          count: logs?.length || 0,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        testMetrics.errorCount++;
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }
  });
}