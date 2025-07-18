import { createProject } from '@/lib/db-turso';
import { withApiErrorHandling } from '@/lib/api-error-handler';

export async function GET() {
  return withApiErrorHandling(async () => {
    
    const testProject = await createProject('test-project-' + Date.now(), 'Test project for debugging');
    
    return {
      success: true,
      project: testProject,
      message: 'Project creation works!'
    };
  });
}