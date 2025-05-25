import type { Database } from "$lib/supabase";
import { fail } from "@sveltejs/kit";

export const actions = {
  create: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();

    const title = formData.get("title")?.toString();
    const artist = formData.get("artist")?.toString();
    const song = {
      title,
      artist,
    } as Database["public"]["Tables"]["songs"]["Insert"];

    if (!title || !artist) {
      return fail(400, {
        error: "Title and artist are required.",
      });
    }

    const { data, error } = await supabase.from("songs").insert(song).select("*").single();

    if (error) {
      console.error("Error creating song:", error);
      return fail(500, {
        error: error.message,
      });
    }

    return { success: true, song: data };
  },
};
