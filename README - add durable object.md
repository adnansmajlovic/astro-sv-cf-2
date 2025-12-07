# Adding Durable Objects for User Movement Tracking

## Overview

This document outlines the implementation strategy for adding Durable Objects to our SvelteKit application to track user movements and interactions. Based on the current project structure, we'll integrate Durable Objects within the same worker that serves the SvelteKit application for optimal performance and simplicity.

## Architecture Decision: Same Worker vs Separate Worker

### Recommended Approach: Same Worker Integration

**Pros:**

- **Lower latency**: Direct communication without network overhead
- **Simplified deployment**: Single worker deployment
- **Shared context**: Access to same environment variables and bindings
- **Cost efficiency**: Single worker billing
- **Easier debugging**: Single codebase to maintain

**Cons:**

- **Resource sharing**: CPU/memory shared between SSR and Durable Object operations
- **Scaling considerations**: Both components scale together

### Alternative: Separate Worker

**When to consider:**

- If user tracking becomes CPU-intensive
- Need for independent scaling
- Different geographic deployment requirements
- Separate team ownership

## Implementation Plan

### Phase 1: Basic Setup and Configuration

#### 1.1 Update wrangler.jsonc

Add Durable Object bindings to the configuration:

```jsonc
{
	"$schema": "node_modules/wrangler/config-schema.json",
	"name": "dexp-fe-ssr-cf-app",
	"main": ".svelte-kit/cloudflare/_worker.js",
	"compatibility_date": "2025-07-02",
	"compatibility_flags": ["global_fetch_strictly_public", "nodejs_als", "nodejs_compat"],

	// Add Durable Object bindings
	"durable_objects": {
		"bindings": [
			{
				"name": "USER_TRACKER",
				"class_name": "UserTracker",
				"script_name": "dexp-fe-ssr-cf-app",
			},
		],
	},

	// Update migrations for DO
	"migrations": [
		{
			"tag": "v1",
			"new_classes": ["UserTracker"],
		},
	],

	// Existing configuration...
	"version_metadata": {
		"binding": "CF_VERSION_METADATA",
	},
	"assets": {
		"binding": "ASSETS",
		"directory": ".svelte-kit/cloudflare",
	},
	"observability": {
		"enabled": true,
	},
}
```

#### 1.2 Update TypeScript Definitions

Extend `worker-configuration.d.ts` to include our Durable Object bindings:

```typescript
// Add to existing Env interface
interface Env {
	USER_TRACKER: DurableObjectNamespace;
	// ... existing bindings
}
```

### Phase 2: Durable Object Implementation

#### 2.1 Create Durable Object Class

Create `src/lib/durable-objects/UserTracker.ts`:

