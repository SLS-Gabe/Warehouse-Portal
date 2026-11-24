// Supabase + auth configuration. Reads public env vars (safe for the browser).
// Until both are set, AUTH_ENABLED is false and the app stays open — so deploys
// don't lock everyone out before the Supabase project is wired up.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const AUTH_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Only @sidelineswap.com Google accounts may use the portal. This is enforced
// server-side in /auth/callback (hd= alone is not a real check).
export const ALLOWED_EMAIL_DOMAIN = "sidelineswap.com";
