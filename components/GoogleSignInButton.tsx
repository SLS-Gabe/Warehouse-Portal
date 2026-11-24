"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AUTH_ENABLED, ALLOWED_EMAIL_DOMAIN } from "@/lib/supabase/config";

export default function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function signIn() {
    if (!AUTH_ENABLED) return;
    setLoading(true);
    setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { hd: ALLOWED_EMAIL_DOMAIN },
      },
    });
    if (error) {
      setErr(error.message);
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={signIn}
        disabled={!AUTH_ENABLED || loading}
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-surface px-4 py-2.5 text-[14px] font-medium text-text transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg viewBox="0 0 18 18" className="h-[18px] w-[18px]">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
          <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
        </svg>
        {loading ? "Redirecting…" : "Continue with Google"}
      </button>
      {!AUTH_ENABLED && (
        <p className="mt-3 text-center text-[12px] text-text-light">
          Login isn&apos;t switched on yet — Supabase keys pending.
        </p>
      )}
      {err && <p className="mt-3 text-center text-[12px] text-[#c0392b]">{err}</p>}
    </div>
  );
}
