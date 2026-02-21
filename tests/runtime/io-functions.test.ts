import { readFileSync } from 'fs';
import { join } from 'path';

describe('Runtime Library - I/O Functions', () => {
  let runtimeHeader: string;

  beforeAll(() => {
    runtimeHeader = readFileSync(
      join(__dirname, '../../runtime/nami_runtime.h'),
      'utf-8'
    );
  });

  describe('Task 11.1: Print and Println Functions', () => {
    test('should define nami_print_value() for single value output', () => {
      expect(runtimeHeader).toContain('nami_print_value(nami_value_t v)');
      expect(runtimeHeader).toContain('switch (v.type)');
      expect(runtimeHeader).toContain('case NAMI_TYPE_INT:');
      expect(runtimeHeader).toContain('case NAMI_TYPE_FLOAT:');
      expect(runtimeHeader).toContain('case NAMI_TYPE_STRING:');
      expect(runtimeHeader).toContain('case NAMI_TYPE_BOOL:');
      expect(runtimeHeader).toContain('case NAMI_TYPE_NULL:');
      expect(runtimeHeader).toContain('case NAMI_TYPE_ARRAY:');
      expect(runtimeHeader).toContain('case NAMI_TYPE_OBJECT:');
      expect(runtimeHeader).toContain('case NAMI_TYPE_FUNCTION:');
    });

    test('should define nami_print() for single value output without newline', () => {
      expect(runtimeHeader).toContain('nami_print(nami_value_t v)');
      expect(runtimeHeader).toContain('nami_print_value(v)');
      expect(runtimeHeader).toContain('fflush(stdout)');
    });

    test('should define nami_println() with newline', () => {
      expect(runtimeHeader).toContain('nami_println(nami_value_t v)');
      expect(runtimeHeader).toContain('nami_print_value(v)');
      expect(runtimeHeader).toContain('printf("\\n")');
      expect(runtimeHeader).toContain('fflush(stdout)');
    });

    test('should define nami_print_multi() for multiple arguments with space separation', () => {
      expect(runtimeHeader).toContain('nami_print_multi(int count, ...)');
      expect(runtimeHeader).toContain('va_list args');
      expect(runtimeHeader).toContain('va_start(args, count)');
      expect(runtimeHeader).toContain('va_end(args)');
      expect(runtimeHeader).toContain('printf(" ")');
      expect(runtimeHeader).toContain('nami_print_value(v)');
    });

    test('should define nami_println_multi() for multiple arguments with newline', () => {
      expect(runtimeHeader).toContain('nami_println_multi(int count, ...)');
      expect(runtimeHeader).toContain('va_list args');
      expect(runtimeHeader).toContain('va_start(args, count)');
      expect(runtimeHeader).toContain('va_end(args)');
      expect(runtimeHeader).toContain('printf(" ")');
      expect(runtimeHeader).toContain('printf("\\n")');
    });

    test('should support formatted output for all data types', () => {
      const printValueFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_print_value(nami_value_t v)'),
        runtimeHeader.indexOf('nami_print(nami_value_t v)')
      );

      // Check formatting for each type
      expect(printValueFunc).toContain('printf("%lld"'); // INT
      expect(printValueFunc).toContain('printf("%g"'); // FLOAT
      expect(printValueFunc).toContain('printf("%s"'); // STRING
      expect(printValueFunc).toContain('"true"'); // BOOL true
      expect(printValueFunc).toContain('"false"'); // BOOL false
      expect(printValueFunc).toContain('"null"'); // NULL
      expect(printValueFunc).toContain('"[Array]"'); // ARRAY
      expect(printValueFunc).toContain('"[Object]"'); // OBJECT
      expect(printValueFunc).toContain('"[Function]"'); // FUNCTION
    });

    test('should include stdarg.h for variadic functions', () => {
      expect(runtimeHeader).toContain('#include <stdarg.h>');
    });
  });

  describe('Task 11.2: Input Functions', () => {
    test('should define nami_input() for reading lines from stdin', () => {
      expect(runtimeHeader).toContain('nami_input(void)');
      expect(runtimeHeader).toContain('fgets(buffer, sizeof(buffer), stdin)');
      expect(runtimeHeader).toContain('char buffer[4096]');
    });

    test('should strip newline characters from input', () => {
      const inputFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_input(void)'),
        runtimeHeader.indexOf('nami_input_line(void)')
      );

      // Check for newline stripping
      expect(inputFunc).toContain("buffer[len - 1] == '\\n'");
      expect(inputFunc).toContain("buffer[len - 1] = '\\0'");
      
      // Check for carriage return stripping (Windows line endings)
      expect(inputFunc).toContain("buffer[len - 1] == '\\r'");
    });

    test('should define nami_input_line() variant', () => {
      expect(runtimeHeader).toContain('nami_input_line(void)');
      expect(runtimeHeader).toContain('return nami_input()');
    });

    test('should return string value from input', () => {
      const inputFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_input(void)'),
        runtimeHeader.indexOf('nami_input_line(void)')
      );

      expect(inputFunc).toContain('result.type = NAMI_TYPE_STRING');
      expect(inputFunc).toContain('nami_string_create(buffer)');
      expect(inputFunc).toContain('return result');
    });

    test('should return NAMI_NULL on input failure', () => {
      const inputFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_input(void)'),
        runtimeHeader.indexOf('nami_input_line(void)')
      );

      expect(inputFunc).toContain('return NAMI_NULL');
    });
  });

  describe('Requirements Validation', () => {
    test('Requirements 2.1: Print function outputs values to stdout', () => {
      expect(runtimeHeader).toContain('nami_print(nami_value_t v)');
      expect(runtimeHeader).toContain('nami_print_value(v)');
      expect(runtimeHeader).toContain('printf(');
    });

    test('Requirements 2.2: Input function reads from stdin', () => {
      expect(runtimeHeader).toContain('nami_input(void)');
      expect(runtimeHeader).toContain('fgets(buffer, sizeof(buffer), stdin)');
    });

    test('Requirements 2.3: Print handles multiple arguments with space separation', () => {
      expect(runtimeHeader).toContain('nami_print_multi(int count, ...)');
      expect(runtimeHeader).toContain('printf(" ")');
      
      const printMultiFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_print_multi(int count, ...)'),
        runtimeHeader.indexOf('nami_println_multi(int count, ...)')
      );
      
      expect(printMultiFunc).toContain('if (i > 0)');
      expect(printMultiFunc).toContain('printf(" ")');
    });

    test('Requirements 2.4: Input strips newline characters', () => {
      const inputFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_input(void)'),
        runtimeHeader.indexOf('nami_input_line(void)')
      );

      expect(inputFunc).toContain("buffer[len - 1] == '\\n'");
      expect(inputFunc).toContain("buffer[len - 1] = '\\0'");
    });

    test('Requirements 2.5: Formatted output for common data types', () => {
      const printValueFunc = runtimeHeader.substring(
        runtimeHeader.indexOf('nami_print_value(nami_value_t v)'),
        runtimeHeader.indexOf('nami_print(nami_value_t v)')
      );

      // Verify formatting for all types
      expect(printValueFunc).toContain('NAMI_TYPE_INT');
      expect(printValueFunc).toContain('NAMI_TYPE_FLOAT');
      expect(printValueFunc).toContain('NAMI_TYPE_STRING');
      expect(printValueFunc).toContain('NAMI_TYPE_BOOL');
      expect(printValueFunc).toContain('NAMI_TYPE_NULL');
      expect(printValueFunc).toContain('NAMI_TYPE_ARRAY');
      expect(printValueFunc).toContain('NAMI_TYPE_OBJECT');
      expect(printValueFunc).toContain('NAMI_TYPE_FUNCTION');
    });
  });

  describe('Documentation and Comments', () => {
    test('should have documentation comments for I/O functions', () => {
      expect(runtimeHeader).toContain('Print a single value to stdout');
      expect(runtimeHeader).toContain('Print multiple values separated by spaces');
      expect(runtimeHeader).toContain('Read a line from stdin');
      expect(runtimeHeader).toMatch(/Requirements:.*2\.1/);
      expect(runtimeHeader).toMatch(/Requirements:.*2\.2/);
      expect(runtimeHeader).toMatch(/Requirements:.*2\.3/);
      expect(runtimeHeader).toMatch(/Requirements:.*2\.4/);
      expect(runtimeHeader).toMatch(/Requirements:.*2\.5/);
    });
  });
});
