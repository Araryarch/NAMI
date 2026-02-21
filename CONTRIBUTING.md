# Contributing to NAMI

Thank you for your interest in contributing to NAMI! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (latest version)
- GCC or Clang
- Git

### Setup Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/Araryarch/NAMI.git
cd NAMI

# Install dependencies
bun install

# Build the project
bun run build

# Link CLI for testing
npm link

# Run tests
npm test
npm run test:examples
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add tests for new features
- Update documentation

### 3. Test Your Changes

```bash
# Run unit tests
npm test

# Run example tests
npm run test:examples

# Check features
npm run features

# Lint code
npm run lint

# Format code
npm run format
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat: add new feature"
# or
git commit -m "fix: resolve bug"
```

Use conventional commit messages:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test changes
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Style

### TypeScript

- Use TypeScript strict mode
- Add type annotations
- Use meaningful variable names
- Keep functions small and focused
- Add JSDoc comments for public APIs

Example:
```typescript
/**
 * Generates C code from AST
 * @param program - The AST program node
 * @returns Generated C code
 */
function generateCode(program: Program): string {
  // Implementation
}
```

### Testing

- Write unit tests for new features
- Add example programs for end-to-end testing
- Ensure all tests pass before submitting PR

Example test:
```typescript
describe('Lexer', () => {
  it('should tokenize numbers', () => {
    const lexer = new Lexer('42');
    const tokens = lexer.tokenize();
    expect(tokens[0].type).toBe('NUMBER');
    expect(tokens[0].value).toBe(42);
  });
});
```

### Adding Examples

1. Create `.nm` file in `examples/`
2. Test manually: `nami run examples/your-example.nm`
3. Generate expected output: `./generate-expected.sh your-example`
4. Verify: `npm run test:examples`

## Project Structure

```
nami-lang/
├── src/                    # TypeScript source
│   ├── lexer/             # Tokenization
│   ├── parser/            # AST generation
│   ├── codegen/           # C code generation
│   ├── compiler/          # Main compiler
│   └── cli.ts             # CLI interface
├── tests/                 # Unit tests
├── examples/              # Example programs
├── runtime/               # C runtime library
└── .github/workflows/     # CI/CD
```

## Areas for Contribution

### High Priority

- [ ] Object literal support
- [ ] Error handling (try/catch/finally)
- [ ] Module system (import/export)
- [ ] String concatenation improvements
- [ ] More array methods
- [ ] Better error messages

### Medium Priority

- [ ] Async/await implementation
- [ ] Class support
- [ ] Destructuring
- [ ] Spread operator
- [ ] Template literals
- [ ] Regular expressions

### Low Priority

- [ ] VSCode extension
- [ ] Language server protocol
- [ ] Debugger support
- [ ] Package manager
- [ ] Standard library expansion

## Testing Guidelines

### Unit Tests

- Test individual components
- Use Jest framework
- Aim for >80% coverage
- Test edge cases

### Example Tests

- Test end-to-end functionality
- Use real-world scenarios
- Keep examples simple
- Document expected behavior

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Examples only
npm run test:examples
```

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Explain complex algorithms
- Include examples in comments

### User Documentation

- Update README.md for user-facing changes
- Add examples for new features
- Update QUICK_START.md if needed

### Changelog

- Update CHANGELOG.md for all changes
- Follow Keep a Changelog format
- Include migration notes for breaking changes

## Release Process

Maintainers only:

1. Update version in `package.json` and `src/version.ts`
2. Update CHANGELOG.md
3. Create git tag: `git tag v0.x.0`
4. Push tag: `git push --tags`
5. GitHub Actions will build and release

## Getting Help

- Check [Issues](https://github.com/Araryarch/NAMI/issues)
- Read [Documentation](README.md)
- Ask questions in discussions

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue or discussion if you have questions!
