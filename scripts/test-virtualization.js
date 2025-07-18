// Test script to generate and test large datasets for virtualization
const { performance } = require('perf_hooks');

// Generate test log entries for performance testing
function generateTestEntries(count = 5000) {
  const levels = ['LOG', 'ERROR', 'INFO', 'WARN', 'DEBUG'];
  const entries = [];
  
  console.log(`Generating ${count} test log entries...`);
  const startTime = performance.now();
  
  for (let i = 0; i < count; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)];
    const timestamp = new Date(Date.now() - (count - i) * 1000).toISOString();
    const message = `Test log entry ${i + 1} with some longer text to simulate real log messages that might wrap to multiple lines`;
    
    // Add some entries with tags and extended data
    const hasExtendedData = i % 10 === 0;
    const hasTags = i % 5 === 0;
    
    let content = `[${timestamp.slice(0, 19).replace('T', ', ')}] [${level}] ${message}`;
    
    if (hasExtendedData || hasTags) {
      const data = {
        userId: `user_${Math.floor(Math.random() * 1000)}`,
        sessionId: `session_${Math.floor(Math.random() * 100)}`,
        requestId: `req_${i}`,
      };
      
      if (hasTags) {
        data._tags = ['performance', 'test', `batch_${Math.floor(i / 100)}`];
      }
      
      content += ` - ${JSON.stringify(data)}`;
    }
    
    entries.push({
      id: `test_entry_${i}`,
      timestamp,
      level,
      message,
      details: hasExtendedData ? { 
        userId: `user_${Math.floor(Math.random() * 1000)}`,
        sessionId: `session_${Math.floor(Math.random() * 100)}`,
        requestId: `req_${i}`,
        ...(hasTags ? { _tags: ['performance', 'test', `batch_${Math.floor(i / 100)}`] } : {})
      } : null,
      tags: hasTags ? ['performance', 'test', `batch_${Math.floor(i / 100)}`] : undefined,
      content
    });
  }
  
  const endTime = performance.now();
  console.log(`Generated ${count} entries in ${(endTime - startTime).toFixed(2)}ms`);
  
  return entries;
}

// Memory usage helper
function getMemoryUsage() {
  const used = process.memoryUsage();
  return {
    rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
    heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
    external: Math.round(used.external / 1024 / 1024 * 100) / 100
  };
}

// Test data generation performance
function testDataGeneration() {
  console.log('\n=== Data Generation Performance Test ===');
  
  const sizes = [1000, 2000, 5000, 10000];
  
  sizes.forEach(size => {
    console.log(`\n--- Testing ${size} entries ---`);
    console.log('Memory before:', getMemoryUsage());
    
    const startTime = performance.now();
    const entries = generateTestEntries(size);
    const endTime = performance.now();
    
    console.log('Memory after:', getMemoryUsage());
    console.log(`Generation time: ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`Avg per entry: ${((endTime - startTime) / size).toFixed(4)}ms`);
    console.log(`Memory per entry: ${((getMemoryUsage().heapUsed * 1024 * 1024) / size / 1024).toFixed(2)}KB`);
  });
}

// Export for use in other scripts
module.exports = {
  generateTestEntries,
  getMemoryUsage,
  testDataGeneration
};

// Run tests if called directly
if (require.main === module) {
  testDataGeneration();
}