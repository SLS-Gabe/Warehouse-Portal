"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { answerQuestion, requestPhotoUpload } from "@/lib/actions";

export default function AnswerForm({ id, isBundle }: { id: string; isBundle: boolean }) {
  const [body, setBody] = useState("");
  const [markDone, setMarkDone] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(e.target.files ?? []).slice(0, 10));
  }

  function submit() {
    setErr(null);
    if (!body.trim()) {
      setErr("Write a reply first.");
      return;
    }
    startTransition(async () => {
      const paths: string[] = [];
      for (const f of files) {
        const u = await requestPhotoUpload();
        if (!u.ok) {
          setErr(u.error);
          return;
        }
        try {
          const put = await fetch(u.signedUrl, {
            method: "PUT",
            headers: { "Content-Type": "image/jpeg" },
            body: f,
          });
          if (!put.ok) {
            setErr(`Photo upload failed (${put.status}).`);
            return;
          }
        } catch {
          setErr("Photo upload failed.");
          return;
        }
        paths.push(u.path);
      }
      const r = await answerQuestion(id, body.trim(), markDone, paths);
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      setBody("");
      setFiles([]);
      setMarkDone(false);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  }

  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-card">
      <div className="mb-2 text-[13px] font-semibold text-text">Reply</div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Answer the coordinator…"
        className="w-full resize-y rounded-lg border border-border bg-bg p-3 text-[13.5px] text-text outline-none focus:border-green"
      />

      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer text-[12.5px] font-medium text-text-muted hover:text-text">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg"
            multiple
            onChange={onPick}
            className="hidden"
          />
          + Photos
        </label>
        {files.length > 0 && (
          <span className="text-[12px] text-text-light">
            {files.length} photo{files.length > 1 ? "s" : ""} attached
          </span>
        )}
        <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-[12.5px] text-text-muted">
          <input
            type="checkbox"
            checked={markDone}
            onChange={(e) => setMarkDone(e.target.checked)}
          />
          Mark Done
        </label>
      </div>

      {err && <div className="mt-2.5 text-[12px] text-[#c0392b]">{err}</div>}

      <div className="mt-3 flex justify-end">
        <button
          onClick={submit}
          disabled={pending}
          className="rounded-lg bg-green px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Sending…" : markDone ? "Send & mark Done" : "Send reply"}
        </button>
      </div>
      {isBundle && (
        <p className="mt-2 text-[11.5px] text-text-light">
          For bundles, use the box panel above to mark items missing or record the packed box.
        </p>
      )}
    </div>
  );
}
