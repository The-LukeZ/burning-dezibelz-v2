// src/routes/api/google-auth/callback/+server.ts
import { redirect } from "@sveltejs/kit";

export const GET = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get("code") as string;
  const next = url.searchParams.get("next") ?? "/";
  const deleteUser = url.searchParams.get("delete") === "true";

  if (code) {
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the authenticated user's email
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        // Check if the user's email is in the allowed_users table
        const { data: allowedUser, error: queryError } = await supabase
          .from("allowed_users")
          .select("*")
          .eq("email", user.email)
          .single();

        if (queryError || !allowedUser) {
          if (deleteUser) {
            // If deleteUser is true, delete the user from the auth system
            await supabase.auth.admin.deleteUser(user.id);
            return redirect(303, "/datenschutz?deleted=true");
          }
          // Email not in allowed list - sign them out and redirect to error page
          await supabase.auth.signOut({ scope: "global" });
          redirect(303, "/intern/login?error=Email+not+authorized");
        }

        // Email is allowed, continue with the authentication flow
        redirect(303, `/${next.slice(1)}`);
      } else {
        // No email found on the user object
        await supabase.auth.signOut({ scope: "global" });
        redirect(303, "/internrn/login?error=Email+not+found");
      }
    }
  }

  // Something went wrong, redirect to homepage
  redirect(303, "/internrn/login?error=Authentication+failed");
};
