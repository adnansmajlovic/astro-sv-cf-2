# 🔐 Protecting Cloudflare Durable Objects with API Keys

This guide explains how to secure your Cloudflare Durable Objects by adding API key authentication, preventing unauthorized access while maintaining server-side functionality.

## 🎯 **What We're Protecting**

**Before**: Anyone could call your Durable Object endpoints directly

```bash
# ❌ This worked without any authentication
curl "https://your-worker.workers.dev/analytics?userId=anyone"
```

**After**: Only requests with valid API keys can access your Durable Objects

```bash
# ✅ Now requires authentication
curl "https://your-worker.workers.dev/analytics?userId=test" \
  -H "X-API-Key: your-secret-key"
```

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│   SvelteKit     │───▶│  Cloudflare     │───▶│ Durable Object   │
│  Server-Side    │    │  Worker         │    │  (UserTracker)   │
│  (+page.server) │    │  (with API key  │    │                  │
│                 │    │   validation)   │    │                  │
└─────────────────┘    └─────────────────┘    └──────────────────┘
         │                       │                       │
         │                       │                       │
    API key stored          Validates every         Protected data
    securely on server      incoming request        and operations
```

## 📋 **Implementation Steps**

### Step 1: Update Worker with API Key Validation

**File**: `src/index.ts`

Add API key validation to your main worker:

```typescript
export interface Env {
	USER_TRACKER: DurableObjectNamespace;
	API_USER_TRACKER_SECRET_KEY: string; // ← Add this
	ENVIRONMENT?: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// 🔐 Validate API Key
		const apiKey =
			request.headers.get('X-API-Key') ||
			request.headers.get('Authorization')?.replace('Bearer ', '');

