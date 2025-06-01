export async function load({ params, locals: { supabase } }) {
  const { data: imageName, error: imageError } = await supabase
    .from("images")
    .select("filename")
    .eq("concert_id", params.concertid)
    .single();

  if (imageError) {
    return { imageName: null, error: imageError.message };
  }

  return {
    imageName: imageName.filename,
  };
}
