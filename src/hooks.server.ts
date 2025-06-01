import * as Sentry from "@sentry/sveltekit";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { type Handle, redirect } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

import { NODE_ENV, SUPABASE_SERVICE_ROLE_KEY } from "$env/static/private";
import { PUBLIC_SENTRY_DSN, PUBLIC_SUPABASE_URL } from "$env/static/public";
import NodeCache from "node-cache";

Sentry.init({
  dsn: PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
});

const devToolsCheck: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith("/.well-known/appspecific/com.chrome.devtools")) {
    console.debug("Serving empty DevTools response");
    return new Response(null, { status: 204 }); // Return empty response with 204 No Content
  }
  return resolve(event);
};

const supabase: Handle = async ({ event, resolve }) => {
  /**
   * Creates a Supabase client specific to this server request.
   *
   * The Supabase client gets the Auth token from the request cookies.
   */
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: "/" });
        });
      },
    },
  });

  event.locals.safeGetSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession();
    if (!session) {
      return { session: null, user: null };
    }

    const {
      data: { user },
      error,
    } = await event.locals.supabase.auth.getUser();
    if (error) {
      // JWT validation has failed
      return { session: null, user: null };
    }

    delete (session as { user?: User }).user;

    return { user: user, session: Object.assign({}, session, { user }) };
  };

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      /**
       * Supabase libraries use the `content-range` and `x-supabase-api-version`
       * headers, so we need to tell SvelteKit to pass it through.
       */
      return name === "content-range" || name === "x-supabase-api-version";
    },
  });
};

const authGuard: Handle = async ({ event, resolve }) => {
  const { session, user } = await event.locals.safeGetSession();
  event.locals.session = session;
  event.locals.user = user;

  if (
    !(event.locals.session && event.locals.user) &&
    event.url.pathname.startsWith("/dash") &&
    event.url.pathname !== "/dash/login"
  ) {
    redirect(303, "/dash/login");
  }

  if (event.locals.session && event.url.pathname === "/dash/login") {
    redirect(303, "/dash");
  }

  return resolve(event);
};

const authUserMiddleware: Handle = async ({ event, resolve }) => {
  // Authorize user role for specific routes
  const isUsersApiRoute = event.url.pathname.startsWith("/api/users");
  const isUsersDashRoute = event.url.pathname === "/dash/users";
  const isAdminRoute = isUsersApiRoute || isUsersDashRoute;

  if (event.locals.user) {
    const { data: users } = await event.locals.supabase.from("allowed_users").select("*");

    const allowedUser = users?.find((u) => u.email === event.locals.user!.email) ?? null;
    if (isAdminRoute && (!allowedUser || allowedUser.role !== "admin")) {
      if (isUsersApiRoute) {
        return Response.json({ error: "No Permission" }, { status: 403 });
      }
    }

    console.debug(
      `User ${event.locals.user!.user_metadata.full_name} is authorized as ${allowedUser?.role} for admin routes`,
    );
    event.locals.isAdmin = allowedUser?.role === "admin";
  } else {
    event.locals.isAdmin = false;
  }

  return resolve(event);
};

export const handle = sequence(Sentry.sentryHandle(), devToolsCheck, supabase, authGuard, authUserMiddleware);

export const handleError =
  NODE_ENV === "production"
    ? Sentry.handleErrorWithSentry()
    : ({ error }: any) => {
        console.error("Error occurred:", error);
        return {
          message: "An error occurred",
        };
      };
