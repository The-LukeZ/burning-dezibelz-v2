const navItems = {
  public: [
    { href: "/konzerte", label: "Konzerte" },
    { href: "/ueber-uns", label: "Über uns" },
    { href: "/kontakt", label: "Kontakt" },
  ],
  private: [
    { href: "/dash", label: "Dash Home" },
    { href: "/dash/concerts", label: "Concerts" },
    { href: "/dash/venues", label: "Venues" },
    { href: "/dash/songs", label: "Songs" },
    { href: "/dash/images", label: "Images" },
    { href: "/dash/users", label: "Users", requiresAdmin: true },
  ],
} as {
  public: NavItem[];
  private: NavItem[];
};

function getItemsForPath(pathname: string): NavItem[] {
  if (pathname.startsWith("/dash")) return navItems.private;
  return navItems.public;
}

export { navItems, getItemsForPath };
