import { createServerClient } from "@supabase/ssr";
import { type Handle, redirect } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import type { User } from "@supabase/supabase-js";

import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public";

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
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
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

export const handle = sequence(devToolsCheck, supabase, authGuard);
