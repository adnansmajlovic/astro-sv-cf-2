import { getDb } from "@lib/server/db";
import { getAuth } from "@lib/auth";

import { defineMiddleware } from "astro:middleware";
export const onRequest = defineMiddleware(async (context, next) => {
  console.log({ c: context.locals.runtime.env });
  const { locals, csp } = context;

  context.locals.db = getDb(context.locals.runtime.env?.DB);
  context.locals.auth = getAuth(context.locals.db);
  console.log({ auth: context.locals.auth, session: context.locals.session });
  // const isAuthed = await getAuth.api.getSession({
  //   headers: context.request.headers,
  // });
  // if (isAuthed) {
  //   console.log("is authed");
  //   context.locals.user = isAuthed.user;
  //   context.locals.session = isAuthed.session;
  // } else {
  //   console.log("!authed");
  //   context.locals.user = null;
  //   context.locals.session = null;
  // }
  return next();
});