```typescript
import { DurableObject } from 'cloudflare:workers';

export interface UserMovement {
	userId: string;
	sessionId: string;
	timestamp: number;
	event: 'page_view' | 'click' | 'scroll' | 'hover' | 'form_interaction';
	data: {
		path?: string;
		element?: string;
		coordinates?: { x: number; y: number };
		duration?: number;
		metadata?: Record<string, any>;
	};
}

export interface UserSession {
	userId: string;
	sessionId: string;
	startTime: number;
	lastActivity: number;
	movements: UserMovement[];
	deviceInfo?: {
		userAgent: string;
		screenResolution?: string;
		timezone?: string;
	};
}

export class UserTracker extends DurableObject {
	private sessions: Map<string, UserSession> = new Map();
	private readonly MAX_MOVEMENTS_PER_SESSION = 1000;
	private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.initializeFromStorage();
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const method = request.method;

		try {
			switch (url.pathname) {
				case '/track':
					if (method === 'POST') return this.handleTrackMovement(request);
					break;
				case '/session':
					if (method === 'POST') return this.handleCreateSession(request);
					if (method === 'GET') return this.handleGetSession(request);
					break;
				case '/analytics':
					if (method === 'GET') return this.handleGetAnalytics(request);
					break;
				default:
					return new Response('Not found', { status: 404 });
			}
		} catch (error) {
			console.error('UserTracker error:', error);
			return new Response('Internal server error', { status: 500 });
		}

		return new Response('Method not allowed', { status: 405 });
	}

	private async handleTrackMovement(request: Request): Promise<Response> {
		const movement: UserMovement = await request.json();

		// Validate movement data
		if (!movement.userId || !movement.sessionId || !movement.event) {
			return new Response('Invalid movement data', { status: 400 });
		}

		// Get or create session
		let session = this.sessions.get(movement.sessionId);
		if (!session) {
			session = {
				userId: movement.userId,
				sessionId: movement.sessionId,
				startTime: Date.now(),
				lastActivity: Date.now(),
				movements: [],
			};
			this.sessions.set(movement.sessionId, session);
		}

		// Update session activity
		session.lastActivity = Date.now();

		// Add movement (with limit)
		if (session.movements.length >= this.MAX_MOVEMENTS_PER_SESSION) {
			session.movements.shift(); // Remove oldest
		}
		session.movements.push(movement);

		// Persist to storage
		await this.persistSession(session);

		return new Response(JSON.stringify({ success: true }), {
			headers: { 'Content-Type': 'application/json' },
		});
	}

	private async handleCreateSession(request: Request): Promise<Response> {
		const { userId, sessionId, deviceInfo } = await request.json();

		const session: UserSession = {
			userId,
			sessionId,
			startTime: Date.now(),
			lastActivity: Date.now(),
			movements: [],
			deviceInfo,
		};

		this.sessions.set(sessionId, session);
		await this.persistSession(session);

		return new Response(JSON.stringify({ success: true, session }), {
			headers: { 'Content-Type': 'application/json' },
		});
	}

	private async handleGetSession(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const sessionId = url.searchParams.get('sessionId');

		if (!sessionId) {
			return new Response('Session ID required', { status: 400 });
		}

		const session = this.sessions.get(sessionId);
		if (!session) {
			return new Response('Session not found', { status: 404 });
		}

		return new Response(JSON.stringify(session), {
			headers: { 'Content-Type': 'application/json' },
		});
	}

	private async handleGetAnalytics(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const userId = url.searchParams.get('userId');

		// Clean up expired sessions
		await this.cleanupExpiredSessions();

		const analytics = {
			totalSessions: this.sessions.size,
			userSessions: userId
				? Array.from(this.sessions.values()).filter((s) => s.userId === userId)
				: [],
			recentActivity: Array.from(this.sessions.values())
				.sort((a, b) => b.lastActivity - a.lastActivity)
				.slice(0, 10),
		};

		return new Response(JSON.stringify(analytics), {
			headers: { 'Content-Type': 'application/json' },
		});
	}

	private async initializeFromStorage(): Promise<void> {
		const stored = await this.ctx.storage.list();
		for (const [key, value] of stored) {
			if (key.startsWith('session:')) {
				const sessionId = key.replace('session:', '');
				this.sessions.set(sessionId, value as UserSession);
			}
		}
	}

	private async persistSession(session: UserSession): Promise<void> {
		await this.ctx.storage.put(`session:${session.sessionId}`, session);
	}

	private async cleanupExpiredSessions(): Promise<void> {
		const now = Date.now();
		const expiredSessions: string[] = [];

		for (const [sessionId, session] of this.sessions) {
			if (now - session.lastActivity > this.SESSION_TIMEOUT) {
				expiredSessions.push(sessionId);
			}
		}

		for (const sessionId of expiredSessions) {
			this.sessions.delete(sessionId);
			await this.ctx.storage.delete(`session:${sessionId}`);
		}
	}

	// Alarm handler for periodic cleanup
	async alarm(): Promise<void> {
		await this.cleanupExpiredSessions();

		// Schedule next cleanup (every hour)
		await this.ctx.storage.setAlarm(Date.now() + 60 * 60 * 1000);
	}
}
```

#### 2.2 SvelteKit Integration

Create `src/lib/tracking/client.ts` for client-side tracking:

