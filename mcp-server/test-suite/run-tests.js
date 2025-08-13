#!/usr/bin/env node

/**
 * MCP Server Test Runner
 * Comprehensive test execution with reporting and validation
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  testSuites: {
    quick: ['00-basic-validation.test.ts'],
    tools: ['01-tool-validation.test.ts'],
    integration: ['02-integration.test.ts'],
    performance: ['03-performance.test.ts'],
    errors: ['04-error-handling.test.ts'],
    comprehensive: ['00-basic-validation.test.ts', '01-tool-validation.test.ts', '02-integration.test.ts', '03-performance.test.ts', '04-error-handling.test.ts']
  },
  jestConfig: path.join(__dirname, 'jest.config.js'),
  resultsDir: path.join(__dirname, 'results'),
  coverageDir: path.join(__dirname, 'coverage')
};

// Ensure directories exist
if (!fs.existsSync(CONFIG.resultsDir)) {
  fs.mkdirSync(CONFIG.resultsDir, { recursive: true });
}

console.log('🧪 MCP Server Test Suite Runner');
console.log('=====================================\n');

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0] || 'comprehensive';
const verbose = args.includes('--verbose') || args.includes('-v');
const coverage = args.includes('--coverage') || args.includes('-c');
const watch = args.includes('--watch') || args.includes('-w');

if (!CONFIG.testSuites[testType]) {
  console.error(`❌ Invalid test type: ${testType}`);
  console.log('\nAvailable test types:');
  Object.keys(CONFIG.testSuites).forEach(type => {
    console.log(`  - ${type}: ${CONFIG.testSuites[type].join(', ')}`);
  });
  process.exit(1);
}

console.log(`🎯 Test Type: ${testType}`);
console.log(`📁 Tests: ${CONFIG.testSuites[testType].join(', ')}`);
if (coverage) console.log('📊 Coverage: Enabled');
if (watch) console.log('👀 Watch: Enabled');
if (verbose) console.log('🗣️  Verbose: Enabled');
console.log();

// Build Jest command
const jestArgs = [
  '--config', CONFIG.jestConfig,
  '--passWithNoTests',
  '--detectOpenHandles',
  '--forceExit'
];

// Add test files
CONFIG.testSuites[testType].forEach(testFile => {
  jestArgs.push(`--testPathPattern=${testFile.replace('.ts', '')}`);
});

// Add coverage if requested
if (coverage) {
  jestArgs.push('--coverage');
  jestArgs.push('--coverageDirectory', CONFIG.coverageDir);
}

// Add verbose if requested
if (verbose) {
  jestArgs.push('--verbose');
}

// Add watch if requested
if (watch) {
  jestArgs.push('--watch');
}

// Environment setup
const testEnv = {
  ...process.env,
  NODE_ENV: 'test',
  LOG_LEVEL: verbose ? 'debug' : 'error',
  FORCE_COLOR: '1'
};

console.log('🚀 Starting test execution...\n');

// Execute tests
try {
  const startTime = Date.now();
  
  // Run TypeScript compilation first
  console.log('🔨 Compiling TypeScript...');
  try {
    execSync('npx tsc --noEmit', { 
      cwd: path.join(__dirname, '..'),
      stdio: verbose ? 'inherit' : 'pipe',
      env: testEnv
    });
    console.log('✅ TypeScript compilation successful\n');
  } catch (error) {
    console.error('❌ TypeScript compilation failed');
    if (verbose) {
      console.error(error.stdout?.toString());
      console.error(error.stderr?.toString());
    }
    process.exit(1);
  }
  
  // Run Jest tests
  const jestProcess = spawn('npx', ['jest', ...jestArgs], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: testEnv
  });
  
  jestProcess.on('close', (code) => {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n⏱️  Total execution time: ${duration}s\n`);
    
    if (code === 0) {
      console.log('🎉 All tests passed successfully!');
      
      // Generate summary report
      generateSummaryReport(testType, duration);
      
      if (coverage) {
        console.log(`📊 Coverage report generated in: ${CONFIG.coverageDir}`);
      }
      
      console.log('\n📋 Available commands for detailed validation:');
      console.log('   npm run test:mcp:tools     # Tool functionality tests');
      console.log('   npm run test:mcp:performance # Performance benchmarks'); 
      console.log('   npm run test:mcp:e2e       # End-to-end workflow tests');
      console.log('   npm run test:mcp:comprehensive # All tests with coverage');
      
    } else {
      console.error(`❌ Tests failed with exit code: ${code}`);
      
      if (fs.existsSync(path.join(CONFIG.resultsDir, 'junit.xml'))) {
        console.log(`📋 Detailed results available in: ${CONFIG.resultsDir}/junit.xml`);
      }
      
      console.log('\n🔧 Debugging tips:');
      console.log('   - Run with --verbose for detailed output');
      console.log('   - Check test setup in test-suite/setup.ts');
      console.log('   - Verify database connectivity');
      console.log('   - Review MCP server logs');
    }
    
    process.exit(code);
  });
  
  jestProcess.on('error', (error) => {
    console.error('❌ Failed to start Jest:', error);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
}

function generateSummaryReport(testType, duration) {
  const reportData = {
    testType,
    duration,
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };
  
  const reportPath = path.join(CONFIG.resultsDir, `summary-${testType}-${Date.now()}.json`);
  
  try {
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📋 Summary report saved: ${reportPath}`);
  } catch (error) {
    console.warn('⚠️  Failed to save summary report:', error.message);
  }
}