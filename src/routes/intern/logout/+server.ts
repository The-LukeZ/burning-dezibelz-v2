import { redirect } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";

export async function GET({ locals: { supabase } }: RequestEvent) {
  // Sign out the user from Supabase authentication
  const { error } = await supabase.auth.signOut({ scope: "global" });

  if (error) {
    console.error("Error signing out:", error);
    // If there's an error, redirect to an error page or show a message
    return new Response(JSON.stringify({ error: "Failed to sign out" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Redirect the user to the homepage after successful logout
  redirect(303, "/");
}
