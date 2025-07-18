# GitHub Actions Performance CI/CD Integration

This directory contains GitHub Actions workflows for automated performance testing and monitoring in the log viewer application.

## 🚀 Workflows Overview

### 1. Performance Benchmarking (`performance.yml`)

**Trigger**: Push to main/develop, Pull requests affecting performance-critical files
**Purpose**: Run performance benchmarks on every change to catch regressions early

**Key Features**:
- ✅ Automated performance testing on code changes
- 📊 Comprehensive benchmark results in PR comments
- 🔍 Analysis of filtering operations, memory usage, and React.memo optimizations
- 📈 Performance threshold enforcement with configurable gates
- 💾 Artifact storage for detailed analysis

**Performance Thresholds**:
- Search operations: < 100ms
- Level filtering: < 50ms
- Sort operations: < 100ms
- Combined operations: < 150ms
- Memory growth: < 2.0x baseline

### 2. Performance Monitoring (`performance-monitoring.yml`)

**Trigger**: Daily schedule (02:00 UTC), Manual dispatch
**Purpose**: Monitor performance trends and detect gradual degradation

**Key Features**:
- 📅 Daily performance trend analysis
- 🔔 Automated issue creation for performance regressions
- 📊 Historical performance tracking
- 💡 Optimization recommendations
- 🎯 Proactive performance monitoring

## 📋 Configuration

Performance settings are centralized in `.claude-testing/performance-config.json`:

```json
{
  "thresholds": {
    "operations": {
      "search": { "max_time_ms": 100 },
      "levelFilter": { "max_time_ms": 50 },
      "sort": { "max_time_ms": 100 },
      "combined": { "max_time_ms": 150 }
    },
    "memory": {
      "max_growth_factor": 2.0,
      "max_peak_mb": 100
    }
  }
}
```

## 🎯 Performance Testing Strategy

### Component Coverage
- **LogViewer**: Main log viewing interface
- **LogEntryList**: Optimized list rendering with React.memo
- **LogItem**: Individual entry component with memoization
- **JsonTree**: JSON data visualization component

### Optimization Validation
- React.memo effectiveness
- Timestamp formatting memoization
- Event handler callback stability
- Memory leak prevention
- Re-render minimization

## 📊 CI/CD Integration Points

### Pull Request Workflow
1. **Trigger**: Changes to performance-critical files
2. **Analysis**: Run benchmarks and compare against thresholds
3. **Reporting**: Post detailed results in PR comments
4. **Gating**: Optional performance gate (currently soft failure)
5. **Artifacts**: Store results for trend analysis

### Performance Gate Options

**Soft Failure (Current)**:
- Performance issues create warnings but don't block PRs
- Results posted as comments for visibility
- Developers can address issues in follow-up

**Hard Failure (Optional)**:
- Performance regressions block PR merging
- Forces immediate attention to performance issues
- Enable by setting `enable_performance_gate: true` in config

## 🔧 Local Development

### Running Performance Tests Locally

```bash
# Run performance test suite
npm run test:performance

# Run standalone benchmarks
npm run benchmark:performance

# Manual performance validation
node manual-performance-validation.js
```

### Performance Debugging

1. **Component Analysis**: Check React DevTools Profiler
2. **Memory Profiling**: Monitor memory usage during testing
3. **Benchmark Results**: Review `.claude-testing/performance-results.json`
4. **Configuration**: Adjust thresholds in `performance-config.json`

## 📈 Performance History

### Baseline Tracking
- Performance snapshots stored on main branch commits
- Historical comparison for trend analysis
- Regression detection across time periods

### Trend Analysis
- Daily monitoring of performance metrics
- Identification of gradual performance degradation
- Automated recommendations for optimization

## 🚨 Alert System

### Automated Issue Creation
- **Trigger**: Performance thresholds exceeded
- **Labels**: `performance`, `regression`, `bug`, `automated`
- **Content**: Detailed analysis and recommendations
- **Updates**: Existing issues updated with new data

### Notification Strategy
- GitHub issues for persistent tracking
- PR comments for immediate feedback
- Artifact storage for detailed investigation

## 🎛️ Customization

### Adjusting Thresholds
1. Edit `.claude-testing/performance-config.json`
2. Update threshold values based on requirements
3. Test changes locally before committing

### Adding New Metrics
1. Extend `performance-benchmark.js` with new measurements
2. Update threshold configuration
3. Modify CI/CD analysis scripts

### Custom Workflows
- Fork existing workflows for custom requirements
- Add organization-specific notification channels
- Integrate with external monitoring tools

## 🔍 Troubleshooting

### Common Issues

**Performance Tests Failing**:
- Check component implementations for React.memo usage
- Verify memoization patterns are correctly applied
- Review recent changes for performance impact

**CI/CD Workflow Errors**:
- Validate performance-config.json syntax
- Check Node.js version compatibility
- Verify test file existence and permissions

**Inconsistent Results**:
- Ensure single worker configuration for consistent measurements
- Check for external factors affecting CI runner performance
- Review warmup iterations and measurement methodology

### Debug Commands

```bash
# Validate configuration
node -c .claude-testing/performance-config.json

# Test benchmark script
node .claude-testing/performance-benchmark.js

# Check Jest performance config
npx jest --config=.claude-testing/jest.config.performance.js --listTests
```

## 📚 Related Documentation

- [Performance Testing Guide](../.claude-testing/PERFORMANCE_BENCHMARKING.md)
- [Component Optimization Patterns](../docs/development/conventions.md)
- [React.memo Best Practices](../docs/development/performance.md)

## 🤝 Contributing

When adding performance-critical features:

1. **Write Performance Tests**: Include benchmarks for new components
2. **Set Reasonable Thresholds**: Based on component complexity
3. **Document Optimizations**: Explain memoization strategies
4. **Monitor Impact**: Check CI/CD results after changes
5. **Update Baselines**: Adjust thresholds if justified by feature complexity

---

*Automated performance testing ensures the log viewer remains fast and responsive as it evolves.*