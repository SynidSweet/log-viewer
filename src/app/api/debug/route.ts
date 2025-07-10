import { withApiErrorHandling } from '@/lib/api-error-handler';

export async function GET() {
  return withApiErrorHandling(async () => {
    return {
      hasEnvironmentVars: {
        TURSO_DATABASE_URL: !!process.env.TURSO_DATABASE_URL,
        TURSO_AUTH_TOKEN: !!process.env.TURSO_AUTH_TOKEN,
      },
      databaseUrlPrefix: process.env.TURSO_DATABASE_URL?.substring(0, 20) || 'not set',
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };
  }, 'GET /api/debug');
}