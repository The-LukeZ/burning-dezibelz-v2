export const prerender = true;

import { markdownToHtml } from "$lib";
import aboutData from "./about.json";

export async function load() {
  return {
    about: aboutData.about.map((s) => markdownToHtml(s)),
    members: aboutData.members.map((m) => ({
      ...m,
      bio: m.bio.map((s) => markdownToHtml(s)),
    })),
  } as {
    about: string[];
    members: BandMember[];
  };
}
