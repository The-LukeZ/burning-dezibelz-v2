import { env } from "$env/dynamic/public";
import { JsonErrors } from "$lib/constants";
import { RateLimiter } from "$lib/server/ratelimiter";
import { S3 } from "$lib/server/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import dayjs from "dayjs";
import sharp from "sharp";

const Limiter = new RateLimiter({
  points: 100, // 100 requests
  duration: 300, // 5 minutes
});

// --- In-Memory Cache Setup ---
interface CacheEntry {
  buffer: Buffer;
  contentType: string;
  eTag?: string; // Store ETag for potential cache validation (optional but good practice)
  lastAccessed: string; // Add timestamp for LRU cleanup
}
const imageCache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 100; // Maximum number of cached images

// --- Daily Cache Clearing ---
let lastCacheClear = dayjs().subtract(24, "h").toISOString();

function performCacheClear() {
  console.log("[ImageCache] Clearing image cache (daily task)...");
  imageCache.clear();
  console.log("[ImageCache] Image cache cleared.");
  lastCacheClear = dayjs().toISOString();
  console.log(`[ImageCache] Next cache clear scheduled in 24 hours.`);
}

// Check if 24 hours have passed and clear cache if needed
function checkAndClearCache() {
  const lastClear = dayjs(lastCacheClear);

  if (dayjs().diff(lastClear, "hour") >= 24) {
    performCacheClear();
  }
}

