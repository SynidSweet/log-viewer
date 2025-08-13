/**
 * Simplified test framework for MCP tools
 * This approach bypasses FastMCP complexity for testing
 */

import { z } from 'zod';
// Database functions are mocked for testing
// import { getProjects, getProject, createProject } from '../../src/lib/db-turso';
// import { getProjectLogs, getLog, createLog } from '../../src/lib/db-turso';
// import { getProjectByApiKey } from '../../src/lib/db-turso';

// Mock database functions for testing
const mockProjects = new Map<string, any>();
const mockLogs = new Map<string, any>();

// Initialize with some test data
mockProjects.set('test-project-id', {
  id: 'test-project-id',
  name: 'MCP Test Project',
  description: 'Project for MCP server testing',
  api_key: 'test-key-12345',
  created_at: new Date().toISOString()
});

mockLogs.set('test-log-id', {
  id: 'test-log-id',
  project_id: 'test-project-id',
  content: '[2025-08-13, 20:00:00] [INFO] Test log entry - {"test": true}',
  comment: 'Test log entry',
  created_at: new Date().toISOString()
});

// Mock database functions
function getProjects() {
  return Promise.resolve(Array.from(mockProjects.values()));
}

function getProject(id: string) {
  return Promise.resolve(mockProjects.get(id) || null);
}

function createProject(name: string, description: string = '') {
  const id = `project-${Date.now()}`;
  const apiKey = `test-key-${Math.random().toString(36).substr(2, 10)}`;
  const project = {
    id,
    name,
    description,
    api_key: apiKey,
    created_at: new Date().toISOString()
  };
  mockProjects.set(id, project);
  return Promise.resolve(project);
}

function getProjectLogs(projectId: string) {
  const logs = Array.from(mockLogs.values()).filter(log => log.project_id === projectId);
  return Promise.resolve(logs);
}

function getLog(id: string) {
  return Promise.resolve(mockLogs.get(id) || null);
}

function createLog(projectId: string, content: string, comment: string = '') {
  const id = `log-${Date.now()}`;
  const log = {
    id,
    project_id: projectId,
    content,
    comment,
    created_at: new Date().toISOString()
  };
  mockLogs.set(id, log);
  return Promise.resolve(log);
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<any>;
  handler: (params: any) => Promise<string>;
}

export interface TestResult {
  success: boolean;
  responseTime: number;
  result?: any;
  error?: string;
}

/**
 * Simple tool registry for testing
 */
