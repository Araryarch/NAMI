# Robin Framework

<p align="center">
  <img src="assets/logo.png" alt="Robin Framework" width="200"/>
</p>

<p align="center">
  <strong>Enterprise-grade API framework for NAMI language</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#examples">Examples</a>
</p>

---

## Features

- 🚀 **Fast & Lightweight** - Minimal overhead, maximum performance
- 🛣️ **Express-like API** - Familiar routing and middleware system
- 🗄️ **Database Support** - SQLite, PostgreSQL, MySQL out of the box
- 🔒 **Built-in Auth** - JWT, Sessions, Cookies, bcrypt
- ✅ **Validation** - Schema-based request validation
- 🔧 **Middleware** - Extensive middleware ecosystem
- 🔐 **Security** - CORS, Helmet, Rate limiting
- 📦 **ORM Ready** - Seamless integration with NMORM
- 📝 **TypeScript-like** - Type-safe development experience
- 🎯 **Production Ready** - Battle-tested patterns

## Installation

```bash
nami install robin
```

Or clone and build from source:

```bash
git clone https://github.com/Araryarch/robin-framework.git
cd robin-framework
nami build
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
  println("🚀 Server running on http://localhost:3000");
});
```

### CRUD API with Database

```nami
import { app, json } from "robin";
import { ORM } from "nmorm";
import { sqlite } from "robin/db";

const server = app();
server.use(json());

// Database setup
const db = sqlite("./database.db");
const orm = ORM(db);

// Define model
const User = orm.model("User", {
  id: { type: "integer", primary: true, autoIncrement: true },
  name: { type: "string", required: true },
  email: { type: "string", unique: true, required: true }
});

await orm.sync();

// Routes
server.get("/users", async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

server.post("/users", async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json(user);
});

server.listen(3000);
```

### Authentication API

```nami
import { app, json } from "robin";
import { jwt, bcrypt } from "robin/auth";
import { validate, schema } from "robin/validation";

const server = app();
server.use(json());

const loginSchema = schema({
  email: { type: "email", required: true },
  password: { type: "string", min: 6, required: true }
});

server.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  const token = jwt.sign(
    { id: user.id, email: user.email },
    "secret-key",
    { expiresIn: "24h" }
  );
  
  res.json({ token });
});

server.listen(3000);
```

## Core Concepts

### Application

```nami
import { app } from "robin";

const server = app();
```

### Routing

```nami
// HTTP methods
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
```

### Middleware

```nami
import { json, cors, helmet } from "robin";

// Built-in middleware
server.use(json());
server.use(cors());
server.use(helmet());

// Custom middleware
server.use((req, res, next) => {
  println(f, req.method, req.path);
  next();
});
```

### Modular Routing

```nami
import { Router } from "robin";

const userRouter = Router();

userRouter.get("/", getAllUsers);
userRouter.get("/:id", getUserById);
userRouter.post("/", createUser);

server.use("/api/users", userRouter);
```

## API Reference

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
req.user       // Authenticated user
req.files      // Uploaded files
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

### Middleware

```nami
import {
  json,           // JSON body parser
  urlencoded,     // URL-encoded body parser
  cors,           // CORS support
  helmet,         // Security headers
  rateLimit,      // Rate limiting
  fileUpload      // File upload handling
} from "robin";
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
```

### Authentication

```nami
import { jwt, bcrypt, session } from "robin/auth";

// JWT
const token = jwt.sign(payload, secret, options);
const decoded = jwt.verify(token, secret);

// Password hashing
const hash = await bcrypt.hash(password, rounds);
const valid = await bcrypt.compare(password, hash);

// Sessions
server.use(session({
  secret: "session-secret",
  resave: false,
  saveUninitialized: false
}));
```

### Validation

```nami
import { validate, schema } from "robin/validation";

const userSchema = schema({
  name: { type: "string", min: 3, max: 50, required: true },
  email: { type: "email", required: true },
  age: { type: "number", min: 18, max: 120 }
});

server.post("/users", validate(userSchema), handler);
```

## Documentation

- [Complete Guide](docs/GUIDE.md)
- [API Reference](docs/API.md)
- [Middleware Guide](docs/MIDDLEWARE.md)
- [Database Guide](docs/DATABASE.md)
- [Authentication Guide](docs/AUTH.md)
- [Best Practices](docs/BEST_PRACTICES.md)

## Examples

Check out the `examples/` directory for complete working examples:

- **[basic-api.nm](examples/basic-api.nm)** - Basic CRUD API
- **[auth-api.nm](examples/auth-api.nm)** - Authentication with JWT
- **[blog-api.nm](examples/blog-api.nm)** - Blog API with relationships
- **[middleware.nm](examples/middleware.nm)** - Custom middleware
- **[validation.nm](examples/validation.nm)** - Request validation
- **[file-upload.nm](examples/file-upload.nm)** - File upload handling

## Project Structure

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

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Related Projects

- **[NMORM](https://github.com/Araryarch/nmorm)** - ORM for NAMI language
- **[NAMI](https://github.com/Araryarch/NAMI)** - NAMI programming language

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- 📧 Email: support@robin-framework.dev
- 💬 Discord: [Join our community](https://discord.gg/robin)
- 🐛 Issues: [GitHub Issues](https://github.com/Araryarch/robin-framework/issues)
- 📖 Docs: [Documentation](https://robin-framework.dev/docs)

---

<p align="center">
  Made with ❤️ by the NAMI Team
</p>
