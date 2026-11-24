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

export type QaItem = {
  item_id: string;
  location_id: string | null;
  title: string | null;
  missing_at: string | null;
};

export type QaMessage = {
  side: string; // "coordinator" | "warehouse"
  author_name: string | null;
  body: string;
  created_at: string;
  photos?: string[];
};

export type QuestionDetail = Question & {
  items: QaItem[];
  messages: QaMessage[];
  photos?: string[];
  bundle_prediction?: unknown;
  sold_on?: string | null;
  ebay_order_id?: string | null;
  label_url?: string | null;
  allowed_status_moves?: string[];
};

/** GET /api/v1/questions/{id} — one question with its thread, items and extras. */
export async function getQuestion(id: string): Promise<QuestionDetail> {
  const res = await fetch(`${BASE}/api/v1/questions/${encodeURIComponent(id)}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) throw await toError(res);
  return (await res.json()) as QuestionDetail;
}

async function post(path: string, body: unknown, actingAs?: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headers(actingAs),
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw await toError(res);
  return res.json().catch(() => ({}));
}

// Write endpoints live under /api/questions (the app's own routes), per the docs.
export function setStatus(id: string, status: "in_progress" | "incoming", actingAs?: string) {
  return post(`/api/questions/${encodeURIComponent(id)}/status`, { status }, actingAs);
}

export function postMessage(
  id: string,
  opts: { body: string; markDone?: boolean; photos?: string[] },
  actingAs?: string,
) {
  return post(
    `/api/questions/${encodeURIComponent(id)}/messages`,
    { body: opts.body, markDone: opts.markDone, photos: opts.photos },
    actingAs,
  );
}

export function setMissing(
  id: string,
  opts: { itemId: string; missing: boolean; note?: string },
  actingAs?: string,
) {
  return post(
    `/api/questions/${encodeURIComponent(id)}/missing`,
    { itemId: opts.itemId, missing: opts.missing, note: opts.note },
    actingAs,
  );
}

export type PackedPayload =
  | { mode: "predicted"; weightOz?: number }
  | { mode: "other"; length: number; width: number; height: number; weightOz?: number }
  | { mode: "skip" };

export function setPacked(id: string, payload: PackedPayload, actingAs?: string) {
  return post(`/api/questions/${encodeURIComponent(id)}/packed`, payload, actingAs);
}

/** POST /api/photos/upload-url — one signed URL per photo. */
export async function createPhotoUpload(
  actingAs?: string,
): Promise<{ path: string; token: string; signedUrl: string }> {
  return post(`/api/photos/upload-url`, {}, actingAs) as Promise<{
    path: string;
    token: string;
    signedUrl: string;
  }>;
}
