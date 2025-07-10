module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/*.comprehensive.test.js'
  ],
  collectCoverageFrom: [
    '../src/lib/api-error-handler.ts',
    '../src/lib/db-turso.ts',
    '../src/app/api/health/route.ts',
    '../src/app/api/logs/route.ts'
  ],
  coverageDirectory: './coverage',
  verbose: true,
  clearMocks: true,
  testTimeout: 30000
};