import * as Sentry from "@sentry/sveltekit";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { redirect, type Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

import { NODE_ENV, R2_ENDPOINT, SUPABASE_SERVICE_ROLE_KEY } from "$env/static/private";
import { PUBLIC_SENTRY_DSN, PUBLIC_SUPABASE_URL } from "$env/static/public";
import wildcardMatch from "wildcard-match";

Sentry.init({
  dsn: PUBLIC_SENTRY_DSN,
  _experiments: { enableLogs: true },
  tracesSampleRate: 1,
});

export async function init() {
  console.debug("NODE_ENV:", NODE_ENV);
  // console.debug("Set ORIGIN:", ORIGIN);
  // console.debug("Set HOST:", HOST);
  // console.debug("Set PORT:", PORT);
  console.debug("PUBLIC_SENTRY_DSN:", PUBLIC_SENTRY_DSN);
  console.debug("PUBLIC_SUPABASE_URL:", PUBLIC_SUPABASE_URL);
  console.debug("SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_ROLE_KEY ? "set" : "not set");
  console.debug("S3 Client endpoint:", R2_ENDPOINT);
}

const baseHandle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname === "/about") {
    redirect(301, "/ueber-uns");
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

const userSessionMiddleware: Handle = async ({ event, resolve }) => {
  const { session, user } = await event.locals.safeGetSession();
  event.locals.session = session;
  event.locals.user = user;

  return resolve(event);
};

type APIRouteConfig = {
  /**
   * Whether the route requires authentication.
   */
  authRequired?: boolean;
  /**
   * Optional list of HTTP methods that the route supports.
   *
   * If not specified, the route applies to all methods.
   */
  methods?: string[];
};

/**
 * Configuration for API routes that require authentication.
 *
 * **Note, that if you have a base route like `/api/foo/**` and you want to
 * have a specific route like `/api/foo/bar`, you need to define
 * `/api/foo/bar` before `/api/foo/**` in this object.**
 *
 * **Otherwise, the wildcard route will match first and prevent the specific
 * route from being matched.**
 */
const AUTHED_ROUTES: Record<string, APIRouteConfig> = {
  "/api/google-auth/**": { authRequired: false },
  "/api/cdn/upload{,/**}": { authRequired: true },
  "/api/cdn/**": { authRequired: true },
};

function matchesRoute(pattern: string, pathname: string): boolean {
  console.debug(`[Route Matcher] Checking pattern "${pattern}" against pathname "${pathname}"`);

  if (!pattern.includes("*")) {
    const exactMatch = pathname === pattern;
    console.debug(`[Route Matcher] Exact match result: ${exactMatch}`);
    return exactMatch;
  }

  const isMatch = wildcardMatch(pattern, {
    flags: "i",
  });

  const wildcardResult = isMatch(pathname);
  console.debug(`[Route Matcher] Wildcard match result: ${wildcardResult}`);
  return wildcardResult;
}

const apiAuthGuard: Handle = async ({ event, resolve }) => {
  const pathname = event.url.pathname;

  if (!pathname.startsWith("/api/")) {
    return resolve(event); // Skip auth guard for non-API routes
  }

  console.debug("");
  console.debug(`[Auth Guard] Checking pathname: ${pathname}`);

  for (const [pattern, config] of Object.entries(AUTHED_ROUTES)) {
    console.debug(`[Auth Guard] Checking route config for pattern: ${pattern}`, config);

    if (matchesRoute(pattern, pathname)) {
      console.debug(`[Auth Guard] Route matched! Pattern: ${pattern}, Config:`, config);

      if (config.authRequired && !(event.locals.user && event.locals.session)) {
        console.debug(`[Auth Guard] Authentication required but user not found. Returning 401.`);
        return Response.json({ error: "Authentication required" }, { status: 401 });
      }

      console.debug(`[Auth Guard] Route matched and auth requirements satisfied`);
      break;
    }
  }

  console.debug(`[Auth Guard] Auth guard complete for ${pathname}`);
  return resolve(event);
};

const authUserMiddleware: Handle = async ({ event, resolve }) => {
  // Authorize user role for API routes only
  const isUsersApiRoute = event.url.pathname.startsWith("/api/users");

  if (event.locals.user) {
    const { data: users } = await event.locals.supabase.from("allowed_users").select("*");
    const allowedUser = users?.find((u) => u.email === event.locals.user!.email) ?? null;

    if (isUsersApiRoute && (!allowedUser || allowedUser.role !== "admin")) {
      return Response.json({ error: "No Permission" }, { status: 403 });
    }
    event.locals.isAdmin = allowedUser?.role === "admin";
  }

  return resolve(event);
};

export const handle = sequence(
  Sentry.sentryHandle(),
  baseHandle,
  supabase,
  userSessionMiddleware,
  apiAuthGuard,
  authUserMiddleware,
);

export const handleError =
  NODE_ENV === "production"
    ? Sentry.handleErrorWithSentry()
    : ({ error }: any) => {
        console.error("Error occurred:", error);
        return {
          message: "An error occurred",
        };
      };
