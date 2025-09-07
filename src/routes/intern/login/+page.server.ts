import { fail, redirect } from "@sveltejs/kit";

export async function load({ locals }) {
  if (locals.user && locals.session) {
    // User is already authenticated, redirect to home
    redirect(303, "/intern/home");
  }

  return {};
}

export const actions = {
  login: async ({ url, locals: { supabase } }) => {

    const { data, error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${url.origin}/api/google-auth/callback?next=${url.searchParams.get("next") || "/intern/home"}`,
        skipBrowserRedirect: true,
      },
    });

    if (err) {
      console.error("Error signing in with OAuth:", err.message);
      return fail(400, {
        message: "Error signing in with OAuth",
      });
    }

    redirect(303, data.url);
  },
};
