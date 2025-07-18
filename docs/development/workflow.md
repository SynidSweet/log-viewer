# Development Workflow

*Last updated: 2025-07-18 | Updated bundle analysis script - removed deprecated swcMinify option for Next.js 15 compatibility*

## Environment Setup

### Prerequisites
- **Node.js**: Version 18+ (project uses React 19 and Next.js 15)
- **npm**: Package manager (included with Node.js)
- **Git**: Version control
- **Turso Account**: For SQLite database hosting
- **Vercel Account**: For deployment (optional)

### Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd log-viewer

# Install dependencies
npm install

# Create environment file
cp env.example .env.local
```

### Environment Configuration
Required environment variables in `.env.local`:

```bash
# Turso Database
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NextAuth.js
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Optional Access Control
ALLOWED_EMAILS=email1@domain.com,email2@domain.com
ALLOWED_DOMAINS=domain1.com,domain2.com
```

## Development Commands

### Core Commands
```bash
# Start development server with Turbopack
npm run dev

# Build for production (includes automatic database initialization)
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Database management
npm run db:init      # Initialize database manually
npm run db:migrate   # Run pending migrations
npm run db:status    # Check migration status

# Performance testing
npm run test:performance      # Run Jest performance test suite
npm run benchmark:performance # Run standalone performance benchmarks
npm run ci:performance        # Combined CI/CD performance testing
npm run validate:performance  # Manual performance validation script
```

### Development Server
- **URL**: http://localhost:3000
- **Features**: Hot reload, Turbopack fast refresh, TypeScript checking
- **API**: All endpoints available at `/api/*`
- **Environment Validation**: Use `npm run verify-env` to check configuration

## Testing Strategy

### Current State
- **✅ Jest Configuration**: Fully operational with TypeScript support and dual environments
- **✅ Testing Infrastructure**: External `.claude-testing/` directory with Jest + React Testing Library
- **✅ Multi-Environment Support**: Node.js for API tests, jsdom for React component tests
- **✅ Module Resolution**: Working `@/` aliases and proper TypeScript integration
- **Type checking via TypeScript**
- **Linting via ESLint**

### Testing Infrastructure Setup
1. **Testing Directory**: `.claude-testing/` - External test setup maintaining project integrity
2. **Test Framework**: Jest with ts-jest transform and dual project configuration
3. **TypeScript Support**: Custom `tsconfig.test.json` with Jest types and proper module resolution
4. **Environment Separation**: API tests (Node) vs component tests (jsdom)

### Jest Configuration Features
- **Dual Environment Projects**: Automatically runs API tests in Node, component tests in jsdom
- **TypeScript Integration**: Full ts-jest support with proper type checking
- **Module Resolution**: `@/` path aliases working correctly
- **Coverage Collection**: Configured for parent `src/` directory
- **Setup Files**: Environment-aware setup with proper window/global mocking

### Running Tests
```bash
# Navigate to test directory
cd .claude-testing

# Install test dependencies (if not already done)
npm install

# Run all tests with Jest project separation
npm test

# Run specific test patterns
npm test -- --testPathPattern=utility.test    # API utility tests
npm test -- --testPathPattern=component.test  # React component tests
npm test -- --testPathPattern=comprehensive   # Comprehensive API tests

# Run with coverage
npm test -- --coverage

# Performance testing (from project root)
cd ..
npm run test:performance      # Jest performance tests
npm run benchmark:performance # Standalone benchmarks
npm run ci:performance        # Combined CI/CD testing
```

### Test Categories
- **API Tests (Node Environment)**: Database operations, error handling, route logic
- **Component Tests (jsdom Environment)**: React components, UI interactions, integration tests
- **Performance Tests**: Filtering optimization benchmarks, React.memo validation, memory usage
- **Utility Tests**: Helper functions, type safety, module loading
- **Integration Tests**: End-to-end scenarios across multiple components

### Manual Testing Checklist
- [ ] **Authentication**: Google OAuth login/logout
- [ ] **Project Management**: Create, edit, delete projects
- [ ] **Log Submission**: POST to `/api/logs` with valid API key
- [ ] **Log Viewing**: Three-column interface functionality
- [ ] **Log Parsing**: Multi-line logs with JSON data
- [ ] **Filtering**: Search and level filtering
- [ ] **Sort Functionality**: Ascending/descending toggle with visual indicators
- [ ] **Read Status**: Mark logs as read/unread
- [ ] **Log Levels**: Verify LOG, ERROR, INFO, WARN, DEBUG support
- [ ] **Tag Display**: Check badge rendering for _tags field (when implemented)

## CI/CD Integration

### GitHub Actions Workflows

#### Performance Testing (`.github/workflows/performance.yml`)
- **Trigger**: Push to main/develop, PRs affecting performance-critical files
- **Purpose**: Automated performance benchmarking and regression detection
- **Features**:
  - **Integration Performance Tests**: Real user interaction testing with LogViewer components
  - **Performance Benchmarks**: Isolated operation testing (search, filtering, sorting)
  - **Threshold Validation**: Render <1000ms, selection <200ms, search <150ms, memory <4x
  - **PR Comment Reports**: Detailed performance analysis with pass/fail status
  - **Regression Detection**: Automated comparison against historical baselines
  - **Artifact Storage**: 30-day retention for trend analysis
  - **Configurable Gates**: Soft failure by default, hard failure option available

#### Performance Monitoring (`.github/workflows/performance-monitoring.yml`)
- **Trigger**: Daily schedule (02:00 UTC), manual dispatch
- **Purpose**: Long-term performance trend analysis and regression alerts
- **Features**:
  - Historical performance tracking
  - Automated issue creation for performance regressions
  - Trend analysis with optimization recommendations
  - Performance baseline management

### Performance Configuration
- **Central Config**: `.claude-testing/performance-config.json`
- **Thresholds**: Configurable performance limits and alerts
- **CI/CD Settings**: Automated testing parameters and reporting options
- **Documentation**: `.github/workflows/README.md` for workflow usage

### Integration with Development
- **Pre-PR Testing**: Run `npm run test:performance:integration` and `npm run ci:performance` before creating PRs
- **Performance Validation**: Review automated PR comments for performance impact analysis
- **Regression Monitoring**: Automated GitHub issue creation for performance degradation
- **Historical Analysis**: Performance trends and detailed reports in GitHub Actions artifacts
- **CI/CD Documentation**: Complete workflow documentation available in `.github/workflows/README.md`

### CI/CD Workflow Usage

#### Triggering Performance Tests
**Automatic Triggers**:
- Push to `main` or `develop` branches
- Pull requests affecting performance-critical files:
  - `src/components/log-viewer/**`
  - `src/app/api/**`
  - `src/lib/**`
  - Performance test files in `.claude-testing/`

**Manual Triggers**:
- Use GitHub Actions "workflow_dispatch" trigger
- Comment `/run-performance-tests` in PR (if configured)

#### Reading Performance Results
**PR Comments**: Automated performance analysis includes:
- **Performance Test Results**: Pass/fail status for each test suite
- **Threshold Validation**: Comparison against configured performance budgets
- **Regression Analysis**: Comparison with historical baselines
- **Detailed Metrics**: Response times, memory usage, render performance
- **Recommendations**: Optimization suggestions for performance issues

**GitHub Actions Artifacts**: Download detailed reports including:
- Raw performance data (JSON format)
- Trend analysis graphs
- Comprehensive test logs
- Performance profiling data

#### Configuring Performance Thresholds
**Edit `.claude-testing/performance-config.json`**:
```json
{
  "thresholds": {
    "operations": {
      "search": { "max_time_ms": 100 },
      "levelFilter": { "max_time_ms": 50 },
      "sort": { "max_time_ms": 100 },
      "combined": { "max_time_ms": 150 }
    },
    "memory": {
      "max_growth_factor": 2.0,
      "max_peak_mb": 100
    },
    "integration": {
      "render_max_ms": 1000,
      "selection_max_ms": 200,
      "search_max_ms": 150,
      "memory_max_factor": 4.0
    }
  },
  "ci": {
    "enable_performance_gate": false,
    "fail_on_regression": true,
    "regression_threshold": 1.2
  }
}
```

#### Debugging Performance Issues in CI/CD
**Common Issues**:
1. **Performance Gate Failures**: Review threshold settings and recent changes
2. **Memory Growth Alerts**: Check for memory leaks in new code
3. **Render Time Regressions**: Analyze component changes and React optimizations
4. **Bundle Size Increases**: Review dependency changes and bundle analysis

**Debugging Steps**:
1. **Download Artifacts**: Access detailed performance reports from GitHub Actions
2. **Local Reproduction**: Run `npm run test:performance:integration` locally
3. **Profiling**: Use `npm run profile:react` for React DevTools profiler analysis
4. **Comparison**: Compare results with baseline using `npm run regression:detect`

#### Handling Performance Regressions
**Automated Alerts**: GitHub issues are automatically created for:
- Performance degradation >20% from baseline
- Memory growth exceeding configured thresholds
- Bundle size increases beyond limits
- Critical performance test failures

**Response Process**:
1. **Triage**: Review automated issue details and performance data
2. **Analysis**: Identify root cause using provided profiling data
3. **Fix**: Implement optimizations or adjust thresholds if justified
4. **Validation**: Verify fix with local testing before PR
5. **Monitoring**: Track improvement in subsequent CI/CD runs

📖 **See complete CI/CD documentation**: [`.github/workflows/README.md`](../../.github/workflows/README.md)

## Git Workflow

### Branch Strategy
- **main**: Production-ready code
- **feature/***: New features and improvements
- **bugfix/***: Bug fixes
- **hotfix/***: Critical production fixes

### Commit Conventions
Follow existing commit patterns:
```bash
docs: Add nested JSON support documentation
feat: Add email login/authentication
fix: Fixed linter errors
refactor: Added suspense boundaries for vercel
```

### Pre-commit Hooks
Configured with Husky and lint-staged:
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "git add"]
  }
}
```

## Build Process

### Development Build
```bash
npm run dev
```
- **Turbopack**: Fast development builds
- **Hot Reload**: Instant updates on file changes
- **TypeScript**: Real-time type checking
- **ESLint**: Code quality warnings

### Production Build
```bash
npm run build
```
- **Next.js Optimization**: Automatic optimizations
- **Static Generation**: Pre-rendered pages
- **Bundle Analysis**: Size optimization
- **Type Checking**: Full TypeScript validation

### Build Output
```
.next/
├── static/           # Static assets
├── server/          # Server-side code
└── standalone/      # Standalone deployment
```

## Deployment

### Vercel Platform
1. **Connect Repository**: Link GitHub repository
2. **Environment Variables**: Configure in Vercel dashboard
3. **Automatic Deployment**: Push to main branch
4. **Preview Deployments**: Pull request previews

### Manual Deployment
```bash
# Build application
npm run build

# Deploy to Vercel
vercel --prod
```

### Environment Setup
- **Development**: `.env.local` file
- **Production**: Vercel environment variables
- **Staging**: Preview deployments with environment overrides

## Code Quality

### ESLint Configuration
```javascript
// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Debugging

### Development Tools
- **React Developer Tools**: Browser extension
- **Next.js DevTools**: Built-in debugging
- **Network Inspector**: API request monitoring
- **Console Logging**: Strategic console.log placement

### Common Issues
1. **Authentication Errors**: Check Google OAuth configuration
2. **Database Connection**: Verify Turso database URL and auth token
3. **API Key Issues**: Ensure project API keys are correct
4. **Build Failures**: Check TypeScript errors and ESLint issues
5. **Environment Variables**: Use `/api/env-check` endpoint to verify configuration

### Troubleshooting Steps
1. **Check Environment**: Verify all required environment variables (Turso database credentials)
2. **Clear Cache**: Delete `.next` folder and rebuild
3. **Dependency Issues**: Remove `node_modules` and reinstall
4. **Console Errors**: Check browser console for client-side errors
5. **API Logs**: Check deployment platform function logs for server errors

## Performance Optimization

### Development
- **Turbopack**: Fast development builds
- **Selective Compilation**: Only compile changed files
- **Memory Management**: Efficient hot reload
- **Performance Testing**: Integrated benchmarking with `npm run test:performance`

### Production
- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js image component
- **Static Generation**: Pre-rendered pages where possible
- **CDN Distribution**: Vercel Edge Network

### Component Performance
- **React.memo**: Optimized LogEntryList and LogItem components
- **Memoization**: Timestamp formatting and expensive calculations cached
- **Callback Stability**: useCallback for event handlers to prevent re-renders
- **Performance Monitoring**: Automated CI/CD benchmarking and regression detection

### Performance Benchmarking
- **Automated Testing**: GitHub Actions workflows for continuous performance monitoring
- **Threshold Validation**: All operations <100ms (actual: <1ms)
- **Memory Monitoring**: Growth factor tracking (<2.0x threshold)
- **Regression Detection**: Daily monitoring with automated issue creation

### Bundle Analysis
- **Analysis Script**: `scripts/analyze-bundle.js` - automated bundle size analysis
- **Configuration**: Next.js 15 compatible (deprecated `swcMinify` option removed)
- **Usage**: Run `npm run analyze` to generate bundle reports
- **Features**: Code splitting visualization, dependency size analysis, optimization recommendations

## Security Considerations

### Development
- **Environment Variables**: Never commit secrets
- **API Keys**: Use development keys for local testing
- **HTTPS**: Use HTTPS in production environment URLs

### Production
- **OAuth Configuration**: Proper redirect URIs
- **API Key Rotation**: Regular key rotation strategy
- **Access Control**: Email/domain restrictions
- **Rate Limiting**: Vercel platform limits

This workflow ensures consistent development practices and maintains code quality throughout the project lifecycle.