import { env } from "$env/dynamic/private";
import { PUBLIC_R2_BUCKET_NAME } from "$env/static/public";
import { getFileExtension, normalizeName, removeExtension } from "$lib";
import { JsonErrors } from "$lib/constants.js";
import { S3 } from "$lib/server/s3.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST({ request, locals: { supabase } }) {
  try {
    const { fileName, fileType } = (await request.json()) as {
      fileName: string | undefined;
      fileType: string | undefined;
    };

    if (!fileName || !fileType) {
      return Response.json({ error: "File name or file type is missing" }, { status: 400 });
    }

    const objectKey = `images/${Date.now().toString()}-${normalizeName(removeExtension(fileName))}.${getFileExtension(fileName)}`;

    const command = new PutObjectCommand({
      Bucket: PUBLIC_R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: fileType,
      ACL: "public-read",
      Metadata: {
        "x-amz-meta-original-filename": fileName,
      },
    });

    const presignedUrl = await getSignedUrl(S3, command, {
      expiresIn: 900, // 15 minutes
    });

    const { data: imageRecord, error: dbError } = await supabase
      .from("images")
      .insert({
        name: fileName,
        r2_key: objectKey,
        status: "pending",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return JsonErrors.serverError("Failed to create image record");
    }

    return Response.json({
      presignedUrl,
      fileName: objectKey,
      imageId: imageRecord.id,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return JsonErrors.serverError("Failed to generate presigned URL");
  }
}
