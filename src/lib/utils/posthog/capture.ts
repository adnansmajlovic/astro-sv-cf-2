import { PostHog } from "posthog-node";
import { PUBLIC_POSTHOG_API_KEY } from "$env/static/public";

// ⚠️ CLOUDFLARE WORKERS: Don't use singleton pattern
// Workers are stateless and can be terminated at any time
// Create a new instance per request for reliability

function getPostHog(): PostHog {
  return new PostHog(PUBLIC_POSTHOG_API_KEY, {
    host: "https://posthog-proxy.marsdd.com",
    // 🔥 Workers optimization: flush immediately
    flushAt: 1, // Send after 1 event (don't batch)
    flushInterval: 0, // Don't wait for interval
    requestTimeout: 3000, // 3 second timeout
    // Disable geoip on the edge as Cloudflare handles it
    // This also serves as a potential differentiator if you don't add a custom prop
    disableGeoip: true, // a.s. added, CF should be taking care of this
  });
}

// ✅ Capture event with proper cleanup
export async function postHogCapture({
  distinctId,
  event,
  properties,
  groups,
}: {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
  groups?: Record<string, string | number>;
}): Promise<void> {
  const posthog = getPostHog();

  try {
    posthog.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      },
      groups,
      // a.s. not sure if it's necessary, considering the code above
      disableGeoip: true,
    });

    // ✅ CRITICAL: Must await flush in Workers
    await posthog.flush();
  } catch (error) {
    console.error("PostHog capture error:", error);
    // Fail silently - don't break user experience
  } finally {
    // ✅ CRITICAL: Always shutdown to release resources
    await posthog.shutdown();
  }
}

// ✅ Alias with proper cleanup
export async function postHogAlias({
  distinctId,
  alias,
}: {
  distinctId: string;
  alias: string;
}): Promise<void> {
  const posthog = getPostHog();

  try {
    posthog.alias({ distinctId, alias });
    await posthog.flush();
  } catch (error) {
    console.error("PostHog alias error:", error);
  } finally {
    await posthog.shutdown();
  }
}

// ✅ Identify with proper cleanup
export async function postHogIdentify({
  distinctId,
  properties,
}: {
  distinctId: string;
  properties?: Record<string, unknown>;
}): Promise<void> {
  const posthog = getPostHog();

  try {
    posthog.identify({
      distinctId,
      properties,
    });
    await posthog.flush();
  } catch (error) {
    console.error("PostHog identify error:", error);
  } finally {
    await posthog.shutdown();
  }
}

// ✅ Group identify with proper cleanup
export async function postHogGroupIdentify({
  groupType,
  groupKey,
  properties,
  distinctId,
}: {
  groupType: string;
  groupKey: string;
  properties?: Record<string, unknown>;
  distinctId?: string;
}): Promise<void> {
  const posthog = getPostHog();

  try {
    posthog.groupIdentify({
      groupType,
      groupKey,
      properties,
      distinctId,
    });
    await posthog.flush();
  } catch (error) {
    console.error("PostHog group identify error:", error);
  } finally {
    await posthog.shutdown();
  }
}
