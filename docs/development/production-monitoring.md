# Production Performance Monitoring Guide

*Comprehensive monitoring infrastructure for production deployment | TASK-2025-131*

## Overview

The production performance monitoring dashboard provides comprehensive real-time and historical performance tracking, automated alerting, performance budget enforcement, and trend analysis capabilities. This system builds upon the existing monitoring infrastructure to deliver production-ready monitoring capabilities.

## 🎯 Key Features

### 1. **Unified Monitoring Dashboard** (`/monitoring`)
- **Real-time metrics** with 5-second refresh intervals
- **Performance budgets** with visual indicators
- **Alert management** with severity-based categorization
- **Historical trends** for regression detection
- **Authentication required** via Google OAuth

### 2. **Performance Alerting System**
- **Configurable thresholds** for each component and metric
- **Severity levels**: Warning (yellow) and Critical (red)
- **Smart cooldowns** to prevent alert fatigue
- **Email/webhook integration ready** (extensible)

### 3. **Performance Budget Enforcement**
- **Automated budget tracking** against defined thresholds
- **Multiple enforcement levels**: warning, error, block
- **Visual budget indicators** showing usage percentage
- **CI/CD integration** for build-time enforcement

### 4. **Historical Performance Tracking**
- **90-day data retention** for long-term analysis
- **Trend detection** using linear regression
- **Performance regression alerts**
- **Data export capabilities** for external analysis

## 📊 Dashboard Components

### Summary Statistics
- **Average Duration**: Overall component render times
- **Pass Rate**: Percentage of renders meeting performance targets
- **Active Alerts**: Current performance issues requiring attention
- **Critical Issues**: Severe performance degradations

### Performance Budgets Panel
Shows real-time budget status for:
- **LogViewer Render Time**: Target <33ms (30fps)
- **LogEntryList Render Time**: Target <16ms (60fps)
- **JavaScript Bundle Size**: Target <250KB gzipped
- **Memory Growth Factor**: Target <2.0x at 5K entries
- **First Contentful Paint**: Target <1000ms

### Real-time Metrics
- **Component-level timing** for mount and update phases
- **Pass/Warning/Fail status** indicators
- **10 most recent measurements** with timestamps

### Alert History
- **Severity-based coloring** (yellow/red)
- **Component and metric details**
- **Threshold violations** with actual vs expected values
- **Timestamp tracking** for incident correlation

### Historical Trends
- **7/30/90-day trend visualization**
- **Performance improvement/degradation indicators**
- **Average duration tracking** over time
- **Visual progress bars** for quick assessment

## 🚀 Quick Start

### 1. Access the Dashboard

```bash
# Navigate to the monitoring dashboard
open http://localhost:3000/monitoring

# Sign in with Google OAuth if not authenticated
```

### 2. Start Monitoring

1. Click "Start Monitoring" to begin real-time data collection
2. Monitor the live metrics and alerts
3. Review performance budgets for violations
4. Analyze historical trends for patterns

### 3. Configure Alerts

```bash
# Access alert configuration via API
curl -X GET http://localhost:3000/api/monitoring/alerts \
  -H "Cookie: your-session-cookie"

# Update alert thresholds
curl -X POST http://localhost:3000/api/monitoring/alerts \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "action": "update",
    "configId": "logviewer-mount-warning",
    "updates": { "threshold": 35 }
  }'
```

### 4. Manage Performance Budgets

```bash
# Get current budget status
curl -X GET http://localhost:3000/api/monitoring/budgets \
  -H "Cookie: your-session-cookie"

# Create custom budget
curl -X POST http://localhost:3000/api/monitoring/budgets \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "action": "create",
    "budget": {
      "name": "API Response Time",
      "category": "timing",
      "metric": "api.response",
      "value": 200,
      "unit": "ms",
      "enforcement": "warning"
    }
  }'
```

## 📡 API Endpoints

### `/api/monitoring/metrics`
- **GET**: Retrieve real-time performance metrics
- **Response**: Current metrics, trends, alerts, budgets, historical data

### `/api/monitoring/alerts`
- **GET**: Get alert configurations
- **POST**: Update alert settings (update, reset, toggle)

