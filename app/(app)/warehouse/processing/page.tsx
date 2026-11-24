import { scalar, MetabaseNotConfiguredError, MetabaseError } from "@/lib/metabase";

export const dynamic = "force-dynamic";

// High-Touch Processing — live from Metabase (Elk Grove dashboard cards).
// These cards are already scoped to W003 + SportsXchange/ReQuip (trade-in).
const CARD = {
  backlog: 767, // To Clean & Photo (SX + RQ)
  publishedToday: 661, // SX/RQ Published Today
  draftsAois: 768,
  draftsD2c: 769,
  draftsWarehouse: 770,
  capacity: 97, // ratio 0–1
};

function Notice({ title, body, tone = "info" }: { title: string; body: string; tone?: "info" | "error" }) {
  const cls =
    tone === "error"
      ? "border-[#f5c6c2] bg-[#fdf0ef] text-[#8a2a20]"
      : "border-[#bfdbfe] bg-[#eff6ff] text-[#1e40af]";
  return (
    <div className={`rounded-card border p-4 text-[13px] ${cls}`}>
      <div className="mb-0.5 font-semibold">{title}</div>
      <div className="leading-relaxed">{body}</div>
    </div>
  );
}

export default async function ProcessingPage() {
  let data: {
    backlog: number;
    publishedToday: number;
    drafts: number;
    capacityPct: number;
  } | null = null;
  let error: { title: string; body: string } | null = null;

  try {
    const [backlog, publishedToday, dA, dD, dW, cap] = await Promise.all([
      scalar(CARD.backlog),
      scalar(CARD.publishedToday),
      scalar(CARD.draftsAois),
      scalar(CARD.draftsD2c),
      scalar(CARD.draftsWarehouse),
      scalar(CARD.capacity),
    ]);
    data = {
      backlog,
      publishedToday,
      drafts: dA + dD + dW,
      capacityPct: Math.round(cap * 1000) / 10,
    };
  } catch (err) {
    if (err instanceof MetabaseNotConfiguredError) {
      error = {
        title: "Metabase isn't connected yet",
        body: "Set METABASE_URL and METABASE_API_KEY in Vercel and this page goes live against the High-Touch Processing cards.",
      };
    } else if (err instanceof MetabaseError) {
      error = { title: `Couldn't load from Metabase (${err.status})`, body: err.message };
    } else {
      error = { title: "Couldn't reach Metabase", body: "Try again in a moment." };
    }
  }

  return (
    <div className="max-w-[900px]">
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

      {error ? (
        <Notice tone="info" title={error.title} body={error.body} />
      ) : data ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3.5 md:grid-cols-4">
            <Kpi
              label="To Clean & Photo"
              value={data.backlog.toLocaleString()}
              sub="waiting · SX + RQ"
              tone="amber"
            />
            <Kpi
              label="Published Today"
              value={data.publishedToday.toLocaleString()}
              sub="listed for sale"
              tone="green"
            />
            <Kpi label="In Drafts" value={data.drafts.toLocaleString()} sub="awaiting publish" />
            <Kpi label="Capacity" value={`${data.capacityPct}%`} sub="of est. slots used" />
          </div>

          {/* Funnel */}
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <div className="mb-3 text-[13px] font-semibold">Processing funnel</div>
            <FunnelStep
              label="To Clean & Photo"
              chip="Queue"
              chipCls="bg-[#fef3e2] text-[#b45309]"
              count={data.backlog}
              width={100}
              fill="#b45309"
            />
            <div className="my-1 text-center text-[12px] text-text-light">↓</div>
            <FunnelStep
              label="In Drafts"
              chip="Drafting"
              chipCls="bg-[#eff6ff] text-[#1d4ed8]"
              count={data.drafts}
              width={Math.min(100, Math.round((data.drafts / Math.max(data.backlog, 1)) * 100))}
              fill="#1d4ed8"
            />
            <div className="my-1 text-center text-[12px] text-text-light">↓</div>
            <FunnelStep
              label="Published Today"
              chip="Live"
              chipCls="bg-green-light text-green-dark"
              count={data.publishedToday}
              width={Math.min(100, Math.round((data.publishedToday / Math.max(data.backlog, 1)) * 100))}
              fill="#2e7d52"
            />
          </div>

          <p className="mt-4 text-[12px] text-text-light">
            Charts (published-by-day, channel mix, capacity) port next — this is the live-data
            foundation.
          </p>
        </>
      ) : null}
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
  const valueCls = tone === "amber" ? "text-[#b45309]" : tone === "green" ? "text-green" : "text-text";
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

function FunnelStep({
  label,
  chip,
  chipCls,
  count,
  width,
  fill,
}: {
  label: string;
  chip: string;
  chipCls: string;
  count: number;
  width: number;
  fill: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[12.5px] font-semibold text-text">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${chipCls}`}>
            {chip}
          </span>
          {label}
        </span>
        <span className="text-[16px] font-bold">{count.toLocaleString()}</span>
      </div>
      <div className="h-3.5 overflow-hidden rounded-md border border-border bg-bg">
        <div className="h-full rounded-md" style={{ width: `${width}%`, background: fill }} />
      </div>
    </div>
  );
}
