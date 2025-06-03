export async function load({ locals: { supabase } }) {
  const songs = await supabase.from("songs").select("*").order("title", { ascending: true });

  if (songs.error) {
    return {
      error: songs.error.message,
    };
  }

  return {
    songs: songs.data,
  };
}
