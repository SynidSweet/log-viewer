#!/usr/bin/env node

// MCP Server Production Monitoring Dashboard
// Simple monitoring script for production MCP server health and metrics

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  refreshInterval: 5000, // 5 seconds
  historySize: 20,
  alertThresholds: {
    errorRate: 5, // 5%
    responseTime: 1000, // 1 second
    memoryUsage: 80 // 80%
  }
};

// State
let history = [];
let alerts = [];
let isRunning = true;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function clearScreen() {
  console.clear();
}

function formatBytes(bytes) {
  return Math.round(bytes / 1024 / 1024) + ' MB';
}

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function createProgressBar(value, max, width = 20, filled = '█', empty = '░') {
  const filledWidth = Math.round((value / max) * width);
  const emptyWidth = width - filledWidth;
  return filled.repeat(filledWidth) + empty.repeat(emptyWidth);
}

function getHealthStatus() {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, LOG_LEVEL: 'error' } // Reduce log noise
    });

    let output = '';
    let timeout = setTimeout(() => {
      child.kill();
      reject(new Error('Health check timeout'));
    }, 3000);

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'health_check',
        arguments: {}
      }
    }) + '\n');

    child.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'get_metrics',
        arguments: {}
      }
    }) + '\n');

    setTimeout(() => {
      child.kill();
      clearTimeout(timeout);
      
      try {
        const lines = output.trim().split('\n');
        const responses = lines
          .filter(line => line.startsWith('{'))
          .map(line => JSON.parse(line))
          .filter(response => response.result);

        const healthResponse = responses.find(r => r.id === 1);
        const metricsResponse = responses.find(r => r.id === 2);

        if (!healthResponse) {
          reject(new Error('No health check response'));
          return;
        }

        const healthData = JSON.parse(healthResponse.result);
        const metricsData = metricsResponse ? JSON.parse(metricsResponse.result) : null;

        resolve({ health: healthData, metrics: metricsData });
      } catch (error) {
        reject(new Error(`Failed to parse response: ${error.message}`));
      }
    }, 2000);
  });
}

function checkAlerts(data) {
  const newAlerts = [];
  
  if (data.metrics && data.metrics.success) {
    const metrics = data.metrics;
    
    // Error rate alert
    const errorRate = parseFloat(metrics.performance.error_rate.replace('%', ''));
    if (errorRate > CONFIG.alertThresholds.errorRate) {
      newAlerts.push({
        type: 'ERROR_RATE',
        message: `High error rate: ${metrics.performance.error_rate}`,
        severity: 'high',
        timestamp: new Date()
      });
    }
    
    // Response time alert
    if (metrics.performance.average_response_time_ms > CONFIG.alertThresholds.responseTime) {
      newAlerts.push({
        type: 'RESPONSE_TIME',
        message: `Slow response time: ${metrics.performance.average_response_time_ms}ms`,
        severity: 'medium',
        timestamp: new Date()
      });
    }
    
    // Memory usage alert (approximation based on heap usage)
    const heapUsedMB = metrics.memory.heap_used_mb;
    const heapTotalMB = metrics.memory.heap_total_mb;
    const memoryUsagePercent = (heapUsedMB / heapTotalMB) * 100;
    
    if (memoryUsagePercent > CONFIG.alertThresholds.memoryUsage) {
      newAlerts.push({
        type: 'MEMORY_USAGE',
        message: `High memory usage: ${memoryUsagePercent.toFixed(1)}%`,
        severity: 'medium',
        timestamp: new Date()
      });
    }
  }
  
  // Add new alerts to the alerts array
  alerts = [...newAlerts, ...alerts].slice(0, 10); // Keep last 10 alerts
  
  return newAlerts;
}

