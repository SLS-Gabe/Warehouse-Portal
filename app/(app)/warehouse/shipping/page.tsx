import { METABASE_ENABLED, scalarOrNull, runCard, type MetabaseRow } from "@/lib/metabase";
import DayBars from "@/components/charts/DayBars";
import CategoryBars from "@/components/charts/CategoryBars";

export const dynamic = "force-dynamic";

// Shipping — a port of the Elk Grove dashboard's "Shipping Station" tab
// (dashboard 6, tab 59). Picking, packing and shipping out, all W003 trade-in.
const CARD = {
  toPickToday: 569, // Elk Grove - Items to Pick Today -> [unique_items, total_orders]
  shippedToday: 95, // Shipped Today (W003)
  shipmentsByDay: 36, // last 30d
  shipmentsPerHour: 91, // avg per hour, excl. Mondays -> [time_of_day, avg]
  shipmentsByDow: 37, // previous 7 days -> [dow_int, count]
  lostByWeek: 40, // Lost Shipments by Week -> [week, count]
  lostValueByWeek: 41, // Value of Lost Orders by Week -> [week, $sum]
};

type Num = number | null;
const fmt = (n: Num) => (n == null ? "—" : n.toLocaleString());

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]; // ISO: 1=Mon

function weekLabel(iso: string) {
  const [, m, d] = String(iso).slice(0, 10).split("-");
  return `${MONTHS[Number(m) - 1]} ${Number(d)}`;
}
function compactHour(s: string) {
  const m = /^(\d+):\d+\s*(AM|PM)/i.exec(s);
  if (!m) return s;
  return `${m[1]}${m[2].toLowerCase()[0]}`;
}
const usd = (n: number) =>
  "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

export default async function ShippingPage() {
  if (!METABASE_ENABLED) {
    return (
      <Shell>
        <Notice
          title="Metabase isn't connected yet"
          body="Set METABASE_URL and METABASE_API_KEY in Vercel and this page goes live against the Shipping Station cards."
        />
      </Shell>
    );
  }

  const [shippedToday, pickRows, byDay, perHour, byDow, lost, lostValue] = await Promise.all([
    scalarOrNull(CARD.shippedToday),
    runCard(CARD.toPickToday).then((r) => r.rows, () => null),
    runCard(CARD.shipmentsByDay).then((r) => r.rows, () => null),
    runCard(CARD.shipmentsPerHour).then((r) => r.rows, () => null),
    runCard(CARD.shipmentsByDow).then((r) => r.rows, () => null),
    runCard(CARD.lostByWeek).then((r) => r.rows, () => null),
    runCard(CARD.lostValueByWeek).then((r) => r.rows, () => null),
  ]);

  const toPickOrders: Num = pickRows?.[0] ? Number(pickRows[0][1] ?? pickRows[0][0] ?? 0) : null;
  const toPickItems: Num = pickRows?.[0] ? Number(pickRows[0][0] ?? 0) : null;

  const hourData = (perHour ?? []).map((r: MetabaseRow) => ({
    label: compactHour(String(r[0])),
    value: Number(r[1] ?? 0),
  }));
  const dowData = (byDow ?? [])
    .map((r: MetabaseRow) => ({ dow: Number(r[0]), value: Number(r[1] ?? 0) }))
    .sort((a, b) => a.dow - b.dow)
    .map((d) => ({ label: DOW[d.dow] ?? String(d.dow), value: d.value }));
  const lostData = (lost ?? []).map((r: MetabaseRow) => ({
    label: weekLabel(String(r[0])),
    value: Number(r[1] ?? 0),
  }));
  const lostValueData = (lostValue ?? []).map((r: MetabaseRow) => ({
    label: weekLabel(String(r[0])),
    value: Number(r[1] ?? 0),
  }));

  return (
    <Shell>
      {/* KPIs */}
      <div className="mb-5 grid grid-cols-2 gap-3.5 md:max-w-[480px]">
        <Kpi
          label="To Pick Today"
          value={fmt(toPickOrders)}
          sub={toPickItems != null ? `orders · ${toPickItems.toLocaleString()} items` : "orders"}
          tone="amber"
        />
        <Kpi label="Shipped Today" value={fmt(shippedToday)} sub="labels printed · W003" tone="green" />
      </div>

      {/* Shipments by day — hero */}
      <Section title="Shipments by day" subtitle="Last 30 days · W003 trade-in">
        {byDay ? <DayBars rows={byDay} color="#2e7d52" /> : <ChartUnavailable />}
      </Section>

      {/* When we ship + by day of week */}
      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <div>
          <SectionHead title="When we ship" subtitle="avg shipments/hour · excl. Mondays" />
          {hourData.length ? (
            <CategoryBars data={hourData} color="#1d4ed8" format={(n) => n.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
          ) : (
            <ChartUnavailable />
          )}
        </div>
        <div>
          <SectionHead title="By day of week" subtitle="last 7 days" />
          {dowData.length ? <CategoryBars data={dowData} color="#2e7d52" /> : <ChartUnavailable />}
        </div>
      </div>

      {/* Lost orders */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <SectionHead title="Lost shipments by week" subtitle="last 2 months" />
          {lostData.length ? <CategoryBars data={lostData} color="#b45309" /> : <ChartUnavailable />}
        </div>
        <div>
          <SectionHead title="Value of lost orders by week" subtitle="last 2 months" />
          {lostValueData.length ? (
            <CategoryBars data={lostValueData} color="#b45309" format={usd} yAxisWidth={44} />
          ) : (
            <ChartUnavailable />
          )}
        </div>
      </div>
    </Shell>
  );
}

/* ---------- layout ---------- */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[980px]">
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-[22px] font-semibold tracking-tight">Shipping</h1>
        <span className="rounded-md border border-green-mid bg-green-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green-dark">
          W003
        </span>
      </div>
      <p className="mb-6 max-w-[720px] text-[13px] text-text-muted">
        Picking, packing and shipping out — W003 trade-in orders. Live from Metabase, refreshed every
        few minutes.
      </p>
      {children}
    </div>
  );
}

function SectionHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-2 flex items-baseline gap-2">
      <h2 className="text-[13px] font-semibold text-text">{title}</h2>
      {subtitle && <span className="text-[11.5px] text-text-light">{subtitle}</span>}
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
      <SectionHead title={title} subtitle={subtitle} />
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
