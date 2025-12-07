```zsh

wrangler vectorize create dexp-advisors-index --preset @cf/baai/bge-base-en-v1.5 -e dev
wrangler vectorize create dexp-advisors-index --preset @cf/baai/bge-large-en-v1.5 -e dev


# switch the account and create the
wrangler vectorize create dexp-advisors-index --preset @cf/baai/bge-base-en-v1.5 -e production
wrangler vectorize create dexp-advisors-index --preset @cf/baai/bge-large-en-v1.5 -e production


# in case it's needed:
wrangler vectorize delete dexp-advisors-index

# test api for loading the advisors
# your-api-key-here
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Advisor-Key: your-api-key-here: <API_ADVISOR_TOKEN>" \
  -d '{"key": "value"}' \
  http://localhost:5173/api/advisors-v2

curl -X GET "https://dexp-fe-ssr-cf-app.mars-dd-dev.workers.dev/api/advisors-query?query=who%20can%20write%20a%20pitch%20deck" \
  -H "X-API-Advisor-Key: 72..." \
  -H "Content-Type: application/json"


```
