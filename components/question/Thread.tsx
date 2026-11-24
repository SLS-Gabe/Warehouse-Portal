import type { QaMessage } from "@/lib/warehouseQa";

function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Thread({ messages }: { messages: QaMessage[] }) {
  if (!messages.length) {
    return (
      <div className="mb-4 text-[13px] text-text-light">No replies yet.</div>
    );
  }

  return (
    <div className="mb-4 flex flex-col gap-2.5">
      {messages.map((m, i) => {
        const fromWarehouse = (m.side ?? "").toLowerCase() === "warehouse";
        return (
          <div
            key={i}
            className={`max-w-[85%] rounded-card border p-3 ${
              fromWarehouse
                ? "self-end border-green-mid bg-green-light"
                : "self-start border-border bg-surface"
            }`}
          >
            <div className="mb-1 flex items-center gap-2 text-[11px] text-text-light">
              <span className="font-medium text-text-muted">
                {m.author_name || (fromWarehouse ? "Warehouse" : "Coordinator")}
              </span>
              <span>·</span>
              <span>{when(m.created_at)}</span>
            </div>
            <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-text">{m.body}</p>
            {m.photos && m.photos.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {m.photos.map((src, j) => (
                  <a key={j} href={src} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt="attachment"
                      className="h-16 w-16 rounded-md border border-border object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
