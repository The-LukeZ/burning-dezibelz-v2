export async function GET({ params: { venue_id }, locals: { supabase } }) {
  const { data, error } = await supabase.from("venues").select("*").eq("id", venue_id).single();

  if (error) {
    console.error("Error fetching venue:", error);
    return Response.json({ error }, { status: 500 });
  }

  return Response.json(data);
}

export async function PUT({ params: { venue_id }, request, locals: { supabase } }) {
  const { name, address, city, postal_code, state, country, ...rest } = await request.json();

  let url = rest.url as string | undefined;
  if (url?.endsWith("/")) {
    url = url.replace(/\/+$/, "");
  }

  const { data, error } = await supabase
    .from("venues")
    .update({ name, address, city, postal_code, state, country, url })
    .eq("id", venue_id)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating venue:", error);
    return Response.json({ error }, { status: 500 });
  }

  return Response.json(data);
}

export async function DELETE({ params: { venue_id }, locals: { supabase } }) {
  const { error } = await supabase.from("venues").delete().eq("id", venue_id);

  if (error) {
    console.error("Error deleting venue:", error);
    return Response.json({ error }, { status: 500 });
  }

  return new Response(null, { status: 204 });
}
