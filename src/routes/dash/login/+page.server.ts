import { PUBLIC_SUPABASE_OAUTH_CALLBACK_URL } from "$env/static/public";
import { supabaseAdmin } from "$lib/server/supabase.js";
import { fail, redirect } from "@sveltejs/kit";

export async function load({ locals }) {
  // Check if logged in, if yes, redirect to /dash
  const {
    data: { session },
    error,
  } = await supabaseAdmin.auth.getSession();
}

export const actions = {
  login: async () => {
    const { data, error: err } = await supabaseAdmin.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: PUBLIC_SUPABASE_OAUTH_CALLBACK_URL,
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
