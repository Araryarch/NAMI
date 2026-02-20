/**
 * Property-based testing setup verification
 * Tests that fast-check is configured correctly
 */

import * as fc from 'fast-check';

describe('Property-Based Testing Setup', () => {
  it('should have fast-check configured correctly', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n === n; // Identity property
      })
    );
  });

  it('should support string generation', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        return s.length >= 0; // Strings have non-negative length
      })
    );
  });

  it('should support array generation', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (arr) => {
        return Array.isArray(arr); // Generated arrays are arrays
      })
    );
  });
});
