import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  return new Response(JSON.stringify({
    message: "Test API route working!",
    timestamp: new Date().toISOString(),
    url: context.url.toString(),
    method: context.request.method
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
};
