"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-screen overflow-y-auto border-r border-border bg-surface px-3 py-5"
      style={{ width: "var(--sidebar-w)" }}
    >
      {/* Brand */}
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-green text-[11px] font-bold text-white">
          SLS
        </div>
        <span className="text-sm font-semibold tracking-tight">Warehouse Portal</span>
      </div>

      {NAV.map((section, i) => (
        <div key={i} className="mb-5">
          {section.label && (
            <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-text-light">
              {section.label}
            </div>
          )}
          {section.items.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] transition-colors ${
                  active
                    ? "bg-green-light font-medium text-green-dark"
                    : "text-text-muted hover:bg-bg hover:text-text"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
