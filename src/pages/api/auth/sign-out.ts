import type { APIRoute } from "astro";

export const POST: APIRoute = async (context) => {
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
    // Use the working auth.api.signOut method
    const result = await auth.api.signOut({
      headers: request.headers,
    });

    // Return success response
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Clear any session cookies
        "Set-Cookie": "better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax"
      },
    });
  } catch (error) {
    console.error("Error signing out:", error);

    // Even if there's an error, return success to clear client state
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax"
      },
    });
  }
};

export const GET: APIRoute = async (context) => {
  // Some clients might use GET for sign-out
  return POST(context);
};
