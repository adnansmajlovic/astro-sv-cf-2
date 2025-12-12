# Minimum Setup Requirements for Better Auth + Astro + Svelte 5 + Cloudflare

This guide covers the absolute minimum requirements to get Better Auth working with your stack.

## 🏗️ Project Structure (REQUIRED)

```
src/
├── lib/
│   ├── auth.ts                 # Server auth configuration
│   ├── auth-client.ts          # Client auth functions
│   └── server/
│       └── db/
│           ├── index.ts        # Database connection
│           └── schema.ts       # Database tables
├── pages/
│   └── api/
│       └── auth/
│           └── [...all].ts     # Auth API handler
├── components/
│   └── Navbar.svelte          # Auth UI component
└── middleware.ts              # Auth initialization
```

## 🔧 Core Dependencies (package.json)

```json
{
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/svelte": "^7.0.0",
    "@astrojs/cloudflare": "^12.0.0",
    "better-auth": "^1.4.0",
    "drizzle-orm": "^0.45.0",
    "svelte": "^5.0.0"
  }
}
```

## 🗄️ Database Schema (REQUIRED)

### `src/lib/server/db/schema.ts`
```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// REQUIRED: All 4 tables must exist
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(current_timestamp)`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(current_timestamp)`),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  userId: text("user_id").notNull().references(() => user.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(current_timestamp)`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(current_timestamp)`),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(current_timestamp)`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(current_timestamp)`),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(current_timestamp)`),
});
```

### `src/lib/server/db/index.ts`
```typescript
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb(db: D1Database) {
  return drizzle(db, { schema });
}

export type DrizzleClient = ReturnType<typeof getDb>;
```

## 🔐 Server Auth Configuration (REQUIRED)

### `src/lib/auth.ts`
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { type DrizzleClient } from "./server/db";
import * as schema from "./server/db/schema";

export function getAuth(db: DrizzleClient, env: Record<string, any>) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite", // REQUIRED for D1
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,     // REQUIRED
        clientSecret: env.GOOGLE_CLIENT_SECRET, // REQUIRED
      },
    },
    secret: env.BETTER_AUTH_SECRET,         // REQUIRED
    baseURL: env.BETTER_AUTH_URL,           // REQUIRED
  });
}
```

## 🌐 Client Auth Functions (REQUIRED)

### `src/lib/auth-client.ts`
```typescript
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
});

export const signIn = async () => {
  return await authClient.signIn.social({ provider: "google" });
};

export const signOut = async () => {
  await authClient.signOut();
  window.location.reload(); // REQUIRED to update UI
};
```

## 🔗 Middleware Setup (REQUIRED)

### `src/middleware.ts`
```typescript
import { defineMiddleware } from "astro:middleware";
import { getDb } from "@lib/server/db";
import { getAuth } from "@lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const env = context.locals.runtime?.env || {};
  
  // Initialize DB and Auth
  context.locals.db = getDb(env.DB);
  context.locals.auth = getAuth(context.locals.db, env);
  
  return next();
});
```

## 📡 API Handler (REQUIRED)

### `src/pages/api/auth/[...all].ts`
```typescript
import type { APIRoute } from "astro";

export const ALL: APIRoute = async (context) => {
  const auth = context.locals.auth;
  
  if (!auth) {
    return new Response("Auth not configured", { status: 500 });
  }
  
  return await auth.handler(context.request);
};
```

## 🎨 UI Component (REQUIRED)

### `src/components/Navbar.svelte`
```svelte
<script>
  import { signIn, signOut } from "$lib/auth-client";
  
  let { session } = $props(); // REQUIRED prop from Astro
  
  async function handleSignIn() {
    await signIn(); // Redirects to Google
  }
  
  async function handleSignOut() {
    await signOut(); // Includes page reload
  }
</script>

<nav>
  {#if session}
    <span>Welcome, {session.user?.name}</span>
    <button onclick={handleSignOut}>Sign Out</button>
  {:else}
    <button onclick={handleSignIn}>Sign In with Google</button>
  {/if}
</nav>
```

## 📄 Astro Page Integration (REQUIRED)

### `src/pages/index.astro`
```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import Navbar from "../components/Navbar.svelte";

// Get session server-side
const auth = Astro.locals.auth;
const sessionData = await auth.api.getSession({
  headers: Astro.request.headers,
});
---

<BaseLayout>
  <Navbar session={sessionData} client:load />
  <!-- client:load is REQUIRED for Svelte interactivity -->
</BaseLayout>
```

## ⚙️ Configuration Files (REQUIRED)

### `astro.config.mjs`
```javascript
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",        // REQUIRED for auth
  adapter: cloudflare(),   // REQUIRED for Cloudflare
  integrations: [svelte()],
});
```

### `wrangler.toml` (D1 Database)
```toml
name = "your-app"
main = "./dist/_worker.js/index.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"           # REQUIRED binding name
database_name = "your-db"
```

## 🔑 Environment Variables (REQUIRED)

### Development (`.env`)
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
BETTER_AUTH_SECRET=your_32_char_random_string
BETTER_AUTH_URL=http://localhost:4321
```

### Production (Cloudflare Secrets)
```bash
# Set these in Cloudflare Pages/Workers
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put BETTER_AUTH_URL  # https://your-domain.pages.dev
```

## 🎯 Google OAuth Setup (REQUIRED)

1. **Google Cloud Console**: Create OAuth 2.0 credentials
2. **Authorized redirect URIs**:
   - `http://localhost:4321/api/auth/callback/google` (dev)
   - `https://your-domain.pages.dev/api/auth/callback/google` (prod)

## ✅ Critical Requirements Summary

1. **File Structure**: All files must be in exact locations shown
2. **Database**: All 4 tables (user, session, account, verification) required
3. **Environment**: All 4 environment variables must be set
4. **Exports**: Use exact export names (`ALL`, `getAuth`, etc.)
5. **Cloudflare**: Use `provider: "sqlite"` for D1 database
6. **Client Load**: Add `client:load` to Svelte components
7. **Server Output**: Set `output: "server"` in Astro config

## 🚫 Common Mistakes to Avoid

- Missing `client:load` directive → Component won't be interactive
- Using `GET` instead of `ALL` in auth handler → OAuth callbacks fail
- Wrong database provider → D1 connection fails  
- Missing page reload after sign-out → Stale UI state
- Direct `betterAuth()` export → Breaks in Cloudflare Workers

Follow this exact setup and your Better Auth integration will work reliably across development and production.
