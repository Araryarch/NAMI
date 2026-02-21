# NAMI Examples

Koleksi contoh program NAMI untuk demonstrasi fitur dan testing.

## Quick Start

```bash
# Run any example
nami run examples/hello.nm

# Test all examples
npm run test:examples
```

## Available Examples

### ✓ Working Examples

| File | Description | Features |
|------|-------------|----------|
| `hello.nm` | Hello World dan basic features | Variables, functions, loops, arrays |
| `variables.nm` | Variable declarations | let, const, types |
| `operators.nm` | Arithmetic dan comparison | +, -, *, /, ==, !=, <, > |
| `functions.nm` | Function declarations | Parameters, return values, recursion |
| `arrays.nm` | Array operations | Creation, indexing, methods |

### ⊘ In Progress

| File | Description | Status |
|------|-------------|--------|
| `control-flow.nm` | If/else, loops | Infinite loop issue |
| `objects.nm` | Object literals | Not tested |
| `error-handling.nm` | Try/catch | Not tested |
| `io-operations.nm` | Input/output | Requires user input |

## Running Examples

### Individual Example

```bash
# Run and see output
nami run examples/hello.nm

# Build to C only
nami build examples/hello.nm -o output/

# Compile to executable
nami compile examples/hello.nm -o hello
./hello
```

### All Examples

```bash
# Test all examples with expected output
npm run test:examples
```

## Adding New Examples

1. Create `.nm` file in `examples/` folder
2. Test it manually: `nami run examples/your-example.nm`
3. Generate expected output: `./generate-expected.sh your-example`
4. Run test suite: `npm run test:examples`

## Example Template

```javascript
// examples/my-feature.nm
// Description: Demonstrates [feature name]

// Your code here
let x = 10;
println(x);
```

## Testing

Expected outputs are stored in `examples/.expected/` folder.

```bash
# Generate expected output for one example
./generate-expected.sh hello

# Generate for all examples
npm run test:examples:generate

# Run tests
npm run test:examples
```

## Guidelines

- Keep examples simple and focused on one feature
- Add comments to explain what's being demonstrated
- Avoid user input (use hardcoded values)
- Keep execution time under 5 seconds
- Use descriptive variable names

## Feature Coverage

Track which NAMI features are working:

- [x] Variables (let, const)
- [x] Basic types (int, float, string, bool)
- [x] Arithmetic operators
- [x] Comparison operators
- [x] Functions
- [x] Arrays
- [x] For loops
- [x] If/else statements
- [ ] Objects
- [ ] Error handling
- [ ] Async/await
- [ ] Modules

Run `npm run test:examples` to see current status.
