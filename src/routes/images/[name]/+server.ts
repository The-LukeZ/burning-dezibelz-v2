import { env } from "$env/dynamic/private";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import sharp from "sharp";

if (!fs.existsSync(env.FILE_DIR)) {
  fs.mkdirSync(env.FILE_DIR, { recursive: true });
}

// Cache directory for optimized images
const CACHE_DIR = path.join(env.FILE_DIR, ".cache");
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

interface ImageParams {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "avif" | "jpeg" | "png";
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
}

function parseImageParams(url: URL): ImageParams {
  const params: ImageParams = {};

  if (url.searchParams.get("w")) params.width = parseInt(url.searchParams.get("w")!);
  if (url.searchParams.get("h")) params.height = parseInt(url.searchParams.get("h")!);
  if (url.searchParams.get("q")) params.quality = parseInt(url.searchParams.get("q")!);
  if (url.searchParams.get("f")) params.format = url.searchParams.get("f") as any;
  if (url.searchParams.get("fit")) params.fit = url.searchParams.get("fit") as any;

  return params;
}

function generateCacheKey(filename: string, params: ImageParams): string {
  const paramString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}_${value}`)
    .join("-");

  const ext = params.format || path.extname(filename).slice(1);
  return `${path.parse(filename).name}_${paramString}.${ext}`;
}

async function optimizeImage(inputPath: string, params: ImageParams): Promise<Buffer> {
  let transformer = sharp(inputPath);

  // Resize if dimensions specified
  if (params.width || params.height) {
    transformer = transformer.resize(params.width, params.height, {
      fit: params.fit || "cover",
      withoutEnlargement: true, // Don't upscale smaller images
    });
  }

  // Apply format-specific optimizations
  switch (params.format) {
    case "webp":
      transformer = transformer.webp({
        quality: params.quality || 80,
        effort: 4, // Better compression
      });
      break;
    case "avif":
      transformer = transformer.avif({
        quality: params.quality || 70,
        effort: 4,
      });
      break;
    case "jpeg":
      transformer = transformer.jpeg({
        quality: params.quality || 85,
        mozjpeg: true, // Better compression
      });
      break;
    case "png":
      transformer = transformer.png({
        quality: params.quality || 90,
        compressionLevel: 9,
      });
      break;
    default:
      // Auto-optimize based on original format
      const metadata = await sharp(inputPath).metadata();
      if (metadata.format === "jpeg") {
        transformer = transformer.jpeg({ quality: params.quality || 85, mozjpeg: true });
      } else if (metadata.format === "png") {
        transformer = transformer.png({ quality: params.quality || 90, compressionLevel: 9 });
      }
  }

  return await transformer.toBuffer();
}

export async function GET({ params, request, locals: { supabase, session }, url }) {
  // Parse optimization parameters
  const imageParams = parseImageParams(url);

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

  const file_path = path.normalize(imageData.file_path);

  if (!fs.existsSync(file_path)) {
    return new Response("file not found on disk", { status: 404 });
  }

  // Generate cache key for optimized version
  const cacheKey = generateCacheKey(params.name, imageParams);
  const cachePath = path.join(CACHE_DIR, cacheKey);

  let optimizedBuffer: Buffer;
  let outputMimeType: string = "";
  let cacheStats: fs.Stats | null = null;

  // Check if cached version exists and is newer than original
  if (fs.existsSync(cachePath)) {
    cacheStats = fs.statSync(cachePath);
    const originalStats = fs.statSync(file_path);

    if (cacheStats.mtime >= originalStats.mtime) {
      // Use cached version
      optimizedBuffer = fs.readFileSync(cachePath);
      outputMimeType = mimes.lookup(cacheKey);
    }
  }

  // Generate optimized version if not cached or outdated
  if (!optimizedBuffer!) {
    try {
      optimizedBuffer = await optimizeImage(file_path, imageParams);

      // Cache the optimized version
      fs.writeFileSync(cachePath, optimizedBuffer);
      cacheStats = fs.statSync(cachePath);

      // Determine output MIME type
      outputMimeType = imageParams.format ? `image/${imageParams.format}` : imageData.mime_type;
    } catch (optimizationError) {
      console.error("Image optimization failed:", optimizationError);
      // Fallback to original file
      const nodejs_rstream = fs.createReadStream(file_path);
      const web_rstream = Readable.toWeb(nodejs_rstream, {
        strategy: new CountQueuingStrategy({ highWaterMark: 100 }),
      });

      return new Response(web_rstream as ReadableStream, {
        headers: {
          "Content-Type": imageData.mime_type,
          "Content-Length": imageData.file_size.toString(),
          "Cache-Control": "max-age=3600",
        },
      });
    }
  }

  // Generate ETag for optimized version
  const etag = `W/"${optimizedBuffer.length}-${cacheStats?.mtime.getTime() || Date.now()}"`;

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304 });
  }

  const headers = {
    ETag: etag,
    "Content-Type": outputMimeType,
    "Content-Length": optimizedBuffer.length.toString(),
    "Cache-Control": "max-age=31536000, immutable", // Long cache for optimized images
    "Last-Modified": (cacheStats?.mtime || new Date()).toUTCString(),
    Vary: "Accept", // Vary on Accept header for format negotiation
  };

  return new Response(optimizedBuffer, { headers });
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
