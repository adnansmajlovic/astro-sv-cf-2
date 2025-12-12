import { getAuth } from "@lib/auth";
import type { MiddlewareHandler } from "astro";
import { eq } from "drizzle-orm";
import { user as userTable } from "@lib/server/db/schema";

export const isLogged: MiddlewareHandler = async (
  { locals, request, redirect, url },
  next,
): Promise<Response> => {
  // ✅ Allow the disabled page itself to render (avoid redirect loop)
  if (url.pathname === "/disabled") {
    return next();
  }

  const env = locals.runtime?.env || {};
  const auth = getAuth(locals.db, env);
  if (!auth) {
    console.error("Failed to initialize auth");
    throw new Error("Auth initialization failed");
  }
  locals.auth = auth;

  const session = await auth.api.getSession({ headers: request.headers });
  locals.user = session?.user || null;
  locals.session = session?.session || null;

  // --- Enforce disabled users ------------------------------------------------
  if (locals.user?.id) {
    const row = await locals.db
      .select({ disabled: userTable.disabled })
      .from(userTable)
      .where(eq(userTable.id, locals.user.id))
      .get();

    const isDisabled = row?.disabled === true;

    if (isDisabled) {
      // ✅ Let auth endpoints function (sign-out must work)
      if (url.pathname.startsWith("/api/auth")) {
        return next();
      }

      // ✅ Let /disabled render (avoid redirect loop)
      if (url.pathname === "/disabled") {
        return next();
      }
      // Treat as logged out everywhere
      locals.user = null;
      locals.session = null;

      // Block app APIs
      if (url.pathname.startsWith("/api/")) {
        return new Response(JSON.stringify({ error: "Account disabled" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Redirect pages to disabled screen
      return redirect("/disabled");
    }
  }

  return next();
};
