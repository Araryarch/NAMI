# NMORM (NAMI ORM)

<p align="center">
  <img src="assets/logo.png" alt="NMORM" width="200"/>
</p>

<p align="center">
  <strong>Modern Object-Relational Mapping library for NAMI language</strong>
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

- 🗄️ **Multi-Database** - SQLite, PostgreSQL, MySQL support
- 🔗 **Relationships** - One-to-One, One-to-Many, Many-to-Many
- 🔍 **Query Builder** - Fluent, chainable API
- 🔄 **Migrations** - Database schema versioning
- ✅ **Validation** - Built-in model validation
- 🎯 **Type-Safe** - Type-safe queries and models
- 📊 **Aggregations** - Count, sum, avg, min, max
- 🔒 **Transactions** - Full transaction support
- 🚀 **Performance** - Connection pooling and query optimization
- 📝 **Logging** - Query logging and debugging

## Installation

```bash
nami install nmorm
```

Or clone and build from source:

```bash
git clone https://github.com/Araryarch/nmorm.git
cd nmorm
nami build
```

## Quick Start

### Basic Usage

```nami
import { ORM } from "nmorm";
import { sqlite } from "robin/db";

// Connect to database
const db = sqlite("./database.db");
const orm = ORM(db);

// Define model
const User = orm.model("User", {
  id: { type: "integer", primary: true, autoIncrement: true },
  name: { type: "string", required: true },
  email: { type: "string", unique: true, required: true },
  createdAt: { type: "datetime", default: "now" }
});

// Sync database (create tables)
await orm.sync();

// Create
const user = await User.create({
  name: "Alice",
  email: "alice@example.com"
});

// Read
const users = await User.findAll();
const user = await User.findById(1);
const user = await User.findOne({ where: { email: "alice@example.com" } });

// Update
await User.update(
  { name: "Alice Smith" },
  { where: { id: 1 } }
);

// Delete
await User.delete({ where: { id: 1 } });
```

### With Relationships

```nami
// Define models
const User = orm.model("User", {
  id: { type: "integer", primary: true, autoIncrement: true },
  name: { type: "string", required: true }
});

const Post = orm.model("Post", {
  id: { type: "integer", primary: true, autoIncrement: true },
  title: { type: "string", required: true },
  content: { type: "text" },
  userId: { type: "integer", required: true }
});

// Define relationships
User.hasMany(Post, { foreignKey: "userId", as: "posts" });
Post.belongsTo(User, { foreignKey: "userId", as: "author" });

await orm.sync();

// Query with relationships
const users = await User.findAll({
  include: ["posts"]
});

const post = await Post.findById(1, {
  include: ["author"]
});
```

### Query Builder

```nami
// Chaining queries
const users = await User
  .where({ active: true })
  .where({ age: { gt: 18 } })
  .orderBy("createdAt", "desc")
  .limit(10)
  .offset(20)
  .select(["id", "name", "email"])
  .findAll();

// Aggregations
const count = await User.where({ active: true }).count();
const total = await Order.where({ status: "completed" }).sum("amount");
const average = await Product.avg("price");
```

## Core Concepts

### Model Definition

```nami
const Model = orm.model("ModelName", {
  fieldName: {
    type: "string" | "integer" | "float" | "boolean" | "text" | "datetime" | "json",
    primary: true,           // Primary key
    autoIncrement: true,     // Auto increment
    unique: true,            // Unique constraint
    required: true,          // NOT NULL
    default: value,          // Default value
    min: number,             // Min value/length
    max: number,             // Max value/length
    validate: function       // Custom validator
  }
});
```

### Field Types

```nami
// String types
{ type: "string", max: 255 }
{ type: "text" }

// Numeric types
{ type: "integer" }
{ type: "float" }
{ type: "decimal", precision: 10, scale: 2 }

// Boolean
{ type: "boolean", default: false }

// Date/Time
{ type: "datetime" }
{ type: "date" }
{ type: "time" }

// JSON
{ type: "json" }

// Enum
{ type: "enum", values: ["active", "inactive"] }
```

### CRUD Operations

```nami
// Create
const user = await User.create({ name: "Alice", email: "alice@example.com" });

// Read
const users = await User.findAll();
const user = await User.findById(1);
const user = await User.findOne({ where: { email: "alice@example.com" } });

// Update
await User.update({ name: "Alice Smith" }, { where: { id: 1 } });

// Delete
await User.delete({ where: { id: 1 } });

// Count
const count = await User.count({ where: { active: true } });

// Exists
const exists = await User.exists({ where: { email: "alice@example.com" } });
```

### Query Operators

```nami
// Comparison
{ eq: value }        // Equal
{ ne: value }        // Not equal
{ gt: value }        // Greater than
{ gte: value }       // Greater than or equal
{ lt: value }        // Less than
{ lte: value }       // Less than or equal

// Pattern matching
{ like: pattern }    // LIKE
{ notLike: pattern } // NOT LIKE

// Lists
{ in: [values] }     // IN
{ notIn: [values] }  // NOT IN

// Range
{ between: [a, b] }  // BETWEEN

// Null checks
{ isNull: true }     // IS NULL
{ isNotNull: true }  // IS NOT NULL
```

