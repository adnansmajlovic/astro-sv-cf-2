## 1. **Cloudflare Workers Environment Variables**

### Via Wrangler CLI (Recommended):

```bash
# Set secrets using wrangler
npx wrangler secret put DATABASE_URL
npx wrangler secret put API_SECRET_KEY
npx wrangler secret put JWT_SECRET

# Set regular environment variables
npx wrangler secret put PUBLIC_API_URL

# Using a file to set multiple secrets
cat private_secrets_amplify.json | npx wrangler secret put PRIVATE_AMPLIFY

```

### Via `wrangler.toml` for non-sensitive vars:

```toml
# wrangler.toml
name = "my-sveltekit-app"
main = "build/index.js"
compatibility_date = "2023-10-30"

[vars]
PUBLIC_API_URL = "https://api.example.com"
ENVIRONMENT = "production"

# Don't put secrets here - use wrangler secret put instead
```

## 2. **Accessing Secrets in SvelteKit**

### In your SvelteKit app, access via the `platform` object:

```javascript
// src/hooks.server.js
export async function handle({ event, resolve }) {
	// Access secrets from the platform.env
	const dbUrl = event.platform?.env?.DATABASE_URL;
	const apiKey = event.platform?.env?.API_SECRET_KEY;

	// Make them available to your app
	event.locals.dbUrl = dbUrl;
	event.locals.apiKey = apiKey;

	return resolve(event);
}
```

### In API routes:

```javascript
// src/routes/api/data/+server.js
export async function GET({ platform, locals }) {
	const apiKey = platform?.env?.API_SECRET_KEY;
	const dbUrl = platform?.env?.DATABASE_URL;

	// Use your secrets
	const response = await fetch('https://external-api.com', {
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
	});

	return new Response(JSON.stringify(data));
}
```

### In load functions:

```javascript
// src/routes/+page.server.js
export async function load({ platform }) {
	const apiKey = platform?.env?.API_SECRET_KEY;

	// Fetch data using the secret
	const data = await fetchSecureData(apiKey);

	return {
		data,
	};
}
```

## 3. **Development vs Production Setup**

### Local Development with `.env`:

```bash
# .env (for local development only - don't commit!)
DATABASE_URL=postgresql://localhost:5432/mydb
API_SECRET_KEY=local-dev-key
JWT_SECRET=local-jwt-secret
```

### Access in development:

```javascript
// src/app.d.ts - Type definitions
declare global {
  namespace App {
    interface Platform {
      env?: {
        DATABASE_URL: string;
        API_SECRET_KEY: string;
        JWT_SECRET: string;
      };
    }
  }
}
```

## 4. **Deployment Workflow**

### Your deployment process:

```bash
# 1. Set secrets (one-time setup)
npx wrangler secret put DATABASE_URL
npx wrangler secret put API_SECRET_KEY

# 2. Regular deployment
git add .
git commit -m "Update app"
git push origin main

# 3. Deploy to Cloudflare Workers
npx wrangler deploy
```

### Or with GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build SvelteKit
        run: npm run build

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy
```

## 5. **Environment-Specific Deployments**

### Multiple environments:

```bash
# Production
npx wrangler secret put DATABASE_URL --env production
npx wrangler deploy --env production

# Staging
npx wrangler secret put DATABASE_URL --env staging
npx wrangler deploy --env staging
```

### Configure in `wrangler.toml`:

```toml
name = "my-sveltekit-app"
main = "build/index.js"

[env.production]
name = "my-sveltekit-app-prod"
vars = { ENVIRONMENT = "production" }

[env.staging]
name = "my-sveltekit-app-staging"
vars = { ENVIRONMENT = "staging" }
```

## 6. **SvelteKit Adapter Configuration**

### Make sure you're using the Cloudflare adapter:

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-cloudflare-workers';

export default {
	kit: {
		adapter: adapter({
			config: 'wrangler.toml',
			platformProxy: {
				configPath: 'wrangler.toml',
				environment: undefined,
				experimentalJsonConfig: false,
				persist: false,
			},
		}),
	},
};
```

## 7. **Security Best Practices**

### ✅ **Do:**

- Use `wrangler secret put` for sensitive data
- Keep secrets out of `wrangler.toml`
- Use different secrets for different environments
- Access secrets only on the server-side

### ❌ **Don't:**

- Put secrets in `wrangler.toml`
- Commit `.env` files to Git
- Access secrets in client-side code
- Hardcode secrets in your source code

## 8. **Managing Secrets at Scale**

### Bulk secret management:

```bash
# Script to set multiple secrets
#!/bin/bash
echo "Setting production secrets..."
npx wrangler secret put DATABASE_URL --env production
npx wrangler secret put API_SECRET_KEY --env production
npx wrangler secret put JWT_SECRET --env production
echo "Secrets set successfully!"
```

### Secret rotation:

```bash
# Update a secret
npx wrangler secret put API_SECRET_KEY --env production
# Redeploy to use new secret
npx wrangler deploy --env production
```

## Summary

For SvelteKit on Cloudflare Workers:

1. **Secrets**: Use `wrangler secret put` (never in code/config)
2. **Access**: Via `event.platform.env` in your SvelteKit code
3. **Deployment**: `git push` + `wrangler deploy` keeps secrets secure
4. **Development**: Use `.env` locally, but don't commit it

This approach keeps your secrets completely separate from your codebase while maintaining smooth deployments!
