# Auth Configuration - `/src/lib/auth.ts`

This file configures Better Auth for your Astro + Cloudflare application.

## Why This File Exists

Better Auth needs configuration to:
- Connect to your database (D1/LibSQL)
- Set up OAuth providers (Google)
- Configure sessions and security
- Handle Cloudflare-specific requirements

## Minimum Required Code

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { type DrizzleClient } from "./server/db";
import * as schema from "./server/db/schema";

export function getAuth(db: DrizzleClient, env?: Record<string, any>) {
  const environment = env || process.env;

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite", // Required for D1/LibSQL
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    socialProviders: {
      google: {
        clientId: environment.GOOGLE_CLIENT_ID,
        clientSecret: environment.GOOGLE_CLIENT_SECRET,
      },
    },
    secret: environment.BETTER_AUTH_SECRET,
    baseURL: environment.BETTER_AUTH_URL || "http://localhost:4321",
  });
}
```

## What Each Part Does

### `getAuth()` Function
- **MUST** be a function (not direct export) for Cloudflare compatibility
- Takes database instance and environment variables
- Returns configured Better Auth instance

### Database Adapter
```typescript
database: drizzleAdapter(db, {
  provider: "sqlite", // REQUIRED for D1/LibSQL
  schema: { ... }     // REQUIRED table mappings
})
```
- **MUST** use `drizzleAdapter` for database operations
- **MUST** specify `provider: "sqlite"` for Cloudflare D1
- **MUST** map all four schema tables

### Social Providers
```typescript
socialProviders: {
  google: {
    clientId: environment.GOOGLE_CLIENT_ID,    // REQUIRED
    clientSecret: environment.GOOGLE_CLIENT_SECRET, // REQUIRED
  },
}
```
- **MUST** have valid Google OAuth credentials
- Environment variables **MUST** be set in Cloudflare

### Security Configuration
```typescript
secret: environment.BETTER_AUTH_SECRET,  // REQUIRED for JWT/sessions
baseURL: environment.BETTER_AUTH_URL,    // REQUIRED for OAuth redirects
```

## Environment Variables Required

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
BETTER_AUTH_SECRET=random_32_char_string
BETTER_AUTH_URL=https://your-domain.pages.dev
```

## Cloudflare-Specific Requirements

1. **Function Export**: Must be a function, not direct betterAuth() call
2. **Environment Access**: Use `locals.runtime.env` from middleware
3. **SQLite Provider**: D1 requires `provider: "sqlite"`
4. **Base URL**: Must match your Cloudflare Pages domain

## Database Schema Dependencies

Requires these tables in your D1 database:
- `user` - User accounts
- `session` - Active sessions  
- `account` - OAuth account links
- `verification` - Email verification tokens

## Common Configuration Issues

- **Missing secret**: App will crash without `BETTER_AUTH_SECRET`
- **Wrong provider**: Using `mysql`/`postgres` instead of `sqlite` for D1
- **Direct export**: Exporting `betterAuth()` directly breaks in Cloudflare Workers
- **Missing baseURL**: OAuth redirects will fail in production
- **Schema mismatch**: Database tables must match schema definitions

This configuration bridges Better Auth with Cloudflare's serverless environment and D1 database.