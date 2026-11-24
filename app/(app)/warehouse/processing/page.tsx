import { METABASE_ENABLED, scalarOrNull, runCard, type MetabaseRow } from "@/lib/metabase";

export const dynamic = "force-dynamic";

// High-Touch Processing — a faithful port of the Elk Grove dashboard's
// "High-touch Processing" tab (dashboard 6, tab 60), live from Metabase.
// Every card here is already scoped to W003 + SportsXchange/ReQuip (trade-in).
const CARD = {
  // Cleaning & Photos
  toCleanPhoto: 767, // SX - Total Items to Clean & Photo
  draftsAois: 768, // SX - AOIS Drafts
  draftsD2c: 769, // SX - D2C Drafts
  draftsWarehouse: 770, // SX/RQ - Warehouse Drafts
  // Published Today (+ channel split)
  publishedToday: 661, // SX/RQ Published Today
  pubAois: 662,
  pubD2c: 663,
  pubWarehouse: 664,
  pubOther: 665,
  // Audit backlog
  d2cNotAudited: 584,
  aoisNotAudited: 586,
  d2cOnTheWay: 585,
  aoisOnTheWay: 591,
  errorsUnresolved: 582,
  // Chart
  publishedByDay: 766, // HTP - Published by Day (SW & RQ), grouped by day + event type
};

type Num = number | null;
const fmt = (n: Num) => (n == null ? "—" : n.toLocaleString());

export default async function ProcessingPage() {
  if (!METABASE_ENABLED) {
    return (
      <Shell>
        <Notice
          title="Metabase isn't connected yet"
          body="Set METABASE_URL and METABASE_API_KEY in Vercel and this page goes live against the High-Touch Processing cards."
        />
      </Shell>
    );
  }

  // Every tile degrades to "—" on failure, so one slow/broken card can't take
  // the page down. Fetched in parallel; each card caches ~5 min independently.
  const [
    toCleanPhoto,
    dA,
    dD,
    dW,
    publishedToday,
    pubAois,
    pubD2c,
    pubWarehouse,
    pubOther,
    d2cNotAudited,
    aoisNotAudited,
    d2cOnTheWay,
    aoisOnTheWay,
    errorsUnresolved,
    chart,
  ] = await Promise.all([
    scalarOrNull(CARD.toCleanPhoto),
    scalarOrNull(CARD.draftsAois),
    scalarOrNull(CARD.draftsD2c),
    scalarOrNull(CARD.draftsWarehouse),
    scalarOrNull(CARD.publishedToday),
    scalarOrNull(CARD.pubAois),
    scalarOrNull(CARD.pubD2c),
    scalarOrNull(CARD.pubWarehouse),
    scalarOrNull(CARD.pubOther),
    scalarOrNull(CARD.d2cNotAudited),
    scalarOrNull(CARD.aoisNotAudited),
    scalarOrNull(CARD.d2cOnTheWay),
    scalarOrNull(CARD.aoisOnTheWay),
    scalarOrNull(CARD.errorsUnresolved),
    runCard(CARD.publishedByDay).then(
      (r) => r.rows,
      () => null,
    ),
  ]);

  const drafts = sumOrNull([dA, dD, dW]);

  return (
    <Shell>
      {/* Top KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3.5 md:grid-cols-3">
        <Kpi label="To Clean & Photo" value={fmt(toCleanPhoto)} sub="waiting · SX + RQ" tone="amber" />
        <Kpi label="Published Today" value={fmt(publishedToday)} sub="listed for sale" tone="green" />
        <Kpi label="In Drafts" value={fmt(drafts)} sub="AOIS + D2C + warehouse" />
      </div>

      {/* Published today by channel */}
      <Section title="Published today by channel">
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
          <MiniStat label="AOIS" value={fmt(pubAois)} dot="#2e7d52" />
          <MiniStat label="D2C" value={fmt(pubD2c)} dot="#1d4ed8" />
          <MiniStat label="Warehouse" value={fmt(pubWarehouse)} dot="#b45309" />
          <MiniStat label="Other" value={fmt(pubOther)} dot="#9ca3af" />
        </div>
      </Section>

      {/* Published by day chart */}
      <Section title="Published by day" subtitle="Last 30 days · SX + RQ, by channel">
        {chart ? <PublishedByDay rows={chart} /> : <ChartUnavailable />}
      </Section>

      {/* Audit backlog */}
      <Section title="Audit backlog">
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3">
          <Kpi label="D2C · Not Audited" value={fmt(d2cNotAudited)} sub="in the building" />
          <Kpi label="AOIS · Not Audited" value={fmt(aoisNotAudited)} sub="in the building" />
          <Kpi
            label="Errors Unresolved"
            value={fmt(errorsUnresolved)}
            sub="events · publish failures"
            tone={errorsUnresolved && errorsUnresolved > 0 ? "amber" : undefined}
          />
          <Kpi label="D2C · On the Way" value={fmt(d2cOnTheWay)} sub="inbound" />
          <Kpi label="AOIS · On the Way" value={fmt(aoisOnTheWay)} sub="inbound" />
        </div>
      </Section>
    </Shell>
  );
}

