module.exports = {
  // Point to the parent project's source files
  rootDir: '..',
  
  // Look for tests only in .claude-testing
  testMatch: [
    '<rootDir>/.claude-testing/**/*.test.{js,ts}',
    '<rootDir>/.claude-testing/**/*.spec.{js,ts}'
  ],
  
  // Coverage from parent src directory
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{js,ts,jsx,tsx}',
    '!<rootDir>/src/**/*.d.ts',
    '!<rootDir>/src/**/*.test.{js,ts}',
    '!<rootDir>/src/**/*.spec.{js,ts}',
  ],
  
  // Use parent's node_modules and support TypeScript
  testEnvironment: 'node',
  
  // Module name mapping for aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/$1'
  },
  
  // Coverage output in .claude-testing
  coverageDirectory: '<rootDir>/.claude-testing/coverage',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/.claude-testing/setupTests.js'],
  
  // Transform settings for TypeScript and ES modules
  transform: {
    '^.+\\.(ts|tsx)$': ['<rootDir>/node_modules/ts-jest', {
      tsconfig: {
        compilerOptions: {
          module: 'commonjs',
          target: 'es2020',
          moduleResolution: 'node',
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          skipLibCheck: true,
          strict: false
        }
      }
    }]
  },
  
  // File extensions to recognize
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Verbose output for debugging
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Maximum worker processes
  maxWorkers: '50%',
  
  // Timeout for tests
  testTimeout: 30000
};