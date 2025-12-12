import { sequence } from "astro/middleware";
import { runtime } from "./hooks/handle-runtime";
import { isLogged } from "./hooks/handle-is-logged";
import { csrf } from "./hooks/handle-csrf";
import { hndlRedirect } from "./hooks/handle-redirects";
import { hndlPostHog } from "./hooks/handle-posthog";
import { hndlCsrfApi } from "./hooks/handle-csrf-api";
// import { checkAdminUser } from "./hooks/handle-check-admin-user";
// import { protectedRoutes } from "./hooks/handle-protected-routes";

// a.s. order is important
// islogged gets a session from auth, and stores into locals.user
// checkAdminUser adds a role from the db!
export const onRequest = sequence(
  runtime,
  isLogged,
  hndlPostHog,
  csrf, // sets cookie + locals.csrfToken
  hndlRedirect, // role gating
  hndlCsrfApi, // validates X-CSRF-Token vs locals.csrfToken (for /api/*)
);
// export const onRequest = sequence(runtime, isLogged, checkAdminUser, protectedRoutes);
