import { redirect } from "@sveltejs/kit";

export async function load({ url }) {
  const redirectUrl = new URL("/dash/home", url.origin);
  if (url.searchParams.has("next")) {
    console.log("Redirecting to next:", url.searchParams.get("next"));
    redirectUrl.searchParams.set("next", url.searchParams.get("next")!);
  }
  redirect(301, redirectUrl);
}
