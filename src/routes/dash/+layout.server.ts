export async function load({ locals }) {
  return {
    isAdmin: locals.isAdmin,
  };
}