function renderDashboard(data, error = null) {
  clearScreen();
  
  console.log(colorize('╭──────────────────────────────────────────────────────────────────────────────╮', 'cyan'));
  console.log(colorize('│', 'cyan') + colorize('                    MCP SERVER MONITORING DASHBOARD                    ', 'bright') + colorize('│', 'cyan'));
  console.log(colorize('├──────────────────────────────────────────────────────────────────────────────┤', 'cyan'));
  
  if (error) {
    console.log(colorize('│', 'cyan') + ' ' + colorize('❌ SERVER ERROR: ' + error.message, 'red').padEnd(76) + ' ' + colorize('│', 'cyan'));
    console.log(colorize('╰──────────────────────────────────────────────────────────────────────────────╯', 'cyan'));
    return;
  }
  
  if (!data) {
    console.log(colorize('│', 'cyan') + ' ' + colorize('Loading...', 'yellow').padEnd(76) + ' ' + colorize('│', 'cyan'));
    console.log(colorize('╰──────────────────────────────────────────────────────────────────────────────╯', 'cyan'));
    return;
  }
  
  const { health, metrics } = data;
  const isHealthy = health.status === 'healthy';
  const statusColor = isHealthy ? 'green' : 'red';
  const statusIcon = isHealthy ? '✅' : '❌';
  
  // Server Status
  console.log(colorize('│', 'cyan') + ' ' + colorize('STATUS:', 'bright') + ' ' + colorize(statusIcon + ' ' + health.status.toUpperCase(), statusColor).padEnd(65) + ' ' + colorize('│', 'cyan'));
  
  if (health.database === 'connected') {
    console.log(colorize('│', 'cyan') + ' ' + colorize('DATABASE:', 'bright') + ' ' + colorize('✅ Connected (' + health.projects_count + ' projects)', 'green').padEnd(63) + ' ' + colorize('│', 'cyan'));
  } else {
    console.log(colorize('│', 'cyan') + ' ' + colorize('DATABASE:', 'bright') + ' ' + colorize('❌ Disconnected', 'red').padEnd(63) + ' ' + colorize('│', 'cyan'));
  }
  
  // Metrics section
  if (metrics && metrics.success) {
    const m = metrics;
    
    console.log(colorize('│', 'cyan') + ' ' + colorize('UPTIME:', 'bright') + ' ' + colorize(formatUptime(m.server.uptime_ms), 'white').padEnd(66) + ' ' + colorize('│', 'cyan'));
    console.log(colorize('│', 'cyan') + ' ' + colorize('VERSION:', 'bright') + ' ' + colorize(m.server.version + ' (' + m.server.environment + ')', 'white').padEnd(65) + ' ' + colorize('│', 'cyan'));
    
    console.log(colorize('├──────────────────────────────────────────────────────────────────────────────┤', 'cyan'));
    
    // Performance metrics
    console.log(colorize('│', 'cyan') + ' ' + colorize('PERFORMANCE:', 'bright').padEnd(76) + ' ' + colorize('│', 'cyan'));
    console.log(colorize('│', 'cyan') + ' ' + colorize('  Requests: ', 'white') + colorize(m.performance.request_count.toString(), 'cyan') + 
                colorize(' | Errors: ', 'white') + colorize(m.performance.error_count + ' (' + m.performance.error_rate + ')', m.performance.error_count > 0 ? 'red' : 'green').padEnd(30) + ' ' + colorize('│', 'cyan'));
    console.log(colorize('│', 'cyan') + ' ' + colorize('  Avg Response: ', 'white') + colorize(m.performance.average_response_time_ms + 'ms', 'cyan') + 
                colorize(' | Req/min: ', 'white') + colorize(m.performance.requests_per_minute.toString(), 'cyan').padEnd(33) + ' ' + colorize('│', 'cyan'));
    
    // Memory usage
    console.log(colorize('│', 'cyan') + ' ' + colorize('MEMORY:', 'bright').padEnd(76) + ' ' + colorize('│', 'cyan'));
    const memUsagePercent = Math.round((m.memory.heap_used_mb / m.memory.heap_total_mb) * 100);
    const memBar = createProgressBar(m.memory.heap_used_mb, m.memory.heap_total_mb, 20);
    console.log(colorize('│', 'cyan') + ' ' + colorize('  Heap: ', 'white') + colorize(memBar, memUsagePercent > 80 ? 'red' : 'green') + 
                colorize(' ' + m.memory.heap_used_mb + '/' + m.memory.heap_total_mb + ' MB (' + memUsagePercent + '%)', 'cyan').padEnd(20) + ' ' + colorize('│', 'cyan'));
    console.log(colorize('│', 'cyan') + ' ' + colorize('  RSS: ', 'white') + colorize(m.memory.rss_mb + ' MB', 'cyan') + 
                colorize(' | External: ', 'white') + colorize(m.memory.external_mb + ' MB', 'cyan').padEnd(38) + ' ' + colorize('│', 'cyan'));
  }
  
  // Alerts section
  if (alerts.length > 0) {
    console.log(colorize('├──────────────────────────────────────────────────────────────────────────────┤', 'cyan'));
    console.log(colorize('│', 'cyan') + ' ' + colorize('⚠️  RECENT ALERTS:', 'yellow').padEnd(76) + ' ' + colorize('│', 'cyan'));
    
    alerts.slice(0, 3).forEach(alert => {
      const timeStr = alert.timestamp.toLocaleTimeString();
      const severity = alert.severity === 'high' ? 'red' : 'yellow';
      console.log(colorize('│', 'cyan') + ' ' + colorize('  [' + timeStr + '] ', 'white') + colorize(alert.message, severity).padEnd(55) + ' ' + colorize('│', 'cyan'));
    });
  }
  
  console.log(colorize('├──────────────────────────────────────────────────────────────────────────────┤', 'cyan'));
  console.log(colorize('│', 'cyan') + ' ' + colorize('Last updated: ' + new Date().toLocaleString(), 'white') + colorize(' | Press Ctrl+C to exit', 'yellow').padEnd(35) + ' ' + colorize('│', 'cyan'));
  console.log(colorize('╰──────────────────────────────────────────────────────────────────────────────╯', 'cyan'));
}

