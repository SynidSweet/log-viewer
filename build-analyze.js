// Temporary build script for bundle analysis
process.env.SKIP_DB_INIT = 'true';
process.env.ANALYZE = 'true';

// Mock the database initialization
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  if (id.includes('init-db-deploy')) {
    return function() {
      console.log('Skipping database initialization for bundle analysis...');
      return Promise.resolve();
    };
  }
  return originalRequire.apply(this, arguments);
};

// Run the Next.js build
require('next/dist/cli/next-build');