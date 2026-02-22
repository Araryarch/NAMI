# Contributing to NMORM

Thank you for your interest in contributing to NMORM! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/Araryarch/nmorm/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - NAMI version and OS
   - Code samples if applicable

### Suggesting Features

1. Check existing [Issues](https://github.com/Araryarch/nmorm/issues) for similar suggestions
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach

### Pull Requests

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Write or update tests
5. Update documentation
6. Commit with clear messages: `git commit -m "Add feature: description"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Create a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/nmorm.git
cd nmorm

# Install dependencies
nami install

# Run tests
nami test

# Build
nami build
```

## Coding Standards

### Style Guide

- Use 2 spaces for indentation
- Use meaningful variable and function names
- Add comments for complex logic
- Follow existing code patterns

### Example

```nami
// Good
function getUserById(id) {
  const user = await User.findById(id);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

// Bad
function get(i) {
  let u = await User.findById(i);
  if (!u) throw new Error("User not found");
  return u;
}
```

### Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Aim for high test coverage

```nami
// Example test
test("should create user", async () => {
  const user = await User.create({
    name: "Alice",
    email: "alice@example.com"
  });
  
  expect(user.id).toBeDefined();
  expect(user.name).toBe("Alice");
});
```

### Documentation

- Update README.md for new features
- Add JSDoc comments for public APIs
- Include code examples

```nami
/**
 * Create a new user
 * @param {Object} data - User data
 * @param {string} data.name - User name
 * @param {string} data.email - User email
 * @returns {Promise<User>} Created user
 */
async function createUser(data) {
  return await User.create(data);
}
```

## Commit Messages

Use clear and descriptive commit messages:

- `feat: Add JWT authentication`
- `fix: Fix query builder bug`
- `docs: Update API documentation`
- `test: Add tests for middleware`
- `refactor: Improve error handling`
- `chore: Update dependencies`

## Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, your PR will be merged

## Questions?

Feel free to ask questions in:
- [GitHub Discussions](https://github.com/Araryarch/nmorm/discussions)
- [Discord](https://discord.gg/robin)

Thank you for contributing! 🎉
