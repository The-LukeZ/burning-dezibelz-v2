import type { Database } from "$lib/supabase";
import { fail } from "@sveltejs/kit";

export const actions = {
  create: async ({ request, locals: { supabase, user } }) => {
    const formData = await request.formData();
    const email = formData.get("email");
    const role = formData.get("role");
    const notes = formData.get("notes") || null;

    if (!email || !role) {
      return fail(400, { error: "Email and role are required" });
    }

    const newUser: Database["public"]["Tables"]["allowed_users"]["Insert"] = {
      email: email.toString(),
      role: role.toString() as Database["public"]["Enums"]["UserRole"],
      notes: notes ? notes.toString() : null,
      created_by: user?.id,
    };

    const { data, error } = await supabase.from("allowed_users").insert([newUser]).select().single();

    if (error) {
      if (error.code === "23505") {
        return fail(400, { error: "User with this email already exists!" });
      }
      return fail(400, { error: error.message });
    }

    return {
      success: true,
      user: data,
    };
  },

  edit: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const user = {
      email: formData.get("email")?.toString(),
      role: formData.get("role")?.toString() as Database["public"]["Enums"]["UserRole"] | undefined,
      notes: formData.get("notes")?.toString() || null,
    };

    const userRoleIsValid = user.role === "admin" || user.role === "editor" || user.role === "user";

    if (!user.email || !userRoleIsValid) {
      return fail(400, { error: "Email and role are required" });
    }

    const { data, error } = await supabase
      .from("allowed_users")
      .update({ notes: user.notes, role: user.role })
      .eq("email", user.email)
      .select()
      .single();

    if (error) {
      return fail(500, { error: error.message });
    }

    return {
      success: true,
      user: data,
    };
  },
};
