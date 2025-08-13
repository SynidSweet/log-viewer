# MCP Server Comprehensive Test Suite

A comprehensive testing framework for the Log Viewer MCP Server, providing automated validation of all 15+ MCP tools including performance benchmarks, integration tests, and error handling validation.

## 📊 Test Coverage

### Core Tools Tested (15)
- **Health & Monitoring**: `health_check`, `get_metrics`, `get_active_alerts`, `update_alert_thresholds`
- **Authentication**: `validate_auth`
- **Project Management**: `list_projects`, `get_project`, `create_project`
- **Log Management**: `get_project_logs`, `get_log_content`, `create_log_entry`
- **Log Search**: `entries_query`, `entries_latest`

### Alias Tools Tested (3)
- **Project Aliases**: `projects_list`, `project_get`
- **Log Aliases**: `logs_list`

## 🧪 Test Categories

### 1. Tool Validation Tests (`01-tool-validation.test.ts`)
- Parameter validation and schema compliance
- Basic functionality verification
- Response structure validation
- Required parameter testing
- Response time validation for all tools

### 2. Integration Tests (`02-integration.test.ts`)
- Database connectivity and performance
- End-to-end workflow validation
- Complete project management lifecycle
- Complete log management lifecycle
- Monitoring and alerting workflows
- Data consistency validation
- Error recovery testing
- Concurrent operation safety

### 3. Performance Tests (`03-performance.test.ts`)
- Response time benchmarks with configurable thresholds
- Throughput testing under various loads
- Memory usage and resource monitoring
- Performance consistency across multiple runs
- Alias tools performance parity validation
- Sustained load testing
- Performance regression prevention

### 4. Error Handling Tests (`04-error-handling.test.ts`)
- Parameter validation edge cases
- Resource not found scenarios
- Malformed input handling
- Unicode and special character support
- Rate limiting and resource protection
- Server stability after errors
- Graceful degradation under stress

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
npm install

# Ensure TypeScript compilation works
npm run build
```

### Running Tests

#### Quick Validation (Essential Tools Only)
```bash
npm run test:quick
```

#### Comprehensive Test Suite
```bash
npm run test:mcp:comprehensive
```

#### Specific Test Categories
```bash
npm run test:mcp:tools          # Tool functionality tests
npm run test:mcp:integration    # End-to-end workflow tests  
npm run test:mcp:performance    # Performance benchmarks
npm run test:mcp:errors         # Error handling validation
```

#### Development & Debugging
```bash
npm run test:watch              # Watch mode for development
npm run test:mcp:tools --verbose # Detailed output
```

## 📋 Test Runner Commands

The test suite includes a comprehensive runner script with multiple execution modes:

```bash
./test-suite/run-tests.js <type> [options]

# Test Types:
#   quick          - Essential tool validation only
#   tools          - All tool functionality tests
#   integration    - End-to-end workflow tests
#   performance    - Performance benchmarks
#   errors         - Error handling tests
#   comprehensive  - All tests (default)

# Options:
#   --verbose, -v  - Detailed output
#   --coverage, -c - Generate coverage reports
#   --watch, -w    - Watch mode for development
```

## 🎯 Performance Thresholds

The test suite enforces performance requirements:

- **Health Checks**: < 500ms response time
- **General Operations**: < 1000ms response time  
- **Database Queries**: < 200ms latency
- **Success Rates**: > 95% under normal load
- **Memory Usage**: < 200MB total heap
- **Throughput**: > 5 requests/second sustained

## 📊 Test Configuration

### Environment Variables (`.env.test`)
```bash
NODE_ENV=test
LOG_LEVEL=error
ENABLE_METRICS=true
TURSO_DATABASE_URL=file:test-mcp.db
TURSO_AUTH_TOKEN=test-token
```

### Performance Configuration (`setup.ts`)
```typescript
RESPONSE_TIME_THRESHOLD: 1000,    // 1 second
HEALTH_CHECK_THRESHOLD: 500,      // 500ms  
DATABASE_QUERY_THRESHOLD: 200,    // 200ms
```

## 📈 Test Results & Reporting

### Coverage Reports
Coverage reports are generated in `test-suite/coverage/` when running with `--coverage`:
- **HTML Report**: `coverage/lcov-report/index.html`
- **LCOV Data**: `coverage/lcov.info`
- **Text Summary**: Console output

### Test Results
JUnit XML reports are generated in `test-suite/results/` for CI/CD integration:
- **JUnit XML**: `results/junit.xml`
- **Summary Reports**: `results/summary-*.json`

### Performance Benchmarks
Performance data is logged during execution:
```
📊 Performance Benchmark Results (5/5 passed)

