import { fail, redirect } from "@sveltejs/kit";

export const actions = {
  "delete-data": async ({ url, locals: { supabase } }) => {
    const { data, error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${url.origin}/api/google-auth/callback?delete=true`,
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
