import { redirect } from "@sveltejs/kit";

export async function load({ url }) {
  const redirectUrl = new URL("/intern/home", url.origin);
  if (url.searchParams.has("next")) {
    redirectUrl.searchParams.set("next", url.searchParams.get("next")!);
  }
  redirect(301, redirectUrl);
}
