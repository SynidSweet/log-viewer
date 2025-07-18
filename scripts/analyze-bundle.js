#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Bundle Analysis Script');
console.log('========================\n');

// Skip database initialization for bundle analysis
process.env.SKIP_DB_INIT = 'true';
process.env.ANALYZE = 'true';

// Create a temporary next.config.js without db:init
const tempConfig = `
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: true,
});

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@radix-ui/react-icons", "lucide-react", "date-fns"],
  },
};

export default withBundleAnalyzer(nextConfig);
`;

// Backup original config
const configPath = path.join(process.cwd(), 'next.config.ts');
const backupPath = path.join(process.cwd(), 'next.config.ts.backup');

try {
  console.log('📦 Starting bundle analysis...\n');
  
  // Run build without db:init
  console.log('🏗️  Building project for analysis...');
  execSync('next build', { 
    stdio: 'inherit',
    env: { ...process.env, SKIP_DB_INIT: 'true', ANALYZE: 'true' }
  });
  
  console.log('\n✅ Bundle analysis complete!');
  console.log('📊 Check the generated reports in your browser');
  
} catch (error) {
  console.error('\n❌ Bundle analysis failed:', error.message);
  process.exit(1);
}