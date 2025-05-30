import { env } from "$env/dynamic/private";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

if (!fs.existsSync(env.FILE_DIR)) {
  fs.mkdirSync(env.FILE_DIR, { recursive: true });
}

export async function GET({ params, request, locals: { supabase, session } }) {
  // Query Supabase to check if the file exists and get metadata
  const { data: imageData, error } = await supabase
    .from("images")
    .select("*")
    .eq("filename", params.name)
    .single();

  if (error || !imageData) {
    return new Response("not found", { status: 404 });
  }

  // Check if file is private and handle access control if needed
  if (imageData.is_private && (!session || session.user.id !== imageData.user_id)) {
    return new Response("forbidden", { status: 403 });
  }

  // file_path is absolute
  const file_path = path.normalize(imageData.file_path);

  if (!fs.existsSync(file_path)) {
    return new Response("file not found on disk", { status: 404 });
  }

  const etag = `W/"${imageData.file_size}-${new Date(imageData.updated_at || imageData.created_at || "").getTime()}"`;

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304 });
  }

  const headers = {
    ETag: etag,
    "Content-Type": imageData.mime_type,
    "Content-Length": imageData.file_size.toString(),
    "Cache-Control": "max-age=60",
    "Last-Modified": new Date(imageData.updated_at || imageData.created_at || "").toUTCString(),
  };

  const nodejs_rstream = fs.createReadStream(file_path);

  const web_rstream = Readable.toWeb(nodejs_rstream, {
    // See: https://github.com/nodejs/node/issues/46347#issuecomment-1416310527
    strategy: new CountQueuingStrategy({ highWaterMark: 100 }),
  });

  return new Response(web_rstream as ReadableStream, { headers: headers });
}

const mimes = {
  // Images
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  avif: "image/avif",

  lookup(string: string): string {
    const ext = string.toLowerCase().split(".").at(-1);
    return (ext && this[ext as Exclude<keyof typeof mimes, "lookup">]) ?? "application/octet-stream";
  },
};
