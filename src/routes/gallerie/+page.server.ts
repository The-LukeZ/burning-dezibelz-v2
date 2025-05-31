export async function load({ locals: { supabase } }) {
  const { data, error } = await supabase.from("images").select("id", { count: "exact" });
  if (error) {
    console.error("Error fetching images:", error);
    return { imageCount: 0 };
  }
  return { imageCount: data.length };
}
