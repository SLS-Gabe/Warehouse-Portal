import Placeholder from "@/components/Placeholder";
import { NAV } from "@/lib/nav";

function titleFor(slug: string[]): string {
  const href = "/" + slug.join("/");
  for (const section of NAV) {
    for (const item of section.items) {
      if (item.href === href) {
        return section.label ? `${item.label} — ${section.label}` : item.label;
      }
    }
  }
  const last = slug[slug.length - 1] ?? "Page";
  return last
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function CatchAll({ params }: { params: { slug: string[] } }) {
  return <Placeholder title={titleFor(params.slug)} />;
}
