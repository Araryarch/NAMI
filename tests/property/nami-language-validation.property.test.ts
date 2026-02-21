/**
 * Property-Based Tests - Nami Language Validation
 *
 * This file contains two types of property tests:
 *
 * 1. Bug Condition Exploration Test (Property 1)
 *    **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 *    CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 *
 * 2. Preservation Property Tests (Property 2)
 *    **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 *    These tests capture baseline behavior on UNFIXED code and ensure it's preserved
 *    EXPECTED OUTCOME: Tests PASS on unfixed code (establishing baseline to preserve)
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Baseline behavior captured from UNFIXED code (observation-first methodology)
 *
 * These observations were made by running CLI commands on existing examples:
 * - hello.nm: check succeeds, ast succeeds, build succeeds, run/compile fail with C errors
 * - test-cli.nm: check succeeds, run/compile fail with C errors
 * - test-error.nm: check fails with parse error (expected - intentional syntax error)
 */
const BASELINE_BEHAVIOR = {
  'hello.nm': {
    check: { succeeds: true, statements: 13 },
    ast: { succeeds: true, hasOutput: true },
    build: { succeeds: true, generatesFiles: true },
    run: { succeeds: true, hasCCompilationError: false },
    compile: { succeeds: true, hasCCompilationError: false },
  },
  'test-cli.nm': {
    check: { succeeds: true },
    run: { succeeds: true, hasCCompilationError: false },
    compile: { succeeds: true, hasCCompilationError: false },
  },
  'test-error.nm': {
    check: { succeeds: false, hasParseError: true },
  },
};

