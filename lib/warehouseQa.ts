// Server-side client for the Warehouse Q&A API (Steve's Question Dashboard).
// The key is per-warehouse and MUST stay server-side — the API blocks
// cross-origin browser calls, so this module is only ever imported by
// server components / route handlers, never shipped to the browser.

const BASE = process.env.WAREHOUSE_QA_BASE_URL ?? "https://warehouse-qa.vercel.app";
const KEY = process.env.WAREHOUSE_QA_API_KEY;

export class QaApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "QaApiError";
  }
}

/** Thrown when the API key env var isn't set yet. */
export class QaNotConfiguredError extends Error {
  constructor() {
    super("WAREHOUSE_QA_API_KEY is not set");
    this.name = "QaNotConfiguredError";
  }
}

export type QaStatus = "incoming" | "in_progress" | "done" | "archived";

export type Question = {
  id: string;
  status: QaStatus;
  issue_type: string;
  priority: string;
  item_id: string | null;
  item_title: string | null;
  account_username: string | null;
  question: string;
  warehouse_location: string | null;
  locations: string[] | null;
  itemCount: number | null;
  created_at: string;
  created_by_name: string | null;
  marked_done_at: string | null;
  reopen_count: number;
  has_new_message: boolean;
};

type ListParams = {
  status?: "open" | "incoming" | "in_progress" | "done" | "archived" | "all";
  issue_type?: string;
  high?: boolean;
  item?: string;
};

function headers(actingAs?: string): HeadersInit {
  if (!KEY) throw new QaNotConfiguredError();
  const h: Record<string, string> = {
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
  };
  if (actingAs) h["X-Acting-As"] = actingAs;
  return h;
}

async function toError(res: Response): Promise<QaApiError> {
  let msg = res.statusText;
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) msg = body.error;
  } catch {
    /* ignore non-JSON bodies */
  }
  return new QaApiError(res.status, msg);
}

/** GET /api/v1/questions — the warehouse's queue, High priority first then oldest. */
export async function listQuestions(params: ListParams = {}): Promise<Question[]> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.issue_type) qs.set("issue_type", params.issue_type);
  if (params.high) qs.set("high", "1");
  if (params.item) qs.set("item", params.item);

  const res = await fetch(`${BASE}/api/v1/questions?${qs.toString()}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) throw await toError(res);

  const data: unknown = await res.json();
  // The envelope isn't pinned in the docs — accept an array or { questions: [...] }.
  if (Array.isArray(data)) return data as Question[];
  if (data && typeof data === "object" && Array.isArray((data as any).questions)) {
    return (data as any).questions as Question[];
  }
  return [];
}
