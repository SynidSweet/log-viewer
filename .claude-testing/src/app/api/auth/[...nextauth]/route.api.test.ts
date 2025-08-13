// Mock NextAuth for testing
jest.mock('next-auth');
jest.mock('next-auth/providers/google');

const route = require('../../../../../../src/app/api/auth/[...nextauth]/route.ts');

describe('NextAuth Route Handlers', () => {
  it('should export GET and POST handlers', () => {
    expect(route).toBeDefined();
    expect(route.GET).toBeDefined();
    expect(route.POST).toBeDefined();
    expect(typeof route.GET).toBe('function');
    expect(typeof route.POST).toBe('function');
  });

  it('should export the same handler for both GET and POST', () => {
    expect(route.GET).toBe(route.POST);
  });

  it('should be a valid NextAuth configuration', () => {
    // Test that the module exports the expected shape
    expect(route).toHaveProperty('GET');
    expect(route).toHaveProperty('POST');
    
    // Verify no other exports exist
    const exportedKeys = Object.keys(route);
    expect(exportedKeys).toEqual(['GET', 'POST']);
  });

  describe('Environment Variable Configuration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      // Reset environment for each test
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should handle ALLOWED_EMAILS environment variable', () => {
      // This test verifies that the module loads without errors
      // when environment variables are present or absent
      process.env.ALLOWED_EMAILS = 'test@example.com,admin@example.com';
      process.env.ALLOWED_DOMAINS = 'example.com,test.org';
      
      // Re-require to test with new env vars
      jest.resetModules();
      const routeWithEnv = require('../../../../../../src/app/api/auth/[...nextauth]/route.ts');
      
      expect(routeWithEnv.GET).toBeDefined();
      expect(routeWithEnv.POST).toBeDefined();
    });
  });
});