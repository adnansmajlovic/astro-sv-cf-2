
```sh

# video better-auth: https://www.youtube.com/watch?v=zIvGs0FOMvA
# 
pnpm add drizzle-orm dotenv
pnpm add -D drizzle-kit tsx
pnpm add better-auth

pnpm install tailwindcss @tailwindcss/vite
pnpm add prettier prettier-plugin-astro

pnpm astro add svelte

npx wrangler d1 create adnan-test

pnpm add better-auth
# pnpm add zod, only since it's a dependency
pnpm add zod@latest

wrangler d1 create a-1

# do the migration to create a local db!!!
wrangler d1 migrations apply a-1

# important stuff: 
# add drizzle-kit
# define the starting schema.ts 
# run scripts:
pnpm run db:generate

# will be needed for a drizzle client
pnpm add @libsql/client

# Because of CF we have to use getDb and getAuth. 




```
