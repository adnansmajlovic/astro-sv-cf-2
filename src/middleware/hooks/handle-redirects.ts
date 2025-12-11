// src/middleware.ts
import type { MiddlewareHandler } from "astro";

export const hndlRedirect: MiddlewareHandler = async (
  { locals, url, redirect },
  next,
) => {
  const pathname = url.pathname;

  const protectedAreas = {
    "/admin": ["super_admin"],
    "/staff": ["admin", "super_admin"],
  };

  for (const [route, allowedRoles] of Object.entries(protectedAreas)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(locals.user?.role)) {
        return redirect("/unauthorized");
      }
    }
  }

  return next();
};
