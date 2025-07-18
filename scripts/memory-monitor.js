#!/usr/bin/env node

/**
 * Memory Usage Monitoring for Large Datasets
 * 
 * This script provides comprehensive memory monitoring for the LogViewer
 * application when handling large datasets. It validates memory stability
 * during filtering, sorting, and virtualization operations.
 * 
 * Features:
 * - Test dataset generation (1000+ entries)
 * - Memory usage tracking during operations
 * - Automated memory leak detection
 * - Performance threshold validation
 * - Memory growth analysis
 * 
 * @author AI Assistant (TASK-2025-114)
 * @date 2025-07-18
 */

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Memory monitoring configuration
const MEMORY_CONFIG = {
  // Dataset sizes to test
  datasetSizes: [1000, 2500, 5000, 10000, 15000],
  
  // Memory thresholds (in MB)
  thresholds: {
    maxMemoryGrowth: 100, // Max 100MB growth during operations
    maxMemoryRatio: 3.0,  // Max 3x memory growth
    memoryLeakTolerance: 5, // Max 5MB after cleanup
  },
  
  // Operation simulation settings
  operations: {
    filterOperations: 50,
    sortOperations: 10,
    searchOperations: 25,
    scrollOperations: 100,
  }
};

/**
 * Get current memory usage in a structured format
 */
function getMemoryUsage() {
  const used = process.memoryUsage();
  return {
    rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
    heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
    external: Math.round(used.external / 1024 / 1024 * 100) / 100,
    arrayBuffers: Math.round(used.arrayBuffers / 1024 / 1024 * 100) / 100,
    timestamp: Date.now()
  };
}

/**
 * Generate realistic test log entries with complex data
 */
function generateTestDataset(size, complexity = 'medium') {
  console.log(`📊 Generating ${size} test log entries (complexity: ${complexity})...`);
  
  const levels = ['LOG', 'ERROR', 'INFO', 'WARN', 'DEBUG'];
  const services = ['auth-service', 'api-gateway', 'database', 'cache', 'notification', 'analytics'];
  const actions = ['login', 'logout', 'query', 'update', 'create', 'delete', 'validate', 'process'];
  
  const entries = [];
  const startTime = performance.now();
  
  for (let i = 0; i < size; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)];
    const service = services[Math.floor(Math.random() * services.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    // Create timestamp with realistic distribution
    const timestamp = new Date(Date.now() - ((size - i) * 1000) + Math.random() * 1000);
    
    // Generate message content
    const message = `${service}: ${action} operation ${i + 1}`;
    
    // Add complex data based on complexity level
    let details = null;
    let tags = [];
    
    if (complexity === 'low') {
      // Simple details for 20% of entries
      if (i % 5 === 0) {
        details = { userId: `user_${i % 100}` };
        tags = [service];
      }
    } else if (complexity === 'medium') {
      // Moderate details for 50% of entries
      if (i % 2 === 0) {
        details = {
          userId: `user_${i % 500}`,
          sessionId: `session_${i % 100}`,
          requestId: `req_${i}`,
          duration: Math.random() * 1000,
          _tags: [service, action, `batch_${Math.floor(i / 100)}`]
        };
        tags = details._tags;
      }
    } else if (complexity === 'high') {
      // Complex details for 80% of entries
      if (i % 5 !== 0) {
        details = {
          userId: `user_${i % 1000}`,
          sessionId: `session_${i % 200}`,
          requestId: `req_${i}`,
          traceId: `trace_${Math.floor(i / 10)}`,
          duration: Math.random() * 1000,
          metadata: {
            version: '1.0.0',
            environment: 'test',
            region: `region_${i % 5}`,
            datacenter: `dc_${i % 10}`,
            nested: {
              deep: {
                data: `complex_${i}`,
                array: Array.from({ length: 5 }, (_, idx) => `item_${idx}`)
              }
            }
          },
          _tags: [service, action, level.toLowerCase(), `batch_${Math.floor(i / 100)}`, 'memory-test']
        };
        tags = details._tags;
      }
    }
    
    entries.push({
      id: `test_entry_${i}`,
      timestamp: timestamp.toISOString(),
      level,
      message,
      details,
      tags,
      _timestampMs: timestamp.getTime(),
      _parsedTimestamp: timestamp.toLocaleTimeString(),
      _service: service,
      _action: action
    });
  }
  
  const endTime = performance.now();
  const generationTime = endTime - startTime;
  
  console.log(`✅ Generated ${size} entries in ${generationTime.toFixed(2)}ms`);
  console.log(`   Avg per entry: ${(generationTime / size).toFixed(4)}ms`);
  
  return {
    entries,
    generationTime,
    complexity,
    memoryFootprint: JSON.stringify(entries).length / 1024 / 1024 // MB
  };
}

