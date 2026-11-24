import QueueView from "@/components/QueueView";

export const dynamic = "force-dynamic";

export default function TodoShipping() {
  return (
    <div>
      <h1 className="mb-1 text-[22px] font-semibold tracking-tight">Shipping — To-Do&apos;s</h1>
      <p className="mb-6 max-w-[720px] text-[13px] text-text-muted">
        Shipping questions from Trade-in Coordinators as a live queue for the Shipping team to work
        and close out.
      </p>
      <QueueView lane="shipping" />
    </div>
  );
}
