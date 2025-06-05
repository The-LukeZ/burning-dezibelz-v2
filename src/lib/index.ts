import { allowedImageExtensions } from "./constants";
import { concertHref } from "./utils/concerts";

/**
 * Checks if the provided href matches the current page's pathname.
 *
 * @param href - The href string to compare against the current page
 * @param url - The URL object containing the current page information
 * @returns True if the href matches the current pathname, false otherwise
 */
export function isCurrentPage(navItem: NavItem, url: URL): boolean {
  return !navItem.pathMatching || navItem.pathMatching === "partial"
    ? url.pathname.startsWith(navItem.href)
    : url.pathname === navItem.href;
}

export function markdownToHtml(markdown: string, infoLink = false): string {
  if (typeof markdown !== "string") return "";

  // Line break: \n
  let html = markdown.replace(/\\n/g, "<br />");
  // Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Italics: *text* or _text_
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>");

  // Underline: __text__
  html = html.replace(/__([^_]+)__/g, "<u>$1</u>");

  // Link: [text](url)
  // Note: This regex does not support nested brackets or parentheses
  // and will not work for all edge cases. Use with caution.
  html = html.replace(/\[([^\]]+)\]\(([^) ]+)\)/gi, (_, text, url) => {
    const target = url.startsWith("/") || url.startsWith("#") ? "_self" : "_blank";
    const rel = target === "_blank" ? ' rel="noopener noreferrer"' : "";
    return `<a href="${url}" class="dy-link dy-link-${infoLink ? "info" : "primary"} dy-link-hover" target="${target}"${rel}>${text}</a>`;
  });

  return html;
}

export function buildImageUrl(r2Key: string, params: ImageParams & { download?: boolean } = {}) {
  const _params = new URLSearchParams();
  if (params.width) _params.set("w", params.width.toString());
  if (params.height) _params.set("h", params.height.toString());
  if (params.quality) _params.set("q", params.quality.toString());
  if (params.fit) _params.set("fit", params.fit);
  if (params.download) _params.set("download", "true");
  if (params.format) _params.set("f", params.format);

  return `/cdn/${r2Key}${_params.size ? "?" + _params.toString() : ""}`;
}

/**
 * Removes the file extension from a filename.
 * @param filename The filename to process.
 * @returns The filename without its extension.
 * @example
 * removeExtension("image.jpg"); // "image"
 * removeExtension("image2.png"); // "image2"
 * removeExtension("image3.gif"); // "image3"
 * removeExtension("image4.webp"); // "image4"
 * // ...
 */
export function removeExtension(filename: string): string {
  return filename.replace(new RegExp(`\.(${allowedImageExtensions.join("|")})$`), "");
}

/**
 * Adds a file extension to a filename.
 * @param filename The filename to process.
 * @param ext The file extension to add, e.g. ".jpg", ".png", etc.
 * @returns The filename with the specified extension added.
 * @example
 * addExtension("image", ".jpg"); // "image.jpg"
 * addExtension("image2", ".png"); // "image2.png"
 * addExtension("image3", ".gif"); // "image3.gif"
 * addExtension("image4", ".webp"); // "image4.webp"
 * // ...
 */
export function addExtension(filename: string, ext: ImageExtension): string {
  return filename + "." + ext;
}

/**
 *
 * @param filename The filename to check for an extension.
 * @returns The file extension if it matches one of the allowed image extensions, or null if it does not.
 * @example
 * getFileExtension("image.jpg"); // "jpg"
 * getFileExtension("image2.png"); // "png"
 * getFileExtension("image3.gif"); // "gif"
 * getFileExtension("image4.webp"); // "webp"
 * // ...
 */
export function getFileExtension(filename: string): ImageExtension | null {
  const match = filename.match(new RegExp(`\.(?<ext>${allowedImageExtensions.join("|")})$`));
  return match ? (match.groups?.ext as ImageExtension) : null;
}

export function mimeTypeToExtension(mimeType: ImageMimeType, withPeriod: true): ImageExtensionWithDot;
export function mimeTypeToExtension(mimeType: ImageMimeType, withPeriod?: false): ImageExtension;

/**
 *
 * @param mimeType The MIME type to convert to an image extension.
 * @returns The corresponding image extension, or null if not found.
 *
 * @example
 * mimeTypeToExtension("image/jpeg"); // "jpg"
 * mimeTypeToExtension("image/png"); // "png"
 * mimeTypeToExtension("image/gif"); // "gif"
 * mimeTypeToExtension("image/webp"); // "webp"
 * mimeTypeToExtension("image/unknown"); // null
 */
export function mimeTypeToExtension(mimeType: string, withPeriod: boolean = true) {
  const match = mimeType.match(/image\/([a-z]+)/);
  if (match && match[1]) {
    const ext = match[1] as ImageExtension;
    if (allowedImageExtensions.includes(ext)) {
      return withPeriod ? `.${ext}` : ext;
    }
  }

  throw new Error(`Unsupported MIME type: ${mimeType}`);
}

export function normalizeName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "-")
    .replace(/-+/g, "-") // Replace multiple dashes with a single dash
    .replace(/^-|-$/g, "") // Remove leading and trailing dashes
    .replace(/_+/g, "_") // Replace multiple underscores with a single underscore
    .toLowerCase();
}

export async function copyConcertLink(concertId: string, venueName: string | null = null) {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}${concertHref(concertId, venueName)}`);
    alert("✅ Konzert Link wurde in die Zwischenablage kopiert!");
  } catch (error) {
    console.error("Failed to copy concert link:", error);
  }
}
