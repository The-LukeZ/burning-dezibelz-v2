export const prerender = false; // Disable globally
export const ssr = true; // Enable server-side rendering

export async function load({ locals, cookies }) {
  const { session, user } = await locals.safeGetSession();
  return {
    session: session,
    user: user,
    cookies: cookies.getAll(),
    currentISODate: new Date().toISOString(),
  };
}
