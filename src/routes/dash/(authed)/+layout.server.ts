import { redirect } from "@sveltejs/kit";

export async function load({ locals, url }) {
  console.log("Loading authed layout..."); // This isn't logging???
  if (!locals.user || !locals.session) {
    redirect(303, "/dash/login?next=" + url.pathname);
  }

  if (url.searchParams.has("next")) {
    console.debug("Redirecting to next:", url.searchParams.get("next"));
    redirect(303, url.searchParams.get("next")!);
  }

  // Check if user is admin
  const { data: users } = await locals.supabase.from("allowed_users").select("*");
  const allowedUser = users?.find((u) => u.email === locals.user!.email) ?? null;
  const isAdmin = allowedUser?.role === "admin";

  console.debug(
    `User ${locals.user.user_metadata.full_name} is authorized as ${allowedUser?.role} for admin routes`,
  );

  return {
    isAdmin,
  };
}
