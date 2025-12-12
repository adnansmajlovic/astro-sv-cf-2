import type { MiddlewareHandler } from "astro";

import { PostHog } from "posthog-node";

export const hndlPostHog: MiddlewareHandler = async (
  { locals, url, redirect },
  next,
) => {
  const client = new PostHog(import.meta.env.PUBLIC_POSTHOG_API_KEY, {
    host: "https://us.i.posthog.com",
  });

  try {
    client.capture({
      distinctId: locals.user?.email || "anonymous user",
      event: "$pageview",
      properties: {
        $current_url: url.pathname,
      },
    });

    // ✅ CRITICAL: Must await flush in Workers
    await client.flush();
    // console.log("PostHog flushed");
  } catch (error) {
    console.error("PostHog capture error:", error);
    // Fail silently - don't break user experience
  } finally {
    // ✅ CRITICAL: Always shutdown to release resources
    await client.shutdown();
  }

  return next();
};
