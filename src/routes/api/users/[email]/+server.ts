export async function DELETE({ params: { email }, locals: { supabase } }) {
  console.log("Deleting user with email:", email);
  const { error, status } = await supabase.from("allowed_users").delete().eq("email", email);

  console.log("Delete operation result:", { error, status });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return new Response(null, { status: 204 });
}
