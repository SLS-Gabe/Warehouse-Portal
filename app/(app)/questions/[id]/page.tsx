import Link from "next/link";
import {
  getQuestion,
  QaNotConfiguredError,
  QaApiError,
} from "@/lib/warehouseQa";
import { laneForIssueType, LANE_LABELS } from "@/lib/lanes";
import StatusBar from "@/components/question/StatusBar";
import Thread from "@/components/question/Thread";
import AnswerForm from "@/components/question/AnswerForm";
import BundlePanel from "@/components/question/BundlePanel";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  incoming: "Incoming",
  in_progress: "In progress",
  done: "Done",
  archived: "Archived",
};

export default async function QuestionPage({ params }: { params: { id: string } }) {
  let q;
  try {
    q = await getQuestion(params.id);
  } catch (err) {
    const msg =
      err instanceof QaNotConfiguredError
        ? "The Q&A API key isn't set yet."
        : err instanceof QaApiError && err.status === 404
          ? "This question isn't in your warehouse — it may have been archived or belongs to another warehouse."
          : err instanceof QaApiError
            ? `Couldn't load this question (${err.status}): ${err.message}`
            : "Couldn't reach the Q&A API.";
    return (
      <div className="max-w-[760px]">
        <Link href="/todos/items" className="text-[13px] text-text-muted hover:text-green">
          ← Back to queue
        </Link>
        <div className="mt-4 rounded-card border border-[#f5c6c2] bg-[#fdf0ef] p-4 text-[13px] text-[#8a2a20]">
          {msg}
        </div>
      </div>
    );
  }

  const lane = laneForIssueType(q.issue_type);
  const isHigh = (q.priority ?? "").toLowerCase() === "high";
  const title = q.item_title || (q.account_username ? `@${q.account_username}` : "Question");
  const isBundle = Array.isArray(q.items) && q.items.length > 0;

  return (
    <div className="max-w-[760px]">
      <Link
        href={`/todos/${lane}`}
        className="text-[13px] text-text-muted transition-colors hover:text-green"
      >
        ← {LANE_LABELS[lane]} queue
      </Link>

      {/* Header */}
      <div className="mt-3 mb-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {isHigh && (
            <span className="rounded-full bg-[#fdf0ef] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c0392b]">
              High
            </span>
          )}
          <span className="rounded-full bg-bg px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-muted">
            {q.issue_type?.replace(/_/g, " ")}
          </span>
          <span className="rounded-full bg-green-light px-2 py-0.5 text-[10px] font-medium text-green-dark">
            {STATUS_LABEL[q.status] ?? q.status}
          </span>
        </div>
        <h1 className="text-[20px] font-semibold tracking-tight">{title}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-text-light">
          {q.account_username && <span>@{q.account_username}</span>}
          {q.item_id && <span className="font-mono">#{q.item_id}</span>}
          {q.warehouse_location && <span>{q.warehouse_location}</span>}
          {q.locations && q.locations.length > 0 && <span>{q.locations.join(", ")}</span>}
          {q.created_by_name && <span>from {q.created_by_name}</span>}
        </div>
      </div>

      {/* The question text */}
      <div className="mb-4 rounded-card border border-border bg-surface p-4 shadow-card">
        <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-text">{q.question}</p>
        {q.label_url && (
          <a
            href={q.label_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-green-dark hover:underline"
          >
            Shipping label ↗
          </a>
        )}
      </div>

      <StatusBar id={q.id} status={q.status} allowedMoves={q.allowed_status_moves} />

      {isBundle && (
        <BundlePanel id={q.id} items={q.items} hasPrediction={Boolean(q.bundle_prediction)} />
      )}

      <Thread messages={q.messages ?? []} />

      {q.status !== "archived" && <AnswerForm id={q.id} isBundle={isBundle} />}
    </div>
  );
}
