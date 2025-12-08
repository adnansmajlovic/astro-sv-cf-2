# Navbar Component - `/src/components/Navbar.svelte`

This Svelte 5 component handles the authentication UI for sign-in/sign-out operations.

## Why This Component Exists

The Navbar provides:
- Visual auth state (logged in/out)
- Sign-in/sign-out buttons
- User profile display
- Loading states during auth operations
- Error handling and user feedback

## Minimum Required Code

```svelte
<script>
  import { authClient } from "$lib/auth-client";
  
  let { session } = $props(); // REQUIRED: Passed from Astro page
  
  async function loginWithGoogle() {
    await authClient.signIn.social({
      provider: "google",
    });
  }
  
  async function logout() {
    await authClient.signOut();
    window.location.reload(); // REQUIRED to update UI
  }
</script>

<nav>
  {#if session}
    <span>Welcome, {session.user?.name || session.user?.email}</span>
    <button onclick={logout}>Sign Out</button>
  {:else}
    <button onclick={loginWithGoogle}>Sign In with Google</button>
  {/if}
</nav>
```

## What Each Part Does

### Props Interface
```typescript
let { session } = $props(); // REQUIRED
```
- **MUST** receive session from parent Astro page
- Session contains user data and authentication state
- Type: `{ user?: User, session?: Session } | null`

### Sign-In Function
```typescript
async function loginWithGoogle() {
  await authClient.signIn.social({
    provider: "google", // REQUIRED - matches server config
  });
}
```
- **MUST** use `authClient.signIn.social()`
- Provider **MUST** match server configuration
- Function triggers OAuth redirect (page will leave)

### Sign-Out Function
```typescript
async function logout() {
  await authClient.signOut();
  window.location.reload(); // REQUIRED
}
```
- **MUST** call `authClient.signOut()`
- **MUST** reload/redirect after sign-out to update session state
- Without reload, UI will show stale session data

### Conditional Rendering
```svelte
{#if session}
  <!-- Authenticated UI -->
{:else}
  <!-- Unauthenticated UI -->
{/if}
```
- **MUST** check session existence for auth state
- Session is `null` when not authenticated
- Session contains user object when authenticated

## Session Data Structure

```typescript
// When authenticated
session = {
  user: {
    id: "user_123",
    name: "John Doe",
    email: "john@example.com",
    image: "https://avatar.url",
    emailVerified: true
  },
  session: {
    id: "session_456",
    userId: "user_123",
    expiresAt: "2024-01-01T00:00:00Z"
  }
}

// When not authenticated
session = null
```

## Astro Integration

### In Astro Page
```astro
---
// Get session server-side
const auth = Astro.locals.auth;
const sessionData = await auth.api.getSession({
  headers: Astro.request.headers,
});
---

<Navbar session={sessionData} client:load />
```

### Required Props
- **session**: Auth state from server
- **client:load**: **REQUIRED** for Svelte interactivity

## Error Handling (Enhanced)

```svelte
<script>
  let isLoading = $state(false);
  let error = $state(null);
  
  async function loginWithGoogle() {
    try {
      isLoading = true;
      error = null;
      await authClient.signIn.social({ provider: "google" });
    } catch (err) {
      error = "Login failed. Please try again.";
    } finally {
      isLoading = false;
    }
  }
</script>

{#if error}
  <div class="error">{error}</div>
{/if}

<button onclick={loginWithGoogle} disabled={isLoading}>
  {isLoading ? "Signing In..." : "Sign In with Google"}
</button>
```

## Svelte 5 Specific Features

### Reactive State
```typescript
let isLoading = $state(false);  // Svelte 5 rune
let error = $state(null);       // Svelte 5 rune
```

### Props Destructuring
```typescript
let { session, auth } = $props(); // Svelte 5 syntax
```

### Event Handlers
```svelte
<button onclick={handleClick}>   <!-- Svelte 5 syntax -->
<button on:click={handleClick}>  <!-- Also works -->
```

## Common Integration Issues

- **Missing client:load**: Component won't be interactive
- **No session prop**: Can't determine auth state
- **Missing reload**: UI shows stale data after sign-out
- **Wrong provider**: Must match server configuration
- **SSR/hydration**: Auth client only works browser-side

## Loading States Best Practice

```svelte
<button onclick={loginWithGoogle} disabled={isLoading}>
  {#if isLoading}
    <svg class="spinner">...</svg>
    Signing In...
  {:else}
    <svg class="google-icon">...</svg>
    Sign In with Google
  {/if}
</button>
```

## Security Considerations

- **Never store secrets**: All auth logic is client-side safe
- **Session validation**: Server validates all auth states
- **CSRF protection**: Automatically handled by Better Auth
- **Cookie security**: httpOnly cookies prevent XSS

This component bridges the gap between Better Auth's session management and Svelte's reactive UI, providing a seamless authentication experience.