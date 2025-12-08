# Auth Client - `/src/lib/auth-client.ts`

This file creates the client-side interface for Better Auth in your Svelte 5 components.

## Why This File Exists

The auth client provides:
- Browser-side authentication methods
- Session management from frontend
- Type-safe auth operations
- Automatic request handling to `/api/auth/*`

## Minimum Required Code

```typescript
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: window.location.origin, // Points to your domain
});

export const signIn = async () => {
  return await authClient.signIn.social({
    provider: "google",
  });
};

export const signOut = async () => {
  return await authClient.signOut();
};
```

## What Each Part Does

### `createAuthClient()`
- **MUST** import from `better-auth/client`
- Creates client instance that talks to `/api/auth/*` endpoints
- Handles cookies, CSRF, and request formatting automatically

### `baseURL` Configuration
```typescript
baseURL: window.location.origin  // REQUIRED
```
- **MUST** point to your app's domain
- Better Auth appends `/api/auth` automatically
- Use `window.location.origin` for dynamic domains (dev/prod)

### Sign-In Function
```typescript
export const signIn = async () => {
  return await authClient.signIn.social({
    provider: "google", // REQUIRED - matches server config
  });
};
```
- **MUST** specify provider that matches server configuration
- Returns Promise that resolves when OAuth flow starts
- Automatically redirects to Google OAuth

### Sign-Out Function
```typescript
export const signOut = async () => {
  return await authClient.signOut();
};
```
- Clears session from database and cookies
- **MUST** be followed by page reload/redirect to update UI state

## Client-Side Requirements

1. **Browser Environment**: Only works in browser (not SSR)
2. **Cookies Enabled**: Better Auth uses httpOnly cookies
3. **Same Origin**: Client must be on same domain as API
4. **CSRF Protection**: Automatically handled by client

## Usage in Svelte Components

```typescript
import { authClient, signIn, signOut } from "$lib/auth-client";

// In component script
async function handleSignIn() {
  try {
    await signIn(); // Redirects to Google
  } catch (error) {
    console.error("Sign in failed:", error);
  }
}

async function handleSignOut() {
  try {
    await signOut();
    window.location.reload(); // REQUIRED to update UI
  } catch (error) {
    console.error("Sign out failed:", error);
  }
}
```

## Session Management

```typescript
// Check current session
const session = await authClient.getSession();

// Listen to auth state changes (if needed)
authClient.onSessionChange((session) => {
  // Update UI state
});
```

## Environment Considerations

### Development
```typescript
baseURL: "http://localhost:4321"
```

### Production (Cloudflare)
```typescript
baseURL: window.location.origin  // Dynamically resolves
```

## Common Client Issues

- **Wrong baseURL**: Client can't reach auth endpoints
- **CORS Errors**: API and client on different domains
- **Cookie Issues**: Third-party cookies blocked
- **Missing redirect**: UI doesn't update after sign-out
- **SSR Usage**: Trying to use client functions server-side

## Integration with Svelte 5

```typescript
// In Svelte component
<script>
  import { signIn, signOut } from "$lib/auth-client";
  
  let { session } = $props(); // Passed from Astro page
  
  // Reactive state
  let isLoading = $state(false);
</script>

{#if session}
  <button onclick={async () => { 
    isLoading = true;
    await signOut(); 
    isLoading = false;
  }}>
    Sign Out
  </button>
{:else}
  <button onclick={() => signIn()}>
    Sign In with Google
  </button>
{/if}
```

The auth client is your frontend interface to Better Auth. It handles the complex OAuth flows and session management, letting you focus on UI logic.