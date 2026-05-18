# streak

Personal habit-tracking PWA — local-first, offline, no backend.

> Visit the live app at https://streak.jasonmatthew.dev

## What + why

A single-user habit and adherence tracker built for the 15-week Sydney Marathon prep block. Everything runs in the browser, data persists in IndexedDB on whatever device installed the PWA, and there is no auth or server-side state to manage. Built so the author owns the data and the deployment.

## Tech stack

- React 19
- Vite 8
- TypeScript 6
- Dexie 4 (IndexedDB)
- Zustand 5
- Cloudflare Workers + Static Assets
- Vitest 4
- Playwright

## Project layout

```text
apps/web/         Vite + React PWA, deployed as a Cloudflare Worker
  src/            App code (screens, components, store, db, lib)
  tests/          Vitest unit tests + Playwright e2e
.github/          CI workflow + Dependabot config
```

## Local dev

```bash
pnpm install && pnpm dev
```

## Deploy

```bash
pnpm deploy:production
```

## License

[MIT](./LICENSE).

---

This is a personal project; no PRs expected.
