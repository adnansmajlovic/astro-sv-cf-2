```zsh
npx wrangler d1 create dexp-advisors -e dev

# a.s. there must be an easier way, but I logged out of wrangler, and logged back in to create a db in production
npx wrangler d1 create dexp-advisors -e production

wrangler d1 migrations create dexp-advisors 'create advisor' -e dev
wrangler d1 migrations create dexp-advisors 'create advisor' -e production

# local db
npx wrangler d1 migrations apply dexp-advisors

# remote (a.s. just added -e dev, since we only have a db underneath the "env")
wrangler d1 migrations apply dexp-advisors --remote -e dev
wrangler d1 migrations apply dexp-advisors --remote -e production # didn't go smooth

wrangler d1 migrations create dexp-advisors 'alter advisor' -e dev

```

y.y.

wrangler d1 migrations create dexp-advisors 'update advisor table fields' -e dev

npx wrangler d1 migrations apply dexp-advisors

wrangler d1 migrations apply dexp-advisors --remote -e dev
