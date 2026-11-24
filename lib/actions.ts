"use server";

import { revalidatePath } from "next/cache";
import * as qa from "@/lib/warehouseQa";
import { AUTH_ENABLED } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

// The name the Q&A dashboard records against this action (X-Acting-As), so the
// coordinator sees which warehouse person did it.
async function actingAs(): Promise<string | undefined> {
  if (!AUTH_ENABLED) return undefined;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const name = (user?.user_metadata?.full_name as string | undefined) ?? undefined;
    return name || user?.email || undefined;
  } catch {
    return undefined;
  }
}

function fail(err: unknown): ActionResult {
  const message = err instanceof Error ? err.message : "Something went wrong.";
  return { ok: false, error: message };
}

export async function startQuestion(id: string): Promise<ActionResult> {
  try {
    await qa.setStatus(id, "in_progress", await actingAs());
    revalidatePath(`/questions/${id}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function putBackQuestion(id: string): Promise<ActionResult> {
  try {
    await qa.setStatus(id, "incoming", await actingAs());
    revalidatePath(`/questions/${id}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function answerQuestion(
  id: string,
  body: string,
  markDone: boolean,
  photos: string[],
): Promise<ActionResult> {
  try {
    await qa.postMessage(
      id,
      { body, markDone, photos: photos.length ? photos : undefined },
      await actingAs(),
    );
    revalidatePath(`/questions/${id}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function toggleMissing(
  id: string,
  itemId: string,
  missing: boolean,
  note?: string,
): Promise<ActionResult> {
  try {
    await qa.setMissing(id, { itemId, missing, note }, await actingAs());
    revalidatePath(`/questions/${id}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function recordPacked(
  id: string,
  payload: qa.PackedPayload,
): Promise<ActionResult> {
  try {
    await qa.setPacked(id, payload, await actingAs());
    revalidatePath(`/questions/${id}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function requestPhotoUpload(): Promise<
  { ok: true; path: string; signedUrl: string } | { ok: false; error: string }
> {
  try {
    const { path, signedUrl } = await qa.createPhotoUpload(await actingAs());
    return { ok: true, path, signedUrl };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload setup failed.";
    return { ok: false, error: message };
  }
}
