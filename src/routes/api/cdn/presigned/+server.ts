import { env } from "$env/dynamic/private";
import { PUBLIC_R2_BUCKET_NAME } from "$env/static/public";
import { normalizeName } from "$lib";
import { S3 } from "$lib/server/s3.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST({ request }) {
  try {
    const { fileName, fileType } = (await request.json()) as {
      fileName: string | undefined;
      fileType: string | undefined;
    };

    if (!fileName || !fileType) {
      return Response.json({ error: "File name or file type is missing" }, { status: 400 });
    }

    const objectKey = `images/${normalizeName(Date.now().toString())}-${normalizeName(fileName)}`;

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

    return Response.json({
      presignedUrl,
      fileName: objectKey,
      // URL where file will be accessible after upload (if bucket is public)
      fileUrl: `${env.R2_PUBLIC_URL}/${PUBLIC_R2_BUCKET_NAME}/${objectKey}`,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return Response.json({ error: "Failed to generate presigned URL" }, { status: 500 });
  }
}
