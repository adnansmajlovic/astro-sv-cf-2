import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  const { locals, url } = context;

  const auth = locals.auth;

  if (!auth) {
    return new Response(JSON.stringify({
      error: "Auth not configured",
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Test different auth endpoints
  const testEndpoints = [
    '/api/auth/session',
    '/api/auth/csrf',
    '/api/auth/sign-in/google',
    '/api/auth/callback/google',
    '/api/auth/sign-out'
  ];

  const results = [];

  for (const endpoint of testEndpoints) {
    try {
      const testRequest = new Request(`${url.origin}${endpoint}`, {
        method: 'GET',
        headers: context.request.headers
      });

      const response = await auth.handler(testRequest);

      results.push({
        endpoint,
        status: response.status,
        statusText: response.statusText,
        available: response.status !== 404
      });
    } catch (error) {
      results.push({
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
        available: false
      });
    }
  }

  // Get auth configuration info
  const authInfo = {
    hasAuth: !!auth,
    authType: typeof auth,
    authKeys: auth ? Object.keys(auth) : [],
    handlerType: auth && auth.handler ? typeof auth.handler : 'undefined'
  };

  return new Response(JSON.stringify({
    timestamp: new Date().toISOString(),
    authInfo,
    endpointTests: results,
    recommendations: results
      .filter(r => !r.available)
      .map(r => `${r.endpoint} is not available - status: ${r.status || 'error'}`)
  }, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache"
    }
  });
};
