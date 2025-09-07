import { redirect } from "@sveltejs/kit";

export async function load({ locals, url }) {
  console.log("Loading authed layout..."); // This isn't logging???
  if (!locals.user || !locals.session) {
    redirect(303, "/intern/login?next=" + url.pathname);
  }

  if (url.searchParams.has("next")) {
    console.debug("Redirecting to next:", url.searchParams.get("next"));
    redirect(303, url.searchParams.get("next")!);
  }

  return {};
}
