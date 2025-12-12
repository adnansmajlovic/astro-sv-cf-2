
```sh
# docs: https://posthog.com/docs/advanced/proxy/cloudflare#option-1-cloudflare-workers

# worker: https://posthog-proxy-cf-2.mars-dd-dev.workers.dev
# a.s. will need to put the custom domain!
wrangler secret put PUBLIC_POSTHOG_PROXY_URL
# phc_1MeG0Ax...
wrangler secret put PUBLIC_POSTHOG_API_KEY

```
