// src/lib/server/security/csrf.ts
import type { APIContext } from "astro";

export function requireCsrf(context: APIContext) {
  const headerToken = context.request.headers.get("X-CSRF-Token");
  const cookieToken = context.locals.csrfToken;

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return new Response(JSON.stringify({ error: "Invalid CSRF token" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return null;
}
