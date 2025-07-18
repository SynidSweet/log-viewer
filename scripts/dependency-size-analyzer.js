#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Dependency Size Analysis');
console.log('===========================\n');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const dependencies = packageJson.dependencies || {};

// Get size of each dependency
const depSizes = [];

console.log('Analyzing dependency sizes...\n');

Object.keys(dependencies).forEach(dep => {
  try {
    const depPath = path.join('node_modules', dep);
    if (fs.existsSync(depPath)) {
      // Calculate directory size
      const sizeOutput = execSync(`du -sk "${depPath}" 2>/dev/null || echo "0"`, { encoding: 'utf8' });
      const sizeKB = parseInt(sizeOutput.split('\t')[0]) || 0;
      
      depSizes.push({
        name: dep,
        version: dependencies[dep],
        sizeKB,
        sizeMB: (sizeKB / 1024).toFixed(2)
      });
    }
  } catch (err) {
    // Ignore errors for individual packages
  }
});

// Sort by size descending
depSizes.sort((a, b) => b.sizeKB - a.sizeKB);

// Display results
console.log('Top 20 Largest Dependencies:');
console.log('----------------------------\n');

const top20 = depSizes.slice(0, 20);
const maxSize = top20[0]?.sizeKB || 1;

top20.forEach((dep, index) => {
  const barLength = Math.round((dep.sizeKB / maxSize) * 40);
  const bar = '█'.repeat(barLength) + '░'.repeat(40 - barLength);
  console.log(`${(index + 1).toString().padStart(2)}. ${dep.name.padEnd(30)} ${bar} ${dep.sizeMB} MB`);
});

// Calculate totals
const totalSize = depSizes.reduce((sum, dep) => sum + dep.sizeKB, 0);
console.log('\n' + '='.repeat(80));
console.log(`Total dependencies size: ${(totalSize / 1024).toFixed(2)} MB`);
console.log(`Number of dependencies: ${depSizes.length}`);

// Identify heavy dependencies that might be optimized
console.log('\n🎯 Optimization Opportunities:');
console.log('-----------------------------\n');

const heavyDeps = {
  '@radix-ui': depSizes.filter(d => d.name.startsWith('@radix-ui')),
  'react-related': depSizes.filter(d => d.name.includes('react')),
  'build-tools': depSizes.filter(d => ['eslint', 'typescript', 'babel', 'jest', 'webpack'].some(tool => d.name.includes(tool))),
  'utilities': depSizes.filter(d => ['lodash', 'moment', 'date-fns', 'uuid'].some(util => d.name.includes(util)))
};

// Radix UI analysis
if (heavyDeps['@radix-ui'].length > 0) {
  const radixTotal = heavyDeps['@radix-ui'].reduce((sum, d) => sum + d.sizeKB, 0);
  console.log(`📦 Radix UI Components (${heavyDeps['@radix-ui'].length} packages): ${(radixTotal / 1024).toFixed(2)} MB`);
  console.log('   ℹ️  Consider using fewer Radix components or implementing custom alternatives');
}

// Large single dependencies
const largeDeps = depSizes.filter(d => d.sizeKB > 5000); // > 5MB
if (largeDeps.length > 0) {
  console.log('\n⚠️  Large dependencies (>5MB):');
  largeDeps.forEach(dep => {
    console.log(`   - ${dep.name}: ${dep.sizeMB} MB`);
    
    // Specific recommendations
    if (dep.name === 'next') {
      console.log('     → This is expected for Next.js framework');
    } else if (dep.name.includes('aws-sdk')) {
      console.log('     → Consider using modular AWS SDK imports');
    } else if (dep.name === 'moment') {
      console.log('     → Consider migrating to date-fns or day.js');
    }
  });
}

// Bundle optimization tips
console.log('\n💡 General Optimization Tips:');
console.log('   1. Use dynamic imports for heavy components');
console.log('   2. Enable tree-shaking with proper ES6 imports');
console.log('   3. Audit and remove unused dependencies');
console.log('   4. Consider lighter alternatives for heavy libraries');
console.log('   5. Use build-time optimizations (minification, compression)');

// Check if we can analyze actual bundle output
if (fs.existsSync('.next/BUILD_ID')) {
  console.log('\n📊 Actual Bundle Analysis:');
  console.log('   Run "ANALYZE=true npm run build" for detailed bundle visualization');
}