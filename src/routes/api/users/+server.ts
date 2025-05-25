export async function GET({ locals: { supabase } }) {
  const { data: users, error } = await supabase
    .from("allowed_users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(users, { status: 200 });
}
