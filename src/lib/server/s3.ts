import { env } from "$env/dynamic/private";
import { S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

console.log("S3 Client initialized with endpoint:", env.R2_ENDPOINT);

export { s3Client as S3 };
