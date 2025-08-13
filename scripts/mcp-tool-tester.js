#!/usr/bin/env node
/**
 * MCP Tool Tester - Direct MCP Client Testing
 * 
 * Tests MCP tools using actual MCP client communication via stdio
 * Provides real integration testing with the MCP server
 * 
 * Task: TASK-2025-009 - Create MCP integration validation scripts
 */

const { spawn } = require('child_process');
const path = require('path');

class MCPToolTester {
  constructor() {
    this.serverProcess = null;
    this.messageId = 1;
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      const serverPath = path.join(__dirname, '../mcp-server');
      
      this.serverProcess = spawn('npm', ['start'], {
        cwd: serverPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let initComplete = false;
      let serverOutput = '';

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        serverOutput += output;
        
        if (output.includes('MCP Server started') && !initComplete) {
          initComplete = true;
          setTimeout(resolve, 1000); // Give server time to fully initialize
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error('Server stderr:', data.toString());
      });

      this.serverProcess.on('error', reject);
      
      // Timeout after 15 seconds
      setTimeout(() => {
        if (!initComplete) {
          reject(new Error('Server startup timeout'));
        }
      }, 15000);
    });
  }

  async sendMCPMessage(method, params = {}) {
    return new Promise((resolve, reject) => {
      const message = {
        jsonrpc: '2.0',
        id: this.messageId++,
        method: method,
        params: params
      };

      const messageStr = JSON.stringify(message) + '\n';
      
      let responseData = '';
      let timeout;

      const onData = (data) => {
        responseData += data.toString();
        
        try {
          // Try to parse each line as JSON
          const lines = responseData.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            const response = JSON.parse(line);
            
            if (response.id === message.id) {
              clearTimeout(timeout);
              this.serverProcess.stdout.removeListener('data', onData);
              
              if (response.error) {
                reject(new Error(response.error.message || 'MCP Error'));
              } else {
                resolve(response.result);
              }
              return;
            }
          }
        } catch (e) {
          // Continue collecting data if JSON is incomplete
        }
      };

      this.serverProcess.stdout.on('data', onData);
      
      timeout = setTimeout(() => {
        this.serverProcess.stdout.removeListener('data', onData);
        reject(new Error('MCP request timeout'));
      }, 5000);

      this.serverProcess.stdin.write(messageStr);
    });
  }

  async testTool(toolName, args = {}) {
    try {
      const result = await this.sendMCPMessage('tools/call', {
        name: toolName,
        arguments: args
      });
      
      return {
        success: true,
        result: result,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: error.message
      };
    }
  }

  async getAllTools() {
    try {
      const result = await this.sendMCPMessage('tools/list');
      return result.tools || [];
    } catch (error) {
      console.error('Failed to get tools list:', error.message);
      return [];
    }
  }

  async runComprehensiveTest() {
    console.log('🚀 Starting MCP Tool Comprehensive Test\n');
    
    try {
      // Start server
      console.log('Starting MCP server...');
      await this.startServer();
      console.log('✅ Server started\n');

      // Get available tools
      console.log('📋 Getting available tools...');
      const tools = await this.getAllTools();
      console.log(`Found ${tools.length} tools\n`);

      if (tools.length === 0) {
        throw new Error('No tools found - server may not be responding correctly');
      }

      // Test each tool
      const testResults = {};
      
      for (const tool of tools) {
        console.log(`🔧 Testing ${tool.name}...`);
        
        const startTime = Date.now();
        const testResult = await this.testToolWithParams(tool);
        const duration = Date.now() - startTime;
        
        testResults[tool.name] = {
          ...testResult,
          duration: duration
        };
        
        if (testResult.success) {
          console.log(`✅ ${tool.name}: PASSED (${duration}ms)`);
        } else {
          console.log(`❌ ${tool.name}: FAILED - ${testResult.error} (${duration}ms)`);
        }
      }

      // Performance summary
      console.log('\n📊 Performance Summary:');
      Object.entries(testResults).forEach(([name, result]) => {
        if (result.success) {
          console.log(`${name}: ${result.duration}ms`);
        }
      });

      // Overall results
      const totalTests = Object.keys(testResults).length;
      const passedTests = Object.values(testResults).filter(r => r.success).length;
      const successRate = Math.round((passedTests / totalTests) * 100);

      console.log(`\n📈 Overall Results:`);
      console.log(`Total Tests: ${totalTests}`);
      console.log(`Passed: ${passedTests}`);
      console.log(`Failed: ${totalTests - passedTests}`);
      console.log(`Success Rate: ${successRate}%`);

      return testResults;

    } catch (error) {
      console.error(`💥 Test failed: ${error.message}`);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async testToolWithParams(tool) {
    // Generate appropriate test parameters for each tool
    const params = this.generateTestParams(tool.name, tool.inputSchema);
    
    return await this.testTool(tool.name, params);
  }

  generateTestParams(toolName, schema) {
    // Generate test parameters based on tool requirements
    switch (toolName) {
      case 'health_check':
      case 'list_projects':
      case 'projects_list':
      case 'get_metrics':
        return {}; // No parameters needed

      case 'validate_auth':
        return { api_token: 'test-token-123' };

      case 'get_project':
      case 'project_get':
        return { project_id: 'test-project' };

      case 'create_project':
        return { 
          name: 'Test Project', 
          description: 'Created during validation testing' 
        };

      case 'get_project_logs':
      case 'logs_list':
        return { project_id: 'test-project' };

      case 'get_log_content':
        return { log_id: 'test-log-123' };

      case 'create_log_entry':
        return {
          project_id: 'test-project',
          content: '[2025-08-13, 21:00:00] [INFO] Validation test log entry',
          comment: 'Created during MCP validation testing'
        };

      default:
        // Try to extract required parameters from schema
        if (schema && schema.properties) {
          const params = {};
          Object.entries(schema.properties).forEach(([key, prop]) => {
            if (schema.required && schema.required.includes(key)) {
              params[key] = this.generateMockValue(prop);
            }
          });
          return params;
        }
        return {};
    }
  }

  generateMockValue(property) {
    switch (property.type) {
      case 'string':
        return property.description?.includes('ID') ? 'test-id-123' : 'test-value';
      case 'number':
        return 123;
      case 'boolean':
        return true;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return 'test-value';
    }
  }

  async cleanup() {
    if (this.serverProcess) {
      console.log('\n🧹 Cleaning up...');
      
      try {
        this.serverProcess.kill('SIGTERM');
        
        await new Promise((resolve) => {
          this.serverProcess.on('exit', resolve);
          setTimeout(() => {
            this.serverProcess.kill('SIGKILL');
            resolve();
          }, 3000);
        });
        
      } catch (error) {
        console.warn(`Cleanup warning: ${error.message}`);
      }
    }
  }
}

// Performance benchmark runner
class MCPPerformanceTester extends MCPToolTester {
  async benchmarkTool(toolName, iterations = 10) {
    console.log(`⚡ Benchmarking ${toolName} (${iterations} iterations)...`);
    
    const times = [];
    const tool = { name: toolName };
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      const result = await this.testToolWithParams(tool);
      const duration = Date.now() - start;
      
      if (result.success) {
        times.push(duration);
      } else {
        console.warn(`Iteration ${i + 1} failed: ${result.error}`);
      }
    }
    
    if (times.length === 0) {
      return { success: false, error: 'All iterations failed' };
    }
    
    const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    return {
      success: true,
      average: avgTime,
      min: minTime,
      max: maxTime,
      iterations: times.length,
      successRate: Math.round((times.length / iterations) * 100)
    };
  }

  async runPerformanceSuite() {
    console.log('🚀 Starting MCP Performance Test Suite\n');
    
    const benchmarkThresholds = {
      health_check: 50,
      list_projects: 100,
      get_project: 150,
      create_project: 300,
      get_project_logs: 200
    };
    
    try {
      await this.startServer();
      
      const results = {};
      
      for (const [toolName, threshold] of Object.entries(benchmarkThresholds)) {
        const benchmark = await this.benchmarkTool(toolName, 5);
        results[toolName] = { ...benchmark, threshold };
        
        if (benchmark.success) {
          const passed = benchmark.average <= threshold;
          const status = passed ? '✅ PASSED' : '❌ FAILED';
          console.log(`${status} ${toolName}: ${benchmark.average}ms avg (threshold: ${threshold}ms)`);
        } else {
          console.log(`❌ ${toolName}: FAILED - ${benchmark.error}`);
        }
      }
      
      return results;
      
    } finally {
      await this.cleanup();
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
MCP Tool Tester - Direct MCP Communication Testing

Usage: node scripts/mcp-tool-tester.js [options]

Options:
  --comprehensive    Run comprehensive tool testing
  --performance      Run performance benchmarks
  --tool=<name>      Test specific tool
  --help             Show this help

Examples:
  node scripts/mcp-tool-tester.js --comprehensive
  node scripts/mcp-tool-tester.js --performance  
  node scripts/mcp-tool-tester.js --tool=health_check
    `);
    return;
  }
  
  try {
    if (args.includes('--performance')) {
      const tester = new MCPPerformanceTester();
      await tester.runPerformanceSuite();
      
    } else if (args.includes('--comprehensive')) {
      const tester = new MCPToolTester();
      await tester.runComprehensiveTest();
      
    } else if (args.some(arg => arg.startsWith('--tool='))) {
      const toolName = args.find(arg => arg.startsWith('--tool=')).split('=')[1];
      const tester = new MCPToolTester();
      
      await tester.startServer();
      const result = await tester.testTool(toolName);
      
      if (result.success) {
        console.log(`✅ ${toolName}: PASSED`);
        console.log('Result:', JSON.stringify(result.result, null, 2));
      } else {
        console.log(`❌ ${toolName}: FAILED - ${result.error}`);
      }
      
      await tester.cleanup();
      
    } else {
      // Default: comprehensive test
      const tester = new MCPToolTester();
      await tester.runComprehensiveTest();
    }
    
  } catch (error) {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { MCPToolTester, MCPPerformanceTester };