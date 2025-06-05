export async function load({ locals: { supabase } }) {
  const { data: foldersWithCounts, error: foldersError } = await supabase.rpc("get_folder_image_counts");
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
    return { imageCount: 0, folders: foldersWithCounts, otherCount: 0 };
  }

  const combinedCounts = foldersWithCounts.reduce((acc, folder) => {
    acc += folder.image_count;
    return acc;
  }, otherCounts || 0);

  foldersWithCounts.sort((a, b) => a.folder_name.localeCompare(b.folder_name));

  return {
    folders: foldersWithCounts,
    imageCount: combinedCounts,
    otherCount: otherCounts || 0,
  };
}
