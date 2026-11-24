import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AUTH_ENABLED, ALLOWED_EMAIL_DOMAIN } from "@/lib/supabase/config";

// Google (via Supabase) redirects here with ?code=. We exchange it for a
// session, then enforce the @sidelineswap.com domain server-side — hd= alone
// is not a real check, since anyone can strip it from the URL.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Behind Vercel's proxy, build the redirect from the forwarded host.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";
  const base = isLocal || !forwardedHost ? origin : `https://${forwardedHost}`;

  if (!AUTH_ENABLED) return NextResponse.redirect(`${base}/`);

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const email = (user?.email ?? "").toLowerCase();
      if (!email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${base}/login?error=domain`);
      }
      return NextResponse.redirect(`${base}${next}`);
    }
  }

  return NextResponse.redirect(`${base}/login?error=auth`);
}
