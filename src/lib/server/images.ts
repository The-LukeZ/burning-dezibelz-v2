import { FILE_DIR } from "$env/static/private";
import dayjs from "dayjs";
import { unlink } from "fs/promises";
import path from "path";

const MAX_CACHE_SIZE = 100;

type CacheEntry = {
  filepath: string;
  timestamp: Date;
  expires: Date;
};

/**
 * ImageCache class manages caching of image files with expiration and size limits.
 *
 * It provides methods to set, get, delete, and clear cached images,
 * as well as utilities for generating cache keys and file paths.
 */
class ImageCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxCacheSize = MAX_CACHE_SIZE;
  private oldestKey: string | null = null;

  constructor() {}

  /**
   * Retrieves a cached image entry from the cache using the provided cache key.
   *
   * @param cacheKey - The unique identifier used to look up the cached image
   * @returns The cached image entry if found, or undefined if not present in cache
   */
  public getCachedImage(cacheKey: string): CacheEntry | null {
    return this.cache.get(cacheKey) ?? null;
  }

  /**
   * Removes the oldest entry from the image cache.
   *
   * If there is an oldest key available, deletes the corresponding cached image.
   * If no oldest key exists, the operation resolves without performing any action.
   *
   * @returns A Promise that resolves when the oldest entry has been removed,
   *          or immediately if there is no oldest entry to remove.
   */
  private removeOldestEntry() {
    if (this.oldestKey) {
      return this.deleteCachedImage(this.oldestKey);
    }
    return Promise.resolve();
  }

  /**
   * Sets a cached image entry with the specified cache key, file path, and expiration time.
   *
   * Automatically manages cache size by removing the oldest entries when the cache
   * reaches its maximum capacity before adding the new entry.
   *
   * @param cacheKey - The unique key to identify the cached image
   * @param filepath - The file system path to the cached image file
   * @param expiresInSeconds - The number of seconds from now when the cache entry should expire
   *
   * @returns A Promise that resolves when the image has been successfully cached
   */
  public async setCachedImage(cacheKey: string, filepath: string, expiresInSeconds: number) {
    // Check if we need to remove oldest entries to stay under limit
    while (this.cache.size >= this.maxCacheSize) {
      await this.removeOldestEntry();
    }

    const expires = dayjs().add(expiresInSeconds, "seconds").toDate();
    const entry: CacheEntry = {
      filepath,
      timestamp: new Date(),
      expires,
    };
    this.cache.set(cacheKey, entry);
  }

  /**
   * Clears all expired entries from the image cache.
   *
   * Iterates through all cached entries and removes those that have passed
   * their expiration time. For each expired entry, the cached image file
   * is deleted from storage.
   *
   * @returns A promise that resolves when all expired cache entries have been cleared
   */
  public async clearExpiredCache() {
    const now = new Date();
    const expiredKeys: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires <= now) {
        await this.deleteCachedImage(key);
        expiredKeys.push(key);
      }
    }
    console.log(`Cleared expired ${expiredKeys.length} cache entries.`);
  }

  /**
   * Clears the entire image cache.
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Deletes a cached image file from both the filesystem and cache.
   *
   * @param cacheKey - The unique identifier for the cached image entry
   * @throws Will not throw an error if the file doesn't exist on the filesystem
   * @remarks The cache entry is always removed regardless of filesystem deletion success
   */
  public async deleteCachedImage(cacheKey: string) {
    const entry = this.cache.get(cacheKey);
    if (entry) {
      try {
        await unlink(entry.filepath);
      } catch (error) {
        // File might already be deleted, continue with cache cleanup
      } finally {
        this.cache.delete(cacheKey);
      }
    }
  }

  /**
   * Clears all cached image variants for a given filename.
   *
   * This method finds all cache keys that start with the specified filename
   * and removes the corresponding cached images. This is useful when the
   * original image has been updated and all its variants need to be regenerated.
   *
   * @param filename - The base filename to match against cache keys
   * @returns A promise that resolves when all matching cached variants have been deleted
   */
  public async clearCacheVariants(filename: string) {
    const keysToDelete = Array.from(this.cache.keys()).filter((key) => key.startsWith(filename));

    for (const key of keysToDelete) {
      await this.deleteCachedImage(key);
    }
  }

  /**
   * Generates a cache key for an image based on the filename and transformation parameters.
   *
   * The cache key is constructed by combining the base filename (without extension) with
   * a sorted parameter string and the appropriate file extension. Parameters are sorted
   * alphabetically to ensure consistent cache keys regardless of parameter order.
   *
   * @param filename - The original filename of the image
   * @param params - Image transformation parameters (e.g., width, height, format)
   * @returns A unique cache key string in the format: `{basename}_{param1_value1-param2_value2}.{ext}`
   *
   * @example
   * ```typescript
   * const key = ImageProcessor.generateCacheKey('photo.jpg', { width: 300, height: 200, format: 'webp' });
   * // Returns: "photo_height_200-width_300.webp"
   * ```
   */
  public static generateCacheKey(filename: string, params: ImageParams): string {
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}_${value}`)
      .join("-");

    const ext = params.format || path.extname(filename).slice(1);
    return `${path.parse(filename).name}_${paramString}.${ext}`;
    // TODO: Find a way to make the filename
  }

  /**
   * Builds the complete file path for an image by joining the base file directory with the provided filename.
   *
   * @param filename - The name of the image file (including extension)
   * @returns The complete file path to the image
   */
  public static buildImageFilePath(filename: string): string {
    return path.join(FILE_DIR, filename);
  }
}

// Export a singleton instance
export const imageCache = new ImageCache();
export { ImageCache };
