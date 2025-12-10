import { randomBytes } from "crypto";
import type { MiddlewareHandler } from "astro";

export const csrf: MiddlewareHandler = async (
  context,
  next,
): Promise<Response> => {
  // a.s. check if CSRF token exists in cookies
  let csrfToken = context.cookies.get("csrf-token")?.value;

  console.log("csrfToken", csrfToken);

  // a.s. if not, generate and store it
  if (!csrfToken) {
    csrfToken = randomBytes(32).toString("hex");
    context.cookies.set("csrf-token", csrfToken, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  // set it in locals for easy access
  context.locals.csrfToken = csrfToken;

  return next();
};
