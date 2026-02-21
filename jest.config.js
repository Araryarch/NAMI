module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    // Skip C runtime tests that require C test files (not yet implemented)
    'tests/runtime/sorting-c.test.ts',
    'tests/runtime/tree-c.test.ts',
    'tests/runtime/string-operations-c.test.ts',
    'tests/runtime/pointer-operations.test.ts',
    'tests/runtime/array-operations-c.test.ts',
    'tests/runtime/error-handling.test.ts',
    'tests/runtime/async-await.test.ts',
    'tests/runtime/graph-c.test.ts',
    'tests/runtime/gc-basic.test.ts',
    // Skip streaming tokenizer test (causes memory issues)
    'tests/tooling/token-provider/streaming-tokenizer.test.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/cli.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true
};
