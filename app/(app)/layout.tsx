import Sidebar from "@/components/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <main
        className="min-h-screen px-8 py-7"
        style={{ marginLeft: "var(--sidebar-w)" }}
      >
        {children}
      </main>
    </>
  );
}
