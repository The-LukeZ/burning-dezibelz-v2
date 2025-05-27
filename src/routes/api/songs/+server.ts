import type { Database } from "$lib/supabase.js";

export async function GET({ locals: { supabase } }) {
  const songs = await supabase.from("songs").select("*").order("title", { ascending: true });

  if (songs.error) {
    return Response.json({ error: songs.error.message }, { status: 500 });
  }

  return Response.json(songs.data);
}

export interface SongBatchPayload {
  create?: Database["public"]["Tables"]["songs"]["Insert"][];
  update?: (Omit<Database["public"]["Tables"]["songs"]["Update"], "id"> & { id: number })[];
  delete?: number[];
}

export async function POST({ request, locals: { supabase } }) {
  const payload = (await request.json()) as SongBatchPayload;

  try {
    // Validate that all songs have non-empty artist and title
    const allSongs = [...(payload.create || []), ...(payload.update || [])];

    for (const song of allSongs) {
      if (!song.artist?.trim() || !song.title?.trim()) {
        return Response.json(
          { error: "All songs must have non-empty artist and title fields" },
          { status: 400 },
        );
      }
    }

    // Delete songs
    if (payload.delete && payload.delete.length > 0) {
      const { error: deleteError } = await supabase.from("songs").delete().in("id", payload.delete);

      if (deleteError) {
        return Response.json({ error: deleteError.message }, { status: 500 });
      }
    }

    // Update songs
    if (payload.update && payload.update.length > 0) {
      for (const song of payload.update) {
        const { error: updateError } = await supabase.from("songs").update(song).eq("id", song.id);

        if (updateError) {
          return Response.json({ error: updateError.message }, { status: 500 });
        }
      }
    }

    // Create new songs
    if (payload.create && payload.create.length > 0) {
      const { error: insertError } = await supabase.from("songs").insert(payload.create);

      if (insertError) {
        return Response.json({ error: insertError.message }, { status: 500 });
      }
    }

    // Return updated song list
    const { data: songs, error: selectError } = await supabase
      .from("songs")
      .select("*")
      .order("title", { ascending: true });

    if (selectError) {
      return Response.json({ error: selectError.message }, { status: 500 });
    }

    return Response.json(songs);
  } catch (err) {
    console.error("Bulk operation error:", err);
    return Response.json({ error: "Bulk operation failed" }, { status: 500 });
  }
}
