import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  const { locals } = context;

  // Get the raw auth instance
  const auth = locals.auth;

  if (!auth) {
    return new Response(JSON.stringify({
      error: "No auth instance in locals"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Try to directly inspect what Better Auth gives us
  const inspection = {
    // Check if auth is what we expect
    typeOfAuth: typeof auth,
    isFunction: typeof auth === 'function',

    // Get all properties
    directProperties: Object.keys(auth),

    // Check for handler
    hasHandler: 'handler' in auth,
    handlerType: auth.handler ? typeof auth.handler : 'undefined',

    // Check for api
    hasApi: 'api' in auth,
    apiType: auth.api ? typeof auth.api : 'undefined',
    apiMethods: auth.api ? Object.keys(auth.api) : [],

    // Check for options
    hasOptions: 'options' in auth,

    // Try to get auth config if accessible
    config: null as any
  };

  // Try to access options/config
  if (auth.options) {
    try {
      inspection.config = {
        hasDatabase: !!auth.options.database,
        hasSocialProviders: !!auth.options.socialProviders,
        socialProvidersList: auth.options.socialProviders ? Object.keys(auth.options.socialProviders) : [],
        hasSecret: !!auth.options.secret,
        baseURL: auth.options.baseURL || 'not set',
        hasEmailAndPassword: !!auth.options.emailAndPassword,
      };
    } catch (e) {
      inspection.config = { error: 'Could not access options' };
    }
  }

  // Test the handler with a very simple request
  let handlerTest = null;
  if (auth.handler && typeof auth.handler === 'function') {
    try {
      // Create the simplest possible request
      const testUrl = new URL('/api/auth/test', context.url.origin);
      const testRequest = new Request(testUrl.toString(), {
        method: 'GET',
      });

      console.log("Testing handler with:", testUrl.toString());

      const response = await auth.handler(testRequest);
      handlerTest = {
        executed: true,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      };

      // If status is 404, try to get the body to see if there's an error message
      if (response.status === 404) {
        try {
          const bodyText = await response.text();
          handlerTest.body = bodyText.substring(0, 200); // First 200 chars
        } catch {
          handlerTest.body = 'Could not read body';
        }
      }
    } catch (error) {
      handlerTest = {
        executed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : undefined
      };
    }
  }

  // Test if api.getSession works
  let apiTest = null;
  if (auth.api && auth.api.getSession) {
    try {
      const session = await auth.api.getSession({
        headers: context.request.headers
      });
      apiTest = {
        getSessionWorks: true,
        hasSession: !!session,
        sessionData: session ? 'Session exists' : 'No session'
      };
    } catch (error) {
      apiTest = {
        getSessionWorks: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Check the $context property if it exists
  let contextInfo = null;
  if (auth.$context) {
    contextInfo = {
      exists: true,
      type: typeof auth.$context,
      keys: Object.keys(auth.$context)
    };
  }

  return new Response(JSON.stringify({
    timestamp: new Date().toISOString(),
    inspection,
    handlerTest,
    apiTest,
    contextInfo,

    // Add some guidance
    analysis: {
      authProbablyInitialized: !!auth.handler && !!auth.api,
      handlerCallable: handlerTest?.executed === true,
      apiCallable: apiTest?.getSessionWorks === true,

      probableIssue:
        !auth.handler ? "Handler not found - auth may not be initialized correctly" :
        handlerTest?.status === 404 ? "Handler exists but returns 404 - likely a routing or path issue" :
        handlerTest?.executed === false ? "Handler exists but throws error when called" :
        "Unknown issue"
    }
  }, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache"
    }
  });
};