export class SimpleTestRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private metrics = {
    requestCount: 0,
    errorCount: 0,
    totalResponseTime: 0,
    startTime: Date.now()
  };

  constructor() {
    this.registerAllTools();
  }

  private registerAllTools(): void {
    // Health Check Tool
    this.tools.set('health_check', {
      name: 'health_check',
      description: 'Check MCP server health status',
      inputSchema: z.object({
        include_detailed_checks: z.boolean().optional().default(false),
        check_database_performance: z.boolean().optional().default(false)
      }),
      handler: async (params) => {
        const health: any = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: { status: 'connected', response_time: '<1ms' },
          server_version: '1.0.0-test'
        };

        if (params.include_detailed_checks) {
          health.subsystems = {
            authentication: { status: 'operational' },
            logging: { status: 'operational' },
            metrics: { status: 'operational' }
          };
          health.alerts = [];
        }

        return JSON.stringify(health);
      }
    });

    // Metrics Tool
    this.tools.set('get_metrics', {
      name: 'get_metrics',
      description: 'Get performance metrics',
      inputSchema: z.object({
        include_trends: z.boolean().optional().default(false),
        include_alerts: z.boolean().optional().default(false)
      }),
      handler: async (params) => {
        const uptime = Date.now() - this.metrics.startTime;
        const avgResponseTime = this.metrics.requestCount > 0 ? 
          this.metrics.totalResponseTime / this.metrics.requestCount : 0;

        const metrics: any = {
          success: true,
          timestamp: new Date().toISOString(),
          server: {
            uptime_ms: uptime,
            request_count: this.metrics.requestCount,
            error_count: this.metrics.errorCount
          },
          performance: {
            average_response_time: Math.round(avgResponseTime)
          }
        };

        if (params.include_trends) {
          metrics.trends = { response_time_trend: 'stable' };
        }

        if (params.include_alerts) {
          metrics.alerts = [];
        }

        return JSON.stringify(metrics);
      }
    });

    // Alert Tools
    this.tools.set('get_active_alerts', {
      name: 'get_active_alerts',
      description: 'Get active system alerts',
      inputSchema: z.object({
        severity_filter: z.string().optional(),
        include_resolved: z.boolean().optional().default(false)
      }),
      handler: async () => {
        return JSON.stringify({
          success: true,
          timestamp: new Date().toISOString(),
          alerts: []
        });
      }
    });

    this.tools.set('update_alert_thresholds', {
      name: 'update_alert_thresholds',
      description: 'Update alerting thresholds',
      inputSchema: z.object({
        error_rate: z.number().min(1).max(50).optional(),
        response_time: z.number().min(100).max(10000).optional(),
        consecutive_errors: z.number().min(1).max(20).optional()
      }),
      handler: async (params) => {
        return JSON.stringify({
          success: true,
          timestamp: new Date().toISOString(),
          new_thresholds: params
        });
      }
    });

    // Auth Tool
    this.tools.set('validate_auth', {
      name: 'validate_auth',
      description: 'Validate API token',
      inputSchema: z.object({
        api_token: z.string()
      }),
      handler: async (params) => {
        const isValid = params.api_token.startsWith('test-key-');
        
        if (isValid) {
          return JSON.stringify({
            valid: true,
            timestamp: new Date().toISOString(),
            project_id: 'test-project-id',
            project_name: 'MCP Test Project'
          });
        } else {
          return JSON.stringify({
            valid: false,
            timestamp: new Date().toISOString(),
            error: 'Invalid API token'
          });
        }
      }
    });

    // Project Tools
    this.tools.set('list_projects', {
      name: 'list_projects',
      description: 'List all projects',
      inputSchema: z.object({}),
      handler: async () => {
        const projects = await getProjects();
        return JSON.stringify({
          success: true,
          projects: projects || [],
          count: projects?.length || 0,
          timestamp: new Date().toISOString()
        });
      }
    });

    this.tools.set('get_project', {
      name: 'get_project',
      description: 'Get project details',
      inputSchema: z.object({
        project_id: z.string()
      }),
      handler: async (params) => {
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
      }
    });

    this.tools.set('create_project', {
      name: 'create_project',
      description: 'Create a new project',
      inputSchema: z.object({
        name: z.string(),
        description: z.string().optional()
      }),
      handler: async (params) => {
        const project = await createProject(params.name, params.description || '');
        
        return JSON.stringify({
          success: true,
          project,
          message: 'Project created successfully',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Log Tools
    this.tools.set('get_project_logs', {
      name: 'get_project_logs',
      description: 'Get logs for a project',
      inputSchema: z.object({
        project_id: z.string(),
        limit: z.number().optional().default(100)
      }),
      handler: async (params) => {
        const logs = await getProjectLogs(params.project_id);
        
        return JSON.stringify({
          success: true,
          project_id: params.project_id,
          logs: logs || [],
          count: logs?.length || 0,
          timestamp: new Date().toISOString()
        });
      }
    });

    this.tools.set('get_log_content', {
      name: 'get_log_content',
      description: 'Get full log content',
      inputSchema: z.object({
        log_id: z.string()
      }),
      handler: async (params) => {
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
      }
    });

    this.tools.set('create_log_entry', {
      name: 'create_log_entry',
      description: 'Create a new log entry',
      inputSchema: z.object({
        project_id: z.string(),
        content: z.string(),
        comment: z.string().optional()
      }),
      handler: async (params) => {
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
      }
    });

    // Search Tools
    this.tools.set('entries_query', {
      name: 'entries_query',
      description: 'Search log entries',
      inputSchema: z.object({
        project_id: z.string(),
        search_query: z.string().optional(),
        levels: z.string().optional(),
        time_from: z.string().optional(),
        limit: z.number().max(1000).optional().default(50),
        verbosity: z.enum(['titles', 'summary', 'full']).optional().default('summary'),
        context_lines: z.number().optional().default(0)
      }),
      handler: async (params) => {
        return JSON.stringify({
          success: true,
          project_id: params.project_id,
          entries: [],
          total_logs_searched: 0,
          filters_applied: {
            search_query: params.search_query,
            levels: params.levels?.split(',') || []
          },
          performance: {
            search_time_ms: 10,
            results_processed: 0
          },
          timestamp: new Date().toISOString()
        });
      }
    });

    this.tools.set('entries_latest', {
      name: 'entries_latest',
      description: 'Get latest log entries',
      inputSchema: z.object({
        project_id: z.string(),
        limit: z.number().optional().default(10),
        exclude_debug: z.boolean().optional().default(false)
      }),
      handler: async (params) => {
        return JSON.stringify({
          success: true,
          project_id: params.project_id,
          recommended_tool: 'entries_query',
          message: 'Use entries_query for more filtering options',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Aliases
    this.tools.set('projects_list', this.tools.get('list_projects')!);
    this.tools.set('project_get', this.tools.get('get_project')!);
    this.tools.set('logs_list', this.tools.get('get_project_logs')!);
  }

  async executeTool(toolName: string, parameters: any = {}): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const tool = this.tools.get(toolName);
      if (!tool) {
        return {
          success: false,
          responseTime: Date.now() - startTime,
          error: `Tool '${toolName}' not found`
        };
      }

      // Validate parameters
      try {
        tool.inputSchema.parse(parameters);
      } catch (error) {
        return {
          success: false,
          responseTime: Date.now() - startTime,
          error: `Parameter validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }

      // Execute tool
      const result = await tool.handler(parameters);
      const responseTime = Date.now() - startTime;

      this.metrics.requestCount++;
      this.metrics.totalResponseTime += responseTime;

      return {
        success: true,
        responseTime,
        result
      };
      
    } catch (error) {
      this.metrics.errorCount++;
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  hasTool(toolName: string): boolean {
    return this.tools.has(toolName);
  }
}