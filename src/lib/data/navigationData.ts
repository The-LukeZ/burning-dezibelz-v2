const navItems = {
  public: [
    { href: "/konzerte", label: "Konzerte" },
    { href: "/ueber-uns", label: "Über uns" },
    { href: "/gallerie", label: "Gallerie" },
    { href: "/kontakt", label: "Kontakt" },
  ],
  private: [
    { href: "/intern/home", label: "Dash Home" },
    { href: "/intern/concerts", label: "Concerts" },
    { href: "/intern/venues", label: "Venues" },
    { href: "/intern/songs", label: "Songs" },
    { href: "/intern/gallery", label: "Gallery" },
    { href: "/intern/users", label: "Users", requiresAdmin: true },
  ],
} as {
  public: NavItem[];
  private: NavItem[];
};

function getItemsForPath(pathname: string): NavItem[] {
  if (pathname.startsWith("/intern")) return navItems.private;
  return navItems.public;
}

export { getItemsForPath, navItems };

