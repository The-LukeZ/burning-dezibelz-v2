import type { Reroute } from "@sveltejs/kit";

const legacy: Record<string, string> = {
  "/about": "/ueber-uns",
};

export const reroute: Reroute = ({ url }) => {
  if (url.pathname in legacy) {
    return legacy[url.pathname];
  }
};
