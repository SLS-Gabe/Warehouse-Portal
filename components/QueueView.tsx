import { listQuestions, QaNotConfiguredError, QaApiError } from "@/lib/warehouseQa";
import { laneForIssueType, LANE_LABELS, type Lane } from "@/lib/lanes";
import QuestionCard from "@/components/QuestionCard";

function Notice({ tone, title, body }: { tone: "info" | "error"; title: string; body: string }) {
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

export default async function QueueView({ lane }: { lane: Lane }) {
  const label = LANE_LABELS[lane];

  let questions;
  try {
    const all = await listQuestions({ status: "open" });
    questions = all.filter((q) => laneForIssueType(q.issue_type) === lane);
  } catch (err) {
    if (err instanceof QaNotConfiguredError) {
      return (
        <Notice
          tone="info"
          title="Q&A API key not set yet"
          body="Add WAREHOUSE_QA_API_KEY in the Vercel project settings and this queue goes live against the Warehouse Q&A dashboard."
        />
      );
    }
    if (err instanceof QaApiError) {
      return (
        <Notice
          tone="error"
          title={`Couldn't load the queue (${err.status})`}
          body={err.message}
        />
      );
    }
    return (
      <Notice
        tone="error"
        title="Couldn't reach the Q&A API"
        body="The Warehouse Q&A dashboard didn't respond. Try again in a moment."
      />
    );
  }

  const high = questions.filter((q) => (q.priority ?? "").toLowerCase() === "high").length;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3 text-[13px] text-text-muted">
        <span>
          <span className="font-semibold text-text">{questions.length}</span> open
        </span>
        {high > 0 && (
          <span className="rounded-full bg-[#fdf0ef] px-2.5 py-0.5 text-[12px] font-medium text-[#c0392b]">
            {high} high priority
          </span>
        )}
      </div>

      {questions.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-10 text-center text-[13px] text-text-muted shadow-card">
          Nothing in the {label} queue right now. 🎉
        </div>
      ) : (
        <div className="grid gap-3">
          {questions.map((q) => (
            <QuestionCard key={q.id} q={q} />
          ))}
        </div>
      )}
    </div>
  );
}