### `/api/monitoring/budgets`
- **GET**: Get performance budgets and validation status
- **POST**: Manage budgets (create, update, delete, reset)

### `/api/monitoring/history`
- **GET**: Query historical performance data
  - Parameters: `component`, `metric`, `period`, `groupBy`
- **POST**: Store new performance data points

## 🔧 Configuration

### Default Alert Thresholds

| Component | Metric | Warning | Critical | Cooldown |
|-----------|--------|---------|----------|----------|
| LogViewer | mount | 33ms | 50ms | 5 min |
| LogViewer | update | 33ms | 50ms | 5 min |
| LogEntryList | mount | 16ms | 25ms | 5 min |
| Memory | growth | 2.0x | 3.0x | 30 min |
| Bundle | size | 250KB | 300KB | 24 hrs |

### Performance Budget Categories

1. **Timing Budgets**: Component render times, API response times
2. **Size Budgets**: Bundle sizes, asset sizes, payload sizes
3. **Memory Budgets**: Growth factors, heap usage, leak detection
4. **Custom Budgets**: User-defined metrics and thresholds

## 🔄 Integration Points

### CI/CD Pipeline Integration

```yaml
# Example GitHub Actions integration
- name: Check Performance Budgets
  run: |
    npm run performance:validate
    curl -X GET http://your-app/api/monitoring/budgets \
      | jq '.validations[] | select(.status != "pass")'
```

### Monitoring Service Integration

```javascript
// Example monitoring service integration
const monitoringService = {
  async checkPerformance() {
    const response = await fetch('/api/monitoring/metrics')
    const data = await response.json()
    
    if (data.summary.failing > 0) {
      // Send alert to external monitoring service
      await notifyOpsGenie({
        message: 'Performance budget violations detected',
        priority: 'P2',
        details: data.validations
      })
    }
  }
}
```

### Vercel Analytics Integration

```javascript
// Track performance metrics in Vercel Analytics
import { track } from '@vercel/analytics'

// In your monitoring dashboard
if (metrics.status === 'fail') {
  track('performance-violation', {
    component: metrics.component,
    metric: metrics.metric,
    value: metrics.duration,
    threshold: metrics.threshold
  })
}
```

## 📈 Best Practices

### 1. **Set Realistic Budgets**
- Start with current baseline performance
- Gradually tighten budgets as optimizations are made
- Consider user hardware and network conditions

### 2. **Monitor Continuously**
- Run monitoring in production environments
- Set up automated alerts for critical violations
- Review trends weekly for gradual degradations

### 3. **Act on Alerts**
- Investigate performance regressions immediately
- Document root causes and fixes
- Update budgets if legitimate increases are needed

### 4. **Use Historical Data**
- Identify performance patterns (time of day, load)
- Correlate performance with deployments
- Plan optimizations based on trend data

## 🛠️ Troubleshooting

### No Metrics Appearing
1. Ensure monitoring is started (click "Start Monitoring")
2. Check browser console for errors
3. Verify authentication status
4. Confirm real-time monitor script is running

### Alert Fatigue
1. Adjust cooldown periods for frequently firing alerts
2. Review and update thresholds based on actual performance
3. Disable non-critical alerts during known high-load periods

### Historical Data Missing
1. Check `.claude-testing/performance-history.json` exists
2. Verify write permissions on the directory
3. Ensure data retention period hasn't expired (90 days)

## 🚀 Future Enhancements

### Planned Features
- **Real User Monitoring (RUM)** integration
- **Synthetic monitoring** for critical user paths
- **Machine learning** for anomaly detection
- **Mobile performance** tracking
- **Third-party integrations** (DataDog, New Relic)
- **Custom dashboards** with drag-and-drop widgets
- **Performance reports** with executive summaries

### Extensibility Points
- Custom metric collectors
- Webhook notifications
- Data export APIs
- Plugin architecture for third-party tools

## 📚 Related Documentation

- [Real-Time Performance Monitoring](./real-time-performance-monitoring.md)
- [Performance Testing Guide](./performance.md)
- [React DevTools Profiler](./react-devtools-profiler.md)
- [Memory Monitoring](./memory-monitoring.md)

---

*This production monitoring infrastructure provides comprehensive performance visibility and control, ensuring optimal user experience in production environments.*