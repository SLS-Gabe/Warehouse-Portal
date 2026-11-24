// Server-side Metabase client. Runs saved questions ("cards") through the REST
// API with a service-account key, cached so we don't hammer Metabase on every
// page view. Key stays server-side; never import this into a client component.

import { unstable_cache } from "next/cache";

const BASE = process.env.METABASE_URL; // e.g. https://metabase.private.sidelineswap.com
const KEY = process.env.METABASE_API_KEY;

export const METABASE_ENABLED = Boolean(BASE && KEY);

// A Metabase REST query must come back well under Vercel's function limit, or the
// whole page hangs. Some cards (e.g. the capacity estimate) are genuinely slow;
// we cap each request and treat a timeout like any other failure so one slow
// card degrades to "—" instead of taking the page down.
const DEFAULT_TIMEOUT_MS = 9000;

export class MetabaseNotConfiguredError extends Error {
  constructor() {
    super("METABASE_URL / METABASE_API_KEY not set");
    this.name = "MetabaseNotConfiguredError";
  }
}

export class MetabaseError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "MetabaseError";
  }
}

export type MetabaseCol = { name: string; display_name?: string };
export type MetabaseRow = (string | number | boolean | null)[];
export type CardResult = { cols: MetabaseCol[]; rows: MetabaseRow[] };

async function _runCard(cardId: number, timeoutMs: number): Promise<CardResult> {
  if (!METABASE_ENABLED) throw new MetabaseNotConfiguredError();

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}/api/card/${cardId}/query`, {
      method: "POST",
      headers: {
        "x-api-key": KEY as string,
        "Content-Type": "application/json",
      },
      // Saved questions here are pre-filtered and take no inputs. For a card with
      // {{template-tag}} variables, pass [{ id, type, target, value }] and look
      // the tag id up from GET /api/card/<id> dataset_query — don't hardcode it.
      body: JSON.stringify({ parameters: [] }),
      cache: "no-store",
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new MetabaseError(res.status, text.slice(0, 300));
    }

    // Metabase can answer 200/202 with a FAILED query — trust the body, not the
    // HTTP code. Success is status === "completed"; rows/cols live under data.
    const json = (await res.json()) as {
      status?: string;
      error?: string;
      data?: { cols?: MetabaseCol[]; rows?: MetabaseRow[] };
    };
    if (json.status && json.status !== "completed") {
      throw new MetabaseError(
        res.status,
        `card status ${json.status}: ${json.error ?? "query not completed"}`.slice(0, 300),
      );
    }
    return { cols: json.data?.cols ?? [], rows: json.data?.rows ?? [] };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new MetabaseError(408, `card ${cardId} timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// A cache-friendly wrapper that NEVER throws for network/query failures, so
// unstable_cache memoizes a failed/slow card for the full window too (otherwise a
// slow card gets retried on every single page load). Config errors still throw —
// they're free and the page shows a distinct "connect Metabase" notice.
type SafeResult =
  | { ok: true; result: CardResult }
  | { ok: false; status: number; message: string };

const cardSafeCached = unstable_cache(
  async (cardId: number, timeoutMs: number): Promise<SafeResult> => {
    try {
      const result = await _runCard(cardId, timeoutMs);
      return { ok: true, result };
    } catch (err) {
      if (err instanceof MetabaseNotConfiguredError) throw err;
      if (err instanceof MetabaseError) {
        console.warn(`[metabase] card ${cardId} http ${err.status}: ${err.message}`);
        return { ok: false, status: err.status, message: err.message };
      }
      // Network-level failure (DNS, refused, TLS). cause.code is the useful bit,
      // e.g. ENOTFOUND when the host isn't resolvable from Vercel.
      const code =
        err && typeof err === "object" && "cause" in err
          ? (err as { cause?: { code?: string } }).cause?.code
          : undefined;
      console.warn(
        `[metabase] card ${cardId} fetch error: ${
          err instanceof Error ? `${err.name}: ${err.message}` : "unknown"
        }${code ? ` code=${code}` : ""}`,
      );
      return { ok: false, status: 0, message: err instanceof Error ? err.message : "unknown error" };
    }
  },
  ["mb-card"],
  { revalidate: 60 }, // 60s per Steve: live-ish, but gentle on the prod DBs
);

/** Runs a card and throws on failure. Use for tiles the page can't render without. */
export async function runCard(cardId: number, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<CardResult> {
  const r = await cardSafeCached(cardId, timeoutMs);
  if (!r.ok) throw new MetabaseError(r.status, r.message);
  return r.result;
}

function toNumber(v: unknown): number {
  return typeof v === "number" ? v : Number(v ?? 0);
}

/** Single-number card (count, ratio). Throws on failure — for required tiles. */
export async function scalar(cardId: number, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<number> {
  const { rows } = await runCard(cardId, timeoutMs);
  return toNumber(rows?.[0]?.[0]);
}

/**
 * Single-number card that returns null instead of throwing when the card is
 * slow, errors, or the key is missing. For optional tiles (e.g. capacity) that
 * shouldn't be able to break the page.
 */
export async function scalarOrNull(
  cardId: number,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<number | null> {
  try {
    const r = await cardSafeCached(cardId, timeoutMs);
    if (!r.ok) return null;
    return toNumber(r.result.rows?.[0]?.[0]);
  } catch {
    return null;
  }
}
