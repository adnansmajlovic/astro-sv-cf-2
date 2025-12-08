```zsh
npx wrangler d1 create dexp-advisors -e dev

# a.s. there must be an easier way, but I logged out of wrangler, and logged back in to create a db in production
npx wrangler d1 create adnan-test-cf-2 -e production

wrangler d1 migrations create adnan-test-cf-2 'create advisor' -e dev
wrangler d1 migrations create adnan-test-cf-2 'create advisor' -e production

# local db
npx wrangler d1 migrations apply adnan-test-cf-2

# remote (a.s. just added -e dev, since we only have a db underneath the "env")
wrangler d1 migrations apply adnan-test-cf-2 --remote -e dev
wrangler d1 migrations apply adnan-test-cf-2 --remote -e production # didn't go smooth

wrangler d1 migrations create adnan-test-cf-2 'alter advisor' -e dev

```

y.y.

wrangler d1 migrations create adnan-test-cf-2 'update advisor table fields' -e dev

npx wrangler d1 migrations apply adnan-test-cf-2

wrangler d1 migrations apply adnan-test-cf-2 --remote -e dev
