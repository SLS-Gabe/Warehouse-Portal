import type { Question } from "@/lib/warehouseQa";

const STATUS_LABEL: Record<string, string> = {
  incoming: "Incoming",
  in_progress: "In progress",
  done: "Done",
  archived: "Archived",
};

const STATUS_CLASS: Record<string, string> = {
  incoming: "bg-green-light text-green-dark",
  in_progress: "bg-[#eff6ff] text-[#1d4ed8]",
  done: "bg-bg text-text-muted",
  archived: "bg-bg text-text-light",
};

function relative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export default function QuestionCard({ q }: { q: Question }) {
  const isHigh = (q.priority ?? "").toLowerCase() === "high";
  const title = q.item_title || (q.account_username ? `@${q.account_username}` : "Question");

  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-card transition-colors hover:border-green-mid">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {isHigh && (
          <span className="rounded-full bg-[#fdf0ef] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c0392b]">
            High
          </span>
        )}
        <span className="rounded-full bg-bg px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-muted">
          {q.issue_type?.replace(/_/g, " ")}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            STATUS_CLASS[q.status] ?? "bg-bg text-text-muted"
          }`}
        >
          {STATUS_LABEL[q.status] ?? q.status}
        </span>
        {q.has_new_message && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-green-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-green" />
            New reply
          </span>
        )}
        {q.reopen_count > 0 && (
          <span className="text-[11px] text-text-light">reopened ×{q.reopen_count}</span>
        )}
        <span className="ml-auto text-[11px] text-text-light">{relative(q.created_at)}</span>
      </div>

      <div className="text-[14px] font-semibold text-text">{title}</div>
      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-text-muted">{q.question}</p>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-text-light">
        {q.account_username && <span>@{q.account_username}</span>}
        {q.warehouse_location && <span>{q.warehouse_location}</span>}
        {q.itemCount != null && q.itemCount > 1 && <span>{q.itemCount} items</span>}
        {q.item_id && <span className="font-mono">#{q.item_id}</span>}
      </div>
    </div>
  );
}