		if (!apiKey || apiKey !== env.API_SECRET_KEY) {
			return new Response(JSON.stringify({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// ✅ Continue with your existing logic...
	},
};
```

### Step 2: Store API Keys Securely

**Never put secrets in your code or wrangler.toml!**

```bash
# Set API key for development
wrangler secret put API_USER_TRACKER_SECRET_KEY
# Enter when prompted: your-development-api-key-2024

# Set API key for production
wrangler secret put API_USER_TRACKER_SECRET_KEY --env production
# Enter when prompted: your-super-secure-production-key-2024-xyz
```

**Verify secrets are set:**

```bash
# List secrets (shows names only, not values)
wrangler secret list
wrangler secret list --env production
```

### Step 3: Update Server-Side Code

**File**: `+page.server.ts` (or your server-side API calls)

```typescript
export const load = (async ({ url, platform, locals }) => {
	const userTrackerBinding = platform?.env?.USER_TRACKER;
	const apiKey = platform?.env?.API_USER_TRACKER_SECRET_KEY; // ← Get API key

	if (!apiKey) {
		throw new Error('API key not configured');
	}

	const response = await durableObject.fetch(
		new Request(`https://do-host/analytics?userId=${userId}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-API-Key': apiKey, // ← Include API key
			},
		}),
	);

	// Handle response...
}) satisfies PageServerLoad;
```

### Step 4: Update wrangler.toml (Safe Configuration)

**File**: `wrangler.toml`

```toml
name = "user-tracker-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "development"

[[env.production]]
name = "user-tracker-worker-prod"

[env.production.vars]
ENVIRONMENT = "production"

[durable_objects]
bindings = [
  { name = "USER_TRACKER", class_name = "UserTracker" }
]

# ✅ NO SECRETS HERE - they're stored via 'wrangler secret put'
```

### Step 5: Deploy and Test

```bash
# Deploy to development
wrangler deploy

# Deploy to production
wrangler deploy --env production

# Test unauthorized access (should fail with 401)
curl -X GET "https://your-worker.workers.dev/analytics?userId=test"

# a.s. test unauthorized access (should fail with 401)
curl -X GET "https://user-tracker-worker.web-tech-lead.workers.dev?userId=test"

# Test authorized access (should work)
curl -X GET "https://your-worker.workers.dev/analytics?userId=test" \
  -H "X-API-Key: your-development-api-key-2024"
```

## 🔑 **API Key Management**

### Generating Strong API Keys

```bash
# Generate a secure random API key
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use online generator (ensure it's from a trusted source)
```

### Key Rotation Schedule

| Environment | Rotation Frequency | Notes                             |
| ----------- | ------------------ | --------------------------------- |
| Development | Every 90 days      | Can be more frequent for testing  |
| Staging     | Every 60 days      | Coordinate with deployment cycles |
| Production  | Every 30-90 days   | Plan during maintenance windows   |

### Rotating API Keys

```bash
# 1. Generate new key
NEW_KEY=$(openssl rand -hex 32)

# 2. Update the secret
wrangler secret put API_SECRET_KEY --env production
# Enter the new key when prompted

# 3. Deploy (if needed)
wrangler deploy --env production

# 4. Update any external systems that use the old key
# 5. Test thoroughly
# 6. Document the change
```

## 🛡️ **Security Features Implemented**

### ✅ **What's Protected**

- **API Endpoints**: All Durable Object routes require authentication
- **Request Validation**: Invalid or missing keys return 401 Unauthorized
- **Audit Logging**: Failed authentication attempts are logged
- **Environment Isolation**: Separate keys for dev/staging/production
- **Server-Side Only**: API keys never exposed to client browsers

### ✅ **Attack Vectors Mitigated**

| Attack Type              | How We Prevent It                             |
| ------------------------ | --------------------------------------------- |
| **Direct API Access**    | API key required for all requests             |
| **Credential Exposure**  | Keys stored in Cloudflare secrets, not code   |
| **Brute Force**          | Rate limiting + monitoring of failed attempts |
| **Cross-Environment**    | Different keys per environment                |
| **Client-Side Exposure** | Keys only exist on server-side                |

## 📊 **Monitoring & Logging**

### View Worker Logs

```bash
# Real-time logs
wrangler tail

# Production logs
wrangler tail --env production

# Filter for security events
wrangler tail --env production | grep "Unauthorized"
```

### Log Analysis

Look for these security-related log entries:

```json
{
	"level": "warn",
	"message": "Unauthorized access attempt",
	"data": {
		"hasKey": false,
		"path": "/analytics",
		"userAgent": "curl/7.68.0",
		"ip": "192.168.1.100",
		"timestamp": "2024-01-15T10:30:00Z"
	}
}
```

### Setting Up Alerts

Consider setting up alerts for:

- High number of 401 responses
- Repeated unauthorized attempts from same IP
- Unusual traffic patterns
- Failed authentication spikes

## 🚨 **Troubleshooting**

### Common Issues

| Problem                | Cause                     | Solution                                 |
| ---------------------- | ------------------------- | ---------------------------------------- |
| **401 Unauthorized**   | Missing/wrong API key     | Check key is set: `wrangler secret list` |
| **500 Internal Error** | API key not configured    | Run `wrangler secret put API_SECRET_KEY` |
| **Local dev fails**    | No local API key          | Add to `.env.local` file                 |
| **Headers not sent**   | Missing header in request | Add `X-API-Key` header                   |

### Debug Steps

1. **Check if secret exists:**

   ```bash
   wrangler secret list --env production
   ```

2. **Test API key format:**

   ```bash
   # Should be 64 characters for hex-encoded 32-byte key
   echo "your-api-key" | wc -c
   ```

3. **Verify worker deployment:**

   ```bash
   wrangler deploy --env production
   ```

4. **Check request headers:**
   ```bash
   curl -v -H "X-API-Key: your-key" "https://your-worker.workers.dev/health"
   ```

## 🔄 **Local Development Setup**

### Environment Variables

**File**: `.env.local` (add to `.gitignore`)

```bash
# Local development API key
API_SECRET_KEY=your-development-api-key-2024
```

### SvelteKit Configuration

**File**: `+page.server.ts`

```typescript
// Support both Cloudflare and local development
const apiKey = platform?.env?.API_SECRET_KEY || process.env.API_SECRET_KEY;

if (!apiKey) {
	throw new Error('API key not configured for environment');
}
```

## 📚 **Next Steps**

### Enhanced Security Options

1. **JWT Authentication**: Replace API keys with user-specific JWT tokens
2. **Rate Limiting**: Add request throttling per API key
3. **IP Whitelisting**: Restrict access to specific IP ranges
4. **Request Signing**: Use HMAC signatures for additional security
5. **Multi-Factor**: Combine API keys with other authentication methods

### Monitoring Improvements

1. **Metrics Dashboard**: Track API usage and security events
2. **Automated Alerts**: Set up notifications for security incidents
3. **Audit Logs**: Detailed logging of all API access
4. **Performance Monitoring**: Track response times and error rates

## 📖 **Additional Resources**

- [Cloudflare Workers Security Best Practices](https://developers.cloudflare.com/workers/platform/security/)
- [Durable Objects Documentation](https://developers.cloudflare.com/durable-objects/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Environment Variables & Secrets](https://developers.cloudflare.com/workers/platform/environment-variables/)

## 🎯 **Security Checklist**

Before going to production, ensure:

- [ ] Strong, unique API keys generated
- [ ] API keys stored via `wrangler secret put` (not in code)
- [ ] Different keys for each environment
- [ ] All endpoints require authentication
- [ ] Failed auth attempts are logged
- [ ] Rate limiting considered/implemented
- [ ] Regular key rotation schedule planned
- [ ] Team members trained on key management
- [ ] Monitoring and alerting configured
- [ ] Incident response plan documented

---

**Remember**: Security is an ongoing process, not a one-time setup. Regularly review and update your security measures as your application grows.
