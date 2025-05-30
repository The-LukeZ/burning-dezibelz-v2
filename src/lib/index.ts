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