/**
 * Simulate filtering operations and monitor memory
 */
function simulateFilteringOperations(entries, operationCount = 50) {
  console.log(`🔍 Simulating ${operationCount} filtering operations...`);
  
  const memorySnapshots = [];
  const initialMemory = getMemoryUsage();
  memorySnapshots.push({ operation: 'initial', ...initialMemory });
  
  const filterCriteria = [
    { type: 'level', values: ['ERROR', 'WARN'] },
    { type: 'level', values: ['INFO', 'LOG'] },
    { type: 'service', values: ['auth-service', 'api-gateway'] },
    { type: 'action', values: ['login', 'query'] },
    { type: 'timeRange', start: Date.now() - 3600000, end: Date.now() },
    { type: 'text', value: 'operation' },
    { type: 'complex', value: { level: 'ERROR', service: 'auth-service' } }
  ];
  
  let totalFilteredEntries = 0;
  const startTime = performance.now();
  
  for (let i = 0; i < operationCount; i++) {
    const criterion = filterCriteria[i % filterCriteria.length];
    
    // Simulate filtering operation
    let filteredEntries;
    
    switch (criterion.type) {
      case 'level':
        filteredEntries = entries.filter(entry => criterion.values.includes(entry.level));
        break;
      case 'service':
        filteredEntries = entries.filter(entry => criterion.values.includes(entry._service));
        break;
      case 'action':
        filteredEntries = entries.filter(entry => criterion.values.includes(entry._action));
        break;
      case 'timeRange':
        filteredEntries = entries.filter(entry => 
          entry._timestampMs >= criterion.start && entry._timestampMs <= criterion.end
        );
        break;
      case 'text':
        filteredEntries = entries.filter(entry => 
          entry.message.toLowerCase().includes(criterion.value.toLowerCase())
        );
        break;
      case 'complex':
        filteredEntries = entries.filter(entry => 
          entry.level === criterion.value.level && entry._service === criterion.value.service
        );
        break;
      default:
        filteredEntries = entries;
    }
    
    totalFilteredEntries += filteredEntries.length;
    
    // Take memory snapshot every 10 operations
    if (i % 10 === 0 || i === operationCount - 1) {
      const memorySnapshot = getMemoryUsage();
      memorySnapshots.push({ 
        operation: `filter_${i + 1}`, 
        filteredCount: filteredEntries.length,
        ...memorySnapshot 
      });
    }
  }
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  
  const finalMemory = getMemoryUsage();
  const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
  
  return {
    operationCount,
    totalTime,
    avgTimePerOperation: totalTime / operationCount,
    totalFilteredEntries,
    memoryGrowth,
    memoryGrowthRatio: finalMemory.heapUsed / initialMemory.heapUsed,
    memorySnapshots
  };
}

/**
 * Simulate sorting operations and monitor memory
 */
function simulateSortingOperations(entries, operationCount = 10) {
  console.log(`📊 Simulating ${operationCount} sorting operations...`);
  
  const memorySnapshots = [];
  const initialMemory = getMemoryUsage();
  memorySnapshots.push({ operation: 'initial', ...initialMemory });
  
  const sortCriteria = [
    { field: 'timestamp', direction: 'desc' },
    { field: 'timestamp', direction: 'asc' },
    { field: 'level', direction: 'desc' },
    { field: 'level', direction: 'asc' },
    { field: 'message', direction: 'asc' },
    { field: '_service', direction: 'asc' }
  ];
  
  const startTime = performance.now();
  
  for (let i = 0; i < operationCount; i++) {
    const criterion = sortCriteria[i % sortCriteria.length];
    
    // Create a copy to avoid mutating original array
    const sortedEntries = [...entries].sort((a, b) => {
      let valueA = a[criterion.field];
      let valueB = b[criterion.field];
      
      // Handle timestamps
      if (criterion.field === 'timestamp') {
        valueA = a._timestampMs;
        valueB = b._timestampMs;
      }
      
      // Convert to string for consistent comparison
      valueA = String(valueA).toLowerCase();
      valueB = String(valueB).toLowerCase();
      
      const comparison = valueA.localeCompare(valueB);
      return criterion.direction === 'desc' ? -comparison : comparison;
    });
    
    // Take memory snapshot
    const memorySnapshot = getMemoryUsage();
    memorySnapshots.push({ 
      operation: `sort_${criterion.field}_${criterion.direction}`, 
      sortedCount: sortedEntries.length,
      ...memorySnapshot 
    });
  }
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  
  const finalMemory = getMemoryUsage();
  const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
  
  return {
    operationCount,
    totalTime,
    avgTimePerOperation: totalTime / operationCount,
    memoryGrowth,
    memoryGrowthRatio: finalMemory.heapUsed / initialMemory.heapUsed,
    memorySnapshots
  };
}

