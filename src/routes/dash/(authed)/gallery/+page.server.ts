export async function load({ locals: { supabase } }) {
  const { data: counts, error } = await supabase.rpc("get_folder_image_counts");
  if (error) {
    console.error("Error fetching images:", error);
    return { imageCount: 0, folders: [] };
  }

  return {
    folders: counts,
    imageCount: counts.reduce((total, folder) => total + folder.image_count, 0),
  };
}
