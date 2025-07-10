import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/turso';

export async function GET() {
  try {
    const isConnected = await checkDatabaseConnection();
    
    if (isConnected) {
      return NextResponse.json({ 
        status: 'healthy', 
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({ 
        status: 'unhealthy', 
        database: 'disconnected',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}