import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  const { locals, request } = context;

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

    // Get session from Better Auth
    let sessionData = null;
    let betterAuthUser = null;

    if (locals.auth) {
      try {
        sessionData = await locals.auth.api.getSession({
          headers: request.headers,
        });
        betterAuthUser = sessionData?.user || null;
      } catch (error) {
        console.error("Error getting session from Better Auth:", error);
      }
    }

    // Get user directly from database
    let dbUser = null;
    let allUsers = [];

    if (locals.db && betterAuthUser?.id) {
      try {
        // Import schema
        const { user } = await import("../../../lib/server/db/schema");
        const { eq } = await import("drizzle-orm");

        // Get specific user
        const userResult = await locals.db.select().from(user).where(eq(user.id, betterAuthUser.id)).limit(1);
        dbUser = userResult[0] || null;

        // Get all users to check schema
        allUsers = await locals.db.select().from(user).limit(5);
      } catch (error) {
        console.error("Error querying database:", error);
      }
    }

    // Check database schema
    let schemaInfo = null;
    if (locals.db) {
      try {
        // Try to get table info
        const result = await locals.db.all("PRAGMA table_info(user)");
        schemaInfo = result;
      } catch (error) {
        console.error("Error getting schema info:", error);
      }
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),

      // From middleware (Astro.locals)
      middlewareData: {
        user: locals.user,
        session: locals.session,
        hasAuth: !!locals.auth,
        hasDb: !!locals.db,
      },

      // From Better Auth API
      betterAuthData: {
        sessionData: sessionData,
        user: betterAuthUser,
      },

      // Direct from database
      databaseData: {
        specificUser: dbUser,
        allUsers: allUsers.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        })),
      },

      // Database schema
      schema: {
        userTableColumns: schemaInfo,
      },

      // Comparison
      comparison: {
        middlewareHasRole: !!locals.user?.role,
        betterAuthHasRole: !!betterAuthUser?.role,
        dbHasRole: !!dbUser?.role,
        middlewareRoleValue: locals.user?.role,
        betterAuthRoleValue: betterAuthUser?.role,
        dbRoleValue: dbUser?.role,
      },

      recommendations: [],
    };

    // Add recommendations
    if (!dbUser && betterAuthUser?.id) {
      debugInfo.recommendations.push("User exists in session but not found in database - possible sync issue");
    }

    if (dbUser?.role && !betterAuthUser?.role) {
      debugInfo.recommendations.push("Role exists in database but not returned by Better Auth - check Better Auth configuration");
    }

    if (betterAuthUser?.role && !locals.user?.role) {
      debugInfo.recommendations.push("Role exists in Better Auth response but not in middleware locals - check middleware setup");
    }

    if (!schemaInfo?.some((col: any) => col.name === 'role')) {
      debugInfo.recommendations.push("Role column not found in user table schema - run database migrations");
    }

    return new Response(JSON.stringify(debugInfo, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });

  } catch (error) {
    console.error("User role debug error:", error);

    return new Response(
      JSON.stringify({
        error: "Debug endpoint error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      }, null, 2),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
