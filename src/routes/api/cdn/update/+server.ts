import { json } from "@sveltejs/kit";
import { S3 } from "$lib/server/s3";
import { CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { PUBLIC_R2_BUCKET_NAME } from "$env/static/public";
import { JsonErrors } from "$lib/constants.js";

export async function POST({ request, locals: { supabase } }) {
  try {
    const { imageId, newName } = await request.json();

    if (!imageId || !newName) {
      return JsonErrors.badRequest("Missing imageId or newName");
    }

    // Get current image record
    const { data: image, error: fetchError } = await supabase
      .from("images")
      .select("r2_key")
      .eq("id", imageId)
      .single();

    if (fetchError || !image) {
      return JsonErrors.notFound("Image not found");
    }

    const oldKey = image.r2_key;
    // Replace the last part of the key with newName
    // Ex: "/images/oldName.jpg" -> "/images/newName.jpg"
    const newKey = oldKey.replace(/[^/]+$/, newName);

    // Copy object with new key
    const copyCommand = new CopyObjectCommand({
      Bucket: PUBLIC_R2_BUCKET_NAME,
      CopySource: `${PUBLIC_R2_BUCKET_NAME}/${oldKey}`,
      Key: newKey,
    });

    await S3.send(copyCommand);

    // Update database record
    const { error: updateError } = await supabase
      .from("images")
      .update({
        name: newName,
        r2_key: newKey,
      })
      .eq("id", imageId);

    if (updateError) {
      // Rollback: delete the copied object
      const deleteNewCommand = new DeleteObjectCommand({
        Bucket: PUBLIC_R2_BUCKET_NAME,
        Key: newKey,
      });
      await S3.send(deleteNewCommand);

      return JsonErrors.serverError("Failed to update database");
    }

    // Delete old object
    const deleteOldCommand = new DeleteObjectCommand({
      Bucket: PUBLIC_R2_BUCKET_NAME,
      Key: oldKey,
    });

    await S3.send(deleteOldCommand);

    return Response.json({ success: true, newKey });
  } catch (error) {
    console.error("Rename error:", error);
    return JsonErrors.serverError("Internal server error");
  }
}
