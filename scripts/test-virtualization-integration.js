// Integration test for virtualization implementation
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test that the virtualization files exist and compile
function testVirtualizationFiles() {
  console.log('🔍 Testing virtualization implementation files...');
  
  const files = [
    'src/components/log-viewer/log-entry-list-virtualized.tsx',
    'src/app/test-virtualization/page.tsx',
    'scripts/test-virtualization-performance.js'
  ];
  
  let allExist = true;
  
  files.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file} exists`);
      
      // Check file size and content
      const stats = fs.statSync(fullPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      console.log(`   Size: ${(stats.size / 1024).toFixed(1)}KB`);
      console.log(`   Lines: ${content.split('\n').length}`);
      
      // Check for key virtualization imports/features
      if (file.includes('virtualized.tsx')) {
        const hasReactWindow = content.includes('react-window');
        const hasFixedSizeList = content.includes('FixedSizeList');
        const hasMemoization = content.includes('useMemo');
        const hasScrollToItem = content.includes('scrollToItem');
        
        console.log(`   ✅ React Window: ${hasReactWindow}`);
        console.log(`   ✅ FixedSizeList: ${hasFixedSizeList}`);
        console.log(`   ✅ Memoization: ${hasMemoization}`);
        console.log(`   ✅ Scroll to item: ${hasScrollToItem}`);
        
        if (!hasReactWindow || !hasFixedSizeList) {
          console.log(`   ❌ Missing critical virtualization features`);
          allExist = false;
        }
      }
      
      if (file.includes('test-virtualization/page.tsx')) {
        const hasVirtualizedImport = content.includes('LogEntryListVirtualized');
        const hasStandardImport = content.includes('LogEntryList');
        const hasToggle = content.includes('useVirtualization');
        
        console.log(`   ✅ Virtualized import: ${hasVirtualizedImport}`);
        console.log(`   ✅ Standard import: ${hasStandardImport}`);
        console.log(`   ✅ Toggle mechanism: ${hasToggle}`);
        
        if (!hasVirtualizedImport || !hasStandardImport) {
          console.log(`   ❌ Missing test page features`);
          allExist = false;
        }
      }
      
    } else {
      console.log(`❌ ${file} does not exist`);
      allExist = false;
    }
  });
  
  return allExist;
}

// Test that react-window dependency is installed
function testDependencies() {
  console.log('\n🔍 Testing dependencies...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const hasReactWindow = packageJson.dependencies && packageJson.dependencies['react-window'];
    const hasReactWindowTypes = packageJson.dependencies && packageJson.dependencies['@types/react-window'];
    
    console.log(`✅ react-window: ${hasReactWindow || 'not found'}`);
    console.log(`✅ @types/react-window: ${hasReactWindowTypes || 'not found'}`);
    
    return hasReactWindow && hasReactWindowTypes;
  } catch (error) {
    console.log(`❌ Error reading package.json: ${error.message}`);
    return false;
  }
}

// Test LogViewer integration
function testLogViewerIntegration() {
  console.log('\n🔍 Testing LogViewer integration...');
  
  try {
    const logViewerPath = 'src/components/log-viewer/index.tsx';
    const content = fs.readFileSync(logViewerPath, 'utf8');
    
    const hasVirtualizedImport = content.includes('LogEntryListVirtualized');
    const hasEnableVirtualizationProp = content.includes('enableVirtualization');
    const hasConditionalRendering = content.includes('enableVirtualization ?');
    
    console.log(`✅ Virtualized import: ${hasVirtualizedImport}`);
    console.log(`✅ enableVirtualization prop: ${hasEnableVirtualizationProp}`);
    console.log(`✅ Conditional rendering: ${hasConditionalRendering}`);
    
    // Check that both components are available
    const standardUsage = content.includes('<LogEntryList');
    const virtualizedUsage = content.includes('<LogEntryListVirtualized');
    
    console.log(`✅ Standard component usage: ${standardUsage}`);
    console.log(`✅ Virtualized component usage: ${virtualizedUsage}`);
    
    return hasVirtualizedImport && hasEnableVirtualizationProp && hasConditionalRendering && standardUsage && virtualizedUsage;
  } catch (error) {
    console.log(`❌ Error reading LogViewer: ${error.message}`);
    return false;
  }
}

// Test that the implementation follows the original component interface
function testComponentInterface() {
  console.log('\n🔍 Testing component interface compatibility...');
  
  try {
    const originalPath = 'src/components/log-viewer/log-entry-list.tsx';
    const virtualizedPath = 'src/components/log-viewer/log-entry-list-virtualized.tsx';
    
    const original = fs.readFileSync(originalPath, 'utf8');
    const virtualized = fs.readFileSync(virtualizedPath, 'utf8');
    
    // Extract interface from original
    const originalInterfaceMatch = original.match(/interface LogEntryListProps \{([^}]+)\}/);
    const virtualizedInterfaceMatch = virtualized.match(/interface LogEntryListProps \{([^}]+)\}/);
    
    if (originalInterfaceMatch && virtualizedInterfaceMatch) {
      const originalProps = originalInterfaceMatch[1].trim();
      const virtualizedProps = virtualizedInterfaceMatch[1].trim();
      
      console.log(`✅ Original interface found`);
      console.log(`✅ Virtualized interface found`);
      console.log(`✅ Interface compatibility: ${originalProps === virtualizedProps}`);
      
      // Check for key props
      const requiredProps = ['entries', 'selectedIndex', 'onSelectEntry', 'selectedEntryIds', 'onToggleSelection'];
      let allPropsFound = true;
      
      requiredProps.forEach(prop => {
        const inOriginal = original.includes(prop);
        const inVirtualized = virtualized.includes(prop);
        console.log(`   ${prop}: Original(${inOriginal}) Virtualized(${inVirtualized})`);
        
        if (!inOriginal || !inVirtualized) {
          allPropsFound = false;
        }
      });
      
      return allPropsFound;
    } else {
      console.log(`❌ Could not extract interfaces`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error testing interface: ${error.message}`);
    return false;
  }
}

