/// <reference path="../.astro/types.d.ts" />
type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    db: DrizzleD1Database;
    auth: BetterAuth;
    user: import("better-auth").User | null;
    session: import("better-auth").Session | null;
    csrfToken: AstroCookie | string | undefined | null;
  }
}
