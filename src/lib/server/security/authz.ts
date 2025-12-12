// src/lib/server/security/authz.ts
type UserRole = "user" | "admin" | "super_admin";

export function requireRole(locals: App.Locals, allowed: readonly UserRole[]) {
  const u = locals.user as { role?: UserRole } | null | undefined;

  if (!u) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!allowed.includes(u.role as UserRole)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return null;
}