async function monitorLoop() {
  while (isRunning) {
    try {
      const data = await getHealthStatus();
      
      // Check for alerts
      const newAlerts = checkAlerts(data);
      
      // Add to history
      history.unshift({ ...data, timestamp: new Date() });
      if (history.length > CONFIG.historySize) {
        history = history.slice(0, CONFIG.historySize);
      }
      
      renderDashboard(data);
      
    } catch (error) {
      renderDashboard(null, error);
    }
    
    // Wait for next iteration
    await new Promise(resolve => setTimeout(resolve, CONFIG.refreshInterval));
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  isRunning = false;
  console.log('\n\nMonitoring stopped.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  isRunning = false;
  console.log('\n\nMonitoring stopped.');
  process.exit(0);
});

// Command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('MCP Server Monitoring Dashboard');
  console.log('');
  console.log('Usage: node monitor.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --interval N   Set refresh interval in seconds (default: 5)');
  console.log('');
  console.log('Requirements:');
  console.log('  - MCP server built (run: npm run build)');
  console.log('  - Server configured with health_check and get_metrics tools');
  console.log('');
  process.exit(0);
}

// Parse interval argument
const intervalIndex = args.findIndex(arg => arg === '--interval');
if (intervalIndex !== -1 && args[intervalIndex + 1]) {
  const interval = parseInt(args[intervalIndex + 1]);
  if (!isNaN(interval) && interval > 0) {
    CONFIG.refreshInterval = interval * 1000;
  }
}

// Check if server is built
if (!fs.existsSync(path.join(__dirname, 'dist', 'index.js'))) {
  console.error(colorize('❌ MCP server not built. Run: npm run build', 'red'));
  process.exit(1);
}

console.log(colorize('Starting MCP Server monitoring dashboard...', 'cyan'));
console.log(colorize('Refresh interval: ' + (CONFIG.refreshInterval / 1000) + ' seconds', 'white'));
console.log('');

// Start monitoring
monitorLoop().catch(error => {
  console.error(colorize('\n\nMonitoring failed: ' + error.message, 'red'));
  process.exit(1);
});
