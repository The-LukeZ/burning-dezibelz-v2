import aboutData from "$lib/data/about.json";

export async function load() {
  return {
    about: aboutData.about,
    members: aboutData.members,
  };
}
