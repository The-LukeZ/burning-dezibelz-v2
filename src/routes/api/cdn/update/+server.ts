import { env as pubEnv } from "$env/dynamic/public";
import { normalizeFolderName } from "$lib";
import { JsonErrors } from "$lib/constants.js";
import { S3 } from "$lib/server/s3";
import { CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function POST({ request, locals: { supabase } }) {
  try {
    let { imageId, newName, newFolder } = (await request.json()) as {
      imageId: string;
      newName?: string;
      newFolder?: string | null;
    };

    if (!imageId || (!newName && newFolder === undefined)) {
      return JsonErrors.badRequest("imageId and at least one of newName or newFolder are required");
    }

    // Get current image record
    const { data: image, error: fetchError } = await supabase
      .from("images")
      .select("r2_key, name, folder, id")
      .eq("id", imageId)
      .maybeSingle();

    if (fetchError || !image) {
      return JsonErrors.notFound("Image not found");
    }

    // Only update name if provided
    let newKey = image.r2_key;
    if (newName && newName !== image.name) {
      const oldKey = image.r2_key;
      // Replace the last part of the key with newName
      // Ex: "images/oldName.jpg" -> "images/newName.jpg"
      newKey = `images/${newName}`;

      // Copy object with new key
      const copyCommand = new CopyObjectCommand({
        Bucket: pubEnv.PUBLIC_R2_BUCKET_NAME,
        CopySource: `${pubEnv.PUBLIC_R2_BUCKET_NAME}/${oldKey}`,
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
          Bucket: pubEnv.PUBLIC_R2_BUCKET_NAME,
          Key: newKey,
        });
        await S3.send(deleteNewCommand);

        return JsonErrors.serverError("Failed to update image name");
      }

      // Delete old object
      const deleteOldCommand = new DeleteObjectCommand({
        Bucket: pubEnv.PUBLIC_R2_BUCKET_NAME,
        Key: oldKey,
      });
      await S3.send(deleteOldCommand);
    }

    // Handle folder update - convert empty string to null
    let finalFolder = newFolder === undefined ? image.folder : newFolder;
    if (newFolder !== undefined) {
      const folderValue = !newFolder ? null : normalizeFolderName(newFolder);

      if (folderValue && !/^[a-zA-Z0-9-_. ]+$/.test(folderValue)) {
        return JsonErrors.badRequest("Invalid folder name");
      }

      if (folderValue !== image.folder) {
        const { error: folderError } = await supabase
          .from("images")
          .update({ folder: folderValue })
          .eq("id", imageId);

        if (folderError) {
          return JsonErrors.serverError("Failed to update folder");
        }
      }

      finalFolder = folderValue;
    }

    return Response.json({ success: true, r2_key: newKey, folder: finalFolder });
  } catch (error) {
    console.error("Rename error:", error);
    return JsonErrors.serverError("Internal server error");
  }
}
