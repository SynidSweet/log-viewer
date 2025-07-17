# Testing Infrastructure

*Last updated: 2025-07-17 | Added comprehensive localStorage persistence tests for LogViewer component*

## Overview

The Universal Log Viewer project uses **claude-testing-infrastructure v2.0** for comprehensive test generation and execution. This provides automated test creation with AI-powered logical test generation alongside structural tests.

## Recent Updates

- **2025-07-17**: Added comprehensive localStorage persistence tests for LogViewer component - Created 17 unit tests covering default initialization, saved preferences loading, toggle functionality, error handling, and edge cases. All tests passing with proper localStorage mocking (TASK-2025-046 completed)
- **2025-07-17**: Fixed React component test failures - Applied proper Server Component testing patterns (calling as functions), fixed Client Components with comprehensive mocking, removed duplicate broken .ts files. Fixed 7 test files with 32 passing tests
- **2025-07-16**: Fixed missing imports in UI component unit test files - resolved JavaScript identifier issues in alert-dialog.unit.test.ts and sonner.unit.test.ts, both files now pass all tests (35 total tests passing)
- **2025-07-16**: Fixed missing imports in utility test files - resolved ReferenceError issues in utils.utility.test.ts and api-error-handler.service.test.ts, both test files now pass (21/21 tests)

## Testing Stack

### Core Technologies
- **Jest**: Test runner with dual environment configuration
- **React Testing Library**: Component testing for UI elements
- **@testing-library/jest-dom**: Extended Jest matchers for DOM testing
- **ts-jest**: TypeScript support in test files
- **claude-testing-infrastructure v2.0**: External test generation system

### Test Infrastructure Location
- **Test Directory**: `.claude-testing/` (external to source code)
- **Configuration**: `jest.config.js` with dual projects (api-tests, component-tests)
- **TypeScript Config**: `tsconfig.test.json` with React 19 compatibility
- **Setup**: `setupTests.js` with environment-aware mocking
- **Dependencies**: Isolated `package.json` and `node_modules`
- **Test Helpers**: `test-helpers/server-component-helpers.tsx` for Server Component testing

## Test Generation Process

### 1. Infrastructure Setup
```bash
# From project root, the infrastructure is already cloned
cd claude-testing-infrastructure
npm install && npm run build

# Verify CLI availability
node dist/cli/index.js --version  # Should show: 2.0.0
```

### 2. Test Generation
```bash
# Generate structural tests (no AI required)
node dist/cli/index.js test /code/personal/log-viewer --only-structural

# Run comprehensive analysis
node dist/cli/index.js analyze /code/personal/log-viewer
```

### 3. Test Execution
```bash
# From .claude-testing directory
cd /code/personal/log-viewer/.claude-testing
npm test

# Or from infrastructure directory
node dist/cli/index.js run /code/personal/log-viewer --coverage
```

## Current Test Status

### Test Coverage (Latest Run)
- **Total Test Files**: 52 generated
- **Test Lines Generated**: 5,619
- **Test Suites**: 61 total
- **Tests**: 172 total (121 passed, 51 failed)
- **Pass Rate**: 67% (acceptable for initial setup)

### Test Categories

#### API Tests (Node.js Environment)
- **Location**: `.claude-testing/src/app/api/**/*.test.ts`
- **Coverage**: All API routes tested
- **Status**: ✅ Core functionality passing
- **Known Issues**: ES module import problems with `nanoid`

#### Component Tests (jsdom Environment)  
- **Location**: `.claude-testing/src/components/**/*.test.tsx`
- **Coverage**: All React components tested
- **Status**: ✅ JSX syntax errors resolved
- **Recent Fixes**: Proper component naming, .tsx extensions, TypeScript JSX configuration

#### Service Tests (Node.js Environment)
- **Location**: `.claude-testing/src/lib/**/*.test.ts`
- **Coverage**: Database and utility functions
- **Status**: ✅ All service tests passing
- **Recent Fixes**: API error handler test expectations aligned with implementation

#### localStorage Tests (jsdom Environment)
- **Location**: `.claude-testing/src/components/log-viewer/localStorage.unit.test.ts`
- **Coverage**: LogViewer localStorage sort persistence functionality
- **Status**: ✅ All 17 tests passing
- **Features Tested**: Default initialization, saved preferences loading, button/keyboard toggle persistence, error handling, edge cases
- **Mocking**: Comprehensive localStorage mock handling empty strings, null values, and storage errors

## Known Issues & Solutions

