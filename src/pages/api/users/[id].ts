// src/pages/api/users/[id].ts
import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { user } from "@lib/server/db/schema";

const ROLES = new Set(["user", "admin", "super_admin"]);

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const PATCH: APIRoute = async (context) => {
  const id = context.params.id;
  if (!id) return json(400, { error: "Missing user id" });

  const body = (await context.request.json().catch(() => null)) as any;
  if (!body || typeof body !== "object")
    return json(400, { error: "Invalid JSON body" });

  const updates: Record<string, unknown> = {};

  // role is optional
  if ("role" in body) {
    if (typeof body.role !== "string" || !ROLES.has(body.role)) {
      return json(400, { error: "Invalid role" });
    }
    updates.role = body.role;
  }

  // disabled is optional
  if ("disabled" in body) {
    if (typeof body.disabled !== "boolean") {
      return json(400, { error: "Invalid disabled value" });
    }
    updates.disabled = body.disabled;
  }

  if (Object.keys(updates).length === 0) {
    return json(400, { error: "No valid fields to update" });
  }

  await context.locals.db.update(user).set(updates).where(eq(user.id, id));

  return json(200, { ok: true });
};
