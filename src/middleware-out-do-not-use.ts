import { getDb } from "@lib/server/db";
import { getAuth } from "@lib/auth";

import { defineMiddleware } from "astro:middleware";
export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, url, request } = context;

  try {
    // Log environment setup for debugging
    const env = context.locals.runtime?.env || {};
    console.log("Middleware setup:", {
      url: url.pathname,
      hasDB: !!env.DB,
      hasGoogleClientId: !!env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!env.GOOGLE_CLIENT_SECRET,
      hasBetterAuthSecret: !!env.BETTER_AUTH_SECRET,
      betterAuthUrl: env.BETTER_AUTH_URL || env.ASTRO_BASE_URL || "not set",
    });

    // Initialize database connection
    const db = getDb(env.DB);
    if (!db) {
      console.error("Failed to initialize database connection");
      throw new Error("Database connection failed");
    }
    context.locals.db = db;

    // Initialize auth with environment variables
    const auth = getAuth(db, env);
    if (!auth) {
      console.error("Failed to initialize auth");
      throw new Error("Auth initialization failed");
    }
    context.locals.auth = auth;

    const session = await auth.api.getSession({ headers: request.headers });
    const user = session?.user;
    console.log("🔐", { user });

    // console.log("api:", auth.api);

    console.log("Middleware setup complete for:", url.pathname);
  } catch (error) {
    console.error("Middleware error:", {
      error: error instanceof Error ? error.message : error,
      url: url.pathname,
    });

    // For auth routes, return proper error response
    if (url.pathname.startsWith("/api/auth")) {
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // For other routes, let them continue but log the error
    console.warn("Continuing with incomplete middleware setup");
  }

  return next();
});
