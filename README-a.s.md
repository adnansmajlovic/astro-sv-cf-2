```zsh
# App deployed at https://a9348d3e.dexp-fe-ssr-cf-app.pages.dev/

# gradually adding new dependencies:
pnpm add -D @aws-sdk/client-cognito-identity-provider @aws-sdk/client-lambda @aws-sdk/client-sns

pnpm add -D \
  @axe-core/playwright \
  @babel/preset-typescript \
  @changesets/cli \
  @floating-ui/dom \
  @fontsource/fira-mono \
  @googlemaps/js-api-loader \
  @iconify/json \
  @iconify/svelte \
  @lukeed/uuid \
  @playwright/experimental-ct-svelte \
  @playwright/test

pnpm add -D \
  @popperjs/core \
  @portabletext/svelte \
  @sveltejs/adapter-cloudflare \
  @sveltejs/adapter-node \
  @sveltejs/kit \
  @sveltejs/vite-plugin-svelte \
  @tailwindcss/typography \
  @types/crypto-js \
  @types/jsforce \
  @types/node \
  @types/ramda

pnpm add -D \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  @vitest/coverage-v8 \
  @zerodevx/svelte-toast \
  autoprefixer \
  cookie \
  crocks \
  crypto-js \
  csvtojson \
  dayjs \
  env-cmd \
  eslint

pnpm add -D \
  eslint-config-prettier \
  eslint-plugin-svelte3 \
  flowbite \
  flowbite-svelte \
  jwt-decode \
  mdsvex \
  mocha \
  mochawesome \
  node-sf-bulk2 \
  nyc

pnpm add -D \
  postcss \
  postcss-load-config \
  prettier \
  prettier-plugin-svelte \
  prettier-plugin-tailwindcss \
  ramda \
  rollup-plugin-istanbul \
  svelte \
  svelte-check \
  svelte-preprocess \
  svelte-select \
  tailwindcss \
  tslib \
  typescript \
  unplugin-icons \
  uvu \
  vite \
  zod

pnpm add \
  @aws-sdk/client-cloudwatch-logs \
  @aws-sdk/client-cognito-identity \
  @aws-sdk/client-eventbridge \
  @aws-sdk/client-s3 \
  @aws-sdk/client-ssm \
  @aws-sdk/credential-provider-cognito-identity \
  @aws-sdk/s3-request-presigner \
  @aws-sdk/util-endpoints

pnpm add @zerodevx/svelte-toast cookie crocks crypto-js dayjs flowbite flowbite-svelte jwt-decode ramda svelte-select zod

pnpm remove -D @zerodevx/svelte-toast cookie crocks crypto-js dayjs flowbite flowbite-svelte jwt-decode ramda svelte-select zod

pnpm add \
  @imask/svelte \
  @sanity/client \
  @sanity/image-url \
  @sentry/sveltekit \
  @tailwindcss/container-queries \
  @tiptap/core \
  @tiptap/extension-character-count \
  @tiptap/extension-document \
  @tiptap/extension-placeholder \
  @tiptap/pm \
  @tiptap/starter-kit \
  apexcharts \
  aws-amplify \
  classnames \
  dotenv \
  graphql \
  graphql-request \
  jsforce \
  openai \
  posthog-js \
  posthog-node \
  sveltekit-search-params \
  unfurl.js

pnpm add -D vitest

pnpm add flowbite-svelte dayjs ramda

# Move essential packages
pnpm remove -D @sveltejs/adapter-cloudflare @sveltejs/kit svelte @floating-ui/dom @iconify/svelte @popperjs/core @portabletext/svelte @lukeed/uuid csvtojson @tailwindcss/forms @tailwindcss/typography

pnpm add @sveltejs/adapter-cloudflare @sveltejs/kit svelte @floating-ui/dom @iconify/svelte @popperjs/core @portabletext/svelte @lukeed/uuid csvtojson @tailwindcss/forms @tailwindcss/typography

pnpm remove -D unplugin-icons
pnpm add unplugin-icons

pnpm remove -D @iconify/json
pnpm add @iconify/json

# "flowbite-svelte": "0.47.4", - pinned

```
