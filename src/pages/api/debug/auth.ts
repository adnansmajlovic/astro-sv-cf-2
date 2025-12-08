import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  const { locals, url } = context;

  try {
    // Check if we're in development mode
    const isDev = import.meta.env.DEV || process.env.NODE_ENV === "development";

    if (!isDev) {
      return new Response(
        JSON.stringify({
          error: "Debug endpoint only available in development mode",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const env = locals.runtime?.env || {};

    // Basic configuration check
    const config = {
      database: {
        hasDB: !!env.DB,
        hasLibSqlUrl: !!env.DATABASE_URL,
      },
      auth: {
        hasGoogleClientId: !!env.GOOGLE_CLIENT_ID,
        googleClientIdPreview: env.GOOGLE_CLIENT_ID
          ? `${env.GOOGLE_CLIENT_ID.substring(0, 10)}...`
          : "not set",
        hasGoogleClientSecret: !!env.GOOGLE_CLIENT_SECRET,
        hasBetterAuthSecret: !!env.BETTER_AUTH_SECRET,
        betterAuthUrl: env.BETTER_AUTH_URL || "not set",
        astroBaseUrl: env.ASTRO_BASE_URL || "not set",
      },
      request: {
        url: url.toString(),
        origin: url.origin,
        host: url.host,
        protocol: url.protocol,
      },
      headers: {
        userAgent: context.request.headers.get("user-agent"),
        origin: context.request.headers.get("origin"),
        referer: context.request.headers.get("referer"),
        host: context.request.headers.get("host"),
      },
      instances: {
        hasDbInstance: !!locals.db,
        hasAuthInstance: !!locals.auth,
      },
    };

    // Test database connection if available
    let dbTest = null;
    if (locals.db) {
      try {
        // Try to query the user table
        const users = await locals.db.select().from(locals.db._.schema.user).limit(1);
        dbTest = {
          success: true,
          userCount: users.length >= 0 ? "accessible" : "empty",
        };
      } catch (error) {
        dbTest = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    // Test auth endpoints if available
    let authTest = null;
    if (locals.auth) {
      try {
        // Test if auth instance can handle a simple request
        const testRequest = new Request(`${url.origin}/api/auth/session`, {
          method: "GET",
          headers: context.request.headers,
        });

        const response = await locals.auth.handler(testRequest);
        authTest = {
          success: true,
          status: response.status,
          statusText: response.statusText,
        };
      } catch (error) {
        authTest = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    const diagnostics = {
      timestamp: new Date().toISOString(),
      config,
      dbTest,
      authTest,
      recommendations: [],
    };

    // Add recommendations based on the diagnostics
    if (!config.auth.hasGoogleClientId) {
      diagnostics.recommendations.push("Set GOOGLE_CLIENT_ID environment variable");
    }

    if (!config.auth.hasGoogleClientSecret) {
      diagnostics.recommendations.push("Set GOOGLE_CLIENT_SECRET environment variable");
    }

    if (!config.auth.hasBetterAuthSecret) {
      diagnostics.recommendations.push("Set BETTER_AUTH_SECRET environment variable");
    }

    if (!config.database.hasDB && !config.database.hasLibSqlUrl) {
      diagnostics.recommendations.push("Configure database (D1 or LibSQL)");
    }

    if (!config.instances.hasDbInstance) {
      diagnostics.recommendations.push("Database instance not initialized in middleware");
    }

    if (!config.instances.hasAuthInstance) {
      diagnostics.recommendations.push("Auth instance not initialized in middleware");
    }

    if (config.auth.betterAuthUrl === "not set" && config.auth.astroBaseUrl === "not set") {
      diagnostics.recommendations.push("Set BETTER_AUTH_URL or ASTRO_BASE_URL for production");
    }

    return new Response(JSON.stringify(diagnostics, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });

  } catch (error) {
    console.error("Debug endpoint error:", error);

    return new Response(
      JSON.stringify({
        error: "Debug endpoint error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }, null, 2),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const POST: APIRoute = async (context) => {
  return new Response(
    JSON.stringify({
      error: "Method not allowed",
      message: "This debug endpoint only supports GET requests",
    }),
    {
      status: 405,
      headers: { "Content-Type": "application/json" },
    }
  );
};
