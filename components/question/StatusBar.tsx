"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startQuestion, putBackQuestion } from "@/lib/actions";

export default function StatusBar({
  id,
  status,
  allowedMoves,
}: {
  id: string;
  status: string;
  allowedMoves?: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const canStart = allowedMoves ? allowedMoves.includes("in_progress") : status === "incoming";
  const canPutBack = allowedMoves ? allowedMoves.includes("incoming") : status === "in_progress";

  function run(fn: (id: string) => Promise<{ ok: boolean; error?: string }>) {
    setErr(null);
    startTransition(async () => {
      const r = await fn(id);
      if (!r.ok) setErr(r.error ?? "Action failed.");
      else router.refresh();
    });
  }

  if (!canStart && !canPutBack) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {canStart && (
        <button
          onClick={() => run(startQuestion)}
          disabled={pending}
          className="rounded-lg bg-green px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Working…" : "Start"}
        </button>
      )}
      {canPutBack && (
        <button
          onClick={() => run(putBackQuestion)}
          disabled={pending}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-[13px] font-medium text-text-muted transition-colors hover:bg-bg disabled:opacity-60"
        >
          {pending ? "Working…" : "Put back to Incoming"}
        </button>
      )}
      {err && <span className="text-[12px] text-[#c0392b]">{err}</span>}
    </div>
  );
}
