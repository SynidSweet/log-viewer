# MCP Server Monitoring and Health Checks

## Overview

The Log Viewer MCP Server now includes comprehensive monitoring and health check capabilities designed for production environments. This system provides real-time health monitoring, alerting, and performance tracking across all server subsystems.

## Enhanced Monitoring Features

### 🔍 Comprehensive Health Checks

**Tool**: `health_check`

Enhanced health checking that monitors multiple subsystems:
- **Database connectivity** with latency tracking
- **Memory utilization** with threshold alerting  
- **Error rate monitoring** with configurable thresholds
- **Response time tracking** for performance degradation detection
- **Subsystem health** with individual component status

```javascript
// Basic health check
{
  "tool": "health_check",
  "arguments": {}
}

// Detailed health check with subsystem monitoring
{
  "tool": "health_check", 
  "arguments": {
    "include_detailed_checks": true,
    "check_database_performance": true
  }
}
```

**Health Status Levels**:
- `healthy` - All systems operating normally
- `degraded` - Some performance issues detected, but functional
- `unhealthy` - Critical issues requiring immediate attention

### 📊 Advanced Performance Metrics

**Tool**: `get_metrics`

Enhanced metrics collection with trend analysis:
- **Request/response tracking** with error rate calculation
- **Performance trend analysis** comparing recent vs. historical performance
- **Memory usage patterns** with utilization percentages
- **Database performance metrics** with latency tracking
- **Alert integration** showing active health issues

```javascript
// Basic metrics
{
  "tool": "get_metrics",
  "arguments": {}
}

// Full metrics with trends and alerts
{
  "tool": "get_metrics",
  "arguments": {
    "include_trends": true,
    "include_alerts": true
  }
}
```

### 🚨 Real-Time Alert Management

**Tool**: `get_active_alerts`

Active monitoring of system health with real-time alerting:
- **Severity-based filtering** (all, degraded, failed)
- **Alert history** with resolved alerts tracking
- **Threshold management** with configurable limits
- **Component-specific alerts** for targeted troubleshooting

```javascript
// Get all active alerts
{
  "tool": "get_active_alerts",
  "arguments": {
    "severity_filter": "all",
    "include_resolved": true
  }
}

// Get only critical alerts
{
  "tool": "get_active_alerts",
  "arguments": {
    "severity_filter": "failed"
  }
}
```

**Tool**: `update_alert_thresholds`

Dynamic threshold management for proactive monitoring:
- **Error rate thresholds** (1-50% configurable)
- **Response time limits** (100-10000ms configurable) 
- **Consecutive error limits** (1-10 errors configurable)
- **Database timeout settings** (5-300 seconds configurable)

```javascript
// Update monitoring thresholds
{
  "tool": "update_alert_thresholds",
  "arguments": {
    "error_rate": 10,
    "response_time": 500,
    "consecutive_errors": 5
  }
}
```

## Monitoring Architecture

### Subsystem Health Tracking

The monitoring system tracks health across multiple subsystems:

1. **Database Health**
   - Connection latency monitoring
   - Query performance tracking
   - Connectivity failure detection
   - Automatic health status updates

2. **Memory Management**
   - Heap utilization tracking
   - Memory leak detection
   - Resource usage alerting
   - Performance impact assessment

3. **Request Processing** 
   - Response time monitoring
   - Error rate calculation
   - Consecutive failure tracking
   - Performance trend analysis

4. **System Resources**
   - CPU utilization (via response times)
   - Process health monitoring
   - Uptime tracking
   - Version and environment reporting

### Alert Threshold System

**Configurable Thresholds**:
- **Error Rate**: Default 5% (triggers degraded), 25% (triggers failed)
- **Response Time**: Default 1000ms (triggers degraded)
- **Consecutive Errors**: Default 3 errors (triggers failed)
- **Database Latency**: <100ms healthy, <500ms degraded, ≥500ms failed
- **Memory Usage**: <85% healthy, <95% degraded, ≥95% failed

**Alert Lifecycle**:
1. **Detection** - Threshold exceeded, alert created
2. **Notification** - Alert logged and available via API
3. **Persistence** - Alert remains active until resolved
4. **Resolution** - Conditions return to normal, alert marked resolved
5. **History** - Resolved alerts tracked for trend analysis

### Performance Trend Analysis

