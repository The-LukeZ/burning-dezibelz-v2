export async function load({ locals, cookies }) {
  const { session } = await locals.safeGetSession();
  return {
    session,
    cookies: cookies.getAll(),
    currentDate: new Date(),
  };
}
