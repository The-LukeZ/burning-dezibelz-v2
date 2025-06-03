import { redirect } from "@sveltejs/kit";

export async function load({ locals, url }) {
  if (!locals.user || !locals.session) {
    if (url.pathname !== "/dash/login") {
      redirect(303, "/dash/login");
    }
    return {};
  }

  return {
    isAdmin: locals.isAdmin,
  };
}