describe('Property 1: Fault Condition - Comprehensive Examples with Expected Output', () => {
  const examplesDir = path.join(process.cwd(), 'examples');

  // Feature categories that should have comprehensive examples
  const featureCategories = [
    'variables',
    'functions',
    'control_flow',
    'arrays',
    'objects',
    'operators',
    'io_operations',
    'error_handling',
    'nami_features',
  ];

  /**
   * Helper function to check if an example file exists for a feature category
   */
  function exampleFileExists(category: string): boolean {
    const possibleNames = [
      `${category}.nm`,
      `${category.replace('_', '-')}.nm`,
      `test-${category}.nm`,
      `test-${category.replace('_', '-')}.nm`,
    ];

    return possibleNames.some((name) => {
      const filePath = path.join(examplesDir, name);
      return fs.existsSync(filePath);
    });
  }

  /**
   * Helper function to get the example file path for a category
   */
  function getExampleFilePath(category: string): string | null {
    const possibleNames = [
      `${category}.nm`,
      `${category.replace('_', '-')}.nm`,
      `test-${category}.nm`,
      `test-${category.replace('_', '-')}.nm`,
    ];

    for (const name of possibleNames) {
      const filePath = path.join(examplesDir, name);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }

    return null;
  }

  /**
   * Helper function to check if a file has expected output documentation
   */
  function hasExpectedOutputDocumentation(filePath: string): boolean {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Check for expected output comments in various formats
    const expectedOutputPatterns = [
      /\/\/\s*Expected output:/i,
      /\/\/\s*Output:/i,
      /\/\*\s*Expected output:/i,
      /\/\*\s*Output:/i,
    ];

    return expectedOutputPatterns.some((pattern) => pattern.test(content));
  }

  /**
   * Helper function to check if a file can be executed successfully
   */
  function canExecuteSuccessfully(filePath: string): boolean {
    try {
      // Try to run the file using nami run command
      // We use nami check first to see if it's valid
      execSync(`node lib/cli.js check ${filePath}`, {
        stdio: 'pipe',
        timeout: 5000,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  it('should have comprehensive example files for all feature categories', () => {
    // This test will FAIL on unfixed code because most feature categories lack examples
    const missingCategories: string[] = [];
    const categoriesWithoutDocs: string[] = [];
    const categoriesWithExecutionIssues: string[] = [];

    for (const category of featureCategories) {
      // Check if example file exists
      if (!exampleFileExists(category)) {
        missingCategories.push(category);
        continue;
      }

      const filePath = getExampleFilePath(category);
      if (!filePath) {
        missingCategories.push(category);
        continue;
      }

      // Check if it has expected output documentation
      if (!hasExpectedOutputDocumentation(filePath)) {
        categoriesWithoutDocs.push(category);
      }

      // Check if it can be executed successfully
      if (!canExecuteSuccessfully(filePath)) {
        categoriesWithExecutionIssues.push(category);
      }
    }

    // Report all counterexamples found
    if (missingCategories.length > 0) {
      console.log('\n=== COUNTEREXAMPLES FOUND ===');
      console.log('Missing example files for categories:', missingCategories);
    }

    if (categoriesWithoutDocs.length > 0) {
      console.log('Categories without expected output documentation:', categoriesWithoutDocs);
    }

    if (categoriesWithExecutionIssues.length > 0) {
      console.log('Categories with execution issues:', categoriesWithExecutionIssues);
    }

    // This assertion will FAIL on unfixed code - this is expected and correct
    expect(missingCategories).toEqual([]);
    expect(categoriesWithoutDocs).toEqual([]);
    expect(categoriesWithExecutionIssues).toEqual([]);
  });

  /**
   * Property-based test: For any feature category, a comprehensive example should exist
   */
  it('should satisfy the property: all feature categories have comprehensive examples', () => {
    fc.assert(
      fc.property(fc.constantFrom(...featureCategories), (category) => {
        // Property: For any feature category, an example file must exist
        const fileExists = exampleFileExists(category);

        if (!fileExists) {
          console.log(`\nCounterexample: No example file for category "${category}"`);
          return false;
        }

        const filePath = getExampleFilePath(category);
        if (!filePath) {
          console.log(`\nCounterexample: Could not locate example file for category "${category}"`);
          return false;
        }

        // Property: The example file must have expected output documentation
        const hasDocs = hasExpectedOutputDocumentation(filePath);
        if (!hasDocs) {
          console.log(
            `\nCounterexample: Example file for "${category}" lacks expected output documentation`
          );
          return false;
        }

        // Property: The example file must execute successfully
        const canExecute = canExecuteSuccessfully(filePath);
        if (!canExecute) {
          console.log(
            `\nCounterexample: Example file for "${category}" cannot be executed successfully`
          );
          return false;
        }

        return true;
      }),
      { numRuns: featureCategories.length } // Test each category once
    );
  });
});

/**
 * Property 2: Preservation - Existing Functionality Unchanged
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 *
 * These tests capture the baseline behavior observed on UNFIXED code.
 * They ensure that after adding new validation examples, existing functionality remains unchanged.
 *
 * EXPECTED OUTCOME: Tests PASS on unfixed code (establishing baseline to preserve)
 * After fix implementation, these tests should still PASS (confirming no regressions)
 */
describe('Property 2: Preservation - Existing Functionality Unchanged', () => {
  const examplesDir = path.join(process.cwd(), 'examples');
  const existingExamples = ['hello.nm', 'test-cli.nm', 'test-error.nm'];

  /**
   * Helper function to run a CLI command and capture its result
   */
  function runCLICommand(
    command: string,
    file: string
  ): {
    exitCode: number;
    stdout: string;
    stderr: string;
    succeeds: boolean;
  } {
    try {
      const output = execSync(`node lib/cli.js ${command} ${file}`, {
        cwd: process.cwd(),
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 10000,
      });
      return {
        exitCode: 0,
        stdout: output,
        stderr: '',
        succeeds: true,
      };
    } catch (error: any) {
      return {
        exitCode: error.status || 1,
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        succeeds: false,
      };
    }
  }

  /**
   * Test: Existing examples must continue to work as before (Requirement 3.1)
   */
  it('should preserve behavior of hello.nm', () => {
    const filePath = path.join(examplesDir, 'hello.nm');
    const baseline = BASELINE_BEHAVIOR['hello.nm'];

    // Test check command
    const checkResult = runCLICommand('check', filePath);
    expect(checkResult.succeeds).toBe(baseline.check.succeeds);
    if (baseline.check.statements) {
      expect(checkResult.stdout).toContain(`Statements: ${baseline.check.statements}`);
    }

    // Test ast command
    const astResult = runCLICommand('ast', filePath);
    expect(astResult.succeeds).toBe(baseline.ast.succeeds);
    if (baseline.ast.hasOutput) {
      expect(astResult.stdout.length).toBeGreaterThan(0);
      expect(astResult.stdout).toContain('"type": "Program"');
    }

    // Test build command
    const buildResult = runCLICommand('build', filePath);
    expect(buildResult.succeeds).toBe(baseline.build.succeeds);
    if (baseline.build.generatesFiles) {
      expect(buildResult.stdout).toContain('Build successful');
    }

    // Test run command (expected to fail with C compilation errors on unfixed code)
    const runResult = runCLICommand('run', filePath);
    expect(runResult.succeeds).toBe(baseline.run.succeeds);
    if (baseline.run.hasCCompilationError) {
      expect(runResult.stderr).toContain('C compilation failed');
    }

    // Test compile command (expected to fail with C compilation errors on unfixed code)
    const compileResult = runCLICommand('compile', filePath);
    expect(compileResult.succeeds).toBe(baseline.compile.succeeds);
    if (baseline.compile.hasCCompilationError) {
      expect(compileResult.stderr).toContain('C compilation failed');
    }
  });

  it('should preserve behavior of test-cli.nm', () => {
    const filePath = path.join(examplesDir, 'test-cli.nm');
    const baseline = BASELINE_BEHAVIOR['test-cli.nm'];

    // Test check command
    const checkResult = runCLICommand('check', filePath);
    expect(checkResult.succeeds).toBe(baseline.check.succeeds);

    // Test run command (expected to fail with C compilation errors on unfixed code)
    const runResult = runCLICommand('run', filePath);
    expect(runResult.succeeds).toBe(baseline.run.succeeds);
    if (baseline.run.hasCCompilationError) {
      expect(runResult.stderr).toContain('C compilation failed');
    }

    // Test compile command (expected to fail with C compilation errors on unfixed code)
    const compileResult = runCLICommand('compile', filePath);
    expect(compileResult.succeeds).toBe(baseline.compile.succeeds);
    if (baseline.compile.hasCCompilationError) {
      expect(compileResult.stderr).toContain('C compilation failed');
    }
  });

  it('should preserve behavior of test-error.nm', () => {
    const filePath = path.join(examplesDir, 'test-error.nm');
    const baseline = BASELINE_BEHAVIOR['test-error.nm'];

    // Test check command (expected to fail with parse error)
    const checkResult = runCLICommand('check', filePath);
    expect(checkResult.succeeds).toBe(baseline.check.succeeds);
    if (baseline.check.hasParseError) {
      expect(checkResult.stderr).toContain('PARSE');
      expect(checkResult.stderr).toContain('error');
    }
  });

  /**
   * Property-based test: For any existing example, CLI commands must behave consistently
   * (Requirement 3.4)
   */
  it('should satisfy the property: all CLI commands function correctly on existing examples', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...existingExamples),
        fc.constantFrom('check', 'ast', 'build'),
        (exampleFile, command) => {
          const filePath = path.join(examplesDir, exampleFile);
          const baseline = BASELINE_BEHAVIOR[exampleFile as keyof typeof BASELINE_BEHAVIOR];

          // Skip commands not in baseline for this file
          if (!(command in baseline)) {
            return true;
          }

          const result = runCLICommand(command, filePath);
          const expectedBehavior = baseline[command as keyof typeof baseline];

          if (typeof expectedBehavior === 'object' && 'succeeds' in expectedBehavior) {
            // Verify the command succeeds/fails as expected
            if (result.succeeds !== expectedBehavior.succeeds) {
              console.log(
                `\nCounterexample: Command "${command}" on "${exampleFile}" changed behavior`
              );
              console.log(
                `Expected succeeds: ${expectedBehavior.succeeds}, Got: ${result.succeeds}`
              );
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 20 } // Test multiple combinations
    );
  });

  /**
   * Property-based test: Compiler parsing must continue to generate correct AST
   * (Requirement 3.2)
   */
  it('should satisfy the property: compiler parsing generates correct AST for valid code', () => {
    const validExamples = ['hello.nm', 'test-cli.nm'];

    fc.assert(
      fc.property(fc.constantFrom(...validExamples), (exampleFile) => {
        const filePath = path.join(examplesDir, exampleFile);
        const astResult = runCLICommand('ast', filePath);

        // Property: Valid Nami code should produce valid AST JSON
        if (!astResult.succeeds) {
          console.log(`\nCounterexample: AST generation failed for "${exampleFile}"`);
          return false;
        }

        try {
          const ast = JSON.parse(astResult.stdout);
          if (ast.type !== 'Program') {
            console.log(`\nCounterexample: AST for "${exampleFile}" doesn't have Program root`);
            return false;
          }
        } catch (e) {
          console.log(`\nCounterexample: AST for "${exampleFile}" is not valid JSON`);
          return false;
        }

        return true;
      }),
      { numRuns: validExamples.length }
    );
  });

  /**
   * Property-based test: Compiler code generation must produce valid C code structure
   * (Requirement 3.3)
   */
  it('should satisfy the property: compiler generates C code files with correct structure', () => {
    const validExamples = ['hello.nm', 'test-cli.nm'];

    fc.assert(
      fc.property(fc.constantFrom(...validExamples), (exampleFile) => {
        const filePath = path.join(examplesDir, exampleFile);
        const buildResult = runCLICommand('build', filePath);

        // Property: Valid Nami code should generate C files
        if (!buildResult.succeeds) {
          console.log(`\nCounterexample: Build failed for "${exampleFile}"`);
          return false;
        }

        // Verify build output mentions generated files
        if (!buildResult.stdout.includes('Build successful')) {
          console.log(`\nCounterexample: Build for "${exampleFile}" didn't report success`);
          return false;
        }

        return true;
      }),
      { numRuns: validExamples.length }
    );
  });

  /**
   * Property-based test: Existing language features maintain current behavior
   * (Requirement 3.5)
   */
  it('should satisfy the property: existing language features maintain their behavior', () => {
    // Test that files with specific language features continue to parse correctly
    const featureTests = [
      { file: 'hello.nm', feature: 'variables', shouldParse: true },
      { file: 'hello.nm', feature: 'functions', shouldParse: true },
      { file: 'hello.nm', feature: 'control flow', shouldParse: true },
      { file: 'hello.nm', feature: 'arrays', shouldParse: true },
      { file: 'test-cli.nm', feature: 'variables', shouldParse: true },
      { file: 'test-cli.nm', feature: 'functions', shouldParse: true },
      { file: 'test-error.nm', feature: 'syntax error', shouldParse: false },
    ];

    fc.assert(
      fc.property(fc.constantFrom(...featureTests), (test) => {
        const filePath = path.join(examplesDir, test.file);
        const checkResult = runCLICommand('check', filePath);

        // Property: Files should parse according to their expected behavior
        if (test.shouldParse && !checkResult.succeeds) {
          console.log(
            `\nCounterexample: "${test.file}" with "${test.feature}" should parse but doesn't`
          );
          return false;
        }

        if (!test.shouldParse && checkResult.succeeds) {
          console.log(
            `\nCounterexample: "${test.file}" with "${test.feature}" shouldn't parse but does`
          );
          return false;
        }

        return true;
      }),
      { numRuns: featureTests.length }
    );
  });
});
