import { env } from "$env/dynamic/private";
import { getFileExtension, normalizeName, removeExtension } from "$lib";
import type { TablesInsert } from "$lib/supabase.ts";
import { createWriteStream, existsSync, mkdirSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const FILE_DIR = env.FILE_DIR!;

if (!existsSync(FILE_DIR)) {
  mkdirSync(FILE_DIR, { recursive: true });
}

export async function POST({ request, locals: { supabase, user } }) {
  if (!request.body) {
    return new Response(null, { status: 400 });
  }

  if (!user) {
    return new Response(null, { status: 401 });
  }

  const file_name = request.headers.get("x-file-name");
  const content_type = request.headers.get("content-type") || "application/octet-stream";

  if (!file_name) {
    request.body.cancel();
    return new Response(null, { status: 400 });
  }

  let sanitized_file_name = normalizeName(removeExtension(file_name)) + "." + getFileExtension(file_name);

  // Validate MIME type for images
  if (!content_type.startsWith("image/")) {
    request.body.cancel();
    return new Response(JSON.stringify({ error: "Only image files are allowed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let file_path = path.normalize(path.join(FILE_DIR, sanitized_file_name));

  // We could also use supabase to check if the file already exists,
  // but for simplicity, we check the local filesystem.
  if (existsSync(file_path)) {
    sanitized_file_name = `${removeExtension(sanitized_file_name)}-${Date.now()}.${getFileExtension(file_name)}`;
    file_path = path.join(FILE_DIR, sanitized_file_name);
  }

  const nodejs_wstream = createWriteStream(file_path);
  const web_rstream = request.body;
  const nodejs_rstream = Readable.fromWeb(web_rstream as any);

  try {
    await pipeline(nodejs_rstream, nodejs_wstream);

    // Get file stats
    const stats = statSync(file_path);

    // Create image record in Supabase
    const imageData: TablesInsert<"images"> = {
      filename: sanitized_file_name,
      original_filename: file_name,
      file_path: file_path,
      file_size: stats.size,
      mime_type: content_type,
      user_id: user.id,
      is_private: false,
    };

    const { data: image, error } = await supabase.from("images").insert(imageData).select().single();

    if (error) {
      // Clean up file if database insert fails
      unlinkSync(file_path);
      return new Response(JSON.stringify({ error: "Failed to save file metadata" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return Response.json(image, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    unlinkSync(file_path);
    return new Response(null, { status: 500 });
  }
}