The system provides trend analysis comparing:
- **Recent performance** (last 20 requests) vs **historical performance** (previous 20 requests)
- **Trend direction** (improving, stable, degrading) with percentage change
- **Error rate trends** with consecutive error tracking
- **Response time patterns** with latency analysis

## Production Deployment

### Environment Variables

Enhanced monitoring is configured via environment variables:

```bash
# Core monitoring settings
ENABLE_METRICS=true                 # Enable metrics collection
LOG_LEVEL=info                     # Logging verbosity
LOG_REQUESTS=true                  # Log individual requests

# Health check configuration  
HEALTH_CHECK_INTERVAL=30000        # Periodic health check interval (ms)

# Performance tuning
CACHE_TTL=300                      # Cache timeout (seconds)
MAX_CONNECTIONS=100                # Connection limit

# Alert configuration (set via update_alert_thresholds tool)
```

### Health Check Integration

**Periodic Health Monitoring**:
- Automatic health checks every 30 seconds (configurable)
- Database connectivity testing with latency measurement
- Memory usage monitoring with threshold alerting
- Error rate tracking with trend analysis
- Automatic recovery detection and alert resolution

**Production Features**:
- Structured logging with timestamps and severity levels
- Graceful shutdown handling with cleanup
- Resource usage optimization for minimal overhead
- Integration with existing database layer (no additional dependencies)

## Integration with Web Dashboard

The enhanced MCP monitoring integrates seamlessly with the existing web monitoring dashboard:

### Data Flow
1. **MCP Server** collects real-time metrics and health data
2. **Web API** (`/api/monitoring/metrics`) aggregates MCP and web app data
3. **Dashboard** displays unified monitoring view with both systems

### Shared Metrics
- **Performance trends** from both MCP server and web application
- **Alert correlation** between backend and frontend issues
- **Health status** unified across all system components
- **Historical data** combined for comprehensive trend analysis

## Usage Examples

### Production Health Monitoring

```javascript
// Check overall system health
const health = await mcpClient.request('health_check', {
  include_detailed_checks: true,
  check_database_performance: true
});

if (health.status === 'unhealthy') {
  console.error('System unhealthy:', health.subsystems);
  // Trigger alerts or failover
}
```

### Performance Monitoring

```javascript
// Monitor performance trends
const metrics = await mcpClient.request('get_metrics', {
  include_trends: true,
  include_alerts: true
});

if (metrics.trends.response_time_trend.direction === 'degrading') {
  console.warn('Performance degrading:', metrics.trends);
  // Scale resources or investigate
}
```

### Alert Management

```javascript
// Check for critical alerts
const alerts = await mcpClient.request('get_active_alerts', {
  severity_filter: 'failed'
});

if (alerts.alerts.summary.critical > 0) {
  console.error('Critical alerts active:', alerts.alerts.active);
  // Immediate response required
}
```

## Best Practices

### Monitoring Configuration
- Enable metrics collection in production (`ENABLE_METRICS=true`)
- Set health check intervals based on criticality (30-60 seconds recommended)
- Configure alert thresholds based on historical performance data
- Monitor both individual components and overall system health

### Alert Management
- Review alert thresholds regularly based on system performance
- Implement alerting automation for critical issues
- Track resolved alerts to identify recurring issues
- Use trend analysis for proactive performance management

### Performance Optimization
- Monitor memory usage trends to prevent resource exhaustion
- Track database performance for query optimization opportunities
- Analyze error patterns for code quality improvements
- Use response time trends for capacity planning

## Migration from v1.1.0

The monitoring enhancements are backwards compatible:
- Existing `health_check` calls continue to work with enhanced data
- `get_metrics` provides additional fields while maintaining existing structure
- New monitoring tools (`get_active_alerts`, `update_alert_thresholds`) are additive
- No configuration changes required for basic functionality

## Troubleshooting

**Common Issues**:
- **Metrics not updating**: Verify `ENABLE_METRICS=true` in environment
- **Health checks failing**: Check database connectivity and permissions
- **High alert volume**: Adjust thresholds using `update_alert_thresholds`
- **Performance degradation**: Review `get_metrics` trends for bottlenecks

**Debug Steps**:
1. Check `health_check` with detailed checks enabled
2. Review `get_active_alerts` for specific issues
3. Analyze `get_metrics` trends for performance patterns
4. Examine server logs for detailed error information