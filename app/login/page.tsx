import GoogleSignInButton from "@/components/GoogleSignInButton";

const ERRORS: Record<string, string> = {
  domain: "That account isn't a @sidelineswap.com address. Sign in with your company Google account.",
  auth: "Sign-in didn't complete. Please try again.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams?.error ? ERRORS[searchParams.error] ?? "Sign-in failed." : null;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green text-[13px] font-bold text-white">
            SLS
          </div>
          <span className="text-[17px] font-semibold tracking-tight">Warehouse Portal</span>
        </div>

        <div className="rounded-card border border-border bg-surface p-7 shadow-card">
          <h1 className="text-center text-[16px] font-semibold">Sign in</h1>
          <p className="mb-5 mt-1 text-center text-[13px] text-text-muted">
            Use your SidelineSwap Google account.
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-[#f5c6c2] bg-[#fdf0ef] p-3 text-center text-[12.5px] text-[#8a2a20]">
              {error}
            </div>
          )}

          <GoogleSignInButton />
        </div>

        <p className="mt-4 text-center text-[11.5px] text-text-light">
          SidelineSwap W003 · access limited to @sidelineswap.com
        </p>
      </div>
    </div>
  );
}