/* ---------- layout ---------- */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[980px]">
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-[22px] font-semibold tracking-tight">Processing</h1>
        <span className="rounded-md border border-green-mid bg-green-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green-dark">
          W003
        </span>
      </div>
      <p className="mb-6 max-w-[720px] text-[13px] text-text-muted">
        High-Touch Processing — trade-in items moving from clean &amp; photo through to live
        listings. Live from Metabase, refreshed every few minutes.
      </p>
      {children}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-baseline gap-2">
        <h2 className="text-[13px] font-semibold text-text">{title}</h2>
        {subtitle && <span className="text-[11.5px] text-text-light">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-card border border-[#bfdbfe] bg-[#eff6ff] p-4 text-[13px] text-[#1e40af]">
      <div className="mb-0.5 font-semibold">{title}</div>
      <div className="leading-relaxed">{body}</div>
    </div>
  );
}

function ChartUnavailable() {
  return (
    <div className="rounded-card border border-border bg-surface p-6 text-center text-[12.5px] text-text-light shadow-card">
      The published-by-day card didn&apos;t load this time — it&apos;ll refresh on the next view.
    </div>
  );
}

/* ---------- tiles ---------- */

function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "amber" | "green";
}) {
  const valueCls =
    tone === "amber" ? "text-[#b45309]" : tone === "green" ? "text-green" : "text-text";
  const cardCls =
    tone === "amber"
      ? "border-[#f1d08c] bg-gradient-to-b from-[#fef3e2] to-surface"
      : tone === "green"
        ? "border-green-mid bg-gradient-to-b from-green-light to-surface"
        : "border-border bg-surface";
  return (
    <div className={`rounded-card border p-4 shadow-card ${cardCls}`}>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-light">
        {label}
      </div>
      <div className={`text-[30px] font-bold leading-none tracking-tight ${valueCls}`}>{value}</div>
      <div className="mt-1.5 text-[11.5px] text-text-light">{sub}</div>
    </div>
  );
}

function MiniStat({ label, value, dot }: { label: string; value: string; dot: string }) {
  return (
    <div className="rounded-card border border-border bg-surface p-3.5 shadow-card">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-light">
          {label}
        </span>
      </div>
      <div className="text-[22px] font-bold leading-none tracking-tight text-text">{value}</div>
    </div>
  );
}

/* ---------- chart: stacked bars, published by day & channel ---------- */

