import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  const { locals, request } = context;

  // Get the auth instance from locals (set in middleware)
  const auth = locals.auth;

  if (!auth) {
    return new Response(JSON.stringify({ error: "Auth not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Use the working auth.api.getSession method
    const sessionData = await auth.api.getSession({
      headers: request.headers,
    });

    // Return the session data
    return new Response(JSON.stringify(sessionData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      },
    });
  } catch (error) {
    console.error("Error getting session:", error);

    // If no session, return null (not an error)
    return new Response(JSON.stringify({
      user: null,
      session: null
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      },
    });
  }
};

export const POST: APIRoute = async (context) => {
  // POST to session endpoint is typically used for session refresh
  return GET(context);
};
