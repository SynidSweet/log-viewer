const path = require('path');

module.exports = {
  // Point to the parent project's source files
  rootDir: '..',
  
  // Look for tests only in .claude-testing
  testMatch: [
    '<rootDir>/.claude-testing/**/*.test.{js,ts,jsx,tsx}',
    '<rootDir>/.claude-testing/**/*.spec.{js,ts,jsx,tsx}'
  ],
  
  // Coverage from parent src directory
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{js,ts,jsx,tsx}',
    '!<rootDir>/src/**/*.d.ts',
    '!<rootDir>/src/**/*.test.{js,ts}',
    '!<rootDir>/src/**/*.spec.{js,ts}',
  ],
  
  // TypeScript support with proper paths
  transform: {
    '^.+\\.(ts|tsx)$': ['<rootDir>/.claude-testing/node_modules/ts-jest', {
      tsconfig: '<rootDir>/.claude-testing/tsconfig.test.json'
    }]
  },
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/$1',
    '^./globals.css$': '<rootDir>/.claude-testing/__mocks__/globals.css',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub'
  },
  
  // Coverage output in .claude-testing
  coverageDirectory: '<rootDir>/.claude-testing/coverage',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/.claude-testing/setupTests.js'],
  
  // File extensions to recognize
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ],
  
  // Use different environments for different test types
  projects: [
    {
      displayName: 'api-tests',
      rootDir: '..',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/.claude-testing/**/api/**/*.test.{js,ts}',
        '<rootDir>/.claude-testing/**/*.comprehensive.test.{js,ts}',
        '<rootDir>/.claude-testing/**/*.service.test.{js,ts}',
        '<rootDir>/.claude-testing/**/*.utility.test.{js,ts}'
      ],
      transform: {
        '^.+\\.(ts|tsx)$': ['<rootDir>/.claude-testing/node_modules/ts-jest', {
          tsconfig: '<rootDir>/.claude-testing/tsconfig.test.json'
        }]
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^~/(.*)$': '<rootDir>/$1',
        '^./globals.css$': '<rootDir>/.claude-testing/__mocks__/globals.css',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub'
      },
      setupFilesAfterEnv: ['<rootDir>/.claude-testing/setupTests.js'],
      transformIgnorePatterns: [
        'node_modules/(?!(nanoid|@radix-ui|@testing-library)/)'
      ]
    },
    {
      displayName: 'component-tests',
      rootDir: '..',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/.claude-testing/**/components/**/*.test.{js,ts,jsx,tsx}',
        '<rootDir>/.claude-testing/**/*.component.test.{js,ts,jsx,tsx}',
        '<rootDir>/.claude-testing/**/integration/**/*.test.{js,ts,jsx,tsx}'
      ],
      transform: {
        '^.+\\.(ts|tsx)$': ['<rootDir>/.claude-testing/node_modules/ts-jest', {
          tsconfig: '<rootDir>/.claude-testing/tsconfig.test.json'
        }]
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^~/(.*)$': '<rootDir>/$1',
        '^./globals.css$': '<rootDir>/.claude-testing/__mocks__/globals.css',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub'
      },
      setupFilesAfterEnv: ['<rootDir>/.claude-testing/setupTests.js'],
      transformIgnorePatterns: [
        'node_modules/(?!(nanoid|@radix-ui|@testing-library)/)'
      ]
    }
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
  
  // Jest configuration
  verbose: true,
  clearMocks: true,
  maxWorkers: '50%',
  testTimeout: 30000,
  
  // Transform ESM modules that cause import issues
  transformIgnorePatterns: [
    'node_modules/(?!(nanoid|@radix-ui|@testing-library)/)'
  ]
};