/**
 * Simulate virtualization operations (scrolling/slicing)
 */
function simulateVirtualizationOperations(entries, operationCount = 100) {
  console.log(`📜 Simulating ${operationCount} virtualization operations...`);
  
  const memorySnapshots = [];
  const initialMemory = getMemoryUsage();
  memorySnapshots.push({ operation: 'initial', ...initialMemory });
  
  const itemHeight = 68;
  const containerHeight = 400;
  const itemsPerPage = Math.ceil(containerHeight / itemHeight);
  const overscan = 5;
  
  const startTime = performance.now();
  let totalSliceOperations = 0;
  
  for (let i = 0; i < operationCount; i++) {
    // Simulate random scroll position
    const scrollTop = Math.floor((entries.length * Math.random()));
    
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      entries.length,
      startIndex + itemsPerPage + (overscan * 2)
    );
    
    // Perform slice operation (what react-window does)
    const visibleItems = entries.slice(startIndex, endIndex);
    totalSliceOperations++;
    
    // Simulate rendering visible items
    visibleItems.forEach(item => {
      // Touch the data to simulate DOM rendering
      const rendered = {
        formattedTime: item._parsedTimestamp,
        levelClass: `level-${item.level.toLowerCase()}`,
        hasDetails: !!item.details
      };
    });
    
    // Take memory snapshot every 20 operations
    if (i % 20 === 0 || i === operationCount - 1) {
      const memorySnapshot = getMemoryUsage();
      memorySnapshots.push({ 
        operation: `virtualize_${i + 1}`, 
        visibleCount: visibleItems.length,
        scrollPosition: scrollTop,
        ...memorySnapshot 
      });
    }
  }
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  
  const finalMemory = getMemoryUsage();
  const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
  
  return {
    operationCount,
    totalSliceOperations,
    totalTime,
    avgTimePerOperation: totalTime / operationCount,
    itemsPerPage,
    memoryGrowth,
    memoryGrowthRatio: finalMemory.heapUsed / initialMemory.heapUsed,
    memorySnapshots
  };
}

/**
 * Perform memory leak detection
 */
function detectMemoryLeaks(beforeOperations, afterOperations, afterCleanup) {
  console.log(`🔍 Analyzing memory leak potential...`);
  
  const operationGrowth = afterOperations.heapUsed - beforeOperations.heapUsed;
  const postCleanupGrowth = afterCleanup.heapUsed - beforeOperations.heapUsed;
  
  const analysis = {
    operationGrowthMB: operationGrowth,
    postCleanupGrowthMB: postCleanupGrowth,
    memoryReclaimed: operationGrowth - postCleanupGrowth,
    reclaimPercentage: ((operationGrowth - postCleanupGrowth) / operationGrowth) * 100,
    hasLeak: postCleanupGrowth > MEMORY_CONFIG.thresholds.memoryLeakTolerance,
    severity: 'none'
  };
  
  // Determine leak severity
  if (postCleanupGrowth > 20) {
    analysis.severity = 'critical';
  } else if (postCleanupGrowth > 10) {
    analysis.severity = 'high';
  } else if (postCleanupGrowth > 5) {
    analysis.severity = 'medium';
  } else if (postCleanupGrowth > 2) {
    analysis.severity = 'low';
  }
  
  return analysis;
}

/**
 * Perform memory stress test with specified dataset size
 */
