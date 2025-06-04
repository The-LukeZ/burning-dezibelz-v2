import * as Sentry from "@sentry/sveltekit";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { type Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

import { NODE_ENV, R2_ENDPOINT, SUPABASE_SERVICE_ROLE_KEY } from "$env/static/private";
import { PUBLIC_SENTRY_DSN, PUBLIC_SUPABASE_URL } from "$env/static/public";

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

const userSessionMiddleware: Handle = async ({ event, resolve }) => {
  const { session, user } = await event.locals.safeGetSession();
  event.locals.session = session;
  event.locals.user = user;

  return resolve(event);
};

const authUserMiddleware: Handle = async ({ event, resolve }) => {
  // Authorize user role for API routes only
  const isUsersApiRoute = event.url.pathname.startsWith("/api/users");

  if (event.locals.user && isUsersApiRoute) {
    const { data: users } = await event.locals.supabase.from("allowed_users").select("*");
    const allowedUser = users?.find((u) => u.email === event.locals.user!.email) ?? null;

    if (!allowedUser || allowedUser.role !== "admin") {
      return Response.json({ error: "No Permission" }, { status: 403 });
    }
  }

  return resolve(event);
};

export const handle = sequence(
  Sentry.sentryHandle(),
  devToolsCheck,
  supabase,
  userSessionMiddleware,
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
