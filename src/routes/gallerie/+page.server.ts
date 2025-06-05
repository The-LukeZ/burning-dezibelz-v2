export async function load({ locals: { supabase } }) {
  const { data: counts, error: foldersError } = await supabase.rpc("get_folder_image_counts");
  if (foldersError) {
    console.error("Error fetching images:", foldersError);
    return { imageCount: 0, folders: [], otherCount: 0 };
  }

  const { count: otherCounts, error: totalError } = await supabase
    .from("images")
    .select("id", { count: "exact", head: true })
    .is("folder", null);

  if (totalError) {
    console.error("Error fetching total image count:", totalError);
    return { imageCount: 0, folders: counts, otherCount: 0 };
  }

  const combinedCounts = counts.reduce((acc, folder) => {
    acc += folder.image_count;
    return acc;
  }, otherCounts || 0);

  return {
    folders: counts,
    imageCount: combinedCounts,
    otherCount: otherCounts || 0,
  };
}