```typescript
import { browser } from '$app/environment';
import { page } from '$app/state';
import { v4 as uuidv4 } from '@lukeed/uuid';

export class UserTrackingClient {
	private sessionId: string;
	private userId: string | null = null;
	private isInitialized = false;
	private trackingEndpoint = '/api/track';

	constructor() {
		this.sessionId = this.getOrCreateSessionId();
	}

	async initialize(userId?: string): Promise<void> {
		if (!browser || this.isInitialized) return;

		this.userId = userId || this.getAnonymousUserId();

		// Create session
		await this.createSession();

		// Set up tracking listeners
		this.setupTrackingListeners();

		this.isInitialized = true;
	}

	private async createSession(): Promise<void> {
		const deviceInfo = {
			userAgent: navigator.userAgent,
			screenResolution: `${screen.width}x${screen.height}`,
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		};

		await fetch(this.trackingEndpoint + '/session', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userId: this.userId,
				sessionId: this.sessionId,
				deviceInfo,
			}),
		});
	}

	private setupTrackingListeners(): void {
		// Track page views
		if (browser) {
			this.trackPageView(window.location.pathname);
		}

		// Track clicks
		document.addEventListener('click', (e) => {
			const target = e.target as HTMLElement;
			this.trackEvent('click', {
				element:
					target.tagName +
					(target.id ? '#' + target.id : '') +
					(target.className ? '.' + target.className : ''),
				coordinates: { x: e.clientX, y: e.clientY },
				path: window.location.pathname,
			});
		});

		// Track scroll
		let scrollTimer: NodeJS.Timeout;
		document.addEventListener('scroll', () => {
			clearTimeout(scrollTimer);
			scrollTimer = setTimeout(() => {
				this.trackEvent('scroll', {
					scrollY: window.scrollY,
					scrollX: window.scrollX,
					path: window.location.pathname,
				});
			}, 100);
		});

		// Track form interactions
		document.addEventListener('input', (e) => {
			const target = e.target as HTMLInputElement;
			if (target.type !== 'password') {
				// Don't track password inputs
				this.trackEvent('form_interaction', {
					element: target.name || target.id,
					path: window.location.pathname,
				});
			}
		});
	}

	async trackPageView(path: string): Promise<void> {
		await this.trackEvent('page_view', { path });
	}

	async trackEvent(event: string, data: Record<string, any>): Promise<void> {
		if (!this.isInitialized) return;

		const movement = {
			userId: this.userId,
			sessionId: this.sessionId,
			timestamp: Date.now(),
			event,
			data,
		};

		try {
			await fetch(this.trackingEndpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(movement),
			});
		} catch (error) {
			console.error('Failed to track event:', error);
		}
	}

	private getOrCreateSessionId(): string {
		if (!browser) return uuidv4();

		let sessionId = sessionStorage.getItem('tracking_session_id');
		if (!sessionId) {
			sessionId = uuidv4();
			sessionStorage.setItem('tracking_session_id', sessionId);
		}
		return sessionId;
	}

	private getAnonymousUserId(): string {
		if (!browser) return uuidv4();

		let userId = localStorage.getItem('tracking_user_id');
		if (!userId) {
			userId = uuidv4();
			localStorage.setItem('tracking_user_id', userId);
		}
		return userId;
	}
}

// Export singleton instance
export const userTracker = new UserTrackingClient();
```

### Phase 3: API Routes

#### 3.1 Create API Endpoints

Create `src/routes/api/track/+server.ts`:

```typescript
import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const userTracker = platform?.env?.USER_TRACKER;
		if (!userTracker) {
			throw error(500, 'User tracker not available');
		}

		// Get user ID from request (this should be extracted from the session)
		const userId = 'user123'; // Replace with actual user ID extraction

		// Create a Durable Object instance
		const id = userTracker.idFromName(userId);
		const stub = userTracker.get(id);

		// Forward the request to the Durable Object
		const response = await stub.fetch(
			new Request(request.url, {
				method: request.method,
				headers: request.headers,
				body: request.body,
			}),
		);

		return response;
	} catch (err) {
		console.error('Tracking error:', err);
		throw error(500, 'Failed to track event');
	}
};
```

Create `src/routes/api/track/session/+server.ts`:

```typescript
import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const userTracker = platform?.env?.USER_TRACKER;
		if (!userTracker) {
			throw error(500, 'User tracker not available');
		}

		const body = await request.json();
		const userId = body.userId;

		const id = userTracker.idFromName(userId);
		const stub = userTracker.get(id);

		const response = await stub.fetch(
			new Request(`${request.url}/session`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			}),
		);

		return response;
	} catch (err) {
		console.error('Session creation error:', err);
		throw error(500, 'Failed to create session');
	}
};

export const GET: RequestHandler = async ({ url, platform }) => {
	try {
		const userTracker = platform?.env?.USER_TRACKER;
		if (!userTracker) {
			throw error(500, 'User tracker not available');
		}

		const sessionId = url.searchParams.get('sessionId');
		const userId = url.searchParams.get('userId');

		if (!userId) {
			throw error(400, 'User ID required');
		}

		const id = userTracker.idFromName(userId);
		const stub = userTracker.get(id);

		const response = await stub.fetch(
			new Request(`${url.origin}/session?sessionId=${sessionId}`, {
				method: 'GET',
			}),
		);

		return response;
	} catch (err) {
		console.error('Session retrieval error:', err);
		throw error(500, 'Failed to retrieve session');
	}
};
```

### Phase 4: Frontend Integration

#### 4.1 Update App Layout

Update `src/app.html` to include tracking initialization:

