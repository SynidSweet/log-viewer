module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  moduleNameMapper: {
    '^nanoid$': '<rootDir>/__mocks__/nanoid.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(nanoid)/)',
  ],
  roots: ['<rootDir>/../src', '<rootDir>/tests'],
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.test.js',
  ],
  collectCoverageFrom: [
    '../src/**/*.{ts,js}',
    '!../src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  testTimeout: 30000, // 30 seconds for integration tests
  verbose: true,
  bail: false, // Continue running tests after failures
  
  // Performance thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Test result processors
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-suite/results',
        outputName: 'junit.xml',
      }
    ]
  ]
};