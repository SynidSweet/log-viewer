import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasEnvironmentVars: {
      TURSO_DATABASE_URL: !!process.env.TURSO_DATABASE_URL,
      TURSO_AUTH_TOKEN: !!process.env.TURSO_AUTH_TOKEN,
    },
    databaseUrlPrefix: process.env.TURSO_DATABASE_URL?.substring(0, 20) || 'not set',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}