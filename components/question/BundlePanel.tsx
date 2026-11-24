"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleMissing, recordPacked } from "@/lib/actions";
import type { QaItem, PackedPayload } from "@/lib/warehouseQa";

export default function BundlePanel({
  id,
  items,
  hasPrediction,
}: {
  id: string;
  items: QaItem[];
  hasPrediction: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  // Packed form state
  const [mode, setMode] = useState<"predicted" | "other" | "skip">(
    hasPrediction ? "predicted" : "other",
  );
  const [dims, setDims] = useState({ length: "", width: "", height: "" });
  const [weightOz, setWeightOz] = useState("");

  function runMissing(item: QaItem) {
    setErr(null);
    const nowMissing = !item.missing_at;
    startTransition(async () => {
      const r = await toggleMissing(id, item.item_id, nowMissing);
      if (!r.ok) setErr(r.error);
      else router.refresh();
    });
  }

  function runPacked() {
    setErr(null);
    let payload: PackedPayload;
    const w = weightOz ? Number(weightOz) : undefined;
    if (mode === "predicted") {
      payload = { mode: "predicted", weightOz: w };
    } else if (mode === "skip") {
      payload = { mode: "skip" };
    } else {
      const l = Number(dims.length),
        wd = Number(dims.width),
        h = Number(dims.height);
      if (!l || !wd || !h) {
        setErr("Enter length, width and height (inches).");
        return;
      }
      payload = { mode: "other", length: l, width: wd, height: h, weightOz: w };
    }
    startTransition(async () => {
      const r = await recordPacked(id, payload);
      if (!r.ok) setErr(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="mb-4 rounded-card border border-border bg-surface p-4 shadow-card">
      <div className="mb-3 text-[13px] font-semibold text-text">Bundle — {items.length} items</div>

      {/* Items with missing toggle */}
      <div className="mb-4 flex flex-col divide-y divide-border">
        {items.map((item) => {
          const missing = Boolean(item.missing_at);
          return (
            <div key={item.item_id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] text-text">
                  {item.title || <span className="font-mono">#{item.item_id}</span>}
                </div>
                <div className="text-[11px] text-text-light">
                  {item.location_id && <span>{item.location_id}</span>}
                  {missing && <span className="ml-2 font-medium text-[#c0392b]">Missing</span>}
                </div>
              </div>
              <button
                onClick={() => runMissing(item)}
                disabled={pending}
                className={`shrink-0 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-60 ${
                  missing
                    ? "border-green-mid bg-green-light text-green-dark hover:bg-green-mid"
                    : "border-[#f5c6c2] bg-[#fdf0ef] text-[#c0392b] hover:bg-[#f9e3e0]"
                }`}
              >
                {missing ? "Mark found" : "Mark missing"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Packed box */}
      <div className="border-t border-border pt-3">
        <div className="mb-2 text-[12.5px] font-semibold text-text">Record packed box</div>
        <div className="flex flex-wrap gap-2">
          {hasPrediction && (
            <ModeChip active={mode === "predicted"} onClick={() => setMode("predicted")}>
              Predicted box
            </ModeChip>
          )}
          <ModeChip active={mode === "other"} onClick={() => setMode("other")}>
            Other box
          </ModeChip>
          <ModeChip active={mode === "skip"} onClick={() => setMode("skip")}>
            Skip box info
          </ModeChip>
        </div>

        {mode === "other" && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {(["length", "width", "height"] as const).map((k) => (
              <input
                key={k}
                type="number"
                inputMode="decimal"
                placeholder={k[0].toUpperCase() + k.slice(1) + ' (in)'}
                value={dims[k]}
                onChange={(e) => setDims({ ...dims, [k]: e.target.value })}
                className="w-[110px] rounded-lg border border-border bg-bg px-3 py-1.5 text-[13px] outline-none focus:border-green"
              />
            ))}
          </div>
        )}

        {mode !== "skip" && (
          <div className="mt-2.5">
            <input
              type="number"
              inputMode="decimal"
              placeholder="Weight (oz, optional)"
              value={weightOz}
              onChange={(e) => setWeightOz(e.target.value)}
              className="w-[180px] rounded-lg border border-border bg-bg px-3 py-1.5 text-[13px] outline-none focus:border-green"
            />
          </div>
        )}

        {err && <div className="mt-2.5 text-[12px] text-[#c0392b]">{err}</div>}

        <div className="mt-3">
          <button
            onClick={runPacked}
            disabled={pending}
            className="rounded-lg bg-green px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Record packed & mark Done"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
        active
          ? "border-green bg-green text-white"
          : "border-border bg-surface text-text-muted hover:bg-bg"
      }`}
    >
      {children}
    </button>
  );
}
