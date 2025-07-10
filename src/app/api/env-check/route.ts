import { withApiErrorHandling } from '@/lib/api-error-handler';
import { turso } from '@/lib/turso';

/**
 * Environment Variable Check Endpoint
 * 
 * This endpoint helps diagnose environment configuration issues in production.
 * It checks for required Turso database variables and provides masked values
 * for security while still being useful for debugging.
 * 
 * IMPORTANT: This endpoint should be removed or secured after resolving
 * production issues to prevent information disclosure.
 */

interface EnvCheckResult {
  variable: string;
  isSet: boolean;
  maskedValue: string;
  validation?: {
    valid: boolean;
    error?: string;
  };
}

interface EnvCheckResponse {
  environment: string;
  timestamp: string;
  tursoVariables: EnvCheckResult[];
  authVariables: EnvCheckResult[];
  databaseStatus: {
    clientInitialized: boolean;
    connectionTestable: boolean;
    error?: string;
  };
  deploymentInfo: {
    vercelEnv?: string;
    isProduction: boolean;
    nodeVersion: string;
  };
  summary: {
    hasErrors: boolean;
    message: string;
    suggestions?: string[];
  };
}

function maskSensitiveValue(key: string, value: string | undefined): string {
  if (!value) return '<not set>';
  
  // For URLs, show the structure but mask sensitive parts
  if (key.includes('URL')) {
    try {
      const url = new URL(value);
      const hostname = url.hostname.replace(/[a-z0-9]/g, '*');
      return `${url.protocol}//${hostname}`;
    } catch {
      return '<invalid URL>';
    }
  }
  
  // For tokens and secrets, show length and first few characters
  if (key.includes('TOKEN') || key.includes('SECRET') || key.includes('KEY')) {
    return `${value.substring(0, 8)}...<${value.length} chars>`;
  }
  
  // For other values, show partially
  if (value.length > 20) {
    return `${value.substring(0, 10)}...<${value.length} chars>`;
  }
  
  return value;
}

function validateTursoUrl(url: string | undefined): { valid: boolean; error?: string } {
  if (!url) return { valid: false, error: 'URL is not set' };
  
  try {
    const parsed = new URL(url);
    
    // Check protocol
    if (!['libsql:', 'https:', 'http:'].includes(parsed.protocol)) {
      return { valid: false, error: `Invalid protocol: ${parsed.protocol}` };
    }
    
    // Check hostname format for Turso
    if (!parsed.hostname.includes('.turso.io') && !parsed.hostname.includes('localhost')) {
      return { valid: false, error: 'URL does not appear to be a valid Turso database URL' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

function validateTursoToken(token: string | undefined): { valid: boolean; error?: string } {
  if (!token) return { valid: false, error: 'Token is not set' };
  
  // Basic JWT structure validation
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Token does not appear to be a valid JWT (expected 3 parts)' };
  }
  
  // Check if it's a reasonable length
  if (token.length < 100) {
    return { valid: false, error: 'Token appears too short to be valid' };
  }
  
  return { valid: true };
}

function checkEnvironmentVariable(name: string): EnvCheckResult {
  const value = process.env[name];
  const result: EnvCheckResult = {
    variable: name,
    isSet: !!value,
    maskedValue: maskSensitiveValue(name, value)
  };
  
  // Add validation for specific variables
  if (name === 'TURSO_DATABASE_URL' && value) {
    result.validation = validateTursoUrl(value);
  } else if (name === 'TURSO_AUTH_TOKEN' && value) {
    result.validation = validateTursoToken(value);
  }
  
  return result;
}

export async function GET() {
  return withApiErrorHandling(
    async () => {
      const tursoVars = [
        'TURSO_DATABASE_URL',
        'TURSO_AUTH_TOKEN'
      ];
      
      const authVars = [
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL'
      ];
      
      const tursoResults = tursoVars.map(checkEnvironmentVariable);
      const authResults = authVars.map(checkEnvironmentVariable);
      
      // Check for errors
      const hasErrors = tursoResults.some(r => !r.isSet || (r.validation && !r.validation.valid));
      
      // Generate suggestions based on errors found
      const suggestions: string[] = [];
      
      tursoResults.forEach(result => {
        if (!result.isSet) {
          suggestions.push(`Set ${result.variable} in Vercel Dashboard → Settings → Environment Variables`);
        } else if (result.validation && !result.validation.valid) {
          suggestions.push(`Fix ${result.variable}: ${result.validation.error}`);
        }
      });
      
      if (hasErrors) {
        suggestions.push('After setting/updating variables, redeploy your application');
        suggestions.push('Use Turso CLI to get your database URL and auth token: turso db show <database-name>');
      }
      
      // Test database client status
      const databaseStatus = {
        clientInitialized: !!turso,
        connectionTestable: false,
        error: undefined as string | undefined
      };
      
      if (!turso) {
        databaseStatus.error = 'Database client not initialized (missing environment variables)';
      }
      
      const response: EnvCheckResponse = {
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        tursoVariables: tursoResults,
        authVariables: authResults,
        databaseStatus,
        deploymentInfo: {
          vercelEnv: process.env.VERCEL_ENV,
          isProduction: process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production',
          nodeVersion: process.version
        },
        summary: {
          hasErrors,
          message: hasErrors 
            ? 'Critical Turso environment variables are missing or invalid!'
            : 'All required Turso variables are configured correctly.',
          suggestions: hasErrors ? suggestions : undefined
        }
      };
      
      // Add deployment-specific information if available
      const result: Record<string, unknown> = {
        ...response,
        ...(process.env.VERCEL_ENV ? { vercelEnvironment: process.env.VERCEL_ENV } : {})
      };
      
      return result;
    },
    'checkEnvironmentVariables'
  );
}