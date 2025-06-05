import { env as pubEnv } from "$env/dynamic/public";
import { isValidImageMimeType, mimeTypeToExtension, normalizeName, removeExtension } from "$lib";
import { JsonErrors } from "$lib/constants.js";
import { S3 } from "$lib/server/s3.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST({ request, locals: { supabase } }) {
  try {
    let { fileName, mimeType } = (await request.json()) as {
      fileName: string | undefined;
      mimeType: string | undefined;
    };

    if (!fileName || !mimeType) {
      return JsonErrors.badRequest("File name or file type is missing");
    }

    if (!isValidImageMimeType(mimeType)) {
      return JsonErrors.badRequest("Unsupported file type");
    }

    try {
      fileName = `${normalizeName(removeExtension(fileName))}${mimeTypeToExtension(mimeType, true)}` as const;
    } catch (err: any) {
      // mimeTypeToExtension might throw an error if the file type is invalid
      return JsonErrors.badRequest(`Invalid file type: ${err.message}`);
    }

    const objectKey = `images/${Date.now().toString()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: pubEnv.PUBLIC_R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: mimeType,
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
        mime_type: mimeType,
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
