import { error } from "@sveltejs/kit";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST({ request, url }) {
  const formData = Object.fromEntries(await request.formData());
  const { file } = formData as { file: File | undefined };

  if (!file) {
    throw error(400, {
      message: "No file uploaded",
    });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create directory if it doesn't exist
  const fileType = file.type.startsWith("video/") ? "videos" : "images";
  const uploadDir = join("static", "media", fileType);
  await mkdir(uploadDir, { recursive: true });

  // Save file
  const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-").toLowerCase()}`;
  const filepath = join(uploadDir, filename);
  await writeFile(filepath, buffer);

  return Response.json(
    {
      success: true,
      url: new URL(`cdn/${fileType}/${filename}`, url.origin).toString(),
    },
    {
      headers: { "Content-Type": "application/json" },
    },
  );
}
