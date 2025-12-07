# Advisors CF v2

```mermaid
flowchart TD
    A[repo root] --> W[workers/]
    A --> S[src/ SvelteKit]
    A --> C[package.json / wrangler configs]

    subgraph SvelteKit["src/"]
        direction TB
        R[routes/]
        R --> RA[advisors/]
        RA --> RA1[+page.svelte]
        RA --> RA2[+page.server.ts optional]
        R --> API[api/ optional proxy]
    end

    subgraph Workers["workers/"]
        direction TB
        AW[advisors/]
        AW --> AWS[src/]
        AWS --> AWS1[index.ts Hono]
        AWS --> AWS2[handlers/]
        AW --> AWM[migrations/0001..0008.sql]
        AW --> AWT[wrangler.toml D1 + Vectorize]
    end

    SvelteKit -->|Service Binding| AW
```

```zsh

curl -X GET "https://app.marsdd.com/api/advisors-query?query=who%20can%20write%20a%20pitch%20deck" \
  -H "X-API-Advisor-Key: 72..." \
  -H "Content-Type: application/json"

```