// Manage cache size using LRU eviction
function manageCacheSize() {
  if (imageCache.size >= MAX_CACHE_SIZE) {
    // Find oldest accessed item
    let oldestKey = "";
    let oldestTime = dayjs();

    for (const [key, entry] of imageCache.entries()) {
      const accessTime = dayjs(entry.lastAccessed);
      if (accessTime.isBefore(oldestTime)) {
        oldestTime = accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      imageCache.delete(oldestKey);
      console.log(`[Cache] Evicted oldest entry: ${oldestKey}`);
    }
  }
}

// --- Sharp Image Processing ---
interface TransformOptions {
  width?: number;
  height?: number;
  format?: "jpeg" | "png" | "webp" | "avif";
  quality?: number;
}

function parseTransformParams(url: URL): TransformOptions {
  const params: TransformOptions = {};

  const width = url.searchParams.get("w") || url.searchParams.get("width");
  const height = url.searchParams.get("h") || url.searchParams.get("height");
  const format = url.searchParams.get("f") || url.searchParams.get("format");
  const quality = url.searchParams.get("q") || url.searchParams.get("quality");

  if (width && !isNaN(Number(width))) params.width = Number(width);
  if (height && !isNaN(Number(height))) params.height = Number(height);
  if (format && ["jpeg", "png", "webp", "avif"].includes(format)) params.format = format as any;
  if (quality && !isNaN(Number(quality))) params.quality = Math.min(100, Math.max(1, Number(quality)));

  return params;
}

async function transformImage(
  buffer: Buffer,
  options: TransformOptions,
): Promise<{ buffer: Buffer; contentType: string }> {
  let transformer = sharp(buffer);

  if (options.width || options.height) {
    transformer = transformer.resize(options.width, options.height, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // Apply format and quality
  if (options.format) {
    switch (options.format) {
      case "jpeg":
        transformer = transformer.jpeg({ quality: options.quality || 80 });
        break;
      case "png":
        transformer = transformer.png({ quality: options.quality || 80 });
        break;
      case "webp":
        transformer = transformer.webp({ quality: options.quality || 80 });
        break;
      case "avif":
        transformer = transformer.avif({ quality: options.quality || 80 });
        break;
    }
  }

  const transformedBuffer = await transformer.toBuffer();
  const contentType = options.format ? `image/${options.format}` : "image/jpeg";

  return { buffer: transformedBuffer, contentType };
}

function hasTransformations(options: TransformOptions): boolean {
  return !!(options.width || options.height || options.format || options.quality);
}

// --- GET Request Handler ---
export async function GET({ params, getClientAddress, url }) {
  const imageName = params.name;

  if (!imageName) {
    return JsonErrors.badRequest("Image name parameter is missing.");
  }

  // Parse transformation parameters
  const transformOptions = parseTransformParams(url);
  const shouldTransform = hasTransformations(transformOptions);

  // Check and perform daily cache clearing
  checkAndClearCache();

  // --- Arcjet Rate Limiting ---
  // Apply rate limiting: 200 requests per 10 minutes.
  // Arcjet automatically tries to identify the client IP from the request.
  const ip = getClientAddress() || "unknown-client";
  const decision = await Limiter.protect(ip, 1, { ip });

  if (decision.isDenied()) {
    console.warn(`[Arcjet] Rate limit exceeded for image "${imageName}". IP: ${decision.data.ip}`);
    return JsonErrors.tooManyRequests("Too Many Requests");
  }

  // --- Cache Check (skip for transformed images) ---
  if (!shouldTransform && imageCache.has(imageName)) {
    const cached = imageCache.get(imageName)!;
    // Update last accessed time
    cached.lastAccessed = dayjs().toISOString();
    imageCache.set(imageName, cached);

    console.log(`[Cache] HIT for image: ${imageName}`);
    return new Response(cached.buffer, {
      headers: {
        "Content-Type": cached.contentType,
        "X-Cache-Status": "HIT",
        ETag: cached.eTag || "",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  console.log(`[Cache] MISS for image: ${imageName}${shouldTransform ? " (transformation requested)" : ""}`);

  try {
    const command = new GetObjectCommand({
      Bucket: env.PUBLIC_R2_BUCKET_NAME,
      Key: imageName,
    });
    const s3Response = await S3.send(command).catch((err) => {
      throw err;
    });

    if (!s3Response.Body) {
      // This case should ideally not happen if the object exists and S3.send is successful.
      console.error(`[R2] Empty body received for image: ${imageName}`);
      throw new Error("Failed to retrieve image body from R2: Empty body.");
    }

    // Convert the S3 response body (SdkStream) to a Buffer.
    const byteArray = await s3Response.Body.transformToByteArray();
    let imageBuffer = Buffer.from(byteArray);
    let contentType = s3Response.ContentType || "application/octet-stream";
    const eTag = s3Response.ETag;

    // Apply transformations if requested
    if (shouldTransform) {
      try {
        const transformed = await transformImage(imageBuffer, transformOptions);
        imageBuffer = Buffer.from(transformed.buffer);
        contentType = transformed.contentType;

        console.log(
          `[Sharp] Transformed image: ${imageName}, Options: ${JSON.stringify(
            transformOptions,
          )}, Size: ${imageBuffer.length} bytes`,
        );

        // Return transformed image without caching
        return new Response(imageBuffer, {
          headers: {
            "Content-Type": contentType,
            "X-Cache-Status": "MISS-TRANSFORMED",
            "Cache-Control": "public, max-age=86400",
          },
        });
      } catch (transformError: any) {
        console.error(`[Sharp Error] Failed to transform image "${imageName}": ${transformError.message}`);
        return JsonErrors.serverError("Image transformation failed");
      }
    }

    // Manage cache size before adding new entry (only for non-transformed images)
    manageCacheSize();

    // Store in cache (only original images).
    imageCache.set(imageName, {
      buffer: imageBuffer,
      contentType,
      eTag,
      lastAccessed: dayjs().toISOString(),
    });
    console.log(
      `[Cache] Stored image: ${imageName}, Type: ${contentType}, Size: ${imageBuffer.length} bytes, ETag: ${eTag}`,
    );

    // Return the image.
    return new Response(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "X-Cache-Status": "MISS",
        ETag: eTag || "",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err: any) {
    // Log the detailed error for server-side debugging.
    console.error(
      `[R2 Error] Failed to fetch image "${imageName}" from R2: ${err.name} - ${err.message}`,
      err,
    );

    if (err.name === "NoSuchKey") {
      return JsonErrors.notFound("Image not found");
    }

    // If it's already a SvelteKit error object, re-throw it.
    if (err.status && typeof err.body === "object" && err.body !== null && "message" in err.body) {
      return err;
    }
    // For other errors, return a generic 500.
    return JsonErrors.serverError(`Server error fetching image: ${err.message || "Unknown R2 error"}`);
  }
}
