import { redirect } from "@sveltejs/kit";

export async function load({ locals, url }) {
  console.log("Loading authed layout...");
  if (!locals.user || !locals.session) {
    redirect(303, "/dash/login?next=" + url.pathname);
  }

  return {
    isAdmin: locals.isAdmin,
  };
}