const CHANNELS: { key: string; label: string; color: string }[] = [
  { key: "AOIS_PROGRAM", label: "AOIS", color: "#2e7d52" },
  { key: "D2C", label: "D2C", color: "#1d4ed8" },
  { key: "WAREHOUSE", label: "Warehouse", color: "#b45309" },
  { key: "SLS_DIRECT_BUY", label: "Direct Buy", color: "#7c3aed" },
  { key: "__other__", label: "Other", color: "#9ca3af" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function PublishedByDay({ rows }: { rows: MetabaseRow[] }) {
  // rows: [published_at (ISO day), event_type | null, count]
  const byDay = new Map<string, Record<string, number>>();
  for (const r of rows) {
    const day = String(r[0] ?? "").slice(0, 10); // YYYY-MM-DD
    if (!day) continue;
    const rawType = r[1] == null ? "__other__" : String(r[1]);
    const key = CHANNELS.some((c) => c.key === rawType) ? rawType : "__other__";
    const count = Number(r[2] ?? 0);
    const bucket = byDay.get(day) ?? {};
    bucket[key] = (bucket[key] ?? 0) + count;
    byDay.set(day, bucket);
  }

  const days = [...byDay.keys()].sort();
  if (days.length === 0) return <ChartUnavailable />;

  const totals = days.map((d) => Object.values(byDay.get(d)!).reduce((a, b) => a + b, 0));
  const max = Math.max(...totals, 1);

  // Geometry
  const H = 180; // plot height
  const barGap = 3;
  const n = days.length;
  const barW = Math.max(6, Math.min(26, Math.floor((640 - barGap * n) / n)));
  const chartW = n * (barW + barGap);
  const yTicks = niceTicks(max, 3);

  function label(day: string) {
    const [, m, d] = day.split("-");
    return `${MONTHS[Number(m) - 1]} ${Number(d)}`;
  }

  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-card">
      {/* Legend */}
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {CHANNELS.map((c) => (
          <span key={c.key} className="flex items-center gap-1.5 text-[11.5px] text-text-muted">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.color }} />
            {c.label}
          </span>
        ))}
      </div>

      <div className="flex">
        {/* Y axis */}
        <div
          className="relative mr-2 w-7 shrink-0 text-right text-[10px] text-text-light"
          style={{ height: H }}
        >
          {yTicks.map((t) => (
            <div
              key={t}
              className="absolute right-0 -translate-y-1/2 leading-none"
              style={{ top: H - (t / max) * H }}
            >
              {t.toLocaleString()}
            </div>
          ))}
        </div>

        {/* Plot */}
        <div className="min-w-0 flex-1 overflow-x-auto">
          <svg
            width={chartW}
            height={H + 26}
            viewBox={`0 0 ${chartW} ${H + 26}`}
            className="block"
            role="img"
            aria-label="Items published per day by channel, last 30 days"
          >
            {/* gridlines */}
            {yTicks.map((t) => (
              <line
                key={t}
                x1={0}
                x2={chartW}
                y1={H - (t / max) * H}
                y2={H - (t / max) * H}
                stroke="#e4e4e0"
                strokeWidth={1}
              />
            ))}
            {/* bars */}
            {days.map((day, i) => {
              const bucket = byDay.get(day)!;
              let yCursor = H;
              const x = i * (barW + barGap);
              return (
                <g key={day}>
                  {CHANNELS.map((c) => {
                    const v = bucket[c.key] ?? 0;
                    if (v <= 0) return null;
                    const h = (v / max) * H;
                    yCursor -= h;
                    return (
                      <rect
                        key={c.key}
                        x={x}
                        y={yCursor}
                        width={barW}
                        height={h}
                        fill={c.color}
                      >
                        <title>{`${label(day)} · ${c.label}: ${v.toLocaleString()}`}</title>
                      </rect>
                    );
                  })}
                  {/* x label every ~5th day */}
                  {i % Math.ceil(n / 7) === 0 && (
                    <text
                      x={x + barW / 2}
                      y={H + 16}
                      textAnchor="middle"
                      fontSize={9}
                      fill="#8a8a85"
                    >
                      {label(day)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function sumOrNull(vals: Num[]): Num {
  const present = vals.filter((v): v is number => v != null);
  if (present.length === 0) return null;
  return present.reduce((a, b) => a + b, 0);
}

function niceTicks(max: number, count: number): number[] {
  const step = niceStep(max / count);
  const ticks: number[] = [];
  for (let t = step; t <= max; t += step) ticks.push(t);
  return ticks;
}

function niceStep(raw: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return Math.max(1, nice * pow);
}
