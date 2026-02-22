# Robin Framework - Complete Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Core Concepts](#core-concepts)
5. [API Reference](#api-reference)
6. [Database Integration](#database-integration)
7. [Authentication](#authentication)
8. [Middleware](#middleware)
9. [Validation](#validation)
10. [Best Practices](#best-practices)
11. [Examples](#examples)

## Introduction

Robin is an enterprise-grade API framework for NAMI language, inspired by Express.js. It provides a robust foundation for building RESTful APIs with built-in support for:

- HTTP routing and middleware
- Database connectivity (SQLite, PostgreSQL, MySQL)
- ORM integration (NMORM)
- Authentication (JWT, Sessions, Cookies)
- Request validation
- Security features
- Error handling

## Installation

```bash
# Install Robin framework
nami install robin

# Install NMORM (optional, for ORM features)
nami install nmorm
```

## Quick Start

### Basic Server

```nami
import { app } from "robin";

const server = app();

server.get("/", (req, res) => {
  res.json({ message: "Hello, Robin!" });
});

server.listen(3000, () => {
  println("Server running on http://localhost:3000");
});
```

### With Database

```nami
import { app, json } from "robin";
import { ORM } from "nmorm";
import { sqlite } from "robin/db";

const server = app();
server.use(json());

const db = sqlite("./app.db");
const orm = ORM(db);

const User = orm.model("User", {
  id: { type: "integer", primary: true, autoIncrement: true },
  name: { type: "string", required: true },
  email: { type: "string", unique: true, required: true }
});

await orm.sync();

server.get("/users", async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

server.listen(3000);
```

## Core Concepts

### Application

The application object represents your Robin server:

```nami
const server = app();
```

### Routing

Define routes using HTTP methods:

```nami
server.get("/path", handler);
server.post("/path", handler);
server.put("/path", handler);
server.delete("/path", handler);
server.patch("/path", handler);
```

### Request Handler

Request handlers receive `req` and `res` objects:

```nami
function handler(req, res) {
  // Access request data
  const body = req.body;
  const params = req.params;
  const query = req.query;
  
  // Send response
  res.json({ success: true });
}
```

### Middleware

Middleware functions process requests before they reach route handlers:

```nami
server.use((req, res, next) => {
  // Process request
  println(f, req.method, req.path);
  
  // Call next middleware
  next();
});
```

### Router

Create modular route groups:

```nami
import { Router } from "robin";

const userRouter = Router();

userRouter.get("/", getAllUsers);
userRouter.get("/:id", getUserById);
userRouter.post("/", createUser);

server.use("/api/users", userRouter);
```

## API Reference

### Application Methods

#### `app()`

Create a new Robin application.

```nami
const server = app();
```

#### `server.use(middleware)`

Register middleware.

```nami
server.use(json());
server.use(cors());
server.use((req, res, next) => {
  // Custom middleware
  next();
});
```

#### `server.METHOD(path, ...handlers)`

Define route handlers for HTTP methods.

```nami
server.get("/users", getUsers);
server.post("/users", createUser);
server.put("/users/:id", updateUser);
server.delete("/users/:id", deleteUser);
```

#### `server.listen(port, callback)`

Start the server.

```nami
server.listen(3000, () => {
  println("Server started");
});
```

### Request Object

#### Properties

- `req.body` - Parsed request body
- `req.params` - Route parameters
- `req.query` - Query string parameters
- `req.headers` - Request headers
- `req.method` - HTTP method
- `req.path` - Request path
- `req.url` - Full URL
- `req.cookies` - Cookies object
- `req.session` - Session data
- `req.user` - Authenticated user (after auth middleware)
- `req.files` - Uploaded files (with fileUpload middleware)

#### Methods

- `req.get(header)` - Get header value
- `req.is(type)` - Check content type

### Response Object

#### Methods

##### `res.json(data)`

Send JSON response.

```nami
res.json({ success: true, data: users });
```

##### `res.send(text)`

Send text response.

```nami
res.send("Hello, World!");
```

##### `res.status(code)`

Set status code (chainable).

```nami
res.status(404).json({ error: "Not found" });
```

##### `res.header(name, value)`

Set response header.

```nami
res.header("X-Custom-Header", "value");
```

##### `res.cookie(name, value, options)`

Set cookie.

```nami
res.cookie("token", "abc123", {
  httpOnly: true,
  maxAge: 3600000
});
```

##### `res.redirect(url)`

Redirect to URL.

```nami
res.redirect("/login");
```

##### `res.sendFile(path)`

Send file.

```nami
res.sendFile("./public/index.html");
```

## Database Integration

### SQLite

```nami
import { sqlite } from "robin/db";

const db = sqlite("./database.db");
```

### PostgreSQL

```nami
import { postgresql } from "robin/db";

const db = postgresql({
  host: "localhost",
  port: 5432,
  database: "mydb",
  user: "postgres",
  password: "password"
});
```

### MySQL

```nami
import { mysql } from "robin/db";

const db = mysql({
  host: "localhost",
  port: 3306,
  database: "mydb",
  user: "root",
  password: "password"
});
```

### Raw Queries

```nami
// Simple query
const result = await db.query("SELECT * FROM users");

// With parameters
const result = await db.query(
  "SELECT * FROM users WHERE id = ?",
  [userId]
);

// Named parameters
const result = await db.query(
  "SELECT * FROM users WHERE name = :name AND age > :age",
  { name: "Alice", age: 18 }
);
```

### Transactions

```nami
await db.transaction(async (tx) => {
  await tx.query("INSERT INTO users (name) VALUES (?)", ["Alice"]);
  await tx.query("INSERT INTO posts (user_id, title) VALUES (?, ?)", [1, "Hello"]);
});
```

## Authentication

### JWT

```nami
import { jwt } from "robin/auth";

// Sign token
const token = jwt.sign(
  { userId: 1, email: "user@example.com" },
  "secret-key",
  { expiresIn: "24h" }
);

// Verify token
const decoded = jwt.verify(token, "secret-key");

// Middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "No token" });
  }
  try {
    req.user = jwt.verify(token, "secret-key");
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

server.get("/protected", authenticate, (req, res) => {
  res.json({ user: req.user });
});
```

### Password Hashing

```nami
import { bcrypt } from "robin/auth";

// Hash password
const hash = await bcrypt.hash("password123", 10);

// Compare password
const valid = await bcrypt.compare("password123", hash);
```

### Sessions

```nami
import { session } from "robin/auth";

server.use(session({
  secret: "session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 3600000,
    httpOnly: true
  }
}));

server.post("/login", (req, res) => {
  req.session.userId = user.id;
  res.json({ success: true });
});

server.get("/profile", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json({ userId: req.session.userId });
});
```

## Middleware

### Built-in Middleware

#### JSON Parser

```nami
import { json } from "robin";

server.use(json());
```

#### URL Encoded Parser

```nami
import { urlencoded } from "robin";

server.use(urlencoded());
```

#### CORS

```nami
import { cors } from "robin";

server.use(cors());

// With options
server.use(cors({
  origin: "https://example.com",
  methods: ["GET", "POST"],
  credentials: true
}));
```

#### Helmet (Security Headers)

```nami
import { helmet } from "robin";

server.use(helmet());
```

#### Rate Limiting

```nami
import { rateLimit } from "robin";

server.use(rateLimit({
  max: 100,           // Max requests
  window: 60000,      // Time window (ms)
  message: "Too many requests"
}));
```

#### File Upload

```nami
import { fileUpload } from "robin";

server.use(fileUpload({
  uploadDir: "./uploads",
  maxSize: 10485760,  // 10MB
  allowedTypes: ["image/jpeg", "image/png"]
}));

server.post("/upload", (req, res) => {
  const file = req.files.image;
  res.json({ filename: file.filename });
});
```

### Custom Middleware

```nami
// Logger middleware
function logger(req, res, next) {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    println(f, req.method, req.path, res.statusCode, duration + "ms");
  });
  
  next();
}

server.use(logger);

// Authentication middleware
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

server.get("/protected", requireAuth, (req, res) => {
  res.json({ message: "Protected resource" });
});

// Error handling middleware
server.use((err, req, res, next) => {
  println(f, "Error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});
```

## Validation

### Schema Definition

```nami
import { validate, schema } from "robin/validation";

const userSchema = schema({
  name: {
    type: "string",
    min: 3,
    max: 50,
    required: true
  },
  email: {
    type: "email",
    required: true
  },
  age: {
    type: "number",
    min: 18,
    max: 120
  },
  role: {
    type: "enum",
    values: ["user", "admin", "moderator"]
  }
});
```

### Validation Middleware

```nami
server.post("/users", validate(userSchema), async (req, res) => {
  // req.body is validated
  const user = await User.create(req.body);
  res.json(user);
});
```

### Field Types

- `string` - String value
- `number` - Numeric value
- `integer` - Integer value
- `boolean` - Boolean value
- `email` - Email address
- `url` - URL
- `date` - Date value
- `enum` - One of specified values
- `array` - Array of values
- `object` - Object value

### Validation Rules

- `required` - Field is required
- `min` - Minimum value/length
- `max` - Maximum value/length
- `pattern` - Regex pattern
- `custom` - Custom validator function

## Best Practices

### Project Structure

```
my-api/
├── src/
│   ├── controllers/
│   │   ├── user.controller.nm
│   │   └── post.controller.nm
│   ├── models/
│   │   ├── user.model.nm
│   │   └── post.model.nm
│   ├── routes/
│   │   ├── user.routes.nm
│   │   └── post.routes.nm
│   ├── middleware/
│   │   ├── auth.nm
│   │   └── validation.nm
│   ├── config/
│   │   └── database.nm
│   └── app.nm
├── migrations/
├── seeds/
└── main.nm
```

### Error Handling

```nami
// Async error wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

server.get("/users", asyncHandler(async (req, res) => {
  const users = await User.findAll();
  res.json(users);
}));

// Global error handler
server.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.status(500).json({ error: "Internal server error" });
});
```

### Environment Configuration

```nami
// config/database.nm
const config = {
  development: {
    database: "dev.db",
    type: "sqlite"
  },
  production: {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    type: "postgresql"
  }
};

export const dbConfig = config[process.env.NODE_ENV || "development"];
```

## Examples

See the `examples/robin/` directory for complete examples:

- `basic-api.nm` - Basic CRUD API
- `auth-api.nm` - Authentication with JWT
- `blog-api.nm` - Blog API with relationships
- `middleware.nm` - Custom middleware examples
- `validation.nm` - Request validation
- `file-upload.nm` - File upload handling

## License

MIT
