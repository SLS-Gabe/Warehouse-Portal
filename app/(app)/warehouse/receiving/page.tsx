import { METABASE_ENABLED, scalarOrNull, runCard } from "@/lib/metabase";
import DayBars from "@/components/charts/DayBars";

export const dynamic = "force-dynamic";

// Receiving — a port of the Elk Grove dashboard's "Receiving" tab (dashboard 6,
// tab 62). The incoming / event side: items received and not yet on shelf.
const CARD = {
  receivedToday: 93, // Received Today by Warehouse (W003)
  publishedInReceiving: 588, // Published & In Receiving (W003-RECEIVING, available)
  receivedMtd: 33, // Items Received by Warehouse (MTD) — [facility, count]
  receivedByDay: 96, // Received by Day W003 (last 30d)
  publishedByDay: 611, // Published by Day (events, last 30d)
  stuckInReceiving: 1464, // Stuck in Receiving - W003 (table)
};

type Num = number | null;
const fmt = (n: Num) => (n == null ? "—" : n.toLocaleString());

export default async function ReceivingPage() {
  if (!METABASE_ENABLED) {
    return (
      <Shell>
        <Notice
          title="Metabase isn't connected yet"
          body="Set METABASE_URL and METABASE_API_KEY in Vercel and this page goes live against the Receiving cards."
        />
      </Shell>
    );
  }

  const [receivedToday, publishedInReceiving, mtdRows, receivedByDay, publishedByDay, stuckRows] =
    await Promise.all([
      scalarOrNull(CARD.receivedToday),
      scalarOrNull(CARD.publishedInReceiving),
      runCard(CARD.receivedMtd).then(
        (r) => r.rows,
        () => null,
      ),
      runCard(CARD.receivedByDay).then(
        (r) => r.rows,
        () => null,
      ),
      runCard(CARD.publishedByDay).then(
        (r) => r.rows,
        () => null,
      ),
      runCard(CARD.stuckInReceiving).then(
        (r) => r.rows,
        () => null,
      ),
    ]);

  // MTD: pull the Elk Grove (W003) row out of the by-warehouse result.
  const mtdElkGrove: Num =
    mtdRows == null
      ? null
      : (() => {
          const row = mtdRows.find((r) => String(r[0]).toLowerCase().includes("elk grove"));
          return row ? Number(row[1] ?? 0) : null;
        })();

  const stuckCount: Num = stuckRows == null ? null : stuckRows.length;

  return (
    <Shell>
      {/* Top KPIs */}
      <div className="mb-5 grid grid-cols-2 gap-3.5 md:grid-cols-3">
        <Kpi label="Received Today" value={fmt(receivedToday)} sub="distinct items · W003" tone="green" />
        <Kpi label="Published & In Receiving" value={fmt(publishedInReceiving)} sub="live, still in RECEIVING" />
        <Kpi label="Received MTD" value={fmt(mtdElkGrove)} sub="Elk Grove · month to date" />
      </div>

      {/* Received by day — the hero */}
      <Section title="Received by day" subtitle="Last 30 days · W003, distinct items">
        {receivedByDay ? <DayBars rows={receivedByDay} color="#2e7d52" /> : <ChartUnavailable />}
      </Section>

      {/* Published by day (events) */}
      <Section title="Published by day" subtitle="Last 30 days · event items">
        {publishedByDay ? <DayBars rows={publishedByDay} color="#1d4ed8" /> : <ChartUnavailable />}
      </Section>

      {/* Stuck in receiving */}
      <Section
        title="Longest in receiving"
        subtitle={
          stuckCount != null
            ? `${stuckCount.toLocaleString()} items in RECEIVING — many are long-stale (pre-2026) and likely already handled`
            : undefined
        }
      >
        {stuckRows ? <StuckTable rows={stuckRows} /> : <ChartUnavailable />}
      </Section>
    </Shell>
  );
}

/* ---------- stuck table ---------- */

function StuckTable({ rows }: { rows: (string | number | boolean | null)[][] }) {
  // Columns: 0 item_id, 1 item_name, 2 item_status, 3 warehouse_status,
  // 4 received_at, 5 hours_in_receiving, 6 days_in_receiving, 7 location,
  // 8 last_scanned_at, 9 origin_type. Already sorted longest-first.
  const top = rows.slice(0, 12);
  const originLabel = (o: unknown) =>
    String(o ?? "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <table className="w-full text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-border bg-bg text-[10.5px] uppercase tracking-wider text-text-light">
            <th className="px-3.5 py-2 font-semibold">Item</th>
            <th className="px-3.5 py-2 font-semibold">Source</th>
            <th className="px-3.5 py-2 text-right font-semibold">Days in receiving</th>
          </tr>
        </thead>
        <tbody>
          {top.map((r, i) => {
            const days = Number(r[6] ?? 0);
            return (
              <tr key={`${r[0]}-${i}`} className="border-b border-border last:border-0">
                <td className="max-w-[420px] px-3.5 py-2">
                  <div className="truncate text-text">{String(r[1] ?? `#${r[0]}`)}</div>
                  <div className="font-mono text-[10.5px] text-text-light">#{String(r[0])}</div>
                </td>
                <td className="px-3.5 py-2 text-text-muted">{originLabel(r[9])}</td>
                <td className="px-3.5 py-2 text-right font-semibold text-text tabular-nums">
                  {days.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length > top.length && (
        <div className="border-t border-border px-3.5 py-2 text-[11.5px] text-text-light">
          Showing the 12 longest of {rows.length.toLocaleString()} · full list in Metabase
        </div>
      )}
    </div>
  );
}

/* ---------- layout (shared shape with Processing) ---------- */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[980px]">
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-[22px] font-semibold tracking-tight">Receiving</h1>
        <span className="rounded-md border border-green-mid bg-green-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green-dark">
          W003
        </span>
      </div>
      <p className="mb-6 max-w-[720px] text-[13px] text-text-muted">
        Incoming items — event freight and trade-in items received and not yet on shelf. Live from
        Metabase, refreshed every few minutes.
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
      This card didn&apos;t load this time — it&apos;ll refresh on the next view.
    </div>
  );
}

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
