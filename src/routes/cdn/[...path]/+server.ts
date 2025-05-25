import { error } from "@sveltejs/kit";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET({ params }) {
  const filePath = params.path;
  const fullPath = join("static", "media", ...filePath.split("/"));

  // Security check - prevent directory traversal
  if (filePath.includes("..") || filePath.includes("~")) {
    console.error(`Invalid file path: ${filePath}`);
    throw error(400, "Invalid file path");
  }

  if (!existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    throw error(404, "File not found");
  }

  try {
    const file = await readFile(fullPath);
    const ext = filePath.split(".").pop()?.toLowerCase();

    // Set appropriate content type
    const contentTypes = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      mp4: "video/mp4",
      webm: "video/webm",
      mov: "video/quicktime",
    };

    const contentType = contentTypes[ext as keyof typeof contentTypes] || "application/octet-stream";

    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
        ETag: `"${Date.now()}"`,
      },
    });
  } catch (err) {
    throw error(500, "Failed to read file");
  }
}
