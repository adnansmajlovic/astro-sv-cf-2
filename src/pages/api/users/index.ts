import type { APIRoute } from "astro";
import { drizzle } from "drizzle-orm/d1";
import { user } from "@lib/server/db/schema"; // adjust to your actual path

export const GET: APIRoute = async (ctx) => {
  const db = drizzle(ctx.locals.runtime.env.DB); // or ctx.locals.db if you already set it

  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user);

  return new Response(JSON.stringify(users), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
