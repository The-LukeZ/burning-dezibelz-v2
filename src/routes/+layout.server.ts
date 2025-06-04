export const prerender = false; // Disable globally
export const ssr = true; // Enable server-side rendering

export async function load({ locals, cookies }) {
  const { session, user } = await locals.safeGetSession();

  let isAdmin = false;
  if (session && user) {
    // Check if user is admin
    const { data: users } = await locals.supabase.from("allowed_users").select("*");
    const allowedUser = users?.find((u) => u.email === user.email) ?? null;
    isAdmin = allowedUser?.role === "admin";

    console.debug(
      `User ${user.user_metadata.full_name} is authorized as ${allowedUser?.role} for admin routes`,
    );
  }

  return {
    isAdmin: isAdmin,
    session: session,
    user: user,
    cookies: cookies.getAll(),
    currentISODate: new Date().toISOString(),
  };
}
