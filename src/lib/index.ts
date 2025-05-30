import { allowedMimeTypes } from "./constants";

export function isCurrentPage(href: string, url: URL): boolean {
  return href === url.pathname;
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

export function buildImageUrl(filename: string, params: ImageParams = {}) {
  const _params = new URLSearchParams();
  if (params.width) _params.set("w", params.width.toString());
  if (params.height) _params.set("h", params.height.toString());
  if (params.quality) _params.set("q", params.quality.toString());
  if (params.format) _params.set("f", params.format);
  if (params.fit) _params.set("fit", params.fit);

  return `/images/${encodeURIComponent(filename)}${_params.size ? "?" + _params.toString() : ""}`;
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
}

const escapedMimeTypes = allowedMimeTypes.map((mime) => mime.replace(/\//g, "\\/"));

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
  return filename.replace(new RegExp(`\.(${escapedMimeTypes.join("|")})$`), "");
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
  return filename + ext;
}
