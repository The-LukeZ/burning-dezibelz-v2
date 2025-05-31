import { FILE_DIR } from "$env/static/private";
import { ImageCache, imageCache } from "$lib/server/images.js";
import fs from "fs";
import path from "node:path";
import { Readable } from "node:stream";
import sharp from "sharp";

if (!fs.existsSync(FILE_DIR)) {
  fs.mkdirSync(FILE_DIR, { recursive: true });
}

// Cache directory for optimized images
const CACHE_DIR = path.join(FILE_DIR, ".cache");
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
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

async function optimizeImage(inputPath: string, params: ImageParams): Promise<Buffer> {
  let transformer = sharp(inputPath);

  // Auto-rotate based on EXIF orientation and remove EXIF data
  transformer = transformer.rotate();

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
  // Clear expired cache entries periodically
  imageCache.clearExpiredCache();

  // Parse optimization parameters
  const imageParams = parseImageParams(url);
  const shouldDownload = url.searchParams.get("download") === "true";

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
  const cacheKey = ImageCache.generateCacheKey(params.name, imageParams);
  const cachePath = path.join(CACHE_DIR, cacheKey);

  let optimizedBuffer: Buffer;
  let outputMimeType: string = "";
  let cacheStats: fs.Stats | null = null;

  // Check advanced cache first
  const cachedEntry = imageCache.getCachedImage(cacheKey);

  if (cachedEntry && fs.existsSync(cachedEntry.filepath)) {
    const originalStats = fs.statSync(file_path);
    cacheStats = fs.statSync(cachedEntry.filepath);

    // Check if cached version is still valid (newer than original and not expired)
    if (cacheStats.mtime >= originalStats.mtime && cachedEntry.expires > new Date()) {
      // Use cached version
      optimizedBuffer = fs.readFileSync(cachedEntry.filepath);
      outputMimeType = mimes.lookup(cacheKey);
    }
  }

  // Generate optimized version if not cached or outdated
  if (!optimizedBuffer!) {
    try {
      optimizedBuffer = await optimizeImage(file_path, imageParams);

      // Save to cache file
      fs.writeFileSync(cachePath, optimizedBuffer);
      cacheStats = fs.statSync(cachePath);

      // Add to advanced cache with 24 hour expiration
      await imageCache.setCachedImage({
        cacheKey: cacheKey,
        filepath: cachePath,
        expiresInSeconds: 24 * 60 * 60, // 24 hours
        imageId: imageData.id,
      });

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

  const headers: HeadersInit = {
    ETag: etag,
    "Content-Type": outputMimeType,
    "Content-Length": optimizedBuffer.length.toString(),
    "Cache-Control": "max-age=31536000, immutable", // Long cache for optimized images
    "Last-Modified": (cacheStats?.mtime || new Date()).toUTCString(),
    Vary: "Accept", // Vary on Accept header for format negotiation
  };

  if (shouldDownload) {
    headers["Content-Disposition"] = `attachment; filename="${imageData.filename}"`;
  }

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
