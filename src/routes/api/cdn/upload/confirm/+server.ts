import { PUBLIC_R2_BUCKET_NAME } from "$env/static/public";
import { JsonErrors } from "$lib/constants.js";
import { S3 } from "$lib/server/s3.js";
import { HeadObjectCommand } from "@aws-sdk/client-s3";

export async function POST({ request, locals: { supabase } }) {
  try {
    const { imageId, fileSize } = await request.json();

    const { data: imageData, error: fetchError } = await supabase
      .from("images")
      .select("id, r2_key, status")
      .eq("id", imageId)
      .maybeSingle();

    if (fetchError || !imageData) {
      console.error("Error fetching image data:", fetchError);
      return JsonErrors.serverError("Failed to fetch image data");
    }

    try {
      await S3.send(
        new HeadObjectCommand({
          Bucket: PUBLIC_R2_BUCKET_NAME,
          Key: imageData.r2_key,
        }),
      );
    } catch (error: any) {
      console.error("Error checking file in R2:", error);
      if (error.name === "NotFound") {
        return JsonErrors.notFound("File not found in R2");
      }
      throw error;
    }

    // Update the image record to mark as successfully uploaded
    const { error } = await supabase
      .from("images")
      .update({
        status: "completed",
        created_at: new Date().toISOString(),
      })
      .eq("id", imageId);

    if (error) {
      console.error("Failed to confirm upload:", error);
      return JsonErrors.serverError("Failed to confirm upload");
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error confirming upload:", error);
    return JsonErrors.serverError("Failed to confirm upload");
  }
}
