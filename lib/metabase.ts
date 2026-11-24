// Server-side Metabase client. Runs saved questions ("cards") through the REST
// API with a service-account key, cached so we don't hammer Metabase on every
// page view. Key stays server-side; never import this into a client component.

import { unstable_cache } from "next/cache";

const BASE = process.env.METABASE_URL; // e.g. https://metabase.private.sidelineswap.com
const KEY = process.env.METABASE_API_KEY;

export const METABASE_ENABLED = Boolean(BASE && KEY);

export class MetabaseNotConfiguredError extends Error {
  constructor() {
    super("METABASE_URL / METABASE_API_KEY not set");
    this.name = "MetabaseNotConfiguredError";
  }
}

export class MetabaseError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "MetabaseError";
  }
}

export type MetabaseCol = { name: string; display_name?: string };
export type MetabaseRow = (string | number | boolean | null)[];
export type CardResult = { cols: MetabaseCol[]; rows: MetabaseRow[] };

async function _runCard(cardId: number): Promise<CardResult> {
  if (!METABASE_ENABLED) throw new MetabaseNotConfiguredError();

  const res = await fetch(`${BASE}/api/card/${cardId}/query`, {
    method: "POST",
    headers: {
      "x-api-key": KEY as string,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new MetabaseError(res.status, text.slice(0, 300));
  }

  const json = (await res.json()) as { data?: { cols?: MetabaseCol[]; rows?: MetabaseRow[] } };
  return { cols: json.data?.cols ?? [], rows: json.data?.rows ?? [] };
}

// Cache each card ~5 min. Different cardIds cache independently (the arg is part
// of the cache key). "Live", without pounding Metabase on every request.
const runCardCached = unstable_cache(async (cardId: number) => _runCard(cardId), ["mb-card"], {
  revalidate: 300,
});

export function runCard(cardId: number): Promise<CardResult> {
  return runCardCached(cardId);
}

/** Convenience for single-number cards (count, ratio): returns rows[0][0] as a number. */
export async function scalar(cardId: number): Promise<number> {
  const { rows } = await runCard(cardId);
  const v = rows?.[0]?.[0];
  return typeof v === "number" ? v : Number(v ?? 0);
}
