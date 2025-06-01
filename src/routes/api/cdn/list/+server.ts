import { PUBLIC_R2_BUCKET_NAME } from "$env/static/public";
import { JsonErrors } from "$lib/constants";
import { S3 } from "$lib/server/s3.js";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

export async function GET({ locals: { supabase } }) {
  // Fetch all images
  const images = await S3.send(
    new ListObjectsV2Command({
      Bucket: PUBLIC_R2_BUCKET_NAME,
      Delimiter: "/",
      Prefix: "images/",
      EncodingType: "url",
      MaxKeys: 100,
    }),
  );

  if (!images.Contents || images.Contents.length === 0) {
    return JsonErrors.notFound("No images found");
  }

  const imageList = images.Contents.map((image) => ({
    key: image.Key,
    lastModified: image.LastModified,
    size: image.Size,
  }));

  return Response.json({
    images: imageList,
    message: "Images fetched successfully",
  });
}
