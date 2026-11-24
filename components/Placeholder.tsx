export default function Placeholder({
  title,
  sub,
  note,
}: {
  title: string;
  sub?: string;
  note?: string;
}) {
  return (
    <div>
      <h1 className="mb-1 text-[22px] font-semibold tracking-tight">{title}</h1>
      {sub && <p className="mb-6 max-w-[720px] text-[13px] text-text-muted">{sub}</p>}
      <div className="rounded-card border border-dashed border-border bg-surface p-10 text-center">
        <div className="mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-[11px] bg-green-light">
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="#2e7d52" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="14" height="14" rx="2" />
            <path d="M7 10l2 2 4-4" />
          </svg>
        </div>
        <div className="mb-1.5 text-[15px] font-semibold">{note ?? "Coming in a later phase"}</div>
        <div className="mx-auto max-w-[440px] text-[13px] leading-relaxed text-text-muted">
          This page is part of the portal rebuild. The foundation (design system, navigation,
          auth) is live; this section gets ported and wired to its real data source next.
        </div>
      </div>
    </div>
  );
}
