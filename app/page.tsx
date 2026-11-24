const PHASES = [
  {
    tag: "Phase 0 · live",
    title: "Foundation",
    body: "Next.js app on Vercel, your design system ported 1:1, sidebar navigation, and Google SSO ready to switch on. You're looking at it.",
    done: true,
  },
  {
    tag: "Phase 1 · next",
    title: "To-Do's, for real",
    body: "Items & Shipping intake forms backed by Supabase — a TIC submits, the warehouse lane sees it as a live queue and checks it off. Built from Steve's form.",
    done: false,
  },
  {
    tag: "Phase 2",
    title: "Port the dashboards",
    body: "Shipping, Processing, Cashflow and the TV displays move over one at a time, each wired to its real data source. Bulk Buys / Lynn's tool lands here.",
    done: false,
  },
];

export default function Home() {
  return (
    <div>
      <div className="mb-7">
        <h1 className="text-[22px] font-semibold tracking-tight">Warehouse Portal</h1>
        <p className="mt-1 max-w-[720px] text-[13px] text-text-muted">
          SidelineSwap W003 — the real build. A single place to manage the day on the floor and
          give anyone in the company a clear view into the warehouse.
        </p>
      </div>

      <div className="grid gap-3.5 md:grid-cols-3">
        {PHASES.map((p) => (
          <div
            key={p.title}
            className="rounded-card border border-border bg-surface p-5 shadow-card"
          >
            <span
              className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                p.done ? "bg-green-light text-green-dark" : "bg-bg text-text-light"
              }`}
            >
              {p.tag}
            </span>
            <h2 className="mt-3 text-[15px] font-semibold">{p.title}</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-card border border-border bg-surface p-5 text-[13px] text-text-muted shadow-card">
        <span className="font-semibold text-text">Preview build.</span> This is the foundation only —
        login isn&apos;t enforced yet, and the dashboard pages are placeholders until Phase 2 wires
        them to live data.
      </div>
    </div>
  );
}
