import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/turso';
import { withApiErrorHandling } from '@/lib/api-error-handler';

export async function GET() {
  return withApiErrorHandling(async () => {
    const healthCheck = await checkDatabaseHealth();
    
    if (healthCheck.healthy) {
      return { 
        healthy: true,
        status: 'healthy', 
        database: 'connected',
        details: healthCheck.details,
        timestamp: new Date().toISOString()
      };
    } else {
      // Return unhealthy status but don't throw error (503 handled by wrapper)
      const response = { 
        healthy: false,
        status: 'unhealthy', 
        database: 'disconnected',
        details: healthCheck.details,
        timestamp: new Date().toISOString()
      };
      
      return NextResponse.json(response, { status: 503 });
    }
  }, 'GET /api/health');
}