import type { APIRoute } from "astro";

export const ALL: APIRoute = async (context) => {
  const { request, locals, url } = context;

  // console.log("🫠 req method:", request.method, url.pathname);
  // 🫠 req method: POST /api/auth/sign-in/social
  // 🫠 req method: POST /api/auth/sign-out
  // 🫠 req method: GET /api/auth/callback/google

  // Get the auth instance from locals (set in middleware)
  const auth = locals.auth;

  if (!auth) {
    return new Response("Auth not configured", { status: 500 });
  }

  // With basePath configured in auth.ts, the handler should work properly
  return await auth.handler(request);
};
