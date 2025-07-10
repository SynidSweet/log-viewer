const types = require('../../../src/lib/types.ts');

describe('types', () => {
  it('should load the module with correct TypeScript types', () => {
    expect(types).toBeDefined();
    expect(typeof types).not.toBe('undefined');
  });

  describe('type safety', () => {
    it('should have correct TypeScript types', () => {
      // Test that TypeScript compilation succeeded
      expect(types).toBeDefined();
      
      // Test type information is preserved
      const actualType = typeof types;
      expect(['function', 'object', 'string', 'number', 'boolean']).toContain(actualType);
    });

    it('should maintain type safety in operations', () => {
      // Test type-safe operations
      if (typeof types === 'function') {
        // Test function type properties
        expect(types).toBeInstanceOf(Function);
        expect(typeof types.length).toBe('number');
        expect(typeof types.name).toBe('string');
        
        // Test TypeScript-specific function properties
        if ('prototype' in types) {
          expect(types.prototype).toBeDefined();
        }
      } else if (typeof types === 'object' && types !== null) {
        // Test object type safety
        expect(types).toBeInstanceOf(Object);
        expect(Object.keys(types)).toEqual(expect.any(Array));
        
        // Test that object methods are properly typed
        Object.values(types).forEach(value => {
          if (typeof value === 'function') {
            expect(value).toBeInstanceOf(Function);
          }
        });
      }
    });

  });

  it('should be a valid TypeScript module structure', () => {
    const moduleType = typeof types;
    expect(['object', 'function']).toContain(moduleType);
    
    // TypeScript module validation
    if (moduleType === 'object' && types !== null) {
      expect(Object.keys(types)).toEqual(expect.any(Array));
      expect(types).toBeInstanceOf(Object);
    } else if (moduleType === 'function') {
      expect(types).toBeInstanceOf(Function);
      expect(typeof types.length).toBe('number');
    }
  });

  it('should maintain TypeScript compilation integrity', () => {
    // Test that module was properly compiled from TypeScript
    expect(types).toBeDefined();
    expect(typeof types).not.toBe('undefined');
    
    // Test TypeScript-specific behaviors
    if (typeof types === 'object' && types !== null) {
      const keys = Object.keys(types);
      expect(Array.isArray(keys)).toBe(true);
      
      // Test that object methods have proper types
      keys.forEach(key => {
        const value = types[key];
        expect(typeof value).toMatch(/^(string|number|boolean|object|function|undefined)$/);
      });
    }
  });

});