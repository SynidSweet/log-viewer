#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📊 Bundle Size Analysis');
console.log('======================\n');

// Skip database for analysis
process.env.SKIP_DB_INIT = 'true';

// Create a temporary build configuration
const tempBuildScript = `
// Temporary build configuration without database
const nextBuild = require('next/dist/build').default;
const path = require('path');

async function build() {
  try {
    await nextBuild(path.resolve('.'), {
      silent: false,
      conf: path.resolve('./next.config.ts')
    });
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
`;

const tempBuildPath = path.join(process.cwd(), '.build-temp.js');

try {
  // Write temporary build script
  fs.writeFileSync(tempBuildPath, tempBuildScript);
  
  console.log('🏗️  Building project without database initialization...\n');
  
  // Run the build
  execSync(`node ${tempBuildPath}`, { 
    stdio: 'inherit',
    env: { ...process.env, SKIP_DB_INIT: 'true' }
  });
  
  console.log('\n📈 Analyzing bundle sizes...\n');
  
  // Check if .next directory exists
  const nextDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(nextDir)) {
    throw new Error('.next directory not found after build');
  }
  
  // Analyze client bundles
  const staticDir = path.join(nextDir, 'static', 'chunks');
  if (fs.existsSync(staticDir)) {
    const files = fs.readdirSync(staticDir);
    
    console.log('Client-side bundles:');
    console.log('-------------------');
    
    let totalSize = 0;
    const bundles = [];
    
    files.forEach(file => {
      if (file.endsWith('.js')) {
        const filePath = path.join(staticDir, file);
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        bundles.push({ name: file, size: stats.size, sizeKB });
        totalSize += stats.size;
      }
    });
    
    // Sort by size descending
    bundles.sort((a, b) => b.size - a.size);
    
    // Display bundles
    bundles.forEach(bundle => {
      const barLength = Math.round((bundle.size / bundles[0].size) * 30);
      const bar = '█'.repeat(barLength) + '░'.repeat(30 - barLength);
      console.log(`${bundle.name.padEnd(40)} ${bar} ${bundle.sizeKB} KB`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`Total bundle size: ${(totalSize / 1024).toFixed(2)} KB (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
    
    // Check for large bundles
    const largeBundles = bundles.filter(b => b.size > 200 * 1024); // > 200KB
    if (largeBundles.length > 0) {
      console.log('\n⚠️  Large bundles detected (>200KB):');
      largeBundles.forEach(bundle => {
        console.log(`   - ${bundle.name}: ${bundle.sizeKB} KB`);
      });
    }
    
    // Recommendations
    console.log('\n📋 Recommendations:');
    if (totalSize > 1024 * 1024) { // > 1MB total
      console.log('   - Consider more aggressive code splitting');
      console.log('   - Review dependencies for lighter alternatives');
    }
    if (largeBundles.length > 0) {
      console.log('   - Split large bundles using dynamic imports');
      console.log('   - Lazy load components that are not immediately needed');
    }
    console.log('   - Enable gzip/brotli compression on your server');
    console.log('   - Use Next.js Image component for optimized image loading');
  }
  
} catch (error) {
  console.error('\n❌ Analysis failed:', error.message);
  process.exit(1);
} finally {
  // Cleanup
  if (fs.existsSync(tempBuildPath)) {
    fs.unlinkSync(tempBuildPath);
  }
}