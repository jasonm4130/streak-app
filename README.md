# streak

Personal habit + adherence tracker for the 15-week Sydney Marathon prep block (race day 2026-08-30). Single user, single device, local-first PWA. Deployed as a Cloudflare Worker with Static Assets at `streak.jasonmatthew.dev`.

See `docs/superpowers/specs/2026-05-17-streak-app-design.md` for the design spec and `RESEARCH.md` for the underlying training-science research.

## Develop

```bash
pnpm install
pnpm dev          # vite dev server on http://localhost:5173
```

## Test

```bash
pnpm test         # vitest unit tests
pnpm e2e          # playwright happy-path
pnpm typecheck
pnpm lint
```

## Deploy

```bash
pnpm deploy:preview     # *.workers.dev preview env
pnpm deploy:production  # streak.jasonmatthew.dev
```

First deploy needs `wrangler login` and the Terraform patch in `infra/terraform-patch.md` applied in the `jasonm4130-cf` repo.

## Data

All data lives in IndexedDB on whatever device installed the PWA. Use Settings → Export JSON to back up; save the file to iCloud Drive periodically. Lose the phone without an export = lose the data.
