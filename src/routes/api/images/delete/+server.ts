import { env } from "$env/dynamic/private";
import { imageCache } from "$lib/server/images";
import { error, json } from "@sveltejs/kit";
import { unlink } from "fs/promises";
import { join } from "path";
import type { RequestHandler } from "./$types";
import { JsonErrors } from "$lib/constants";

// This endpoint is not used for form submissions, but for API requests to delete images.
// See the `delete` action in the `src/routes/dash/gallery/+page.server.ts` file for the form submission handler.
// Even though the logic is the same, the error handling and response format are VERY different (API vs. form action).

export const DELETE: RequestHandler = async ({ request, locals: { supabase } }) => {
  const { imageIds } = await request.json();

  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    throw error(400, "imageIds must be a non-empty array");
  }

  // Fetch all images to be deleted
  const { data: imagesToDelete, error: fetchError } = await supabase
    .from("images")
    .select("id, filename, file_path")
    .in("id", imageIds);

  if (fetchError) {
    console.error("Error fetching images:", fetchError);
    throw error(500, "Failed to fetch images");
  }

  if (!imagesToDelete || imagesToDelete.length === 0) {
    throw error(404, "No images found with provided IDs");
  }

  const deletionResults = {
    successful: [] as string[],
    failed: [] as { id: string; error: string }[],
  };

  // Delete cached variants and files for each image
  for (const image of imagesToDelete) {
    try {
      // Delete cached variants (same as existing delete action)
      console.log("Deleting cached variants for:", image.filename);
      await imageCache.clearCacheVariants(image.id);

      // Delete file from filesystem (same as existing delete action)
      const filePath = image.file_path || join(env.FILE_DIR, image.filename);
      await unlink(filePath);

      deletionResults.successful.push(image.id);
    } catch (fileError) {
      console.error(`Error deleting file for image ${image.id}:`, fileError);
      deletionResults.failed.push({
        id: image.id,
        error: "Failed to delete file from filesystem",
      });
    }
  }

  // Delete successfully processed images from database
  if (deletionResults.successful.length > 0) {
    const { error: dbError } = await supabase.from("images").delete().in("id", deletionResults.successful);

    if (dbError) {
      console.error("Error deleting images from database:", dbError);
      return JsonErrors.internalServerError("Failed to delete images from database");
    }
  }

  return json({
    success: true,
    message: `Deleted ${deletionResults.successful.length} images successfully`,
    deletedCount: deletionResults.successful.length,
    failedCount: deletionResults.failed.length,
    failures: deletionResults.failed,
  });
};
