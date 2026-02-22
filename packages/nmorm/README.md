# NMORM (NAMI ORM)

Modern Object-Relational Mapping library for NAMI language.

## Features

- 🗄️ Multi-database support (SQLite, PostgreSQL, MySQL)
- 🔗 Relationships (One-to-One, One-to-Many, Many-to-Many)
- 🔍 Query builder with fluent API
- 🔄 Migrations and seeding
- ✅ Model validation
- 🎯 Type-safe queries
- 📊 Aggregations and joins
- 🔒 Transactions support
- 🚀 Connection pooling
- 📝 Query logging

## Installation

```bash
nami install nmorm
```

## Quick Start

```nami
import { ORM } from "nmorm";
import { sqlite } from "robin/db";

// Connect to database
const db = sqlite("./database.db");
const orm = ORM(db);

// Define models
const User = orm.model("User", {
  id: { type: "integer", primary: true, autoIncrement: true },
  name: { type: "string", required: true },
  email: { type: "string", unique: true, required: true },
  createdAt: { type: "datetime", default: "now" }
});

const Post = orm.model("Post", {
  id: { type: "integer", primary: true, autoIncrement: true },
  title: { type: "string", required: true },
  content: { type: "text" },
  userId: { type: "integer", required: true },
  published: { type: "boolean", default: false }
});

// Define relationships
User.hasMany(Post, { foreignKey: "userId", as: "posts" });
Post.belongsTo(User, { foreignKey: "userId", as: "author" });

// Sync database (create tables)
await orm.sync();

// CRUD operations
const user = await User.create({
  name: "Alice",
  email: "alice@example.com"
});

const users = await User.findAll();
const user = await User.findById(1);
const user = await User.findOne({ where: { email: "alice@example.com" } });

await User.update({ name: "Alice Smith" }, { where: { id: 1 } });
await User.delete({ where: { id: 1 } });
```

## API Reference

### Model Definition

```nami
const Model = orm.model("ModelName", {
  // Field definitions
  fieldName: {
    type: "string" | "integer" | "float" | "boolean" | "text" | "datetime" | "json",
    primary: true,           // Primary key
    autoIncrement: true,     // Auto increment (for integers)
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
{ type: "text" }  // Unlimited length

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
{ type: "enum", values: ["active", "inactive", "pending"] }
```

### CRUD Operations

```nami
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

// Count
const count = await User.count({ where: { active: true } });

// Exists
const exists = await User.exists({ where: { email: "alice@example.com" } });
```

### Query Builder

```nami
// Where conditions
User.where({ name: "Alice" })
User.where({ age: { gt: 18 } })
User.where({ email: { like: "%@example.com" } })
User.where({ status: { in: ["active", "pending"] } })

// Operators
{ eq: value }        // Equal
{ ne: value }        // Not equal
{ gt: value }        // Greater than
{ gte: value }       // Greater than or equal
{ lt: value }        // Less than
{ lte: value }       // Less than or equal
{ like: pattern }    // LIKE
{ in: [values] }     // IN
{ notIn: [values] }  // NOT IN
{ between: [a, b] }  // BETWEEN
{ isNull: true }     // IS NULL
{ isNotNull: true }  // IS NOT NULL

// Chaining
const users = await User
  .where({ active: true })
  .orderBy("createdAt", "desc")
  .limit(10)
  .offset(20)
  .select(["id", "name", "email"])
  .findAll();

// Aggregations
const result = await User
  .where({ active: true })
  .count();

const result = await Order
  .where({ status: "completed" })
  .sum("total");

const result = await Product
  .avg("price");

const result = await Product
  .min("price");

const result = await Product
  .max("price");
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

const user = await User.findById(1, {
  include: [
    { relation: "posts", where: { published: true } },
    "profile"
  ]
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
  // Auto commit on success, rollback on error
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
// Create migration
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

// Reset (rollback all and re-run)
await orm.reset();
```

### Seeding

```nami
// seeds/users.nm

export async function seed(orm) {
  const User = orm.model("User");
  
  await User.bulkCreate([
    { name: "Alice", email: "alice@example.com" },
    { name: "Bob", email: "bob@example.com" },
    { name: "Charlie", email: "charlie@example.com" }
  ]);
}

// Run seeds
await orm.seed();
```

### Hooks/Lifecycle

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

User.beforeDelete((user) => {
  println(f, "Deleting user:", user.id);
});

// Available hooks
beforeValidate, afterValidate
beforeCreate, afterCreate
beforeUpdate, afterUpdate
beforeDelete, afterDelete
beforeSave, afterSave
```

### Validation

```nami
const User = orm.model("User", {
  email: {
    type: "string",
    required: true,
    validate: (value) => {
      if (!value.includes("@")) {
        throw new Error("Invalid email format");
      }
    }
  },
  age: {
    type: "integer",
    min: 18,
    max: 120,
    validate: (value) => {
      if (value < 18) {
        throw new Error("Must be 18 or older");
      }
    }
  }
});
```

### Raw Queries

```nami
// Execute raw SQL
const result = await orm.query("SELECT * FROM users WHERE age > ?", [18]);

// With named parameters
const result = await orm.query(
  "SELECT * FROM users WHERE name = :name AND age > :age",
  { name: "Alice", age: 18 }
);
```

## Examples

See the `examples/` directory for complete examples:

- `examples/nmorm/basic-crud.nm` - Basic CRUD operations
- `examples/nmorm/relationships.nm` - Model relationships
- `examples/nmorm/transactions.nm` - Transaction handling
- `examples/nmorm/migrations.nm` - Database migrations
- `examples/nmorm/advanced-queries.nm` - Complex queries

## License

MIT