### Relationships

```nami
// One-to-Many
User.hasMany(Post, { foreignKey: "userId", as: "posts" });
Post.belongsTo(User, { foreignKey: "userId", as: "author" });

// One-to-One
User.hasOne(Profile, { foreignKey: "userId", as: "profile" });
Profile.belongsTo(User, { foreignKey: "userId", as: "user" });

// Many-to-Many
User.belongsToMany(Role, {
  through: "UserRoles",
  foreignKey: "userId",
  otherKey: "roleId",
  as: "roles"
});

// Eager loading
const users = await User.findAll({
  include: ["posts", "profile"]
});

// Nested includes
const users = await User.findAll({
  include: [
    {
      relation: "posts",
      include: ["comments"]
    }
  ]
});
```

### Transactions

```nami
// Auto-managed transaction
await orm.transaction(async (tx) => {
  const user = await User.create({ name: "Alice" }, { transaction: tx });
  await Post.create({ userId: user.id, title: "Hello" }, { transaction: tx });
});

// Manual transaction
const tx = await orm.beginTransaction();
try {
  const user = await User.create({ name: "Alice" }, { transaction: tx });
  await Post.create({ userId: user.id, title: "Hello" }, { transaction: tx });
  await tx.commit();
} catch (error) {
  await tx.rollback();
  throw error;
}
```

### Migrations

```nami
// migrations/001_create_users.nm

export function up(orm) {
  return orm.createTable("users", {
    id: { type: "integer", primary: true, autoIncrement: true },
    name: { type: "string", required: true },
    email: { type: "string", unique: true, required: true },
    createdAt: { type: "datetime", default: "now" }
  });
}

export function down(orm) {
  return orm.dropTable("users");
}

// Run migrations
await orm.migrate();

// Rollback
await orm.rollback();
```

### Hooks

```nami
User.beforeCreate((user) => {
  user.createdAt = new Date();
});

User.afterCreate((user) => {
  println(f, "User created:", user.id);
});

User.beforeUpdate((user) => {
  user.updatedAt = new Date();
});

// Available hooks
beforeValidate, afterValidate
beforeCreate, afterCreate
beforeUpdate, afterUpdate
beforeDelete, afterDelete
beforeSave, afterSave
```

## API Reference

### ORM

```nami
const orm = ORM(database);

orm.model(name, schema)           // Define model
orm.sync()                        // Sync database
orm.migrate()                     // Run migrations
orm.rollback()                    // Rollback migrations
orm.seed()                        // Run seeds
orm.transaction(callback)         // Execute transaction
orm.query(sql, params)            // Raw query
```

### Model

```nami
Model.create(data)                // Create record
Model.findAll(options)            // Find all records
Model.findById(id, options)       // Find by ID
Model.findOne(options)            // Find one record
Model.update(data, options)       // Update records
Model.delete(options)             // Delete records
Model.count(options)              // Count records
Model.exists(options)             // Check existence
Model.sum(field, options)         // Sum field
Model.avg(field, options)         // Average field
Model.min(field, options)         // Min field
Model.max(field, options)         // Max field
```

### Query Builder

```nami
Model.where(conditions)           // Add WHERE clause
Model.orderBy(field, direction)   // Add ORDER BY
Model.limit(count)                // Add LIMIT
Model.offset(count)               // Add OFFSET
Model.select(fields)              // Select specific fields
Model.include(relations)          // Include relationships
```

## Documentation

- [Complete Guide](docs/GUIDE.md)
- [API Reference](docs/API.md)
- [Migrations Guide](docs/MIGRATIONS.md)
- [Relationships Guide](docs/RELATIONSHIPS.md)
- [Query Builder Guide](docs/QUERY_BUILDER.md)
- [Best Practices](docs/BEST_PRACTICES.md)

## Examples

Check out the `examples/` directory:

- **[basic-crud.nm](examples/basic-crud.nm)** - Basic CRUD operations
- **[relationships.nm](examples/relationships.nm)** - Model relationships
- **[transactions.nm](examples/transactions.nm)** - Transaction handling
- **[migrations.nm](examples/migrations.nm)** - Database migrations
- **[advanced-queries.nm](examples/advanced-queries.nm)** - Complex queries

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md).

## Related Projects

- **[Robin Framework](https://github.com/Araryarch/robin-framework)** - API framework for NAMI
- **[NAMI](https://github.com/Araryarch/NAMI)** - NAMI programming language

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- 📧 Email: support@nmorm.dev
- 💬 Discord: [Join our community](https://discord.gg/nmorm)
- 🐛 Issues: [GitHub Issues](https://github.com/Araryarch/nmorm/issues)
- 📖 Docs: [Documentation](https://nmorm.dev/docs)

---

<p align="center">
  Made with ❤️ by the NAMI Team
</p>
