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

    if (!locals.db) {
      return new Response(
        JSON.stringify({
          error: "Database not available",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Import database schema and functions
    const { user } = await import("../../../lib/server/db/schema");
    const { eq, isNull } = await import("drizzle-orm");

    // Get all users
    const allUsers = await locals.db.select().from(user);

    // Check for users without roles
    const usersWithoutRoles = await locals.db
      .select()
      .from(user)
      .where(isNull(user.role));

    // Get current session user for comparison
    let currentUser = null;
    if (locals.auth) {
      try {
        const sessionData = await locals.auth.api.getSession({
          headers: context.request.headers,
        });
        currentUser = sessionData?.user || null;
      } catch (error) {
        console.error("Error getting current session:", error);
      }
    }

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalUsers: allUsers.length,
        usersWithoutRoles: usersWithoutRoles.length,
        usersWithRoles: allUsers.filter(u => u.role).length,
      },
      currentUser: {
        id: currentUser?.id || "Not logged in",
        email: currentUser?.email || "N/A",
        role: currentUser?.role || "N/A",
        roleInDb: allUsers.find(u => u.id === currentUser?.id)?.role || "N/A",
      },
      allUsers: allUsers.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      usersWithoutRoles: usersWithoutRoles.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        createdAt: u.createdAt,
      })),
      recommendations: [],
    };

    // Add recommendations
    if (usersWithoutRoles.length > 0) {
      report.recommendations.push(
        `${usersWithoutRoles.length} users don't have roles assigned. Use the POST endpoint to fix this.`
      );
    }

    if (currentUser?.id && !currentUser.role) {
      report.recommendations.push(
        "Current user doesn't have role in session response - check Better Auth configuration."
      );
    }

    if (currentUser?.id && currentUser.role !== allUsers.find(u => u.id === currentUser.id)?.role) {
      report.recommendations.push(
        "Role mismatch between session and database - session might be cached."
      );
    }

    return new Response(JSON.stringify(report, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });

  } catch (error) {
    console.error("Check user roles error:", error);

    return new Response(
      JSON.stringify({
        error: "Check user roles error",
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

export const POST: APIRoute = async (context) => {
  const { locals } = context;

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

    if (!locals.db) {
      return new Response(
        JSON.stringify({
          error: "Database not available",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Import database schema and functions
    const { user } = await import("../../../lib/server/db/schema");
    const { eq, isNull } = await import("drizzle-orm");

    // Find users without roles
    const usersWithoutRoles = await locals.db
      .select()
      .from(user)
      .where(isNull(user.role));

    let updatedCount = 0;
    const updateResults = [];

    // Update users without roles to have default "user" role
    for (const u of usersWithoutRoles) {
      try {
        await locals.db
          .update(user)
          .set({ role: "user", updatedAt: new Date() })
          .where(eq(user.id, u.id));

        updateResults.push({
          id: u.id,
          email: u.email,
          status: "updated",
          newRole: "user",
        });
        updatedCount++;
      } catch (error) {
        updateResults.push({
          id: u.id,
          email: u.email,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const response = {
      timestamp: new Date().toISOString(),
      action: "update_user_roles",
      summary: {
        usersFoundWithoutRoles: usersWithoutRoles.length,
        usersUpdated: updatedCount,
        errors: updateResults.filter(r => r.status === "error").length,
      },
      details: updateResults,
      message: updatedCount > 0
        ? `Successfully updated ${updatedCount} users with default role "user"`
        : "No users needed role updates",
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });

  } catch (error) {
    console.error("Update user roles error:", error);

    return new Response(
      JSON.stringify({
        error: "Update user roles error",
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
