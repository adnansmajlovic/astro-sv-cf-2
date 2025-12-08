import type { APIRoute } from "astro";

export const ALL: APIRoute = async (context) => {
  const { request, locals } = context;

  // Get the auth instance from locals (set in middleware)
  const auth = locals.auth;

  if (!auth) {
    return new Response("Auth not configured", { status: 500 });
  }

  // With basePath configured in auth.ts, the handler should work properly
  return await auth.handler(request);
};
