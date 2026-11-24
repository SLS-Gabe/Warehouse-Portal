"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AUTH_ENABLED } from "@/lib/supabase/config";

export default function UserFooter() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!AUTH_ENABLED) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  if (!AUTH_ENABLED) return null;

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mt-4 border-t border-border px-2 pt-3">
      {email && (
        <div className="mb-1.5 truncate text-[11px] text-text-light" title={email}>
          {email}
        </div>
      )}
      <button
        onClick={signOut}
        className="text-[12px] font-medium text-text-muted transition-colors hover:text-text"
      >
        Sign out
      </button>
    </div>
  );
}
