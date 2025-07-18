# Next.js Testing Patterns and Mocking Best Practices

*Last updated: 2025-07-18 | Testing Infrastructure & Technical Debt Sprint*

## Overview

This document outlines the established testing patterns for Next.js 15 applications with React 19, focusing on Client Components, Server Components, and comprehensive mocking strategies. These patterns were developed and validated during TASK-2025-030 to ensure reliable test execution across the entire application.

## Table of Contents

1. [Client Component Testing](#client-component-testing)
2. [Server Component Testing](#server-component-testing)
3. [Mocking Strategies](#mocking-strategies)
4. [Jest Configuration](#jest-configuration)
5. [Best Practices](#best-practices)
6. [Common Patterns](#common-patterns)
7. [Troubleshooting](#troubleshooting)

## Client Component Testing

### Basic Client Component Test Pattern

For components with `'use client'` directives, use the CommonJS import pattern:

```tsx
// Example: log-item.comprehensive.test.tsx
const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
require('@testing-library/jest-dom');

// Import the component using CommonJS
const { LogItem } = require('../../../../src/components/log-viewer/log-item');

// Mock dependencies before tests
jest.mock('../../../../src/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="tooltip-content">{children}</div>
}));

describe('LogItem Component', () => {
  const mockLog = {
    id: 'log-123',
    projectId: 'project-456',
    timestamp: '2025-01-17T14:30:00Z',
    comment: 'Test log entry with important data',
    isRead: false,
    content: '[2025-01-17, 14:30:00] [INFO] Test message'
  };

  const defaultProps = {
    log: mockLog,
    isSelected: false,
    onSelectLog: jest.fn(),
    onDeleteLog: jest.fn(),
    onToggleReadStatus: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render log comment', () => {
    render(<LogItem {...defaultProps} />);
    expect(screen.getByText('Test log entry with important data')).toBeInTheDocument();
  });

  it('should handle click interactions', async () => {
    render(<LogItem {...defaultProps} />);
    
    const logElement = screen.getByTestId(`log-item-${mockLog.id}`);
    fireEvent.click(logElement);
    
    await waitFor(() => {
      expect(defaultProps.onSelectLog).toHaveBeenCalledWith(mockLog.id);
    });
  });
});
```

### Key Requirements for Client Components

1. **Use CommonJS imports** (`require()`) instead of ES6 imports
2. **Mock all external dependencies** before component import
3. **Provide all required props** in defaultProps object
4. **Use `data-testid` attributes** for reliable element selection
5. **Clear mocks in `beforeEach`** to ensure test isolation

### Complex Client Component Testing

For components with multiple dependencies and API calls:

```tsx
// Example: index.comprehensive.test.tsx (LogViewer)
const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
require('@testing-library/jest-dom');

// Mock child components to isolate testing
jest.mock('../../../../src/components/log-viewer/log-item', () => ({
  LogItem: jest.fn(({ log, isSelected, onSelectLog, onDeleteLog, onToggleReadStatus }) => (
    <div 
      data-testid={`log-item-${log.id}`}
      onClick={() => onSelectLog(log.id)}
      className={isSelected ? 'selected' : ''}
    >
      <span>{log.comment || 'Unnamed log'}</span>
      <button 
        data-testid={`delete-${log.id}`}
        onClick={(e) => { e.stopPropagation(); onDeleteLog(log.id); }}
      >
        Delete
      </button>
    </div>
  ))
}));

// Mock fetch and localStorage
global.fetch = jest.fn();
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('LogViewer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    fetch.mockClear();
  });

  it('should fetch and display logs on mount', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockLogs })
    });

    render(<LogViewer projectId={mockProjectId} />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`/api/projects/${mockProjectId}/logs`);
    });
  });
});
```

## Server Component Testing

Server Components are tested differently - they are treated as functions that return JSX:

```tsx
// Example: page.component.test.tsx
const React = require('react');
const { render } = require('@testing-library/react');
require('@testing-library/jest-dom');

// Mock next/navigation for server components
jest.mock('next/navigation', () => require('../../../../__mocks__/next/navigation'));

// Import the server component
const Page = require('../../../../src/app/page');

describe('Page Component', () => {
  it('should render without crashing', () => {
    // Test server component as a function
    const jsx = Page();
    expect(jsx).toBeDefined();
    expect(jsx.type).toBeDefined();
  });

  it('should have correct JSX structure', () => {
    const jsx = Page();
    expect(jsx.props.children).toBeDefined();
  });
});
```

### Server Component Testing Pattern

1. **Import using CommonJS** (`require()`)
2. **Call component as a function** (not with `render()`)
3. **Check JSX structure** directly
4. **Mock Next.js navigation** and other server-side dependencies

## Mocking Strategies

### Next.js Navigation Mocking

```javascript
// __mocks__/next/navigation.js
const useRouter = () => ({
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
});

const usePathname = () => '/test-path';
const useSearchParams = () => new URLSearchParams();
const useParams = () => ({});

module.exports = {
  useRouter,
  usePathname,
  useSearchParams,
  useParams
};
```

### NextAuth.js Mocking

```javascript
// __mocks__/next-auth/react.js
const React = require('react');

const mockSession = {
  user: {
    name: 'Test User',
    email: 'test@example.com',
    image: null
  },
  expires: '2025-12-31T00:00:00.000Z'
};

const SessionProvider = ({ children }) => {
  return React.createElement(React.Fragment, null, children);
};

const useSession = () => ({
  data: mockSession,
  status: 'authenticated',
  update: jest.fn()
});

const signIn = jest.fn().mockResolvedValue({
  error: null,
  status: 200,
  ok: true,
  url: null
});

const signOut = jest.fn().mockResolvedValue({
  url: null
});

module.exports = {
  SessionProvider,
  useSession,
  signIn,
  signOut,
  getSession: jest.fn().mockResolvedValue(mockSession)
};
```

### Sonner Toast Mocking

```javascript
// __mocks__/sonner.js
const toast = jest.fn((message) => {
  console.log('Toast:', message);
});

toast.success = jest.fn((message) => {
  console.log('Toast success:', message);
});

toast.error = jest.fn((message) => {
  console.log('Toast error:', message);
});

toast.promise = jest.fn((promise, messages) => {
  console.log('Toast promise:', messages);
  return promise;
});

module.exports = { toast };
```

### Next.js Font Mocking

```javascript
// __mocks__/next/font/google.js
const createMockFont = (fontName) => ({
  className: `mock-${fontName.toLowerCase()}`,
  style: { fontFamily: fontName },
  variable: `--mock-${fontName.toLowerCase()}`,
});

const Inter = () => createMockFont('Inter');
const Roboto = () => createMockFont('Roboto');

module.exports = () => createMockFont('GoogleFont');
module.exports.Inter = Inter;
module.exports.Roboto = Roboto;
```

## Jest Configuration

### Critical Jest Configuration Elements

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/.claude-testing/setupTests.js'],
  
  // CRITICAL: Force React to use main project's React instance
  moduleNameMapper: {
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },

  // Transform configuration for Next.js
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript'
      ]
    }]
  },

  // Test environment setup
  testEnvironmentOptions: {
    customExportConditions: ['']
  },

  // Separate environments for different test types
  projects: [
    {
      displayName: 'component-tests',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/.claude-testing/**/components/**/*.test.{js,ts,jsx,tsx}']
    },
    {
      displayName: 'api-tests',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/.claude-testing/**/api/**/*.test.{js,ts,jsx,tsx}']
    }
  ]
};
```

### Setup File Configuration

```javascript
// setupTests.js
// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// React testing configuration
try {
  require('@testing-library/jest-dom');
} catch (e) {
  // @testing-library/jest-dom not available - using basic matchers
}

// Mock window.matchMedia for responsive components
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}
```

## Best Practices

### 1. Component Testing Best Practices

- **Always provide required props** in a `defaultProps` object
- **Use `data-testid` attributes** for reliable element selection
- **Mock all external dependencies** before component import
- **Clear mocks in `beforeEach`** to ensure test isolation
- **Use `waitFor` for async operations** and API calls
- **Test props, interactions, and state changes** separately

### 2. Mock Management

- **Create dedicated mock files** in `__mocks__/` directory for complex components
- **Use CommonJS exports** in mock files for compatibility
- **Mock at the top level** before any imports
- **Provide realistic mock data** that matches expected interfaces

### 3. Async Testing

```tsx
// Testing async operations
it('should handle async operations', async () => {
  const mockResponse = { success: true, data: mockData };
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockResponse
  });

  render(<AsyncComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
  
  expect(fetch).toHaveBeenCalledWith('/api/data');
});
```

### 4. Error Handling Testing

```tsx
// Testing error states
it('should handle errors gracefully', async () => {
  fetch.mockRejectedValueOnce(new Error('Network error'));
  
  render(<Component />);
  
  await waitFor(() => {
    expect(screen.getByText('Error loading data')).toBeInTheDocument();
  });
});
```

## Common Patterns

### 1. Basic UI Component Test

```tsx
const React = require('react');
const { render, screen } = require('@testing-library/react');
require('@testing-library/jest-dom');

