# Auth API Handler - `/api/auth/[...all].ts`

This file is the **core auth endpoint** that handles all Better Auth operations in your Astro application.

## Why This File Exists

Better Auth needs a single endpoint to handle all authentication operations:
- OAuth flows (Google sign-in)
- Session management
- Sign-out operations
- Token refresh
- CSRF protection

## Minimum Required Code

```typescript
import type { APIRoute } from "astro";

export const ALL: APIRoute = async (context) => {
  const { request, locals } = context;
  
  // Get auth instance from middleware
  const auth = locals.auth;
  
  if (!auth) {
    return new Response("Auth not configured", { status: 500 });
  }
  
  // Let Better Auth handle all requests
  return await auth.handler(request);
};
```

## What Each Part Does

### `export const ALL`
- **MUST** export `ALL` (not GET/POST) to catch all HTTP methods
- Better Auth uses different methods: GET for OAuth callbacks, POST for sign-out, etc.

### `locals.auth`
- Auth instance is created in middleware and stored in `locals`
- **MUST** be available or authentication will fail

### `auth.handler(request)`
- Better Auth's built-in request handler
- Automatically routes to correct auth operation based on URL path
- Handles: `/api/auth/sign-in/google`, `/api/auth/sign-out`, `/api/auth/session`, etc.

## URL Structure Handled

- `/api/auth/sign-in/google` - Initiates Google OAuth
- `/api/auth/callback/google` - OAuth callback from Google
- `/api/auth/sign-out` - Signs out user
- `/api/auth/session` - Gets current session
- `/api/auth/csrf` - CSRF token

## Critical Requirements

1. **File Location**: MUST be at `/src/pages/api/auth/[...all].ts`
2. **Export Name**: MUST export `ALL` (case-sensitive)
3. **Middleware Dependency**: Requires auth instance from middleware
4. **Request Forwarding**: MUST pass the raw request to `auth.handler()`

## Common Issues

- **Wrong export name**: Using `GET` instead of `ALL` breaks OAuth callbacks
- **Missing auth instance**: Middleware not properly configured
- **Wrong file path**: Better Auth expects `/api/auth/*` routes
- **Request modification**: Modifying the request before passing to handler breaks auth

This handler is the bridge between Astro's routing and Better Auth's internal logic. Keep it simple and let Better Auth do the heavy lifting.