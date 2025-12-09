import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { type DrizzleClient } from "./server/db";
import * as schema from "./server/db/schema";
// Better Auth context type - using any for now due to type export issues
type Context = any;

export function getAuth(db: DrizzleClient, env?: Record<string, any>) {
  // Use provided env or fallback to process.env
  //
  const environment =
    env ||
    import.meta?.env ||
    (typeof process !== "undefined" ? process.env : {});

  console.log("Setting up Better Auth with config:", {
    hasDb: !!db,
    googleClientId: environment.GOOGLE_CLIENT_ID
      ? "***" + environment.GOOGLE_CLIENT_ID.slice(-4)
      : "missing",
    googleClientSecret: environment.GOOGLE_CLIENT_SECRET
      ? "***present"
      : "missing",
    baseURL: environment.BETTER_AUTH_URL,
    secret: environment.BETTER_AUTH_SECRET ? "***present" : "missing",
  });

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    basePath: "/api/auth",
    socialProviders: {
      google: {
        clientId: environment.GOOGLE_CLIENT_ID as string,
        clientSecret: environment.GOOGLE_CLIENT_SECRET as string,
        scopes: ["openid", "email", "profile"],
        allowDangerousEmailAccountLinking: true,
      },
    },
    callbacks: {
      signIn: {
        before: async (ctx: Context) => {
          console.log("Before sign in callback:", {
            user: ctx.user,
            account: ctx.account,
          });
          return ctx;
        },
        after: async (ctx: Context) => {
          console.log("After sign in callback:", {
            user: ctx.user,
            session: ctx.session,
          });
          return ctx;
        },
      },
      // signOut: {
      //   before: async (ctx: Context) => {
      //     console.log("Before sign out callback:", {
      //       user: ctx.user,
      //       account: ctx.account,
      //     });
      //     return ctx;
      //   },
      //   after: async (ctx: Context) => {
      //     console.log("After sign out callback:", {
      //       user: ctx.user,
      //       session: ctx.session,
      //     });
      //     return ctx;
      //   },
      // },
    },
    secret: environment.BETTER_AUTH_SECRET as string,
    baseURL:
      environment.BETTER_AUTH_URL ||
      environment.ASTRO_BASE_URL ||
      "http://localhost:4321",
    trustedOrigins: [
      "http://localhost:4321",
      "http://localhost:8787",
      "http://localhost:5173",
      "https://astro-sv-cf-2.pages.dev",
      "https://astro-sv-cf-2.mars-dd-dev.workers.dev",
      ...(environment.BETTER_AUTH_URL ? [environment.BETTER_AUTH_URL] : []),
      ...(environment.ASTRO_BASE_URL ? [environment.ASTRO_BASE_URL] : []),
    ],
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 24 hours
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
      },
    },
    advanced: {
      cookiePrefix: "better-auth",
      crossSubDomainCookies: {
        enabled: false,
      },
      generateId: () => crypto.randomUUID(),
    },
  });
}

export type BetterAuth = ReturnType<typeof getAuth>;
