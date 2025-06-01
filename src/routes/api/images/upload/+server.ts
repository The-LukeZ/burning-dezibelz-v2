import { env } from "$env/dynamic/private";
import { getFileExtension, normalizeName, removeExtension } from "$lib";
import type { TablesInsert } from "$lib/supabase.ts";

// R2 configuration
const R2_ENDPOINT = env.R2_ENDPOINT!;
const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = env.R2_BUCKET_NAME!;

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

  // Validate MIME type for images
  if (!content_type.startsWith("image/")) {
    request.body.cancel();
    return new Response(JSON.stringify({ error: "Only image files are allowed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let sanitized_file_name = normalizeName(removeExtension(file_name)) + "." + getFileExtension(file_name);

  // Add timestamp to prevent conflicts
  sanitized_file_name = `${removeExtension(sanitized_file_name)}-${Date.now()}.${getFileExtension(file_name)}`;

  // Convert request body to buffer
  const arrayBuffer = await request.arrayBuffer();
  const fileBuffer = new Uint8Array(arrayBuffer);

  try {
    // Upload to R2
    const uploadUrl = `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${sanitized_file_name}`;

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY_ID}/...`, // You'll need proper AWS v4 signing
        "Content-Type": content_type,
        "Content-Length": fileBuffer.length.toString(),
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      return new Response(JSON.stringify({ error: "Failed to upload to R2" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create image record in Supabase
    const imageData: TablesInsert<"images"> = {
      filename: sanitized_file_name,
      original_filename: file_name,
      file_path: `https://your-domain.com/images/${sanitized_file_name}`, // Your R2 public URL
      file_size: fileBuffer.length,
      mime_type: content_type,
      user_id: user.id,
      is_private: false,
    };

    const { data: image, error } = await supabase.from("images").insert(imageData).select().single();

    if (error) {
      // Optionally clean up R2 file if database insert fails
      return new Response(JSON.stringify({ error: "Failed to save file metadata" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return Response.json(image, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Upload failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
