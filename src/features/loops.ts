/**
 * NAMI Modern Loops
 *
 * Defines the modern loop constructs in NAMI:
 *
 * 1. Range-based for: `for i in 0..10 { ... }`
 * 2. Collection iteration: `for item of items { ... }`
 * 3. Infinite loop: `loop { ... }`
 * 4. Traditional while: `while condition { ... }`
 * 5. Do-while: `do { ... } while condition`
 *
 * C code generation helpers for each loop type.
 */

/** Generate C code for a range-based for loop */
export function generateRangeLoop(
  varName: string,
  startExpr: string,
  endExpr: string,
  inclusive: boolean,
  bodyCode: string
): string {
  const cmp = inclusive ? '<=' : '<';
  return [
    `{`,
    `    int64_t __range_end = ${endExpr};`,
    `    for (int64_t ${varName} = ${startExpr}; ${varName} ${cmp} __range_end; ${varName}++) {`,
    bodyCode,
    `    }`,
    `}`,
  ].join('\n');
}

/** Generate C code for a collection for-of loop */
export function generateForOfLoop(
  varName: string,
  collectionExpr: string,
  bodyCode: string
): string {
  return [
    `{`,
    `    nami_value_t __collection = ${collectionExpr};`,
    `    int64_t __len = nami_length(__collection);`,
    `    for (int64_t __i = 0; __i < __len; __i++) {`,
    `        nami_value_t ${varName} = nami_get(__collection, nami_value_int(__i));`,
    bodyCode,
    `    }`,
    `}`,
  ].join('\n');
}

/** Generate C code for an infinite loop */
export function generateInfiniteLoop(bodyCode: string, enableGuard: boolean): string {
  const guardCode = enableGuard ? '        NAMI_LOOP_CHECK(&nami_loop_guard);\n' : '';
  return [`while (1) {`, guardCode + bodyCode, `}`].join('\n');
}

/** Check if a for-in/for-of right-hand side is a range expression */
export function isRangeBasedLoop(rightExprType: string): boolean {
  return rightExprType === 'RangeExpression';
}
