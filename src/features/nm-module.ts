/**
 * NAMI Standard Module (`nm`)
 *
 * Provides built-in functions accessible via `import nm`:
 * - nm.input(prompt?)  — Read user input from stdin
 * - nm.exit(code?)     — Exit the program
 * - nm.sleep(ms)       — Sleep for milliseconds
 * - nm.args()          — Get command line arguments
 * - nm.env(key)        — Get environment variable
 * - nm.time()          — Get current timestamp in milliseconds
 * - nm.random()        — Get random float [0, 1)
 * - nm.random_int(min, max) — Get random integer in range
 * - nm.type_of(val)    — Get type of value as string
 */

export interface NmModuleFunction {
  name: string;
  cName: string; // C runtime function name
  params: string[];
  returnType: string; // C return type
  description: string;
}

/** All functions available in the `nm` module */
export const NM_MODULE_FUNCTIONS: NmModuleFunction[] = [
  {
    name: 'input',
    cName: 'nami_input',
    params: ['prompt'],
    returnType: 'nami_string_t*',
    description: 'Read a line of input from stdin, optionally displaying a prompt',
  },
  {
    name: 'exit',
    cName: 'nami_exit',
    params: ['code'],
    returnType: 'void',
    description: 'Exit the program with the given exit code (default 0)',
  },
  {
    name: 'sleep',
    cName: 'nami_sleep',
    params: ['ms'],
    returnType: 'void',
    description: 'Sleep for the given number of milliseconds',
  },
  {
    name: 'args',
    cName: 'nami_args',
    params: [],
    returnType: 'nami_array_t*',
    description: 'Get command line arguments as an array of strings',
  },
  {
    name: 'env',
    cName: 'nami_env',
    params: ['key'],
    returnType: 'nami_string_t*',
    description: 'Get the value of an environment variable',
  },
  {
    name: 'time',
    cName: 'nami_time_ms',
    params: [],
    returnType: 'int64_t',
    description: 'Get the current timestamp in milliseconds',
  },
  {
    name: 'random',
    cName: 'nami_random',
    params: [],
    returnType: 'double',
    description: 'Get a random floating-point number in [0, 1)',
  },
  {
    name: 'random_int',
    cName: 'nami_random_int',
    params: ['min', 'max'],
    returnType: 'int64_t',
    description: 'Get a random integer in [min, max)',
  },
  {
    name: 'type_of',
    cName: 'nami_type_of',
    params: ['value'],
    returnType: 'nami_string_t*',
    description: 'Get the type of a value as a string',
  },
];

/** Resolve a nm module method call to its C function name */
export function resolveNmMethod(methodName: string): NmModuleFunction | null {
  return NM_MODULE_FUNCTIONS.find((f) => f.name === methodName) || null;
}

/** Generate C runtime declarations for the nm module */
export function generateNmRuntimeHeader(): string {
  const lines: string[] = ['// ── nm module (NAMI standard library) ──────────────────', ''];

  for (const fn of NM_MODULE_FUNCTIONS) {
    const params =
      fn.params.length > 0 ? fn.params.map((p) => `nami_value_t ${p}`).join(', ') : 'void';
    lines.push(`${fn.returnType} ${fn.cName}(${params});`);
  }

  lines.push('');
  return lines.join('\n');
}