✅ health_check
   Avg: 45ms (threshold: 500ms)
   Range: 32ms - 78ms
   Failures: 0% (15 calls)

✅ get_metrics  
   Avg: 123ms (threshold: 1000ms)
   Range: 98ms - 167ms
   Failures: 0% (10 calls)
```

## 🔧 Customization

### Adding New Tests
1. Create test file in `tests/` directory
2. Follow naming convention: `XX-category.test.ts`
3. Import test helpers from `utils/test-helpers.ts`
4. Update `testSuites` configuration in `run-tests.js`

### Modifying Performance Thresholds
Update thresholds in `setup.ts`:
```typescript
export const TEST_CONFIG = {
  RESPONSE_TIME_THRESHOLD: 1000,  // Adjust as needed
  HEALTH_CHECK_THRESHOLD: 500,
  DATABASE_QUERY_THRESHOLD: 200,
  // ... other configuration
};
```

### Custom Test Data
Modify test data in `setup.ts`:
```typescript
TEST_PROJECT: {
  id: 'custom-test-project',
  name: 'Custom Test Project',
  description: 'Custom test description',
},
TEST_LOG_CONTENT: `custom log content...`
```

## 🛠️ Test Utilities

### Test Helpers (`utils/test-helpers.ts`)
- **`executeTool()`**: Execute MCP tool with performance measurement
- **`benchmarkTool()`**: Run performance benchmarks with configurable iterations
- **`setupTestData()`**: Create test database with sample data
- **`validateToolResponse()`**: Validate response structure and fields
- **`formatPerformanceResults()`**: Format benchmark results for display

### Data Generation
- **`generateTestData.projectName()`**: Random project names
- **`generateTestData.logContent()`**: Formatted log entries
- **`generateTestData.apiKey()`**: Test API keys

## 🐛 Troubleshooting

### Common Issues

#### TypeScript Compilation Errors
```bash
npx tsc --noEmit  # Check for TypeScript errors
```

#### Database Connection Issues  
```bash
# Check database configuration
cat test-suite/.env.test

# Verify database accessibility
npm run health
```

#### Performance Test Failures
- Reduce performance thresholds in `setup.ts`
- Run on more powerful hardware
- Check system resource usage during tests

#### Memory Issues
```bash
# Run with increased memory
node --max-old-space-size=4096 ./test-suite/run-tests.js
```

### Debug Mode
```bash
# Run with debug logging
LOG_LEVEL=debug npm run test:mcp:tools --verbose
```

## 📚 Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run MCP Server Tests
  run: |
    cd mcp-server
    npm install
    npm run test:mcp:comprehensive
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./mcp-server/test-suite/coverage/lcov.info
```

### NPM Scripts Integration
The test suite is designed to integrate with NPM scripts and CI/CD pipelines:
- Exit codes properly indicate test success/failure
- JUnit XML output for test result integration
- Coverage reports in standard formats
- Performance benchmarks with pass/fail criteria

## 🎯 Test Quality Metrics

- **Code Coverage**: Target 80% line coverage
- **Test Execution Time**: Full suite completes in < 5 minutes
- **Test Reliability**: > 99% consistency across runs
- **Performance Validation**: All tools meet defined thresholds
- **Error Coverage**: Comprehensive error scenario testing

This comprehensive test suite ensures the MCP server meets production requirements for functionality, performance, and reliability.