export const prerender = false; // Disable globally
export const ssr = true; // Enable server-side rendering

export async function load({ locals, cookies }) {
  const { session, user } = await locals.safeGetSession();

  if (user && locals.isAdmin) {
    console.debug(`User ${user.user_metadata.full_name} is authorized for admin routes`);
  } else {
    console.debug("User is not authorized for admin routes");
  }

  return {
    isAdmin: locals.isAdmin,
    session: session,
    user: user,
    cookies: cookies.getAll(),
    currentISODate: new Date().toISOString(),
  };
}