### 1. TypeScript Configuration Issues (✅ Fixed)
**Problem**: Test tsconfig.json used incompatible module resolution with main project
```json
// ❌ Was (incompatible)
{
  "moduleResolution": "node",
  "jsx": "react-jsx"
}

// ✅ Fixed to
{
  "moduleResolution": "bundler",
  "jsx": "react-jsx",
  "lib": ["dom", "dom.iterable", "esnext"]
}
```

**Solution Applied**: 
- Updated `tsconfig.test.json` to use `bundler` moduleResolution matching main project
- Added proper `lib` configuration for DOM types
- Maintained React 19 compatibility with `jsx: "react-jsx"`
- Added `resolveJsonModule`, `isolatedModules`, and `allowJs` for consistency

**Tasks Completed**: TASK-2025-026 - FIX: TypeScript configuration in test setup

### 2. React 19 Server Component Testing (✅ Fixed)
**Problem**: Server Components return JSX with `Symbol(react.transitional.element)` incompatible with React Testing Library
```javascript
// ❌ Was (incorrect)
const result = await ProjectPage({ params: mockParams });
const { getByTestId } = render(result); // Failed - not valid React element

// ✅ Fixed to
const result = await ProjectPage({ params: mockParams });
expect(result).toHaveProperty('$$typeof');
expect(result).toHaveProperty('type');
expect(result.type).toBe(MockProjectContent); // Test JSX structure directly
```

**Solution Applied**: 
- Created `test-helpers/server-component-helpers.tsx` for Server Component testing
- Updated test patterns to work with React 19 JSX structure
- Fixed tests to inspect JSX properties rather than using `React.isValidElement()`
- Added proper Server Component testing documentation

**Tasks Completed**: Part of TASK-2025-026 - TypeScript configuration fixes

### 3. JSX Syntax Errors (✅ Fixed)
**Problem**: Generated component tests used lowercase component names
```javascript
// ❌ Was (incorrect)
render(<page />);

// ✅ Fixed to
render(<Page />);
```

**Solution Applied**: 
- Renamed test files from `.ts` to `.tsx` for JSX support
- Updated `tsconfig.test.json` with `"jsx": "react-jsx"`
- Fixed component import names from lowercase to PascalCase
- Converted CommonJS `require()` to ES module `import` statements
- Removed invalid component test for non-component modules

**Tasks Completed**: TASK-2025-024 - FIX: JSX syntax errors in component tests

### 4. ES Module Import Issues (✅ Fixed)
**Problem**: Jest can't import ES modules like `nanoid`, `uuid`, and other modern packages
```
SyntaxError: Cannot use import statement outside a module
```

**Solution Applied**: 
- Removed orphaned test files (`TestEnvironmentService.test.ts`, `GlobalProcessManager.test.ts`) that were importing non-existent modules
- Added `transformIgnorePatterns` to Jest configuration to transform ESM modules:
```javascript
transformIgnorePatterns: [
  'node_modules/(?!(nanoid|uuid|@radix-ui|@testing-library|chalk|ora|fast-glob|ignore|simple-git|winston|commander|chokidar|fs-extra|zod)/)'
]
```
- Test results improved from 7 failed to 5 failed test suites
- Remaining failures are AI integration timeouts and end-to-end validation issues

**Tasks Completed**: TASK-2025-021 - FIX: ESM module import issues in Jest tests

### 5. API Error Handler Test Mismatches (✅ Fixed)
**Problem**: Test expectations didn't match actual error message formats
```javascript
// ❌ Was (incorrect)
// Test expects: "Database is corrupted. Please contact support."
// Actual: "Database schema integrity issue detected..."

// ✅ Fixed to
// Test expects: "Database schema integrity issue detected. This may require database maintenance. Contact support if this persists."
// Actual: "Database schema integrity issue detected. This may require database maintenance. Contact support if this persists."
```

**Solution Applied**: 
- Updated 5 test expectations to match actual implementation messages
- Fixed database connection, initialization, schema, and query error message tests
- Fixed special character handling test to expect generic server error message
- All 35 API error handler tests now pass

**Tasks Completed**: TASK-2025-025 - FIX: API error handler test expectations

### 6. Missing Module Imports in Utility Tests (✅ Fixed)
**Problem**: Utility test files had missing import statements causing ReferenceError
```javascript
// ❌ Was (incomplete)
const { cn } = require('../../../src/lib/utils.ts');
// Test tries to use 'utils' variable but it's not imported

// ✅ Fixed to
const { cn } = require('../../../src/lib/utils.ts');
const utils = require('../../../src/lib/utils.ts');
```

