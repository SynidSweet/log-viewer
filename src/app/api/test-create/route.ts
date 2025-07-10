import { NextResponse } from 'next/server';
import { createProject } from '@/lib/db-turso';

export async function GET() {
  try {
    console.log('Testing project creation...');
    
    const testProject = await createProject('test-project-' + Date.now(), 'Test project for debugging');
    
    return NextResponse.json({
      success: true,
      project: testProject,
      message: 'Project creation works!'
    });
  } catch (error) {
    console.error('Test project creation failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack',
      name: error instanceof Error ? error.name : 'Unknown error type'
    }, { status: 500 });
  }
}