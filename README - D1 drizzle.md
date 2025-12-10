

```ts
// a.s. this is a local drizzle config, unlike remote it has a specific url
//      but, despite that, we need to do the migration manually
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/lib/server/db/schema.ts",
  out: "./src/lib/server/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./.wrangler/state/v3/d1/a-1.sqlite",
  },
});
```

```sh
# instead of drizzle for the local db we use the wrangler standard migration
wrangler d1 migrations apply a-1
wrangler d1 execute a-1 --local --command "SELECT 1;"

# all sqlite/d1 tables
wrangler d1 execute a-1 --local --command "SELECT name FROM sqlite_master WHERE type='table';"
wrangler d1 execute a-1 --remote --command "SELECT name FROM sqlite_master WHERE type='table';"

# more details
wrangler d1 execute a-1 --local --command "SELECT name, type, sql FROM sqlite_master WHERE type='table';"

wrangler d1 execute a-1 --local --command "
  SELECT name 
  FROM sqlite_master 
  WHERE type='table';
"

wrangler d1 execute a-1 --local --command "
  SELECT name 
  FROM sqlite_master 
  WHERE type='table' 
  AND name NOT LIKE 'sqlite_%';
"

| Goal                 | Command                                              |
| -------------------- | ---------------------------------------------------- |
| List all tables      | `SELECT name FROM sqlite_master WHERE type='table';` |
| Inspect table schema | `SELECT sql FROM sqlite_master WHERE name='users';`  |
| List indexes         | `SELECT name FROM sqlite_master WHERE type='index';` |


```

Absolutely — here is a **clean, copy-paste-ready Markdown block** containing *all* the useful D1 introspection commands.
You can drop this directly into your project docs or README.

---

# 📘 Cloudflare D1 — Local DB Introspection Cheat Sheet

````md
# Cloudflare D1 — Local Database Introspection Guide

> Replace `a-1` with your database name if different.

---

## 🧱 List all tables
```bash
wrangler d1 execute a-1 --local --command \
"SELECT name FROM sqlite_master WHERE type='table';"
````

---

## 🧱 List all non-system tables

```bash
wrangler d1 execute a-1 --local --command \
"SELECT name FROM sqlite_master 
 WHERE type='table' 
 AND name NOT LIKE 'sqlite_%';"
```

---

## 🔍 Show SQL that created each table

```bash
wrangler d1 execute a-1 --local --command \
"SELECT name, sql FROM sqlite_master WHERE type='table';"
```

---

## 🔍 Show schema for a specific table

```bash
wrangler d1 execute a-1 --local --command \
\"SELECT sql FROM sqlite_master WHERE name='users';\"
```

---

## 📑 List all indexes

```bash
wrangler d1 execute a-1 --local --command \
"SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index';"
```

---

## 📜 Dump full schema (all CREATE statements)

```bash
wrangler d1 execute a-1 --local --command \
"SELECT sql FROM sqlite_master WHERE sql NOT NULL;"
```

---

## 🧪 Quick test (ensure DB is reachable)

```bash
wrangler d1 execute a-1 --local --command "SELECT 1;"
```

```

---

If you want, I can also generate an **npm script block** (like `npm run db:tables`, `npm run db:schema`, etc.) or a standalone **Node CLI tool** that wraps these commands.
```
