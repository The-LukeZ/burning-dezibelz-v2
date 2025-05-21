// src/routes/api/check-whitelist/+server.js
import { json } from "@sveltejs/kit";

export async function POST({ locals: { supabase, session } }) {
  if (!session) {
    return json({ allowed: false, message: "Not authenticated" }, { status: 401 });
  }

  // Use the server-side supabase client with elevated permissions to check the whitelist
  const { data, error } = await supabase
    .from("allowed_emails")
    .select("*")
    .eq("email", session.user.email)
    .maybeSingle();

  if (error) {
    console.error("Server error checking whitelist:", error.message);
    return json({ allowed: false, message: "Server error" }, { status: 500 });
  }

  return json({
    allowed: !!data,
    message: data ? "Access granted" : "Email not authorized",
  });
}