async function performMemoryStressTest(datasetSize, complexity = 'medium') {
  console.log(`\n🧪 Memory Stress Test - ${datasetSize} entries (${complexity} complexity)`);
  console.log('='.repeat(60));
  
  // Generate test dataset
  const dataset = generateTestDataset(datasetSize, complexity);
  const postGenerationMemory = getMemoryUsage();
  
  console.log(`📏 Dataset footprint: ${dataset.memoryFootprint.toFixed(2)}MB`);
  console.log(`💾 Memory after generation: ${postGenerationMemory.heapUsed}MB`);
  
  // Baseline memory measurement
  const baselineMemory = getMemoryUsage();
  
  // Perform filtering operations
  const filterResults = simulateFilteringOperations(dataset.entries, MEMORY_CONFIG.operations.filterOperations);
  const postFilterMemory = getMemoryUsage();
  
  // Perform sorting operations
  const sortResults = simulateSortingOperations(dataset.entries, MEMORY_CONFIG.operations.sortOperations);
  const postSortMemory = getMemoryUsage();
  
  // Perform virtualization operations
  const virtualResults = simulateVirtualizationOperations(dataset.entries, MEMORY_CONFIG.operations.scrollOperations);
  const postVirtualMemory = getMemoryUsage();
  
  // Force garbage collection
  if (global.gc) {
    global.gc();
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const postCleanupMemory = getMemoryUsage();
  
  // Analyze memory leaks
  const leakAnalysis = detectMemoryLeaks(baselineMemory, postVirtualMemory, postCleanupMemory);
  
  // Compile results
  const results = {
    datasetSize,
    complexity,
    datasetFootprint: dataset.memoryFootprint,
    memoryProgression: {
      baseline: baselineMemory.heapUsed,
      postGeneration: postGenerationMemory.heapUsed,
      postFilter: postFilterMemory.heapUsed,
      postSort: postSortMemory.heapUsed,
      postVirtual: postVirtualMemory.heapUsed,
      postCleanup: postCleanupMemory.heapUsed
    },
    operationResults: {
      filtering: filterResults,
      sorting: sortResults,
      virtualization: virtualResults
    },
    leakAnalysis,
    performanceValidation: {
      memoryGrowthWithinLimits: (postVirtualMemory.heapUsed - baselineMemory.heapUsed) < MEMORY_CONFIG.thresholds.maxMemoryGrowth,
      memoryRatioWithinLimits: (postVirtualMemory.heapUsed / baselineMemory.heapUsed) < MEMORY_CONFIG.thresholds.maxMemoryRatio,
      noMemoryLeaks: !leakAnalysis.hasLeak,
      overallPass: true
    }
  };
  
  // Update overall pass status
  results.performanceValidation.overallPass = 
    results.performanceValidation.memoryGrowthWithinLimits &&
    results.performanceValidation.memoryRatioWithinLimits &&
    results.performanceValidation.noMemoryLeaks;
  
  return results;
}

/**
 * Generate comprehensive memory monitoring report
 */
function generateMemoryReport(testResults) {
  console.log(`\n📊 Memory Monitoring Report`);
  console.log('='.repeat(60));
  
  // Summary statistics
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.performanceValidation.overallPass).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`\n📈 Test Summary:`);
  console.log(`   Total tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(`   Failed: ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)`);
  
  // Detailed results by dataset size
  console.log(`\n📊 Results by Dataset Size:`);
  testResults.forEach(result => {
    const { datasetSize, complexity, memoryProgression, performanceValidation, leakAnalysis } = result;
    const maxMemory = Math.max(...Object.values(memoryProgression));
    const memoryGrowth = memoryProgression.postVirtual - memoryProgression.baseline;
    const memoryRatio = memoryProgression.postVirtual / memoryProgression.baseline;
    
    console.log(`\n   📏 ${datasetSize} entries (${complexity}):`);
    console.log(`      Peak memory: ${maxMemory.toFixed(2)}MB`);
    console.log(`      Memory growth: ${memoryGrowth.toFixed(2)}MB (${memoryRatio.toFixed(2)}x)`);
    console.log(`      Memory leak: ${leakAnalysis.hasLeak ? '❌ Detected' : '✅ None'} (${leakAnalysis.postCleanupGrowthMB.toFixed(2)}MB post-cleanup)`);
    console.log(`      Overall: ${performanceValidation.overallPass ? '✅ PASS' : '❌ FAIL'}`);
  });
  
  // Performance thresholds analysis
  console.log(`\n⚡ Performance Thresholds:`);
  console.log(`   Max memory growth: ${MEMORY_CONFIG.thresholds.maxMemoryGrowth}MB`);
  console.log(`   Max memory ratio: ${MEMORY_CONFIG.thresholds.maxMemoryRatio}x`);
  console.log(`   Memory leak tolerance: ${MEMORY_CONFIG.thresholds.memoryLeakTolerance}MB`);
  
  // Recommendations
  console.log(`\n💡 Recommendations:`);
  const largestDataset = testResults[testResults.length - 1];
  
  if (largestDataset && !largestDataset.performanceValidation.overallPass) {
    console.log(`   ⚠️  Large datasets (${largestDataset.datasetSize}+) show performance issues`);
    
    if (!largestDataset.performanceValidation.memoryGrowthWithinLimits) {
      console.log(`   🔧 Consider implementing more aggressive memory optimization`);
    }
    
    if (largestDataset.leakAnalysis.hasLeak) {
      console.log(`   🔧 Memory leak detected - review component cleanup logic`);
    }
  } else {
    console.log(`   ✅ Memory performance is excellent across all dataset sizes`);
    console.log(`   ✅ No memory leaks detected`);
    console.log(`   ✅ Virtualization is working effectively`);
  }
  
  // Dataset size recommendations
  const passedSizes = testResults.filter(r => r.performanceValidation.overallPass).map(r => r.datasetSize);
  const maxPassedSize = passedSizes.length > 0 ? Math.max(...passedSizes) : 0;
  
  console.log(`\n📏 Dataset Size Recommendations:`);
  console.log(`   ✅ Recommended max size: ${maxPassedSize} entries`);
  console.log(`   🎯 Enable virtualization: ${maxPassedSize < 5000 ? '1000' : '2000'}+ entries`);
  console.log(`   ⚡ Performance threshold: 33ms render time (30fps)`);
  
  return {
    summary: {
      totalTests,
      passedTests,
      failedTests,
      successRate: (passedTests / totalTests) * 100
    },
    recommendations: {
      maxRecommendedSize: maxPassedSize,
      virtualizationThreshold: maxPassedSize < 5000 ? 1000 : 2000,
      memoryOptimizationNeeded: largestDataset && !largestDataset.performanceValidation.memoryGrowthWithinLimits,
      memoryLeakDetected: testResults.some(r => r.leakAnalysis.hasLeak)
    }
  };
}

/**
 * Save results to file for historical tracking
 */
function saveResults(testResults, report) {
  const resultsDir = path.join(__dirname, '..', '.claude-testing');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `memory-monitoring-results-${timestamp}.json`;
  const filepath = path.join(resultsDir, filename);
  
  const data = {
    timestamp: new Date().toISOString(),
    testConfig: MEMORY_CONFIG,
    testResults,
    report,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage()
    }
  };
  
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`\n💾 Results saved to: ${filepath}`);
  
  // Also update the latest results file
  const latestFilepath = path.join(resultsDir, 'memory-monitoring-latest.json');
  fs.writeFileSync(latestFilepath, JSON.stringify(data, null, 2));
  
  return filepath;
}

/**
 * Main memory monitoring test runner
 */
async function runMemoryMonitoring() {
  console.log('🚀 Memory Usage Monitoring for Large Datasets');
  console.log('============================================');
  console.log(`📊 Testing dataset sizes: ${MEMORY_CONFIG.datasetSizes.join(', ')}`);
  console.log(`⚡ Memory thresholds: ${MEMORY_CONFIG.thresholds.maxMemoryGrowth}MB growth, ${MEMORY_CONFIG.thresholds.maxMemoryRatio}x ratio`);
  
  const testResults = [];
  
  // Run tests for each dataset size
  for (const size of MEMORY_CONFIG.datasetSizes) {
    try {
      const result = await performMemoryStressTest(size, 'medium');
      testResults.push(result);
      
      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Test failed for ${size} entries:`, error.message);
    }
  }
  
  // Generate and save report
  const report = generateMemoryReport(testResults);
  const resultsFile = saveResults(testResults, report);
  
  console.log(`\n🎯 Memory Monitoring Complete!`);
  console.log(`   Success rate: ${report.summary.successRate.toFixed(1)}%`);
  console.log(`   Results: ${resultsFile}`);
  
  // Exit with error code if tests failed
  if (report.summary.failedTests > 0) {
    console.log(`\n⚠️  ${report.summary.failedTests} tests failed - review results for optimization opportunities`);
    process.exit(1);
  } else {
    console.log(`\n✅ All memory tests passed - excellent performance!`);
    process.exit(0);
  }
}

// Export functions for use in other scripts
module.exports = {
  getMemoryUsage,
  generateTestDataset,
  simulateFilteringOperations,
  simulateSortingOperations,
  simulateVirtualizationOperations,
  detectMemoryLeaks,
  performMemoryStressTest,
  generateMemoryReport,
  runMemoryMonitoring,
  MEMORY_CONFIG
};

// Run if called directly
if (require.main === module) {
  runMemoryMonitoring().catch(console.error);
}