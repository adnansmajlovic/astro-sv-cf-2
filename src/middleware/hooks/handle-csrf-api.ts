// src/middleware/hooks/handle-csrf-api.ts
import type { MiddlewareHandler } from "astro";

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const hndlCsrfApi: MiddlewareHandler = async (context, next) => {
  const pathname = context.url.pathname;

  // only API routes
  if (!pathname.startsWith("/api/")) return next();

  // ✅ exempt Better Auth endpoints (adjust if your auth routes differ)
  if (pathname.startsWith("/api/auth")) return next();

  // ✅ usually only enforce CSRF on mutations
  if (SAFE_METHODS.has(context.request.method)) return next();

  const headerToken = context.request.headers.get("X-CSRF-Token");
  const cookieToken = context.locals.csrfToken;

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return json(403, { error: "Invalid CSRF token" });
  }

  return next();
};
