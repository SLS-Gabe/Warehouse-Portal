# Warehouse Portal — SidelineSwap W003

Internal warehouse operations portal for SidelineSwap's W003 warehouse. A single place
to manage the day on the floor and give anyone in the company a clear view into the warehouse.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** for styling (design system ported from the original single-file portal)
- **Supabase** — Postgres + Auth (Google SSO, @sidelineswap) — _Phase 1_
- **Vercel** — hosting + CI

## Build plan

- **Phase 0 — Foundation (this commit):** Next.js app, design system, sidebar navigation, deploy pipeline.
- **Phase 1 — To-Do's:** Items & Shipping intake forms + live queue on Supabase, built from the TIC question form.
- **Phase 2 — Dashboards:** Shipping, Processing, Cashflow, TV displays and Bulk Buys ported and wired to live data.

## Local development

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Structure

```
app/              App Router routes
  layout.tsx      Root layout + sidebar shell
  page.tsx        Home
  todos/          To-Do's section (Items / Shipping / Bulk Buys)
  [...slug]/      Placeholder for pages pending Phase 2
components/        Sidebar, shared UI
lib/nav.ts        Sidebar navigation config
```
