# Development Workflow

*Last updated: 2025-07-16 | Fixed Jest configuration and updated testing infrastructure*

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
```

### Test Categories
- **API Tests (Node Environment)**: Database operations, error handling, route logic
- **Component Tests (jsdom Environment)**: React components, UI interactions, integration tests
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

### Production
- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js image component
- **Static Generation**: Pre-rendered pages where possible
- **CDN Distribution**: Vercel Edge Network

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