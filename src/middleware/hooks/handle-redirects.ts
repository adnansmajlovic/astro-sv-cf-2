// src/middleware/hooks/handle-redirects.ts
import type { MiddlewareHandler } from "astro";
import { requireRole } from "@lib/server/security/authz";

const protectedApis = {
  "/api/users": ["admin", "super_admin"],
  // "/api/reports": ["super_admin"],
} as const;

const protectedAreas = {
  "/admin": ["super_admin"],
  "/staff": ["admin", "super_admin"],
} as const;

export const hndlRedirect: MiddlewareHandler = async (
  { locals, url, redirect },
  next,
) => {
  const pathname = url.pathname;

  // --- API authz (no redirects) --------------------------------------------
  for (const [route, allowedRoles] of Object.entries(protectedApis) as Array<
    [
      keyof typeof protectedApis,
      (typeof protectedApis)[keyof typeof protectedApis],
    ]
  >) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      const res = requireRole(locals, allowedRoles);
      if (res) return res;
      return next();
    }
  }

  // --- Page authz (redirect) ------------------------------------------------
  for (const [route, allowedRoles] of Object.entries(protectedAreas) as Array<
    [
      keyof typeof protectedAreas,
      (typeof protectedAreas)[keyof typeof protectedAreas],
    ]
  >) {
    if (pathname.startsWith(route)) {
      const res = requireRole(locals, allowedRoles);
      if (res) return redirect("/unauthorized");
      return next();
    }
  }

  return next();
};
