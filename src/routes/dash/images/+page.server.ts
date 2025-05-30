import { sanitizeFilename } from "$lib";
import { fail, type Actions } from "@sveltejs/kit";
import { rename } from "fs/promises";
import { join } from "path";
import { env } from "$env/dynamic/private";

export const actions: Actions = {
  delete: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const imageId = formData.get("imageId") as string;

    if (!imageId) {
      return fail(400, {
        error: "Image ID is required",
      });
    }

    const { error } = await supabase.from("images").delete({ count: "exact" }).eq("id", imageId);

    if (error) {
      console.error("Error deleting image:", error);
      return fail(500, {
        error: "Failed to delete image",
      });
    }

    return {
      success: true,
      message: "Image deleted successfully",
    };
  },

  update: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const imageId = formData.get("imageId") as string;
    const name = formData.get("filename") as string;
    const description = formData.get("description") as string;
    const is_private = formData.get("is_private") === "on";

    if (!imageId || !name) {
      return fail(400, {
        error: "Image ID and name are required",
      });
    }

    const { data: oldData, error: fetchError } = await supabase
      .from("images")
      .select("filename")
      .eq("id", imageId)
      .single();

    if (fetchError || !oldData) {
      console.error("Error fetching old filename:", fetchError);
      return fail(404, {
        error: "Image not found",
      });
    }
    const finalName = sanitizeFilename(name);

    const { data, error } = await supabase
      .from("images")
      .update({ filename: finalName, description, is_private })
      .eq("id", imageId)
      .select()
      .single();

    if (error) {
      console.error("Error updating image:", error);
      return fail(500, {
        error: "Failed to update image",
      });
    }

    // Update the file
    const oldPath = join(env.FILE_DIR, oldData.filename);
    const newPath = join(env.FILE_DIR, finalName);

    try {
      await rename(oldPath, newPath);
    } catch (renameError) {
      console.error("Error renaming file:", renameError);
      return fail(500, {
        error: "Failed to rename file",
      });
    }

    return {
      success: true,
      image: data,
    };
  },
};
