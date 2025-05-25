export function isCurrentPage(href: string, url: URL): boolean {
  return href === url.pathname;
}
