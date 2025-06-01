import { S3 } from "$lib/server/s3.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { PUBLIC_R2_BUCKET_NAME } from "$env/static/public";
import { JsonErrors } from "$lib/constants.js";
import * as Sentry from "@sentry/sveltekit";

export async function POST({ request, locals: { supabase } }) {
  try {
    const { imageIds } = await request.json();

    if (!imageIds?.length) {
      return JsonErrors.badRequest("No image IDs provided");
    }

    // Get image records to find R2 keys
    const { data: images, error: fetchError } = await supabase
      .from("images")
      .select("id, r2_key")
      .in("id", imageIds);

    if (fetchError) {
      console.error("Error fetching images:", fetchError);
      return JsonErrors.serverError("Failed to fetch images");
    }

    // Delete from R2 first
    const deletePromises = images.map((image) =>
      S3.send(
        new DeleteObjectCommand({
          Bucket: PUBLIC_R2_BUCKET_NAME,
          Key: image.r2_key,
        }),
      ),
    );

    try {
      await Promise.all(deletePromises);
    } catch (r2Error) {
      console.error("Error deleting from R2:", r2Error);
      Sentry.captureException(r2Error, {
        extra: {
          imageIds,
          r2Keys: images.map((img) => img.r2_key),
        },
      });
    }

    // Delete from database
    const { error: deleteError } = await supabase.from("images").delete().in("id", imageIds);

    if (deleteError) {
      console.error("Error deleting from database:", deleteError);
      return JsonErrors.serverError("Failed to delete from database");
    }

    return Response.json({
      success: true,
      deletedCount: images.length,
    });
  } catch (error) {
    console.error("Error deleting images:", error);
    return Response.json({ error: "Failed to delete images" }, { status: 500 });
  }
}