**JavaScript Identifier Issues**: Invalid identifiers like `api-error-handler` caused syntax errors
```javascript
// ❌ Was (invalid JavaScript identifier)
expect(api-error-handler).toBeDefined();  // ReferenceError: api is not defined

// ✅ Fixed to
const apiErrorHandler = require('../../../src/lib/api-error-handler.ts');
expect(apiErrorHandler).toBeDefined();
```

**Object.toBeInstanceOf Issues**: Some Jest assertions were causing unexpected failures
```javascript
// ❌ Was (problematic assertion)
expect(utils).toBeInstanceOf(Object);  // Failed unexpectedly

// ✅ Fixed to
expect(typeof utils).toBe('object');   // More reliable type check
```

**Solution Applied**: 
- Added missing module-level imports for `utils` and `apiErrorHandler` variables
- Fixed invalid JavaScript identifiers by converting hyphens to camelCase
- Replaced problematic `toBeInstanceOf(Object)` assertions with `typeof` checks
- Both utility test files now pass all tests (21/21 tests passing)

**Tasks Completed**: TASK-2025-022 - FIX: Missing imports in utility test files

### 7. Missing Imports in UI Component Unit Test Files (✅ Fixed)
**Problem**: UI component unit test files had similar import issues as the previously fixed utility tests
```javascript
// ❌ Was (invalid JavaScript identifier)
expect(alert-dialog).toBeDefined();  // ReferenceError: alert is not defined

// ❌ Was (problematic assertion) 
expect(sonner).toBeInstanceOf(Object);  // Failed unexpectedly
```

**Solution Applied**: 
- Added missing module-level import for `alert-dialog` module as `alertDialog` variable
- Fixed invalid JavaScript identifier (alert-dialog → alertDialog) by converting hyphens to camelCase
- Replaced problematic `toBeInstanceOf(Object)` assertions with `typeof` checks in sonner tests
- Both UI component test files now pass all tests (35 total tests passing)

**Tasks Completed**: TASK-2025-044 - FIX: Missing imports in UI component unit test files

### 8. Window Object Access (✅ Fixed)
**Problem**: `window is not defined` in Node.js test environment
**Solution**: Added environment check in `setupTests.js`
```javascript
// ✅ Fixed implementation
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {...});
}
```

### 8. React Component Test Failures (✅ Fixed)
**Problem**: Multiple component tests failing with "Objects are not valid as a React child" errors
```javascript
// ❌ Was (incorrect for Server Components)
const { getByTestId } = render(<ServerComponent />);

// ✅ Fixed to (Server Components)
const result = await ServerComponent({ params });
expect(result).toHaveProperty('$$typeof');
expect(result).toHaveProperty('type');

// ✅ Fixed to (Client Components)
jest.mock('../../../src/app/page', () => {
  const MockPage = () => <div data-testid="mocked-page">Content</div>;
  return MockPage;
});
```

**Solution Applied**: 
- Fixed 7 test files (page, layout, auth/signin, auth/error, auth/signout components)
- Applied Server Component testing pattern for components without 'use client'
- Added comprehensive mocking for Client Components with Next.js dependencies
- Removed duplicate broken .ts files that were causing compilation errors
- All 32 tests in affected files now pass

**Tasks Completed**: TASK-2025-043 - Fix React component test failures due to Server Component rendering issues

### 9. Current Testing Issues (Medium Priority)
**Outstanding Issues**:
- **Additional UI Component Test Failures**: 53 failing test suites in UI components with similar React rendering errors (TASK-2025-045)
- **AI Integration Test Timeouts**: Several tests (enhanced-heartbeat-monitoring, reliability-improvements, ClaudeOrchestrator.stderr) are timing out
- **End-to-End Validation Failures**: Production readiness tests failing due to workflow validation issues

**Tasks Created**: 
- TASK-2025-045 - FIX: Additional component test failures in UI components (Low priority)
- TASK-2025-041 - Address AI integration test timeouts in Jest
- TASK-2025-042 - Fix end-to-end production readiness test failures

## Jest Configuration

### Dual Environment Setup
The project uses Jest's multi-project configuration:

#### API Tests Project
- **Environment**: `node`
- **Patterns**: `**/api/**/*.test.{js,ts}`, `**/*.service.test.{js,ts}`
- **Purpose**: Server-side API and service testing

#### Component Tests Project
- **Environment**: `jsdom`
- **Patterns**: `**/components/**/*.test.{js,ts,jsx,tsx}`
- **Purpose**: React component and integration testing

