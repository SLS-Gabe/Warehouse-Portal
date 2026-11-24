export type NavItem = { label: string; href: string };
export type NavSection = { label?: string; items: NavItem[] };

export const NAV: NavSection[] = [
  {
    items: [
      { label: "Home", href: "/" },
      { label: "Upload CSV", href: "/upload" },
      { label: "Freight Box Tracker", href: "/freight-box-tracker" },
    ],
  },
  {
    label: "Warehouse",
    items: [
      { label: "Shipping", href: "/warehouse/shipping" },
      { label: "Receiving", href: "/warehouse/receiving" },
      { label: "Processing", href: "/warehouse/processing" },
      { label: "Shelving", href: "/warehouse/shelving" },
    ],
  },
  {
    label: "To-Do's",
    items: [
      { label: "Items", href: "/todos/items" },
      { label: "Shipping", href: "/todos/shipping" },
      { label: "Bulk Buys", href: "/todos/bulk-buys" },
    ],
  },
  {
    label: "Programs",
    items: [
      { label: "Events", href: "/programs/events" },
      { label: "AOIS", href: "/programs/aois" },
      { label: "D2C", href: "/programs/d2c" },
    ],
  },
  {
    label: "TV Displays",
    items: [
      { label: "Shipping TV", href: "/tv/shipping" },
      { label: "Receiving TV", href: "/tv/receiving" },
      { label: "Processing TV", href: "/tv/processing" },
      { label: "Shelving TV", href: "/tv/shelving" },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "Analytics", href: "/reports/analytics" },
      { label: "Cashflow & Expenses", href: "/reports/cashflow" },
    ],
  },
];
