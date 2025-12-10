import type { APIRoute } from "astro";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { user, userRoles, type UserRole } from "@lib/server/db/schema"; // adjust path

type Body = {
  role?: UserRole;
};

export const PATCH: APIRoute = async (context) => {
  // CSRF check
  const headerToken = context.request.headers.get("X-CSRF-Token");
  const cookieToken = context.locals.csrfToken;

  if (!headerToken || headerToken !== cookieToken) {
    return new Response(JSON.stringify({ error: "Invalid CSRF token" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const id = context.params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing user id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: Body;
  try {
    body = (await context.request.json()) as Body;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.role || !userRoles.includes(body.role)) {
    return new Response(JSON.stringify({ error: "Invalid role" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const db = drizzle(context.locals.runtime.env.DB); // or context.locals.db if you wired it

  await db.update(user).set({ role: body.role }).where(eq(user.id, id));

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