const { Button } = require('../../../../src/components/ui/button');

describe('Button', () => {
  it('should render without crashing', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2. Form Component Testing

```tsx
it('should handle form submissions', async () => {
  const onSubmit = jest.fn();
  render(<FormComponent onSubmit={onSubmit} />);
  
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'test@example.com' }
  });
  
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
  
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com'
    });
  });
});
```

### 3. Hook Testing

```tsx
// Testing custom hooks
const { renderHook, act } = require('@testing-library/react');
const { useCustomHook } = require('../../../../src/hooks/useCustomHook');

describe('useCustomHook', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useCustomHook());
    expect(result.current.value).toBe(initialValue);
  });

  it('should update state', () => {
    const { result } = renderHook(() => useCustomHook());
    
    act(() => {
      result.current.setValue('new value');
    });
    
    expect(result.current.value).toBe('new value');
  });
});
```

## Troubleshooting

### Common Issues and Solutions

1. **React Hook Errors in Tests**
   - Solution: Use CommonJS imports (`require()`) instead of ES6 imports
   - Ensure all mocks are set up before component import

2. **Missing Props Errors**
   - Solution: Always provide all required props in tests
   - Use TypeScript to verify prop requirements

3. **Async Operation Timeout**
   - Solution: Use `waitFor()` for async operations
   - Increase Jest timeout if needed: `jest.setTimeout(10000)`

4. **Mock Not Working**
   - Solution: Ensure mocks are defined before imports
   - Check mock file path and naming conventions

5. **Navigation Hook Errors**
   - Solution: Always mock Next.js navigation hooks
   - Use the established navigation mock pattern

### Debug Tips

1. **Use `screen.debug()`** to see the rendered output
2. **Check mock call history** with `jest.mock.calls`
3. **Verify mock setup** with `console.log` in mock functions
4. **Use `data-testid`** attributes for reliable element selection

## Conclusion

These testing patterns have been validated across the entire application and provide a solid foundation for testing Next.js components with React 19. The key to success is:

1. **Consistent use of CommonJS imports** for Client Components
2. **Comprehensive mocking** of all external dependencies
3. **Proper prop management** with default values
4. **Clear test isolation** with proper cleanup

Following these patterns will ensure reliable, maintainable tests that work consistently across different environments and CI/CD pipelines.

## References

- [TASK-2025-030: Next.js Component Test Mocking](../planning/tasks/TASK-2025-030.md)
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Configuration Guide](https://jestjs.io/docs/configuration)
- [Next.js Testing Documentation](https://nextjs.org/docs/app/building-your-application/testing)