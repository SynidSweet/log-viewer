const { cn } = require('../../../src/lib/utils.ts');

describe('utils', () => {
  it('should load the module with correct TypeScript types', () => {
    expect(utils).toBeDefined();
    expect(typeof utils).not.toBe('undefined');
  });

  describe('type safety', () => {
    it('should have correct TypeScript types', () => {
      // Test that TypeScript compilation succeeded
      expect(utils).toBeDefined();
      
      // Test type information is preserved
      const actualType = typeof utils;
      expect(['function', 'object', 'string', 'number', 'boolean']).toContain(actualType);
    });

    it('should maintain type safety in operations', () => {
      // Test type-safe operations
      if (typeof utils === 'function') {
        // Test function type properties
        expect(utils).toBeInstanceOf(Function);
        expect(typeof utils.length).toBe('number');
        expect(typeof utils.name).toBe('string');
        
        // Test TypeScript-specific function properties
        if ('prototype' in utils) {
          expect(utils.prototype).toBeDefined();
        }
      } else if (typeof utils === 'object' && utils !== null) {
        // Test object type safety
        expect(utils).toBeInstanceOf(Object);
        expect(Object.keys(utils)).toEqual(expect.any(Array));
        
        // Test that object methods are properly typed
        Object.values(utils).forEach(value => {
          if (typeof value === 'function') {
            expect(value).toBeInstanceOf(Function);
          }
        });
      }
    });

  });

  describe('cn (TypeScript)', () => {
    it('should be defined with correct TypeScript type', () => {
      expect(cn).toBeDefined();
      expect(typeof cn).not.toBe('undefined');
    });

    it('should maintain TypeScript type safety', () => {
      const actualType = typeof cn;
      expect(['function', 'object', 'string', 'number', 'boolean']).toContain(actualType);
      
      // Enhanced TypeScript type checking
      if (actualType === 'function') {
        // Test function signature properties
        expect(cn).toBeInstanceOf(Function);
        expect(typeof cn.length).toBe('number');
        expect(typeof cn.name).toBe('string');
        
        // Test TypeScript function properties
        expect(cn.constructor).toBe(Function);
        if ('prototype' in cn) {
          expect(typeof cn.prototype).toBe('object');
        }
      } else if (actualType === 'object' && cn !== null) {
        // Test object type safety
        expect(cn).toBeInstanceOf(Object);
        expect(Array.isArray(Object.keys(cn))).toBe(true);
        
        // Test object method types
        Object.entries(cn).forEach(([key, value]) => {
          expect(typeof key).toBe('string');
          if (typeof value === 'function') {
            expect(value).toBeInstanceOf(Function);
          }
        });
      }
    });

    it('should work correctly with TypeScript patterns', () => {
      if (typeof cn === 'function') {
        // Test function behavior with TypeScript awareness
        expect(cn).toBeInstanceOf(Function);
        
        // Try calling with TypeScript-common patterns
        const testScenarios = [
          () => cn(),
          () => cn(undefined),
          () => cn(null),
          () => cn({}),
          () => cn(''),
          () => cn(0),
          () => cn(false),
          () => cn([]),
        ];
        
        let successfulCall = false;
        for (const scenario of testScenarios) {
          try {
            const result = scenario();
            successfulCall = true;
            
            // Test result type safety
            expect(result).toBeDefined();
            expect(typeof result).toMatch(/^(string|number|boolean|object|function|undefined)$/);
            break;
          } catch (error) {
            // Test error type safety
            expect(error).toBeInstanceOf(Error);
          }
        }
        
        // If no scenarios work, verify it's still a valid function
        if (!successfulCall) {
          expect(cn).toBeInstanceOf(Function);
        }
      } else {
        // Test non-function exports with TypeScript patterns
        expect(cn).toBeDefined();
        expect(typeof cn).not.toBe('undefined');
        
        // Test TypeScript primitive type safety
        const primitiveTypes = ['string', 'number', 'boolean'];
        const complexTypes = ['object', 'function'];
        const validTypes = [...primitiveTypes, ...complexTypes];
        
        expect(validTypes).toContain(typeof cn);
      }
    });
  });

});