export async function load({ locals: { supabase } }) {
  const { data: allFolders, error: foldersError } = await supabase
    .from("images")
    .select("folder")
    .not("folder", "is", null)
    .order("folder", { ascending: true });

  if (foldersError) {
    console.error("Error fetching folders:", foldersError);
    return { folders: [] };
  }

  const foldersArray = allFolders.reduce((acc, f) => {
    if (acc.includes(f.folder!)) {
      return acc;
    }
    acc.push(f.folder!);
    return acc;
  }, [] as string[]);

  return {
    folders: foldersArray,
  };
}