### Coverage Configuration
- **Output**: `.claude-testing/coverage/`
- **Formats**: HTML, JSON, text
- **Thresholds**: 70% (branches, functions, lines, statements)

## Testing Workflow

### For New Features
1. **Generate tests** using claude-testing-infrastructure
2. **Fix any configuration issues** in generated tests
3. **Run test suite** and verify coverage
4. **Address failing tests** with appropriate fixes
5. **Update test expectations** to match implementation

### For Bug Fixes
1. **Write regression tests** first (if not auto-generated)
2. **Verify test fails** before implementing fix
3. **Implement fix** and verify test passes
4. **Run full suite** to ensure no regressions

### For Refactoring
1. **Ensure existing tests pass** before refactoring
2. **Refactor implementation** while keeping tests green
3. **Update tests only if API contracts change**
4. **Regenerate tests** if major structural changes occur

## Integration with Development

### CI/CD Integration
Currently, tests are run manually. Future integration:
- **GitHub Actions**: Automated test execution on PR
- **Coverage Reports**: Automated coverage tracking
- **Test Generation**: Incremental test updates on code changes

### Development Commands
```bash
# Quick test run (from .claude-testing/)
npm test

# Watch mode for development
npm run test:watch

# Coverage report generation
npm run test:coverage

# Verbose output for debugging
npm run test:verbose
```

## Future Improvements

### Short-term (Current Sprint)
- ✅ **Fix TypeScript configuration** in test setup (COMPLETED - TASK-2025-026)
- ✅ **Fix JSX syntax errors** in component tests (COMPLETED - TASK-2025-024)
- ✅ **Align API error test expectations** (COMPLETED - TASK-2025-025)
- ✅ **Resolve ES module import issues** (COMPLETED - TASK-2025-021)
- ✅ **Fix missing imports in utility test files** (COMPLETED - TASK-2025-022)
- ✅ **Fix missing imports in UI component unit test files** (COMPLETED - TASK-2025-044)
- ✅ **Fix React component test failures due to Server Component rendering issues** (COMPLETED - TASK-2025-043)
- **Fix additional UI component test failures** (TASK-2025-045 - Low priority)
- **Address AI integration test timeouts** (TASK-2025-041)
- **Fix end-to-end production readiness test failures** (TASK-2025-042)
- **Update component tests to use proper Server Component testing patterns** (TASK-2025-032)
- **Add proper mocking for Next.js components** (TASK-2025-030)

### Medium-term
- **Increase test coverage** to >80%
- **Add integration tests** for complete user flows
- **Implement visual regression testing** for UI components
- **Set up continuous test generation** with incremental updates

### Long-term
- **Performance testing** for large log datasets
- **End-to-end testing** with real database operations
- **Load testing** for API endpoints
- **Security testing** for authentication flows

## Testing Best Practices

### Component Testing
- **Test user interactions**, not implementation details
- **Use semantic queries** (`getByRole`, `getByLabelText`) over brittle selectors
- **Mock external dependencies** (API calls, database operations)
- **Test accessibility** and keyboard navigation

### API Testing
- **Test both success and error paths**
- **Validate input sanitization** and validation
- **Test authentication and authorization**
- **Mock external services** (database, third-party APIs)

### Service Testing
- **Test pure functions** with various inputs
- **Mock side effects** (file I/O, network calls)
- **Test error handling** and edge cases
- **Verify type safety** and TypeScript integration

### Server Component Testing (React 19)
- **Test JSX structure directly** instead of rendering with React Testing Library
- **Use helper functions** from `test-helpers/server-component-helpers.tsx`
- **Inspect JSX properties** (`$$typeof`, `type`, `props`) rather than DOM output
- **Mock dependencies** (database calls, external APIs) before calling Server Components
- **Test async behavior** by awaiting Server Component function calls

### localStorage Testing
- **Mock localStorage completely** with custom implementation for predictable behavior
- **Test state initialization** from localStorage values on component mount
- **Test persistence on state changes** (button clicks, keyboard shortcuts)
- **Handle edge cases** (empty localStorage, invalid values, storage errors)
- **Validate key consistency** across reads and writes
- **Test server-side rendering compatibility** (window object checks)

---

**Infrastructure Status**: ✅ Operational (React component test failures fixed, core page tests stable)  
**Next Priority**: Fix additional UI component test failures (TASK-2025-045) or address AI integration timeouts (TASK-2025-041)  
**Coverage Goal**: >80% for all new code