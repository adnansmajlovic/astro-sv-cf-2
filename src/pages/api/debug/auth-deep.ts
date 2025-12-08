import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  const { locals, url, request } = context;

  try {
    const auth = locals.auth;
    const db = locals.db;
    const env = locals.runtime?.env || {};

    // Deep inspection of auth instance
    const authInspection = {
      exists: !!auth,
      type: typeof auth,
      constructor: auth?.constructor?.name,
      properties: auth ? Object.keys(auth) : [],
      methods: auth ? Object.getOwnPropertyNames(Object.getPrototypeOf(auth)).filter(name => typeof auth[name] === 'function') : [],
      handler: {
        exists: !!auth?.handler,
        type: auth?.handler ? typeof auth.handler : 'undefined',
      },
      api: {
        exists: !!auth?.api,
        methods: auth?.api ? Object.keys(auth.api) : [],
      },
      options: auth?.options ? {
        hasDatabase: !!auth.options.database,
        hasSocialProviders: !!auth.options.socialProviders,
        hasEmailPassword: !!auth.options.emailAndPassword,
        baseURL: auth.options.baseURL,
        secret: auth.options.secret ? '***present' : 'missing',
        trustedOrigins: auth.options.trustedOrigins,
      } : null,
    };

    // Check if Better Auth is properly initialized
    let betterAuthValidation = {
      hasHandler: false,
      handlerCallable: false,
      testHandlerResponse: null,
      internalRoutes: [],
    };

    if (auth?.handler) {
      betterAuthValidation.hasHandler = true;

      try {
        // Try to call handler with a test request
        const testReq = new Request(`${url.origin}/api/auth/__test__`, {
          method: 'GET',
        });

        const testResponse = await auth.handler(testReq);
        betterAuthValidation.handlerCallable = true;
        betterAuthValidation.testHandlerResponse = {
          status: testResponse.status,
          statusText: testResponse.statusText,
        };
      } catch (error) {
        betterAuthValidation.testHandlerResponse = {
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }

      // Try to access internal routes if available
      if (auth.options?.routes) {
        betterAuthValidation.internalRoutes = Object.keys(auth.options.routes);
      }
    }

    // Database validation
    let dbValidation = {
      hasInstance: !!db,
      tables: [],
      userCount: null,
      sessionCount: null,
      errors: [],
    };

    if (db) {
      try {
        // Check if tables exist and have data
        const tables = ['user', 'session', 'account', 'verification'];

        for (const tableName of tables) {
          try {
            const table = db._.schema[tableName];
            if (table) {
              const count = await db.select().from(table).limit(1);
              dbValidation.tables.push({
                name: tableName,
                exists: true,
                accessible: true,
              });

              if (tableName === 'user') {
                dbValidation.userCount = count.length;
              } else if (tableName === 'session') {
                dbValidation.sessionCount = count.length;
              }
            } else {
              dbValidation.tables.push({
                name: tableName,
                exists: false,
                accessible: false,
              });
            }
          } catch (error) {
            dbValidation.tables.push({
              name: tableName,
              exists: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      } catch (error) {
        dbValidation.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Environment validation
    const envValidation = {
      googleClientId: {
        set: !!env.GOOGLE_CLIENT_ID,
        preview: env.GOOGLE_CLIENT_ID ? env.GOOGLE_CLIENT_ID.substring(0, 20) + '...' : 'not set',
      },
      googleClientSecret: {
        set: !!env.GOOGLE_CLIENT_SECRET,
      },
      betterAuthSecret: {
        set: !!env.BETTER_AUTH_SECRET,
        length: env.BETTER_AUTH_SECRET ? env.BETTER_AUTH_SECRET.length : 0,
      },
      betterAuthUrl: {
        set: !!env.BETTER_AUTH_URL,
        value: env.BETTER_AUTH_URL || 'not set',
      },
      database: {
        hasD1: !!env.DB,
        hasLibSql: !!env.DATABASE_URL,
      },
    };

    // Test specific Better Auth endpoints
    const endpointTests = [];
    const testEndpoints = [
      { path: '/api/auth/session', method: 'GET' },
      { path: '/api/auth/sign-in/google', method: 'POST' },
      { path: '/api/auth/sign-out', method: 'POST' },
      { path: '/api/auth/callback/google', method: 'GET' },
      { path: '/api/auth/csrf', method: 'GET' },
      { path: '/api/auth/sign-up/email', method: 'POST' },
      { path: '/api/auth/sign-in/email', method: 'POST' },
    ];

    if (auth?.handler) {
      for (const endpoint of testEndpoints) {
        try {
          const testRequest = new Request(`${url.origin}${endpoint.path}`, {
            method: endpoint.method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: endpoint.method === 'POST' ? JSON.stringify({}) : undefined,
          });

          const response = await auth.handler(testRequest);

          endpointTests.push({
            path: endpoint.path,
            method: endpoint.method,
            status: response.status,
            statusText: response.statusText,
            working: response.status !== 404,
          });
        } catch (error) {
          endpointTests.push({
            path: endpoint.path,
            method: endpoint.method,
            error: error instanceof Error ? error.message : 'Unknown error',
            working: false,
          });
        }
      }
    }

    // Analyze results and provide diagnosis
    const diagnosis = {
      issues: [],
      recommendations: [],
    };

    // Check for common issues
    if (!auth) {
      diagnosis.issues.push('Auth instance not initialized');
      diagnosis.recommendations.push('Check middleware initialization');
    }

    if (!auth?.handler) {
      diagnosis.issues.push('Auth handler not available');
      diagnosis.recommendations.push('Verify Better Auth import and initialization');
    }

    if (!envValidation.googleClientId.set || !envValidation.googleClientSecret.set) {
      diagnosis.issues.push('Google OAuth credentials missing');
      diagnosis.recommendations.push('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables');
    }

    if (!envValidation.betterAuthSecret.set) {
      diagnosis.issues.push('Better Auth secret missing');
      diagnosis.recommendations.push('Set BETTER_AUTH_SECRET environment variable');
    }

    if (!dbValidation.hasInstance) {
      diagnosis.issues.push('Database instance not available');
      diagnosis.recommendations.push('Check database configuration in middleware');
    }

    const missingTables = dbValidation.tables.filter(t => !t.exists || !t.accessible);
    if (missingTables.length > 0) {
      diagnosis.issues.push(`Missing or inaccessible tables: ${missingTables.map(t => t.name).join(', ')}`);
      diagnosis.recommendations.push('Run database migrations: npm run db:push');
    }

    const failedEndpoints = endpointTests.filter(e => !e.working);
    if (failedEndpoints.length > 0) {
      diagnosis.issues.push(`${failedEndpoints.length} auth endpoints returning 404`);

      // Check specific patterns
      if (failedEndpoints.find(e => e.path === '/api/auth/session')) {
        diagnosis.recommendations.push('Basic session endpoint not working - check Better Auth initialization');
      }

      if (failedEndpoints.find(e => e.path.includes('email'))) {
        diagnosis.recommendations.push('Email auth endpoints missing - add emailAndPassword: { enabled: true } to auth config');
      }
    }

    // Check if only callback works (common issue)
    const workingEndpoints = endpointTests.filter(e => e.working);
    if (workingEndpoints.length === 1 && workingEndpoints[0].path === '/api/auth/callback/google') {
      diagnosis.issues.push('Only OAuth callback working - auth not fully initialized');
      diagnosis.recommendations.push('Check if auth.handler is properly receiving and processing requests');
      diagnosis.recommendations.push('Verify database adapter is correctly configured');
    }

    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        authInitialized: !!auth,
        handlerAvailable: !!auth?.handler,
        databaseConnected: !!db,
        endpointsWorking: endpointTests.filter(e => e.working).length,
        endpointsTested: endpointTests.length,
      },
      authInspection,
      betterAuthValidation,
      dbValidation,
      envValidation,
      endpointTests,
      diagnosis,
      debugInfo: {
        requestUrl: request.url,
        requestMethod: request.method,
        origin: url.origin,
        isDev: import.meta.env.DEV,
      },
    }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Deep debug error:', error);

    return new Response(JSON.stringify({
      error: 'Debug endpoint error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
