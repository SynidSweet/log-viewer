# Development Workflow

*Last updated: 2025-07-10 | Complete development setup and workflow guide*

## Environment Setup

### Prerequisites
- **Node.js**: Version 18+ (project uses React 19 and Next.js 15)
- **npm**: Package manager (included with Node.js)
- **Git**: Version control
- **Vercel Account**: For KV database and deployment

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
# Vercel KV Database
KV_URL=your-kv-url
KV_REST_API_URL=your-kv-rest-api-url  
KV_REST_API_TOKEN=your-kv-rest-api-token
KV_REST_API_READ_ONLY_TOKEN=your-kv-rest-api-read-only-token

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

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

### Development Server
- **URL**: http://localhost:3000
- **Features**: Hot reload, Turbopack fast refresh, TypeScript checking
- **API**: All endpoints available at `/api/*`

## Testing Strategy

### Current State
- **No test framework configured**
- **Manual testing workflow**
- **Type checking via TypeScript**
- **Linting via ESLint**

### Recommended Testing Setup
If implementing tests, consider:

1. **Clone testing infrastructure**:
```bash
git clone https://github.com/SynidSweet/claude-testing-infrastructure.git
```

2. **Follow setup guide**: `claude-testing-infrastructure/AI_AGENT_GUIDE.md`

3. **Test categories**:
   - **Unit Tests**: Component logic and utilities
   - **Integration Tests**: API endpoints and database operations
   - **E2E Tests**: Complete user workflows

### Manual Testing Checklist
- [ ] **Authentication**: Google OAuth login/logout
- [ ] **Project Management**: Create, edit, delete projects
- [ ] **Log Submission**: POST to `/api/logs` with valid API key
- [ ] **Log Viewing**: Three-column interface functionality
- [ ] **Log Parsing**: Multi-line logs with JSON data
- [ ] **Filtering**: Search and level filtering
- [ ] **Read Status**: Mark logs as read/unread

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
2. **Database Connection**: Verify Vercel KV environment variables
3. **API Key Issues**: Ensure project API keys are correct
4. **Build Failures**: Check TypeScript errors and ESLint issues

### Troubleshooting Steps
1. **Check Environment**: Verify all required environment variables
2. **Clear Cache**: Delete `.next` folder and rebuild
3. **Dependency Issues**: Remove `node_modules` and reinstall
4. **Console Errors**: Check browser console for client-side errors
5. **API Logs**: Check Vercel function logs for server errors

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