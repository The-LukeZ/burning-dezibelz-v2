// src/routes/api/google-auth/callback/+server.ts
import { redirect } from "@sveltejs/kit";

export const GET = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get("code") as string;
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the authenticated user's email
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        // Check if the user's email is in the allowed_emails table
        const { data: allowedEmail, error: queryError } = await supabase
          .from("allowed_emails")
          .select("*")
          .eq("email", user.email)
          .single();

        console.log("Allowed email data:", allowedEmail);
        console.log("Query error:", queryError);

        if (queryError || !allowedEmail) {
          // Email not in allowed list - sign them out and redirect to error page
          await supabase.auth.signOut({ scope: "global" });
          redirect(303, "/dash/login?error=Email+not+authorized");
        }

        // Email is allowed, continue with the authentication flow
        redirect(303, `/${next.slice(1)}`);
      } else {
        // No email found on the user object
        await supabase.auth.signOut({ scope: "global" });
        redirect(303, "/dash/login?error=Email+not+found");
      }
    }
  }

  // Something went wrong, redirect to homepage
  redirect(303, "/dash/login?error=Authentication+failed");
};
