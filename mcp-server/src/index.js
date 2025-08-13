const { FastMCP } = require('fastmcp');
const { z } = require('zod');

// Simple environment variable parsing
const env = {
  PROJECT_ID: process.env.PROJECT_ID,
  API_TOKEN: process.env.API_TOKEN,
  PORT: parseInt(process.env.PORT) || 3001,
};

// Create FastMCP server instance
const server = new FastMCP({
  name: 'Log Viewer MCP Server',
  version: '1.0.0',
  description: 'MCP server for Log Viewer application providing project and log management tools',
});

// Mock database functions for testing (would normally import from the TypeScript files)
const mockProjects = [
  {
    id: 'test-project',
    name: 'Test Project',
    description: 'A test project for the MCP server',
    createdAt: new Date().toISOString(),
    apiKey: 'test-api-key-12345'
  }
];

const mockLogs = [
  {
    id: 'log-1',
    projectId: 'test-project',
    timestamp: new Date().toISOString(),
    comment: 'Test log entry',
    isRead: false,
    content: '[2025-08-13, 20:25:00] [INFO] MCP server infrastructure setup completed successfully'
  }
];

// Health check tool
server.addTool({
  name: 'health_check',
  description: 'Check server health status and database connectivity',
  parameters: z.object({}),
  execute: async () => {
    return JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'mocked',
      projects_count: mockProjects.length,
      server_version: '1.0.0',
      environment: {
        project_id: env.PROJECT_ID ? 'configured' : 'not_configured',
        api_token: env.API_TOKEN ? 'configured' : 'not_configured',
      }
    });
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
    const project = mockProjects.find(p => p.apiKey === api_token);
    
    if (!project) {
      return JSON.stringify({
        valid: false,
        message: 'Invalid API token',
        timestamp: new Date().toISOString()
      });
    }
    
    return JSON.stringify({
      valid: true,
      project_id: project.id,
      project_name: project.name,
      timestamp: new Date().toISOString()
    });
  }
});

// Project management tools
server.addTool({
  name: 'list_projects',
  description: 'Get a list of all projects',
  parameters: z.object({}),
  execute: async () => {
    return JSON.stringify({
      success: true,
      projects: mockProjects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        created_at: p.createdAt,
        // Don't expose API keys in list
      })),
      count: mockProjects.length,
      timestamp: new Date().toISOString()
    });
  }
});

server.addTool({
  name: 'get_project',
  description: 'Get details of a specific project by ID',
  parameters: z.object({
    project_id: z.string().describe('Project ID to retrieve')
  }),
  execute: async ({ project_id }) => {
    const project = mockProjects.find(p => p.id === project_id);
    
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
    const project = mockProjects.find(p => p.id === project_id);
    if (!project) {
      return JSON.stringify({
        success: false,
        error: 'Project not found',
        timestamp: new Date().toISOString()
      });
    }
    
    const logs = mockLogs.filter(log => log.projectId === project_id);
    
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
  }
});

server.addTool({
  name: 'get_log_content',
  description: 'Get the full content of a specific log entry',
  parameters: z.object({
    log_id: z.string().describe('Log ID to retrieve content for')
  }),
  execute: async ({ log_id }) => {
    const log = mockLogs.find(l => l.id === log_id);
    
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
  }
});

// Start the server
console.log(`🚀 Starting Log Viewer MCP Server on port ${env.PORT}...`);
console.log(`🔧 Environment: PROJECT_ID=${env.PROJECT_ID ? 'configured' : 'not_configured'}, API_TOKEN=${env.API_TOKEN ? 'configured' : 'not_configured'}`);
console.log(`⚠️  Note: Running with mock data for demonstration`);

// Start in HTTP mode for testing and external integration
server.start({
  transportType: "http",
  httpOptions: {
    port: env.PORT,
    hostname: "0.0.0.0"
  }
}).then(() => {
  console.log(`✅ Log Viewer MCP Server running on http://0.0.0.0:${env.PORT}`);
  console.log(`📋 Available tools:`);
  server.listTools().forEach(tool => {
    console.log(`   - ${tool.name}: ${tool.description}`);
  });
}).catch((error) => {
  console.error('❌ Failed to start MCP server:', error);
  process.exit(1);
});

module.exports = server;