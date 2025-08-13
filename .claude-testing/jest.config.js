const path = require('path');

module.exports = {
  // Point to the parent project's source files
  rootDir: '..',
  
  // No main testMatch - let projects handle their own test matching
  // testMatch handled by individual projects below
  
  // Coverage from parent src directory
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{js,ts,jsx,tsx}',
    '!<rootDir>/src/**/*.d.ts',
    '!<rootDir>/src/**/*.test.{js,ts}',
    '!<rootDir>/src/**/*.spec.{js,ts}',
  ],
  
  // TypeScript support with performance optimizations
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/.claude-testing/tsconfig.test.json',
      useESM: false,
      // Performance optimizations
      compiler: 'typescript',
      diagnostics: {
        ignoreCodes: [1343]
      },
    }]
  },
  
  // Module resolution
  moduleNameMapper: {
    // CRITICAL: Force React to use main project's React instance
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/$1',
    '^./globals.css$': '<rootDir>/.claude-testing/__mocks__/globals.css',
    // Next.js font mocking
    '^next/font/google$': '<rootDir>/node_modules/next/dist/build/jest/__mocks__/nextFontMock.js',
    '^next/font/local$': '<rootDir>/node_modules/next/dist/build/jest/__mocks__/nextFontMock.js',
    // ESM modules that need CJS mapping
    '^nanoid$': '<rootDir>/.claude-testing/__mocks__/nanoid.js',
    '^uuid$': require.resolve('uuid'),
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub'
  },
  
  // Coverage output in .claude-testing
  coverageDirectory: '<rootDir>/.claude-testing/coverage',
  
  // Setup files - use optimized setup
  setupFilesAfterEnv: ['<rootDir>/.claude-testing/setupTests.optimized.js'],
  
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
        '<rootDir>/.claude-testing/**/*.utility.test.{js,ts}',
        '<rootDir>/.claude-testing/**/*.api.test.{js,ts}',
        '<rootDir>/.claude-testing/**/lib/**/*.unit.test.{js,ts}',
        '<rootDir>/.claude-testing/**/middleware*.unit.test.{js,ts}'
      ],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: '<rootDir>/.claude-testing/tsconfig.test.json',
          useESM: false,
          compiler: 'typescript',
          diagnostics: {
            ignoreCodes: [1343]
          }
        }]
      },
      moduleNameMapper: {
        // CRITICAL: Force React to use main project's React instance
        '^react$': '<rootDir>/node_modules/react',
        '^react-dom$': '<rootDir>/node_modules/react-dom',
        '^@/(.*)$': '<rootDir>/src/$1',
        '^~/(.*)$': '<rootDir>/$1',
        '^./globals.css$': '<rootDir>/.claude-testing/__mocks__/globals.css',
        // Next.js font mocking
        '^next/font/google$': '<rootDir>/node_modules/next/dist/build/jest/__mocks__/nextFontMock.js',
        '^next/font/local$': '<rootDir>/node_modules/next/dist/build/jest/__mocks__/nextFontMock.js',
        // ESM modules that need CJS mapping
        '^nanoid$': '<rootDir>/.claude-testing/__mocks__/nanoid.js',
        '^uuid$': require.resolve('uuid'),
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub'
      },
      setupFilesAfterEnv: ['<rootDir>/.claude-testing/setupTests.optimized.js'],
      transformIgnorePatterns: [
        'node_modules/(?!(nanoid|uuid|@radix-ui|@testing-library|@libsql|next-auth)/)'
      ]
    },
    {
      displayName: 'component-tests',
      rootDir: '..',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/.claude-testing/**/components/**/*.test.{js,ts,jsx,tsx}',
        '<rootDir>/.claude-testing/**/*.component.test.{js,ts,jsx,tsx}',
        '<rootDir>/.claude-testing/**/integration/**/*.test.{js,ts,jsx,tsx}',
        '<rootDir>/.claude-testing/**/hooks/**/*.test.{js,ts,jsx,tsx}',
        '<rootDir>/.claude-testing/**/components/**/*.unit.test.{js,ts,jsx,tsx}',
        '<rootDir>/.claude-testing/**/ui/**/*.unit.test.{js,ts,jsx,tsx}'
      ],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: '<rootDir>/.claude-testing/tsconfig.test.json',
          useESM: false,
          compiler: 'typescript',
          diagnostics: {
            ignoreCodes: [1343]
          }
        }]
      },
      moduleNameMapper: {
        // CRITICAL: Force React to use main project's React instance
        '^react$': '<rootDir>/node_modules/react',
        '^react-dom$': '<rootDir>/node_modules/react-dom',
        '^@/(.*)$': '<rootDir>/src/$1',
        '^~/(.*)$': '<rootDir>/$1',
        '^./globals.css$': '<rootDir>/.claude-testing/__mocks__/globals.css',
        // Next.js font mocking
        '^next/font/google$': '<rootDir>/node_modules/next/dist/build/jest/__mocks__/nextFontMock.js',
        '^next/font/local$': '<rootDir>/node_modules/next/dist/build/jest/__mocks__/nextFontMock.js',
        // ESM modules that need CJS mapping
        '^nanoid$': '<rootDir>/.claude-testing/__mocks__/nanoid.js',
        '^uuid$': require.resolve('uuid'),
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub'
      },
      setupFilesAfterEnv: ['<rootDir>/.claude-testing/setupTests.optimized.js'],
      transformIgnorePatterns: [
        'node_modules/(?!(nanoid|uuid|@radix-ui|@testing-library|@libsql|next-auth)/)'
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
  
  // Jest configuration optimized for React 19
  verbose: true,
  clearMocks: true,
  maxWorkers: '50%',
  testTimeout: 30000,
  
  // Performance optimizations
  resetModules: false,
  restoreMocks: true,
  clearMocks: true,
  
  // Optimize for React 19 performance
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // Transform ESM modules that cause import issues
  // Note: nanoid is a pure ESM module and needs special handling
  transformIgnorePatterns: [
    'node_modules/(?!(nanoid|uuid|@radix-ui|@testing-library|@libsql|next-auth)/)'
  ],
  
  // Global configuration for ESM modules
  globals: {
    'ts-jest': {
      useESM: false,
      tsconfig: '<rootDir>/.claude-testing/tsconfig.test.json'
    }
  }
};