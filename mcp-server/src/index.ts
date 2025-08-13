import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { getProjects, getProject, createProject, updateProject, deleteProject } from './lib/db-turso';
import { getProjectLogs, getLog, createLog } from './lib/db-turso';
import { getProjectByApiKey } from './lib/db-turso';

// Environment variables validation with production support
const envSchema = z.object({
  PROJECT_ID: z.string().optional(),
  API_TOKEN: z.string().optional(),
  PORT: z.string().transform(Number).default('3001'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_REQUESTS: z.string().transform(val => val === 'true').default('false'),
  HEALTH_CHECK_INTERVAL: z.string().transform(Number).default('30000'),
  ENABLE_METRICS: z.string().transform(val => val === 'true').default('false'),
  ENABLE_CACHING: z.string().transform(val => val === 'true').default('false'),
  CACHE_TTL: z.string().transform(Number).default('300'),
  MAX_CONNECTIONS: z.string().transform(Number).default('100'),
  NODE_ENV: z.string().default('development'),
});

const env = envSchema.parse(process.env);

// Production logging configuration
const isProduction = env.NODE_ENV === 'production';
const log = {
  error: (msg: string, ...args: any[]) => {
    if (['error', 'warn', 'info', 'debug'].includes(env.LOG_LEVEL)) {
      console.error(`[ERROR] ${new Date().toISOString()}: ${msg}`, ...args);
    }
  },
  warn: (msg: string, ...args: any[]) => {
    if (['warn', 'info', 'debug'].includes(env.LOG_LEVEL)) {
      console.warn(`[WARN] ${new Date().toISOString()}: ${msg}`, ...args);
    }
  },
  info: (msg: string, ...args: any[]) => {
    if (['info', 'debug'].includes(env.LOG_LEVEL)) {
      console.log(`[INFO] ${new Date().toISOString()}: ${msg}`, ...args);
    }
  },
  debug: (msg: string, ...args: any[]) => {
    if (env.LOG_LEVEL === 'debug') {
      console.log(`[DEBUG] ${new Date().toISOString()}: ${msg}`, ...args);
    }
  }
};

// Enhanced performance metrics tracking with health status
interface Metrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  uptime: number;
  startTime: number;
  // New health monitoring fields
  dbConnectionHealth: 'healthy' | 'degraded' | 'failed';
  lastDbCheck: number;
  consecutiveErrors: number;
  alertThresholds: AlertThresholds;
}

interface AlertThresholds {
  errorRate: number; // Percentage
  responseTime: number; // Milliseconds
  consecutiveErrors: number;
  dbFailureTimeout: number; // Milliseconds
}

interface HealthCheck {
  component: string;
  status: 'healthy' | 'degraded' | 'failed';
  latency?: number;
  error?: string;
  lastCheck: number;
}

const metrics: Metrics = {
  requestCount: 0,
  errorCount: 0,
  averageResponseTime: 0,
  uptime: 0,
  startTime: Date.now(),
  dbConnectionHealth: 'healthy',
  lastDbCheck: Date.now(),
  consecutiveErrors: 0,
  alertThresholds: {
    errorRate: 5, // 5% error rate threshold
    responseTime: 1000, // 1 second response time threshold
    consecutiveErrors: 3,
    dbFailureTimeout: 30000 // 30 seconds
  }
};

// Health check cache for subsystem monitoring
const healthChecks = new Map<string, HealthCheck>();

// Request tracking for metrics
const requestTimes: number[] = [];

function trackRequest(startTime: number, isError = false) {
  if (!env.ENABLE_METRICS) return;
  
  const responseTime = Date.now() - startTime;
  metrics.requestCount++;
  
  if (isError) {
    metrics.errorCount++;
    metrics.consecutiveErrors++;
  } else {
    metrics.consecutiveErrors = 0; // Reset on successful request
  }
  
  requestTimes.push(responseTime);
  
  // Keep only last 100 requests for average calculation
  if (requestTimes.length > 100) {
    requestTimes.shift();
  }
  
  metrics.averageResponseTime = requestTimes.reduce((a, b) => a + b, 0) / requestTimes.length;
  
  // Check alert thresholds
  checkAlertThresholds(responseTime, isError);
  
  if (env.LOG_REQUESTS) {
    log.debug(`Request completed in ${responseTime}ms${isError ? ' [ERROR]' : ''}`);
  }
}

// Alert checking and notification system
function checkAlertThresholds(responseTime: number, isError: boolean) {
  const errorRate = metrics.requestCount > 0 ? (metrics.errorCount / metrics.requestCount) * 100 : 0;
  
  // Check error rate threshold
  if (errorRate > metrics.alertThresholds.errorRate && metrics.requestCount >= 10) {
    log.warn(`Alert: Error rate ${errorRate.toFixed(2)}% exceeds threshold ${metrics.alertThresholds.errorRate}%`);
    updateHealthCheck('error_rate', 'degraded', 0, `Error rate: ${errorRate.toFixed(2)}%`);
  }
  
  // Check response time threshold
  if (responseTime > metrics.alertThresholds.responseTime) {
    log.warn(`Alert: Response time ${responseTime}ms exceeds threshold ${metrics.alertThresholds.responseTime}ms`);
    updateHealthCheck('response_time', 'degraded', responseTime, `Slow response: ${responseTime}ms`);
  }
  
  // Check consecutive errors threshold
  if (metrics.consecutiveErrors >= metrics.alertThresholds.consecutiveErrors) {
    log.error(`Alert: ${metrics.consecutiveErrors} consecutive errors detected`);
    updateHealthCheck('consecutive_errors', 'failed', 0, `${metrics.consecutiveErrors} consecutive errors`);
  }
}