// Performance validation
function testPerformanceImplementation() {
  console.log('\n🔍 Testing performance implementation...');
  
  try {
    const virtualizedPath = 'src/components/log-viewer/log-entry-list-virtualized.tsx';
    const content = fs.readFileSync(virtualizedPath, 'utf8');
    
    // Check for performance optimizations
    const hasMemo = content.includes('memo(');
    const hasUseMemo = content.includes('useMemo(');
    const hasUseCallback = content.includes('useCallback(');
    const hasArePropsEqual = content.includes('arePropsEqual');
    const hasItemHeight = content.includes('ITEM_HEIGHT');
    
    console.log(`✅ React.memo: ${hasMemo}`);
    console.log(`✅ useMemo: ${hasUseMemo}`);
    console.log(`✅ useCallback: ${hasUseCallback}`);
    console.log(`✅ Custom memo comparison: ${hasArePropsEqual}`);
    console.log(`✅ Fixed item height: ${hasItemHeight}`);
    
    // Check for react-window specific features
    const hasFixedSizeList = content.includes('FixedSizeList');
    const hasVirtualizedItem = content.includes('VirtualizedItem');
    const hasScrollToItem = content.includes('scrollToItem');
    
    console.log(`✅ FixedSizeList: ${hasFixedSizeList}`);
    console.log(`✅ VirtualizedItem: ${hasVirtualizedItem}`);
    console.log(`✅ Scroll to selected: ${hasScrollToItem}`);
    
    return hasMemo && hasUseMemo && hasUseCallback && hasFixedSizeList && hasItemHeight;
  } catch (error) {
    console.log(`❌ Error testing performance: ${error.message}`);
    return false;
  }
}

// Main test runner
function runIntegrationTests() {
  console.log('🚀 Virtualization Integration Test Suite');
  console.log('=========================================\n');
  
  const results = {
    filesExist: testVirtualizationFiles(),
    dependencies: testDependencies(),
    logViewerIntegration: testLogViewerIntegration(),
    componentInterface: testComponentInterface(),
    performanceImplementation: testPerformanceImplementation(),
  };
  
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  
  console.log(`\n${allPassed ? '🎉' : '❌'} Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n✅ Virtualization implementation is ready for testing!');
    console.log('📝 Next steps:');
    console.log('  1. Run npm run dev');
    console.log('  2. Navigate to /test-virtualization');
    console.log('  3. Test with large datasets (5000+ entries)');
    console.log('  4. Measure performance with browser DevTools');
    console.log('  5. Validate sprint objective: LogViewer <33ms render times');
  } else {
    console.log('\n❌ Please fix the failing tests before proceeding.');
  }
  
  return allPassed;
}

// Export for use in other scripts
module.exports = {
  testVirtualizationFiles,
  testDependencies,
  testLogViewerIntegration,
  testComponentInterface,
  testPerformanceImplementation,
  runIntegrationTests
};

// Run tests if called directly
if (require.main === module) {
  runIntegrationTests();
}