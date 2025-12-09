import { getAuth } from "@lib/auth";
import type { MiddlewareHandler } from "astro";

export const isLogged: MiddlewareHandler = async (
  { locals, request, rewrite, url, redirect },
  next,
): Promise<Response> => {
  const env = locals.runtime?.env || {};

  // Initialize auth with environment variables
  const auth = getAuth(locals.db, env);
  if (!auth) {
    console.error("Failed to initialize auth");
    throw new Error("Auth initialization failed");
  }
  locals.auth = auth;

  const session = await auth.api.getSession({ headers: request.headers });
  locals.user = session?.user || null;
  locals.session = session?.session || null;

  return next();
};