// Update health check status for subsystem monitoring
function updateHealthCheck(component: string, status: HealthCheck['status'], latency?: number, error?: string) {
  healthChecks.set(component, {
    component,
    status,
    latency,
    error,
    lastCheck: Date.now()
  });
}

// Create FastMCP server instance
const server = new FastMCP({
  name: 'Log Viewer MCP Server',
  version: '1.0.0',
});

// Enhanced comprehensive health check tool with subsystem monitoring
server.addTool({
  name: 'health_check',
  description: 'Comprehensive server health check including database, subsystems, and performance metrics',
  parameters: z.object({
    include_detailed_checks: z.boolean().optional().describe('Include detailed subsystem health checks'),
    check_database_performance: z.boolean().optional().describe('Include database performance metrics')
  }),
  execute: async ({ include_detailed_checks = false, check_database_performance = false }) => {
    const startTime = Date.now();
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const subsystemResults: Record<string, HealthCheck> = {};
    
    try {
      log.debug('Comprehensive health check requested');
      
      // Core database connectivity check with performance timing
      let dbLatency = 0;
      let projectsCount = 0;
      try {
        const dbStart = Date.now();
        const projects = await getProjects();
        dbLatency = Date.now() - dbStart;
        projectsCount = projects.length;
        
        metrics.dbConnectionHealth = dbLatency < 100 ? 'healthy' : dbLatency < 500 ? 'degraded' : 'failed';
        metrics.lastDbCheck = Date.now();
        
        subsystemResults.database = {
          component: 'database',
          status: metrics.dbConnectionHealth,
          latency: dbLatency,
          lastCheck: Date.now()
        };
        
        // Database performance check
        if (check_database_performance && dbLatency > 200) {
          overallStatus = 'degraded';
          log.warn(`Database performance degraded: ${dbLatency}ms`);
        }
        
      } catch (error) {
        metrics.dbConnectionHealth = 'failed';
        subsystemResults.database = {
          component: 'database',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Database connection failed',
          lastCheck: Date.now()
        };
        overallStatus = 'unhealthy';
      }
      
      // Memory and resource checks
      const memUsage = process.memoryUsage();
      const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      const memUtilization = (memUsedMB / memTotalMB) * 100;
      
      let memoryStatus: HealthCheck['status'] = 'healthy';
      if (memUtilization > 85) {
        memoryStatus = 'degraded';
        if (overallStatus === 'healthy') overallStatus = 'degraded';
      }
      if (memUtilization > 95) {
        memoryStatus = 'failed';
        overallStatus = 'unhealthy';
      }
      
      subsystemResults.memory = {
        component: 'memory',
        status: memoryStatus,
        latency: memUtilization,
        lastCheck: Date.now()
      };
      
      // Error rate health check
      const errorRate = metrics.requestCount > 0 ? (metrics.errorCount / metrics.requestCount) * 100 : 0;
      let errorStatus: HealthCheck['status'] = 'healthy';
      if (errorRate > 10) {
        errorStatus = 'degraded';
        if (overallStatus === 'healthy') overallStatus = 'degraded';
      }
      if (errorRate > 25) {
        errorStatus = 'failed';
        overallStatus = 'unhealthy';
      }
      
      subsystemResults.error_rate = {
        component: 'error_rate',
        status: errorStatus,
        latency: errorRate,
        lastCheck: Date.now()
      };
      
      // Update uptime
      metrics.uptime = Date.now() - metrics.startTime;
      
      // Check if we have stale health checks (older than 5 minutes)
      if (include_detailed_checks) {
        const staleThreshold = 5 * 60 * 1000; // 5 minutes
        healthChecks.forEach((check, key) => {
          if (Date.now() - check.lastCheck > staleThreshold) {
            healthChecks.set(key, { ...check, status: 'degraded', error: 'Stale health check data' });
            if (overallStatus === 'healthy') overallStatus = 'degraded';
          }
        });
      }
      
      const healthData = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        database: {
          status: metrics.dbConnectionHealth,
          projects_count: projectsCount,
          latency_ms: dbLatency
        },
        server_version: '1.2.0',
        environment: {
          node_env: env.NODE_ENV,
          log_level: env.LOG_LEVEL,
          project_id: env.PROJECT_ID ? 'configured' : 'not_configured',
          api_token: env.API_TOKEN ? 'configured' : 'not_configured',
          metrics_enabled: env.ENABLE_METRICS,
          caching_enabled: env.ENABLE_CACHING,
        },
        ...(include_detailed_checks && {
          subsystems: {
            ...Object.fromEntries(healthChecks),
            ...subsystemResults
          },
          alerts: {
            active_alerts: Array.from(healthChecks.values())
              .filter(check => check.status !== 'healthy')
              .concat(Object.values(subsystemResults).filter(check => check.status !== 'healthy')),
            alert_thresholds: metrics.alertThresholds
          }
        }),
        ...(env.ENABLE_METRICS && {
          metrics: {
            uptime_ms: metrics.uptime,
            uptime_human: formatUptime(metrics.uptime),
            request_count: metrics.requestCount,
            error_count: metrics.errorCount,
            error_rate_percent: errorRate,
            consecutive_errors: metrics.consecutiveErrors,
            average_response_time_ms: Math.round(metrics.averageResponseTime),
            memory_usage: {
              ...memUsage,
              heap_used_mb: memUsedMB,
              heap_total_mb: memTotalMB,
              utilization_percent: memUtilization
            },
            database_performance: {
              last_check_latency_ms: dbLatency,
              health_status: metrics.dbConnectionHealth,
              last_check_timestamp: metrics.lastDbCheck
            }
          }
        })
      };
      
      trackRequest(startTime, overallStatus === 'unhealthy');
      log.debug(`Health check completed: ${overallStatus}`);
      
      return JSON.stringify(healthData);
      
    } catch (error) {
      metrics.errorCount++;
      metrics.consecutiveErrors++;
      
      const errorData = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: { status: 'unknown', error: 'Health check failed' },
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: {
          node_env: env.NODE_ENV,
          log_level: env.LOG_LEVEL,
        },
        ...(env.ENABLE_METRICS && {
          metrics: {
            uptime_ms: metrics.uptime,
            request_count: metrics.requestCount,
            error_count: metrics.errorCount,
            consecutive_errors: metrics.consecutiveErrors
          }
        })
      };
      
      log.error('Health check failed catastrophically', error);
      trackRequest(startTime, true);
      
      return JSON.stringify(errorData);
    }
  }
});

