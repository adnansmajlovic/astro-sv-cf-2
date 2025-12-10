// src/pages/api/users/index.ts
import type { APIRoute } from "astro";
import { drizzle } from "drizzle-orm/d1";
import { user } from "@lib/server/db/schema";

export const GET: APIRoute = async (context) => {
  // --- CSRF check -----------------------------------------------------------
  const headerToken = context.request.headers.get("X-CSRF-Token");
  const cookieToken = context.locals.csrfToken;

  if (!headerToken || headerToken !== cookieToken) {
    return new Response(JSON.stringify({ error: "Invalid CSRF token" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    }); // Blocks attacker
  }

  // --- DB access ------------------------------------------------------------
  const db = context.locals.db;

  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user);

  return new Response(JSON.stringify(users), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
