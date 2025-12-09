import { sequence } from "astro/middleware";
import { runtime } from "./hooks/handle-runtime";
import { isLogged } from "./hooks/handle-is-logged";
// import { checkAdminUser } from "./hooks/handle-check-admin-user";
// import { protectedRoutes } from "./hooks/handle-protected-routes";

// a.s. order is important
// islogged gets a session from auth, and stores into locals.user
// checkAdminUser adds a role from the db!
export const onRequest = sequence(runtime, isLogged);
// export const onRequest = sequence(runtime, isLogged, checkAdminUser, protectedRoutes);
