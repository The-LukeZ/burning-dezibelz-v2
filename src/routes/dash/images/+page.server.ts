import { env } from "$env/dynamic/private";
import { sanitizeFilename } from "$lib";
import { ImageCache, imageCache } from "$lib/server/images";
import { fail, type Actions } from "@sveltejs/kit";
import { rename, unlink } from "fs/promises";
import { join } from "path";

export const actions: Actions = {
  delete: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const imageId = formData.get("imageId") as string;

    if (!imageId) {
      return fail(400, {
        error: "Image ID is required",
      });
    }

    const { data: imageData, error: fetchError } = await supabase
      .from("images")
      .select("*")
      .eq("id", imageId)
      .single();

    if (fetchError || !imageData) {
      console.error("Error fetching image data:", fetchError);
      return fail(404, {
        error: "Image not found",
      });
    }

    // Delete all cached variants
    await imageCache.clearCacheVariants(imageData.filename);

    // Delete the file from the filesystem
    const filePath = imageData.file_path || join(env.FILE_DIR, imageData.filename);
    try {
      await unlink(filePath);
    } catch (unlinkError) {
      console.error("Error deleting file from filesystem:", unlinkError);
      // Continue with DB deletion even if file deletion fails
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
    // Get all (new) data
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

    // Get old filename and path
    const { data: oldData, error: fetchError } = await supabase
      .from("images")
      .select("filename, file_path")
      .eq("id", imageId)
      .single();

    if (fetchError || !oldData) {
      console.error("Error fetching old filename:", fetchError);
      return fail(404, {
        error: "Image not found",
      });
    }

    // Delete all cached variants
    await imageCache.clearCacheVariants(oldData.filename);

    // Build new filename and filePath
    const finalName = sanitizeFilename(name);
    const newFilePath = ImageCache.buildImageFilePath(finalName);

    // Rename the file in the fs to the new name
    const oldPath = oldData.file_path || join(env.FILE_DIR, oldData.filename);

    try {
      await rename(oldPath, newFilePath);
    } catch (renameError) {
      console.error("Error renaming file:", renameError);
      return fail(500, {
        error: "Failed to rename file",
      });
    }

    // Update DB
    const { data, error } = await supabase
      .from("images")
      .update({
        filename: finalName,
        description,
        is_private,
        file_path: newFilePath,
        updated_at: new Date().toISOString(),
      })
      .eq("id", imageId)
      .select()
      .single();

    if (error) {
      console.error("Error updating image:", error);
      return fail(500, {
        error: "Failed to update image",
      });
    }

    return {
      success: true,
      image: data,
    };
  },
};
