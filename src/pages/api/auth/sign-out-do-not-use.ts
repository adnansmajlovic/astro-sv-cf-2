import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ locals, request }) => {
  const auth = locals.auth;
  if (!auth) {
    return new Response(JSON.stringify({ error: "Auth not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Let Better Auth clear cookies correctly
  const signOutRes = await auth.api.signOut({
    headers: request.headers,
    asResponse: true,
  });

  // reuse its headers (includes Set-Cookie)
  const headers = new Headers(signOutRes.headers);
  headers.set("Content-Type", "application/json");

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers,
  });
};

export const GET: APIRoute = async (ctx) => POST(ctx);
