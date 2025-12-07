# Adding & Using Secrets in this Repo

This guide shows how to add secrets so our GitHub Actions can:

1. read environment/repository secrets (dev & main/prod),
2. pass secrets to Cloudflare Workers via `wrangler-action`, and
3. write selected secrets to an `.env` file via `SpicyPizza/create-envfile` (using the `envkey_<NAME>` convention).

---

## 0) What “kinds” of secrets do we use?

We touch secrets in **three** places:

* **GitHub Actions Secrets (Repo & Environment scope):** Where the actual sensitive values live (e.g., `DEV_CLOUDFLARE_API_TOKEN`, `API_USER_TRACKER_SECRET_KEY`).
* **Cloudflare Worker Secrets:** Pushed to each Worker by `cloudflare/wrangler-action` using a `secrets:` block and `env:` mappings.
* **Build `.env` file:** Generated during CI with `SpicyPizza/create-envfile` by passing inputs named `envkey_<SECRET_NAME>`.

> Tip: Names must be **consistent** across all three layers.

---

## 1) Add secrets in GitHub (dev & main/prod)

1. In GitHub, go to **Settings → Secrets and variables → Actions**.
2. Add repo-wide secrets with **New repository secret** (e.g., values shared across environments).
3. For environment‑specific secrets, go to **Settings → Environments → dev** (and **main/prod**), then add the same secret **name** with the dev/prod value.
4. Follow existing naming conventions:

   * Dev‑scoped Cloudflare & Slack items are prefixed with **`DEV_`** (e.g., `DEV_CLOUDFLARE_API_TOKEN`, `DEV_SLACK_WEBHOOK_URL`).
   * Shared names (no prefix) are used by Workers and the envfile (e.g., `API_USER_TRACKER_SECRET_KEY`, `PUBLIC_GRAPHQL_ENDPOINT`).

**Checklist when adding a new secret**

* [ ] Decide the **scope**: repository vs environment (`dev`, `main/prod`).
* [ ] Use the **exact name** used by the workflow.
* [ ] Add **both** dev and prod values when required.

---

## 2) Pass secrets into Workers (wrangler‑action)

Each Worker step in CI uses `cloudflare/wrangler-action`. To expose a secret **inside the Worker runtime**, do **both** of the following in the step:

* Add the variable name under `with: secrets:` (multi-line list)
* Map the value under `env:` from GitHub secrets

**Example: add `API_USER_TRACKER_SECRET_KEY` to a Worker**

```yaml
- name: Deploy user-tracker
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.DEV_CLOUDFLARE_API_TOKEN }}
    workingDirectory: 'workers/user-tracker'
    preCommands: pnpm i
    command: deploy
    environment: dev
    wranglerVersion: '4.40.2'
    secrets: |
      API_USER_TRACKER_SECRET_KEY
  env:
    API_USER_TRACKER_SECRET_KEY: ${{ secrets.API_USER_TRACKER_SECRET_KEY }}
```

**To add another Worker secret** (e.g., `FOO`):

1. Ensure `FOO` exists in GitHub (repo or environment).
2. Add `FOO` under `with: secrets:` **for that Worker step**.
3. Map `FOO` in the same step’s `env:` block: `FOO: ${{ secrets.FOO }}`.

Repeat per Worker that needs it. Workers that **don’t** need a given secret should **not** list it.

---

## 3) Add secrets to the generated `.env` (create‑envfile)

We generate an `.env` file in the pipeline using `SpicyPizza/create-envfile`. To include a secret in the file, provide an input named `envkey_<SECRET_NAME>`.

**Example:**

```yaml
- name: Make envfile
  uses: SpicyPizza/create-envfile@v2.0
  with:
    envkey_API_USER_TRACKER_SECRET_KEY: ${{ secrets.API_USER_TRACKER_SECRET_KEY }}
    envkey_PUBLIC_GRAPHQL_ENDPOINT: ${{ secrets.PUBLIC_GRAPHQL_ENDPOINT }}
    # add more as needed: envkey_<NAME>: ${{ secrets.<NAME> }}
```

This produces lines like:

```
API_USER_TRACKER_SECRET_KEY=****
PUBLIC_GRAPHQL_ENDPOINT=****
```

**To add a new env var to the file** (e.g., `MY_FLAG`):

1. Add/confirm `MY_FLAG` exists as a GitHub secret.
2. In the `create-envfile` step, add: `envkey_MY_FLAG: ${{ secrets.MY_FLAG }}`.
3. Use `process.env.MY_FLAG` (Node/Vite) in the app/build as needed.

> Note: The `.env` is created during CI; ensure it’s **not committed**. The action writes to the workspace for subsequent build steps.

---

## 4) Dev vs Prod

* Switch `environment: dev` → `environment: production` (or your prod environment name) on Worker deploy steps.
* Use prod‑scoped tokens (e.g., `PROD_CLOUDFLARE_API_TOKEN`) in `with.apiToken` for prod runs.
* Keep the **secret names** identical when values are environment‑specific; only the **values** differ by environment.

---

## 5) Verification

* **Action logs:** wrangler‑action will indicate when it uploads secrets. (Values are masked.)
* **Cloudflare dashboard:** confirm Worker environment variables if needed.
* **Slack notification:** success/failure messages confirm the pipeline completed.

---

## 6) Common pitfalls

* Missing the `env:` mapping after listing a name under `with: secrets:`.
* Typos or mismatched **case** in secret names.
* Adding a secret at the **repo level** but using it in a job that runs with an **environment** that doesn’t define it.
* Forgetting the `envkey_` prefix when using `create-envfile`.
* Not adding a required secret to **each** Worker that needs it.

---

## 7) Snippets & Templates

**New Worker step (template)**

```yaml
- name: Deploy <worker-name>
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.DEV_CLOUDFLARE_API_TOKEN }}
    workingDirectory: 'workers/<worker-dir>'
    preCommands: pnpm i
    command: deploy
    environment: dev
    wranglerVersion: '4.40.x'
    secrets: |
      <SECRET_ONE>
      <SECRET_TWO>
  env:
    <SECRET_ONE>: ${{ secrets.<SECRET_ONE> }}
    <SECRET_TWO>: ${{ secrets.<SECRET_TWO> }}
```

**Add a secret to `.env` (template)**

```yaml
- name: Make envfile
  uses: SpicyPizza/create-envfile@v2.0
  with:
    envkey_<SECRET_NAME>: ${{ secrets.<SECRET_NAME> }}
```

---

## 8) Quick checklist when introducing a new secret

* [ ] Create `NAME` in GitHub secrets (repo or environment).
* [ ] If a Worker needs it, list `NAME` under `with: secrets:` for that Worker step.
* [ ] Map `NAME` in the Worker step’s `env:` block.
* [ ] If the build/runtime needs it in `.env`, add `envkey_NAME: ${{ secrets.NAME }}` to the `create-envfile` step.
* [ ] Validate in CI logs and Cloudflare dashboard.

---

### References

* See the `Deploy Cloudflare Worker (Dev)` workflow for working examples of: wrangler‑action secrets+env, and `create-envfile` inputs.
