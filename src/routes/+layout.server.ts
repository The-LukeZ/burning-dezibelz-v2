export async function load({ locals, cookies }) {
  const { session, user } = await locals.safeGetSession();
  return {
    session: session,
    user: user,
    cookies: cookies.getAll(),
    currentDate: new Date(),
  };
}