```html
<!DOCTYPE html>
<html lang="en" %sveltekit.theme%>
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.png" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover" %sveltekit.theme%>
		<div style="display: contents" %sveltekit.body%>%sveltekit.body%</div>

		<script>
			// Initialize tracking when the page loads
			if (typeof window !== 'undefined') {
				window.addEventListener('load', () => {
					import('/src/lib/tracking/client.ts').then(({ userTracker }) => {
						userTracker.initialize();
					});
				});
			}
		</script>
	</body>
</html>
```

#### 4.2 Update Root Layout

Update `src/routes/+layout.svelte`:

```svelte
<script>
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { userTracker } from '$lib/tracking/client';

  // Track page changes
  $: if (page.url.pathname) {
    userTracker.trackPageView(page.url.pathname);
  }

  onMount(() => {
    // Initialize tracking with user ID if available
    const userId = /* get user ID from your auth system */;
    userTracker.initialize(userId);
  });
</script>

<!-- Your existing layout content -->
<slot />
```

### Phase 5: Analytics Dashboard

Create `src/routes/(admin)/analytics/+page.svelte`:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';

	let analytics: any = null;
	let loading = true;

	async function loadAnalytics() {
		try {
			const response = await fetch('/api/analytics');
			analytics = await response.json();
		} catch (error) {
			console.error('Failed to load analytics:', error);
		} finally {
			loading = false;
		}
	}

	onMount(loadAnalytics);
</script>

<div class="analytics-dashboard">
	<h1>User Analytics Dashboard</h1>

	{#if loading}
		<p>Loading analytics...</p>
	{:else if analytics}
		<div class="stats">
			<div class="stat">
				<h3>Total Sessions</h3>
				<p>{analytics.totalSessions}</p>
			</div>

			<div class="stat">
				<h3>Recent Activity</h3>
				<ul>
					{#each analytics.recentActivity as session}
						<li>
							User: {session.userId} - Last Activity: {new Date(
								session.lastActivity,
							).toLocaleString()}
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}
</div>

<style>
	.analytics-dashboard {
		padding: 2rem;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-top: 2rem;
	}

	.stat {
		background: #f5f5f5;
		padding: 1.5rem;
		border-radius: 8px;
	}
</style>
```

## Deployment Steps

### 1. Update Dependencies

```bash
# No additional dependencies needed for basic Durable Objects
# If you need UUID generation:
pnpm add @lukeed/uuid
```

### 2. Export Durable Object

Update your worker entry point to export the Durable Object class. Create `src/lib/durable-objects/index.ts`:

```typescript
export { UserTracker } from './UserTracker';
```

### 3. Update Build Configuration

Ensure your build process includes the Durable Object classes. This is typically handled automatically by the Cloudflare adapter.

### 4. Deploy

```bash
pnpm run build
wrangler deploy
```

## Security Considerations

1. **Data Privacy**:
   - Implement data retention policies
   - Allow users to opt-out of tracking
   - Comply with GDPR/CCPA requirements

2. **Rate Limiting**:
   - Implement rate limiting on tracking endpoints
   - Prevent abuse and spam

3. **Authentication**:
   - Validate user sessions
   - Implement proper authentication checks

4. **Data Sanitization**:
   - Sanitize tracked data to prevent XSS
   - Don't track sensitive information

## Monitoring and Observability

1. **Metrics**:
   - Track DO request rates
   - Monitor storage usage
   - Alert on error rates

2. **Logging**:
   - Log tracking events for debugging
   - Monitor performance metrics

3. **Dashboards**:
   - Create real-time analytics dashboards
   - Monitor user engagement metrics

## Scaling Considerations

1. **Partitioning Strategy**:
   - Use user ID for DO partitioning
   - Consider geographic partitioning for global apps

2. **Storage Limits**:
   - Implement data rotation policies
   - Archive old data to external storage

3. **Performance Optimization**:
   - Batch tracking requests
   - Implement client-side queuing
   - Use WebSocket connections for real-time tracking

## Testing Strategy

1. **Unit Tests**: Test Durable Object logic
2. **Integration Tests**: Test API endpoints
3. **E2E Tests**: Test complete tracking flow
4. **Load Tests**: Test under high traffic

## Future Enhancements

1. **Real-time Analytics**: WebSocket-based real-time updates
2. **Advanced Analytics**: Heat maps, user journey analysis
3. **Machine Learning**: User behavior predictions
4. **Data Export**: Export tracking data to analytics platforms
5. **A/B Testing**: Integrate with A/B testing frameworks

This implementation provides a solid foundation for user movement tracking while maintaining scalability and performance within your existing SvelteKit application.
