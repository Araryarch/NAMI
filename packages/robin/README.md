# Robin Framework

Enterprise-grade API framework for NAMI language, inspired by Express.js.

## Features

- 🚀 Fast and lightweight HTTP server
- 🛣️ Modular routing system
- 🔒 Built-in authentication (JWT, Sessions, Cookies)
- 🗄️ Database support (SQLite, PostgreSQL, MySQL)
- 🔧 Middleware support
- ✅ Request validation
- 📦 ORM integration (NMORM)
- 🔐 Security features (CORS, Helmet, Rate limiting)
- 📝 Logging and error handling
- 🎯 TypeScript-like type safety

## Installation

```bash
nami install robin
```

## Quick Start

```nami
import { app, Router, json } from "robin";
import { ORM } from "nmorm";
import { sqlite } from "robin/db";

// Initialize app
const server = app();

// Middleware
server.use(json());

// Database connection
const db = sqlite("./database.db");
const orm = ORM(db);

// Define model
const User = orm.model("User", {
  id: { type: "integer", primary: true, autoIncrement: true },
  name: { type: "string", required: true },
  email: { type: "string", unique: true, required: true },
  password: { type: "string", required: true }
});

// Routes
server.get("/", (req, res) => {
  res.json({ message: "Welcome to Robin API" });
});

server.get("/users", async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

server.post("/users", async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json(user);
});

// Start server
server.listen(3000, () => {
  println("Server running on http://localhost:3000");
});
```

## API Reference

### Application

```nami
import { app } from "robin";

const server = app();
```

### Routing

```nami
// Basic routes
server.get("/path", handler);
server.post("/path", handler);
server.put("/path", handler);
server.delete("/path", handler);
server.patch("/path", handler);

// Route parameters
server.get("/users/:id", (req, res) => {
  const id = req.params.id;
  res.json({ id });
});

// Query parameters
server.get("/search", (req, res) => {
  const query = req.query.q;
  res.json({ query });
});

// Modular routing
const router = Router();
router.get("/", handler);
router.post("/", handler);
server.use("/api/users", router);
```

### Middleware

```nami
import { json, cors, helmet, rateLimit } from "robin";

// Built-in middleware
server.use(json());
server.use(cors());
server.use(helmet());
server.use(rateLimit({ max: 100, window: 60000 }));

// Custom middleware
server.use((req, res, next) => {
  println(f, req.method, req.path);
  next();
});

// Error handling middleware
server.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```

### Request Object

```nami
req.body       // Request body (parsed JSON)
req.params     // Route parameters
req.query      // Query string parameters
req.headers    // Request headers
req.method     // HTTP method
req.path       // Request path
req.cookies    // Cookies
req.session    // Session data
req.user       // Authenticated user (after auth middleware)
```

### Response Object

```nami
res.json(data)                    // Send JSON response
res.send(text)                    // Send text response
res.status(code)                  // Set status code
res.header(name, value)           // Set header
res.cookie(name, value, options)  // Set cookie
res.redirect(url)                 // Redirect
res.sendFile(path)                // Send file
```

### Authentication

```nami
import { jwt, session, bcrypt } from "robin/auth";

// JWT
const token = jwt.sign({ userId: 1 }, "secret", { expiresIn: "1h" });
const decoded = jwt.verify(token, "secret");

// Middleware
server.use(jwt.authenticate("secret"));

// Password hashing
const hash = await bcrypt.hash("password", 10);
const valid = await bcrypt.compare("password", hash);

// Session
server.use(session({
  secret: "session-secret",
  resave: false,
  saveUninitialized: false
}));

server.post("/login", (req, res) => {
  req.session.userId = user.id;
  res.json({ success: true });
});
```

### Validation

```nami
import { validate, schema } from "robin/validation";

const userSchema = schema({
  name: { type: "string", min: 3, max: 50, required: true },
  email: { type: "email", required: true },
  age: { type: "number", min: 18, max: 120 },
  role: { type: "enum", values: ["user", "admin"] }
});

server.post("/users", validate(userSchema), async (req, res) => {
  // req.body is validated
  const user = await User.create(req.body);
  res.json(user);
});
```

### Database

```nami
import { sqlite, postgresql, mysql } from "robin/db";

// SQLite
const db = sqlite("./database.db");

// PostgreSQL
const db = postgresql({
  host: "localhost",
  port: 5432,
  database: "mydb",
  user: "postgres",
  password: "password"
});

// MySQL
const db = mysql({
  host: "localhost",
  port: 3306,
  database: "mydb",
  user: "root",
  password: "password"
});

// Raw queries
const result = await db.query("SELECT * FROM users WHERE id = ?", [1]);

// Transactions
await db.transaction(async (tx) => {
  await tx.query("INSERT INTO users (name) VALUES (?)", ["Alice"]);
  await tx.query("INSERT INTO posts (user_id, title) VALUES (?, ?)", [1, "Hello"]);
});
```

## Examples

See the `examples/` directory for complete examples:

- `examples/robin/basic-api.nm` - Basic CRUD API
- `examples/robin/auth-api.nm` - Authentication with JWT
- `examples/robin/orm-example.nm` - Using NMORM
- `examples/robin/middleware.nm` - Custom middleware
- `examples/robin/validation.nm` - Request validation
- `examples/robin/file-upload.nm` - File upload handling

## License

MIT
