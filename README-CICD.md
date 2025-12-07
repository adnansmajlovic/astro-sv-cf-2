
# CI/CD Workflows

This repository includes three primary CI/CD workflows:

* **Release & Deploy**: Create a new release tag (major.minor) and deploy to Cloudflare Workers.
* **Rollback & Deploy**: Roll back to a previous version tag and deploy to Cloudflare Workers.
* **Dev Deployments**: Automatic deployments to the development environment on merges to `main`.

## Prerequisites

* **GitHub Secrets**:

  * `CLOUDFLARE_API_TOKEN`: API token for production Cloudflare account.
  * `CLOUDFLARE_DEV_API_TOKEN`: API token for development Cloudflare account.
* **Repository Tags**: Must follow `v<MAJOR>.<MINOR>` format (e.g., `v1.2`).
* **Wrangler Configuration**: Ensure `wrangler.jsonc` is set up for both prod and dev environments.
* **GitHub Actions Permissions**: Allow workflows to create tags and releases.

## Deploy to Production

Workflow file: `.github/workflows/release-deploy.yml`

* **Trigger**: Manual via **Workflow Dispatch**.
* **Inputs**:

  * `version` (optional, format `X.Y`): If provided, uses this version. Otherwise, auto-increments the minor version from the latest tag.
* **How to Run**:

  1. Go to the **Actions** tab in your GitHub repository.
  2. Select the **Release & Deploy** workflow from the list.
  3. Click **Run workflow**.
  4. In the **Version** field, optionally enter a version (e.g., `2.0`) or leave blank to auto-bump.
  5. Click **Run workflow** to start the release and deployment.

## Rollback&#x20;

Workflow file: `.github/workflows/rollback-deploy.yml`

* **Trigger**: Manual via **Workflow Dispatch**.
* **Inputs**:

  * `version` (optional, format `X.Y`): If provided, rolls back to this version. Otherwise, selects the previous tag before the latest.
* **How to Run**:

  1. Navigate to the **Actions** tab in GitHub.
  2. Select the **Rollback & Deploy** workflow.
  3. Click **Run workflow**.
  4. Optionally enter the target version in the **Version** field, or leave blank to roll back to the previous version.
  5. Click **Run workflow** to execute the rollback.

## Deploy to Dev

Dev deployments are automatic on merges to the `main` branch.

* **Trigger**: `push` event on `main`.
* **Workflow**: `.github/workflows/dev-deploy.yml` (create this file to handle dev deploys; see example below).
* **How to Deploy to Dev**:

  1. Open a pull request with your changes.
  2. Merge the PR into the `main` branch.
  3. The Dev Deploy workflow will run automatically.
  4. Verify the deployment via the **Actions** tab or the Cloudflare dashboard.
* **Example dev-deploy.yml**:

```yaml
name: Dev Deploy

on:
  push:
    branches:
      - main

jobs:
  dev-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Cloudflare Dev
        uses: cloudflare/wrangler-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_DEV_API_TOKEN }}
          args: publish --env dev
```