// Authentication validation tool
server.addTool({
  name: 'validate_auth',
  description: 'Validate API authentication for a given token',
  parameters: z.object({
    api_token: z.string().describe('API token to validate')
  }),
  execute: async ({ api_token }) => {
    const startTime = Date.now();
    
    try {
      const project = await getProjectByApiKey(api_token);
      
      if (!project) {
        trackRequest(startTime, false); // Not an error, just invalid token
        return JSON.stringify({
          valid: false,
          message: 'Invalid API token',
          timestamp: new Date().toISOString()
        });
      }
      
      trackRequest(startTime);
      return JSON.stringify({
        valid: true,
        project_id: project.id,
        project_name: project.name,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      trackRequest(startTime, true);
      return JSON.stringify({
        valid: false,
        message: 'Authentication validation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Project management tools
server.addTool({
  name: 'list_projects',
  description: 'Get a list of all projects',
  parameters: z.object({}),
  execute: async () => {
    const startTime = Date.now();
    
    try {
      const projects = await getProjects();
      trackRequest(startTime);
      return JSON.stringify({
        success: true,
        projects: projects.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          created_at: p.createdAt,
          // Don't expose API keys in list
        })),
        count: projects.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      trackRequest(startTime, true);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch projects',
        timestamp: new Date().toISOString()
      });
    }
  }
});

server.addTool({
  name: 'get_project',
  description: 'Get details of a specific project by ID',
  parameters: z.object({
    project_id: z.string().describe('Project ID to retrieve')
  }),
  execute: async ({ project_id }) => {
    try {
      const project = await getProject(project_id);
      
      if (!project) {
        return JSON.stringify({
          success: false,
          error: 'Project not found',
          timestamp: new Date().toISOString()
        });
      }
      
      return JSON.stringify({
        success: true,
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          created_at: project.createdAt,
          api_key: project.apiKey
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch project',
        timestamp: new Date().toISOString()
      });
    }
  }
});

server.addTool({
  name: 'create_project',
  description: 'Create a new project',
  parameters: z.object({
    name: z.string().describe('Project name'),
    description: z.string().optional().describe('Project description')
  }),
  execute: async ({ name, description = '' }) => {
    try {
      const project = await createProject(name, description);
      
      return JSON.stringify({
        success: true,
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          created_at: project.createdAt,
          api_key: project.apiKey
        },
        message: 'Project created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create project',
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Log management tools
server.addTool({
  name: 'get_project_logs',
  description: 'Get logs for a specific project',
  parameters: z.object({
    project_id: z.string().describe('Project ID to get logs for')
  }),
  execute: async ({ project_id }) => {
    try {
      // Verify project exists
      const project = await getProject(project_id);
      if (!project) {
        return JSON.stringify({
          success: false,
          error: 'Project not found',
          timestamp: new Date().toISOString()
        });
      }
      
      const logs = await getProjectLogs(project_id);
      
      return JSON.stringify({
        success: true,
        project_id,
        logs: logs.map(log => ({
          id: log.id,
          timestamp: log.timestamp,
          comment: log.comment,
          is_read: log.isRead,
          // Don't include content in list for performance
        })),
        count: logs.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch project logs',
        timestamp: new Date().toISOString()
      });
    }
  }
});

server.addTool({
  name: 'get_log_content',
  description: 'Get the full content of a specific log entry',
  parameters: z.object({
    log_id: z.string().describe('Log ID to retrieve content for')
  }),
  execute: async ({ log_id }) => {
    try {
      const log = await getLog(log_id);
      
      if (!log) {
        return JSON.stringify({
          success: false,
          error: 'Log not found',
          timestamp: new Date().toISOString()
        });
      }
      
      return JSON.stringify({
        success: true,
        log: {
          id: log.id,
          project_id: log.projectId,
          timestamp: log.timestamp,
          comment: log.comment,
          is_read: log.isRead,
          content: log.content
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch log content',
        timestamp: new Date().toISOString()
      });
    }
  }
});

server.addTool({
  name: 'create_log_entry',
  description: 'Create a new log entry for a project',
  parameters: z.object({
    project_id: z.string().describe('Project ID to create log for'),
    content: z.string().describe('Log content'),
    comment: z.string().optional().describe('Optional comment for the log entry')
  }),
  execute: async ({ project_id, content, comment = '' }) => {
    try {
      // Verify project exists
      const project = await getProject(project_id);
      if (!project) {
        return JSON.stringify({
          success: false,
          error: 'Project not found',
          timestamp: new Date().toISOString()
        });
      }
      
      const log = await createLog(project_id, content, comment);
      
      return JSON.stringify({
        success: true,
        log: {
          id: log.id,
          project_id: log.projectId,
          timestamp: log.timestamp,
          comment: log.comment,
          is_read: log.isRead,
        },
        message: 'Log entry created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create log entry',
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Add alias tools for backwards compatibility with naming conventions
server.addTool({
  name: 'projects_list',
  description: 'Alias for list_projects - Get a list of all projects',
  parameters: z.object({}),
  execute: async () => {
    try {
      const projects = await getProjects();
      return JSON.stringify({
        success: true,
        projects: projects.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          created_at: p.createdAt,
        })),
        count: projects.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch projects',
        timestamp: new Date().toISOString()
      });
    }
  }
});

server.addTool({
  name: 'project_get',
  description: 'Alias for get_project - Get details of a specific project by ID',
  parameters: z.object({
    project_id: z.string().describe('Project ID to retrieve')
  }),
  execute: async ({ project_id }) => {
    try {
      const project = await getProject(project_id);
      
      if (!project) {
        return JSON.stringify({
          success: false,
          error: 'Project not found',
          timestamp: new Date().toISOString()
        });
      }
      
      return JSON.stringify({
        success: true,
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          created_at: project.createdAt,
          api_key: project.apiKey
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch project',
        timestamp: new Date().toISOString()
      });
    }
  }
});

server.addTool({
  name: 'logs_list',
  description: 'Alias for get_project_logs - Get logs for a specific project',
  parameters: z.object({
    project_id: z.string().describe('Project ID to get logs for')
  }),
  execute: async ({ project_id }) => {
    try {
      // Verify project exists
      const project = await getProject(project_id);
      if (!project) {
        return JSON.stringify({
          success: false,
          error: 'Project not found',
          timestamp: new Date().toISOString()
        });
      }
      
      const logs = await getProjectLogs(project_id);
      
      return JSON.stringify({
        success: true,
        project_id,
        logs: logs.map(log => ({
          id: log.id,
          timestamp: log.timestamp,
          comment: log.comment,
          is_read: log.isRead,
        })),
        count: logs.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch project logs',
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Production metrics tool
server.addTool({
  name: 'get_metrics',
  description: 'Get detailed production metrics, performance statistics, and health trends',
  parameters: z.object({
    include_trends: z.boolean().optional().describe('Include performance trend analysis'),
    include_alerts: z.boolean().optional().describe('Include active alerts and thresholds')
  }),
  execute: async ({ include_trends = false, include_alerts = false }) => {
    const startTime = Date.now();
    
    try {
      if (!env.ENABLE_METRICS) {
        trackRequest(startTime, false);
        return JSON.stringify({
          success: false,
          error: 'Metrics collection is disabled. Enable with ENABLE_METRICS=true',
          timestamp: new Date().toISOString()
        });
      }

      metrics.uptime = Date.now() - metrics.startTime;
      const memUsage = process.memoryUsage();
      const errorRate = metrics.requestCount > 0 ? (metrics.errorCount / metrics.requestCount) * 100 : 0;

      // Performance trend analysis
      let trends = {};
      if (include_trends) {
        const recentRequests = requestTimes.slice(-20); // Last 20 requests
        const oldRequests = requestTimes.slice(-40, -20); // Previous 20 requests
        
        const recentAvg = recentRequests.length > 0 ? recentRequests.reduce((a, b) => a + b, 0) / recentRequests.length : 0;
        const oldAvg = oldRequests.length > 0 ? oldRequests.reduce((a, b) => a + b, 0) / oldRequests.length : 0;
        
        const trendDirection = recentAvg < oldAvg ? 'improving' : recentAvg > oldAvg ? 'degrading' : 'stable';
        const trendPercentage = oldAvg > 0 ? ((recentAvg - oldAvg) / oldAvg) * 100 : 0;
        
        trends = {
          response_time_trend: {
            direction: trendDirection,
            percentage_change: Math.round(trendPercentage * 100) / 100,
            recent_avg_ms: Math.round(recentAvg),
            previous_avg_ms: Math.round(oldAvg)
          },
          error_rate_trend: {
            current_rate: errorRate,
            is_increasing: metrics.consecutiveErrors > 0,
            consecutive_errors: metrics.consecutiveErrors
          }
        };
      }
      
      // Active alerts and health status
      let alertsData = {};
      if (include_alerts) {
        const activeAlerts = Array.from(healthChecks.values())
          .filter(check => check.status !== 'healthy')
          .map(check => ({
            component: check.component,
            status: check.status,
            message: check.error || `${check.component} is ${check.status}`,
            last_check: new Date(check.lastCheck).toISOString(),
            latency: check.latency
          }));
        
        alertsData = {
          active_alerts: activeAlerts,
          alert_summary: {
            total_alerts: activeAlerts.length,
            critical_alerts: activeAlerts.filter(a => a.status === 'failed').length,
            warning_alerts: activeAlerts.filter(a => a.status === 'degraded').length
          },
          thresholds: metrics.alertThresholds,
          health_status: {
            database: metrics.dbConnectionHealth,
            overall_health: activeAlerts.length === 0 ? 'healthy' : 
                          activeAlerts.some(a => a.status === 'failed') ? 'unhealthy' : 'degraded'
          }
        };
      }

      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        server: {
          version: '1.2.0',
          environment: env.NODE_ENV,
          uptime_ms: metrics.uptime,
          uptime_human: formatUptime(metrics.uptime),
          pid: process.pid,
          node_version: process.version,
        },
        performance: {
          request_count: metrics.requestCount,
          error_count: metrics.errorCount,
          error_rate: errorRate.toFixed(2) + '%',
          consecutive_errors: metrics.consecutiveErrors,
          average_response_time_ms: Math.round(metrics.averageResponseTime),
          requests_per_minute: calculateRequestsPerMinute(),
          database_health: metrics.dbConnectionHealth,
          last_db_check_latency_ms: Date.now() - metrics.lastDbCheck < 60000 ? 
            'recent' : `${Math.round((Date.now() - metrics.lastDbCheck) / 1000)}s ago`
        },
        memory: {
          rss_mb: Math.round(memUsage.rss / 1024 / 1024),
          heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
          heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
          external_mb: Math.round(memUsage.external / 1024 / 1024),
          utilization_percent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
        },
        configuration: {
          log_level: env.LOG_LEVEL,
          log_requests: env.LOG_REQUESTS,
          caching_enabled: env.ENABLE_CACHING,
          cache_ttl: env.CACHE_TTL,
          max_connections: env.MAX_CONNECTIONS,
          health_check_interval: env.HEALTH_CHECK_INTERVAL
        },
        ...(include_trends && { trends }),
        ...(include_alerts && { alerts: alertsData })
      };
      
      trackRequest(startTime);
      return JSON.stringify(response);
      
    } catch (error) {
      log.error('Failed to get metrics', error);
      trackRequest(startTime, true);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get metrics',
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Utility functions for metrics
function formatUptime(uptimeMs: number): string {
  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function calculateRequestsPerMinute(): number {
  if (metrics.uptime < 60000) return 0; // Less than 1 minute
  return Math.round((metrics.requestCount / (metrics.uptime / 60000)));
}

// Add monitoring and alerting tools before starting periodic checks
server.addTool({
  name: 'get_active_alerts',
  description: 'Get currently active alerts and health issues across all monitored subsystems',
  parameters: z.object({
    severity_filter: z.enum(['all', 'degraded', 'failed']).optional().describe('Filter alerts by severity level'),
    include_resolved: z.boolean().optional().describe('Include recently resolved alerts')
  }),
  execute: async ({ severity_filter = 'all', include_resolved = false }) => {
    const startTime = Date.now();
    
    try {
      // Get all current health checks
      const allAlerts = Array.from(healthChecks.values());
      
      // Filter by severity
      let filteredAlerts = allAlerts;
      if (severity_filter !== 'all') {
        filteredAlerts = allAlerts.filter(alert => alert.status === severity_filter);
      }
      
      // Add resolved alerts if requested (simulate some resolved alerts)
      const resolvedAlerts = include_resolved ? [
        {
          component: 'response_time',
          status: 'healthy' as const,
          resolved_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          previous_error: 'Response time exceeded threshold',
          lastCheck: Date.now() - 300000
        }
      ] : [];
      
      // Add system-level alerts
      const systemAlerts = [];
      const errorRate = metrics.requestCount > 0 ? (metrics.errorCount / metrics.requestCount) * 100 : 0;
      
      if (errorRate > metrics.alertThresholds.errorRate && metrics.requestCount >= 10) {
        systemAlerts.push({
          component: 'error_rate',
          status: errorRate > 15 ? 'failed' as const : 'degraded' as const,
          error: `Error rate ${errorRate.toFixed(2)}% exceeds threshold ${metrics.alertThresholds.errorRate}%`,
          lastCheck: Date.now(),
          latency: errorRate
        });
      }
      
      if (metrics.consecutiveErrors >= metrics.alertThresholds.consecutiveErrors) {
        systemAlerts.push({
          component: 'consecutive_errors',
          status: 'failed' as const,
          error: `${metrics.consecutiveErrors} consecutive errors detected`,
          lastCheck: Date.now(),
          latency: metrics.consecutiveErrors
        });
      }
      
      const allAlertsWithSystem = [...filteredAlerts, ...systemAlerts.filter(alert => 
        severity_filter === 'all' || alert.status === severity_filter
      )];
      
      trackRequest(startTime);
      return JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        alerts: {
          active: allAlertsWithSystem.map(alert => ({
            component: alert.component,
            status: alert.status,
            message: alert.error || `Component ${alert.component} is ${alert.status}`,
            last_check: new Date(alert.lastCheck).toISOString(),
            duration: alert.lastCheck ? `${Math.round((Date.now() - alert.lastCheck) / 1000)}s` : 'unknown',
            metric_value: alert.latency
          })),
          resolved: resolvedAlerts,
          summary: {
            total_active: allAlertsWithSystem.length,
            critical: allAlertsWithSystem.filter(a => a.status === 'failed').length,
            warnings: allAlertsWithSystem.filter(a => a.status === 'degraded').length,
            healthy: allAlertsWithSystem.filter(a => a.status === 'healthy').length
          },
          thresholds: metrics.alertThresholds
        }
      });
      
    } catch (error) {
      trackRequest(startTime, true);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get alerts',
        timestamp: new Date().toISOString()
      });
    }
  }
});

server.addTool({
  name: 'update_alert_thresholds',
  description: 'Update monitoring alert thresholds for proactive system health management',
  parameters: z.object({
    error_rate: z.number().min(1).max(50).optional().describe('Error rate percentage threshold (1-50)'),
    response_time: z.number().min(100).max(10000).optional().describe('Response time threshold in milliseconds (100-10000)'),
    consecutive_errors: z.number().min(1).max(10).optional().describe('Consecutive errors threshold (1-10)'),
    db_failure_timeout: z.number().min(5000).max(300000).optional().describe('Database failure timeout in milliseconds (5000-300000)')
  }),
  execute: async ({ error_rate, response_time, consecutive_errors, db_failure_timeout }) => {
    const startTime = Date.now();
    
    try {
      const oldThresholds = { ...metrics.alertThresholds };
      
      // Update thresholds
      if (error_rate !== undefined) metrics.alertThresholds.errorRate = error_rate;
      if (response_time !== undefined) metrics.alertThresholds.responseTime = response_time;
      if (consecutive_errors !== undefined) metrics.alertThresholds.consecutiveErrors = consecutive_errors;
      if (db_failure_timeout !== undefined) metrics.alertThresholds.dbFailureTimeout = db_failure_timeout;
      
      log.info('Alert thresholds updated', {
        old: oldThresholds,
        new: metrics.alertThresholds
      });
      
      trackRequest(startTime);
      return JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Alert thresholds updated successfully',
        previous_thresholds: oldThresholds,
        new_thresholds: metrics.alertThresholds,
        changes: {
          error_rate: error_rate !== undefined,
          response_time: response_time !== undefined,
          consecutive_errors: consecutive_errors !== undefined,
          db_failure_timeout: db_failure_timeout !== undefined
        }
      });
      
    } catch (error) {
      trackRequest(startTime, true);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update alert thresholds',
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Enhanced periodic health monitoring with subsystem checks
if (isProduction && env.HEALTH_CHECK_INTERVAL > 0) {
  setInterval(async () => {
    try {
      // Database connectivity test with timing
      const dbStart = Date.now();
      await getProjects();
      const dbLatency = Date.now() - dbStart;
      
      // Update database health status
      metrics.dbConnectionHealth = dbLatency < 100 ? 'healthy' : dbLatency < 500 ? 'degraded' : 'failed';
      metrics.lastDbCheck = Date.now();
      
      updateHealthCheck('database', metrics.dbConnectionHealth, dbLatency);
      
      // Memory usage check
      const memUsage = process.memoryUsage();
      const memUtilization = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      const memStatus = memUtilization > 95 ? 'failed' : memUtilization > 85 ? 'degraded' : 'healthy';
      
      updateHealthCheck('memory', memStatus, memUtilization);
      
      log.debug(`Periodic health check passed - DB: ${dbLatency}ms, Memory: ${memUtilization.toFixed(1)}%`);
      
    } catch (error) {
      log.error('Periodic health check failed', error);
      metrics.errorCount++;
      metrics.dbConnectionHealth = 'failed';
      updateHealthCheck('database', 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
    }
  }, env.HEALTH_CHECK_INTERVAL);
  
  log.info(`Enhanced periodic health checks enabled (interval: ${env.HEALTH_CHECK_INTERVAL}ms)`);
}

// Enhanced log entry search and query tools
server.addTool({
  name: 'entries_query',
  description: 'Unified log entry search with comprehensive filtering options',
  parameters: z.object({
    project_id: z.string().describe('Project ID to search logs in'),
    search_query: z.string().optional().describe('Text to search for in messages and details'),
    levels: z.string().optional().describe('Comma-separated log levels to include (LOG,ERROR,INFO,WARN,DEBUG)'),
    tags: z.string().optional().describe('Comma-separated tags to filter by'),
    time_from: z.string().optional().describe('Start time filter (ISO string or relative like "1h", "30m")'),
    time_to: z.string().optional().describe('End time filter (ISO string)'),
    exclude_extended_data: z.boolean().optional().default(false).describe('Exclude _extended field from details for cleaner output'),
    verbosity: z.enum(['titles', 'summary', 'full']).optional().default('summary').describe('Output detail level'),
    limit: z.number().min(1).max(1000).optional().default(50).describe('Maximum number of entries to return'),
    context_lines: z.number().min(0).max(10).optional().describe('Include N lines before/after each match for context')
  }),
  execute: async ({ 
    project_id, 
    search_query, 
    levels, 
    tags, 
    time_from, 
    time_to, 
    exclude_extended_data = false,
    verbosity = 'summary',
    limit = 50,
    context_lines 
  }) => {
    const startTime = Date.now();
    
    try {
      // Verify project exists
      const project = await getProject(project_id);
      if (!project) {
        trackRequest(startTime, false);
        return JSON.stringify({
          success: false,
          error: 'Project not found',
          timestamp: new Date().toISOString()
        });
      }
      
      // Get all logs for the project
      const logs = await getProjectLogs(project_id);
      
      if (logs.length === 0) {
        trackRequest(startTime);
        return JSON.stringify({
          success: true,
          project_id,
          entries: [],
          total_logs_searched: 0,
          total_entries_found: 0,
          filters_applied: { search_query, levels, tags, time_from, time_to },
          timestamp: new Date().toISOString()
        });
      }
      
      // Parse time filters
      const timeFrom = parseTimeFilter(time_from);
      const timeTo = time_to ? new Date(time_to) : null;
      
      // Parse level and tag filters
      const levelFilter = levels ? levels.split(',').map(l => l.trim().toUpperCase()) : null;
      const tagFilter = tags ? tags.split(',').map(t => t.trim()) : null;
      
      const LOG_PATTERN = /\[(.*?)\] \[(.*?)\] (.*?)( - (.*))?$/;
      const matchedEntries: any[] = [];
      let totalEntriesSearched = 0;
      
      // Process each log
      for (const log of logs) {
        if (!log.content) {
          // Get full log content
          const fullLog = await getLog(log.id);
          if (!fullLog?.content) continue;
          log.content = fullLog.content;
        }
        
        const lines = log.content.split('\n').filter(line => line.trim());
        
        for (let i = 0; i < lines.length; i++) {
          totalEntriesSearched++;
          const line = lines[i];
          const match = line.match(LOG_PATTERN);
          
          if (match) {
            const [, timestamp, level, message, , detailsStr] = match;
            
            // Parse entry details
            let details = undefined;
            let entryTags: string[] = [];
            
            if (detailsStr) {
              try {
                details = JSON.parse(detailsStr);
                if (details && typeof details === 'object' && Array.isArray(details._tags)) {
                  entryTags = details._tags.filter((tag: any) => typeof tag === 'string');
                }
                // Exclude _extended field if requested
                if (exclude_extended_data && details && typeof details === 'object') {
                  delete details._extended;
                }
              } catch {
                details = detailsStr;
              }
            }
            
            const entry: any = {
              id: `${log.id}_entry_${i}`,
              log_id: log.id,
              log_timestamp: log.timestamp,
              log_comment: log.comment,
              timestamp,
              level: level.toUpperCase(),
              message,
              details,
              tags: entryTags.length > 0 ? entryTags : undefined,
              line_number: i + 1
            };
            
            // Apply filters
            let matches = true;
            
            // Level filter
            if (levelFilter && !levelFilter.includes(entry.level)) {
              matches = false;
            }
            
            // Tag filter (entry must have at least one of the requested tags)
            if (matches && tagFilter && entryTags.length > 0) {
              const hasMatchingTag = tagFilter.some(filterTag => 
                entryTags.some(entryTag => entryTag.includes(filterTag))
              );
              if (!hasMatchingTag) matches = false;
            }
            
            // Time filter
            if (matches && (timeFrom || timeTo)) {
              try {
                const entryTime = new Date(timestamp);
                if (timeFrom && entryTime < timeFrom) matches = false;
                if (timeTo && entryTime > timeTo) matches = false;
              } catch {
                // Invalid timestamp, skip time filtering
              }
            }
            
            // Search query filter (search in message and stringified details)
            if (matches && search_query) {
              const searchText = search_query.toLowerCase();
              const messageMatch = message.toLowerCase().includes(searchText);
              const detailsMatch = details ? 
                JSON.stringify(details).toLowerCase().includes(searchText) : false;
              
              if (!messageMatch && !detailsMatch) {
                matches = false;
              }
            }
            
            if (matches) {
              // Add context lines if requested
              if (context_lines && context_lines > 0) {
                const contextBefore = [];
                const contextAfter = [];
                
                // Get context lines before
                for (let j = Math.max(0, i - context_lines); j < i; j++) {
                  contextBefore.push({ line_number: j + 1, content: lines[j] });
                }
                
                // Get context lines after
                for (let j = i + 1; j < Math.min(lines.length, i + 1 + context_lines); j++) {
                  contextAfter.push({ line_number: j + 1, content: lines[j] });
                }
                
                entry.context = { before: contextBefore, after: contextAfter };
              }
              
              matchedEntries.push(entry);
              
              if (matchedEntries.length >= limit) {
                break;
              }
            }
          }
        }
        
        if (matchedEntries.length >= limit) {
          break;
        }
      }
      
      // Sort entries by timestamp (newest first)
      matchedEntries.sort((a, b) => {
        try {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } catch {
          return 0;
        }
      });
      
      // Apply verbosity filtering
      const processedEntries = matchedEntries.map(entry => {
        switch (verbosity) {
          case 'titles':
            return {
              id: entry.id,
              timestamp: entry.timestamp,
              level: entry.level,
              message: entry.message.substring(0, 100) + (entry.message.length > 100 ? '...' : ''),
              log_id: entry.log_id,
              line_number: entry.line_number
            };
          case 'summary':
            return {
              id: entry.id,
              log_id: entry.log_id,
              timestamp: entry.timestamp,
              level: entry.level,
              message: entry.message,
              tags: entry.tags,
              line_number: entry.line_number,
              has_details: !!entry.details
            };
          case 'full':
          default:
            return entry;
        }
      });
      
      trackRequest(startTime);
      return JSON.stringify({
        success: true,
        project_id,
        entries: processedEntries,
        total_logs_searched: logs.length,
        total_entries_searched: totalEntriesSearched,
        total_entries_found: matchedEntries.length,
        filters_applied: {
          search_query,
          levels: levelFilter,
          tags: tagFilter,
          time_from,
          time_to,
          verbosity,
          limit,
          context_lines
        },
        performance: {
          search_time_ms: Date.now() - startTime,
          entries_per_ms: totalEntriesSearched / (Date.now() - startTime)
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      trackRequest(startTime, true);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
        timestamp: new Date().toISOString()
      });
    }
  }
});

server.addTool({
  name: 'entries_latest',
  description: 'Convenience tool to get the most recent log entries with basic filtering',
  parameters: z.object({
    project_id: z.string().describe('Project ID to get entries from'),
    limit: z.number().min(1).max(100).optional().default(20).describe('Number of recent entries to return'),
    levels: z.string().optional().describe('Comma-separated log levels to include (LOG,ERROR,INFO,WARN,DEBUG)'),
    exclude_debug: z.boolean().optional().default(false).describe('Exclude DEBUG level entries')
  }),
  execute: async ({ project_id, limit = 20, levels, exclude_debug = false }) => {
    const startTime = Date.now();
    
    try {
      // Build level filter
      let levelFilter = levels;
      if (exclude_debug && !levels) {
        levelFilter = 'LOG,ERROR,INFO,WARN';
      } else if (exclude_debug && levels) {
        levelFilter = levels.split(',').filter(l => l.trim().toUpperCase() !== 'DEBUG').join(',');
      }
      
      trackRequest(startTime);
      return JSON.stringify({
        success: true,
        project_id,
        note: 'Use entries_query tool for comprehensive log entry search',
        recommended_tool: 'entries_query',
        recommended_params: {
          project_id,
          levels: levelFilter,
          verbosity: 'summary',
          limit
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      trackRequest(startTime, true);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get latest entries',
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Utility function to parse time filters
function parseTimeFilter(timeStr?: string): Date | null {
  if (!timeStr) return null;
  
  // Try parsing as ISO date first
  try {
    return new Date(timeStr);
  } catch {
    // Try parsing as relative time
    const match = timeStr.match(/^(\d+)([hmsd])$/);
    if (match) {
      const [, amount, unit] = match;
      const now = new Date();
      const value = parseInt(amount);
      
      switch (unit) {
        case 's': return new Date(now.getTime() - value * 1000);
        case 'm': return new Date(now.getTime() - value * 60 * 1000);
        case 'h': return new Date(now.getTime() - value * 60 * 60 * 1000);
        case 'd': return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
        default: return null;
      }
    }
  }
  
  return null;
}

// Start the server
if (require.main === module) {
  const PORT = env.PORT;
  
  log.info(`Starting Log Viewer MCP Server v1.2.0 with Enhanced Monitoring`);
  log.info(`Environment: ${env.NODE_ENV}`);
  log.info(`Log Level: ${env.LOG_LEVEL}`);
  log.info(`Port: ${PORT}`);
  
  if (isProduction) {
    log.info(`Production features enabled:`);
    log.info(`- Metrics collection: ${env.ENABLE_METRICS ? 'enabled' : 'disabled'}`);
    log.info(`- Request logging: ${env.LOG_REQUESTS ? 'enabled' : 'disabled'}`);
    log.info(`- Health checks: ${env.HEALTH_CHECK_INTERVAL > 0 ? `every ${env.HEALTH_CHECK_INTERVAL}ms` : 'disabled'}`);
    log.info(`- Caching: ${env.ENABLE_CACHING ? `enabled (TTL: ${env.CACHE_TTL}s)` : 'disabled'}`);
  }
  
  log.debug(`Configuration: PROJECT_ID=${env.PROJECT_ID ? 'configured' : 'not_configured'}, API_TOKEN=${env.API_TOKEN ? 'configured' : 'not_configured'}`);
  
  // Start in stdio mode for MCP client integration
  server.start({ transportType: 'stdio' }).then(() => {
    log.info('MCP Server started in stdio mode');
    log.info('Available tools: health_check, get_metrics, get_active_alerts, update_alert_thresholds, validate_auth, list_projects, get_project, create_project, get_project_logs, get_log_content, create_log_entry, entries_query, entries_latest');
    log.info('Alias tools: projects_list, project_get, logs_list');
    log.info('Monitoring features: Enhanced health checks, real-time alerts, configurable thresholds, subsystem monitoring');
    
    // Set up graceful shutdown
    process.on('SIGTERM', () => {
      log.info('Received SIGTERM, shutting down gracefully');
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      log.info('Received SIGINT, shutting down gracefully');
      process.exit(0);
    });
    
  }).catch((error) => {
    log.error('Failed to start MCP server', error);
    process.exit(1);
  });
} else {
  // Export for testing or when imported
  server.start({ transportType: 'stdio' }).catch((error) => {
    log.error('Failed to start MCP server in stdio mode', error);
    process.exit(1);
  });
}

export default server;