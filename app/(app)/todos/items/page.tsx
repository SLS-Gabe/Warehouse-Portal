import QueueView from "@/components/QueueView";

export const dynamic = "force-dynamic";

export default function TodoItems() {
  return (
    <div>
      <h1 className="mb-1 text-[22px] font-semibold tracking-tight">Items — To-Do&apos;s</h1>
      <p className="mb-6 max-w-[720px] text-[13px] text-text-muted">
        Item questions from Trade-in Coordinators — bundles, photos, and general gear questions —
        as a live queue for the Items team to work and close out.
      </p>
      <QueueView lane="items" />
    </div>
  );
}
