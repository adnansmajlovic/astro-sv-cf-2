import { createAuthClient } from "better-auth/client";

// Get the base URL for auth client
const getBaseURL = () => {
  // In production, use the current origin with /api/auth
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  // Fallback to environment variables or localhost
  return (
    // import.meta.env.PUBLIC_BETTER_AUTH_URL ||
    import.meta.env.BETTER_AUTH_URL ||
    // import.meta.env.PUBLIC_ASTRO_BASE_URL ||
    "http://localhost:4321"
  );
};

const baseURL = getBaseURL();

// console.log("Auth client config:", {
//   baseURL,
//   // env1: import.meta.env.PUBLIC_BETTER_AUTH_URL,
// });

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: "include",
  },
});

export const signIn = async (
  options: {
    callbackURL?: string;
    errorCallbackURL?: string;
    newUserCallbackURL?: string;
  } = {},
) => {
  try {
    // console.log("Starting Google sign-in...", { baseURL, options });

    const data = await authClient.signIn.social({
      provider: "google",
      callbackURL: options.callbackURL || window.location.origin + "/",
      errorCallbackURL:
        options.errorCallbackURL || window.location.origin + "/login-error",
      newUserCallbackURL:
        options.newUserCallbackURL || window.location.origin + "/welcome",
    });

    // console.log("Sign-in successful:", data);
    return data;
  } catch (error) {
    console.error("Sign-in error:", error);
    // Check if it's a redirect (expected behavior)
    if (error instanceof Error && error.message.includes("redirect")) {
      console.log("Redirecting to Google OAuth...");
      return;
    }
    throw error;
  }
};

export const signOut = async (
  options: {
    redirectTo?: string;
  } = {},
) => {
  try {
    // console.log("Starting sign-out...", { baseURL });

    const data = await authClient.signOut({
      fetchOptions: {
        credentials: "include",
        onSuccess: () => {
          console.log("Sign-out successful");
        },
        onError: (error: any) => {
          console.error("Sign-out failed:", error);
        },
      },
      ...options,
    });

    // Force redirect after successful sign out
    if (options.redirectTo) {
      window.location.href = options.redirectTo;
    } else {
      window.location.reload();
    }

    return data;
  } catch (error) {
    console.error("Sign-out error:", error);
    // Even if sign-out fails on client, redirect anyway for security
    window.location.href = options.redirectTo || "/";
    throw error;
  }
};

// Helper function to check session status
export const getSession = async () => {
  try {
    const session = await authClient.getSession();
    console.log("Current session:", session);
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
};
