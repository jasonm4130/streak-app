# Streak App — Design Spec

Date: 2026-05-17
Owner: Jason Matthew (jasonm4130@gmail.com)
Status: Brainstormed, awaiting user review before plan-writing.
Companion document: [`RESEARCH.md`](../../../RESEARCH.md) — the underlying training-science research that drives the behavioural framework this app encodes.

---

## 1. Purpose

A personal PWA that replaces the "75 Hard" mental model with a science-backed daily-discipline tracker for the user's 15-week Sydney Marathon prep block (race day Sun 2026-08-30, sub-4:00 target). Single-user, single-device. Stable enough to use every day for the full block without breaking.

The behavioural framework (corrected from the 75 Hard starting point) is captured in `RESEARCH.md` §1; this spec encodes that framework as a data model + UI.

## 2. Non-goals

- Not a multi-user product. No auth, no accounts, no marketing.
- Not a training-plan generator. Pure log; user knows what's on the schedule from Garmin/other sources.
- Not a structured strength logger. Sessions are tracked as a weekly checkbox + free-text note; no exercise library, no set/rep schema.
- Not a Strava/Garmin integration in v1. Runs are logged as status + free-text note.
- No reminders, no push notifications, no backend in v1. The Worker has zero application code; it's pure static-asset hosting.
- No multi-device sync. Data lives in IndexedDB on the phone.

## 3. Stack & deployment

- **Vite 5 + React 18 + TypeScript** — matches `Adaptive-Training/apps/web` convention.
- **Dexie** for IndexedDB.
- **Zustand** for ephemeral UI state. Domain state lives in Dexie, surfaced via `dexie-react-hooks` `useLiveQuery`.
- **vite-plugin-pwa** for service worker + manifest + offline cache (Workbox-backed, `registerType: 'autoUpdate'`).
- **date-fns** for dates and rolling windows.
- **Hand-rolled SVG** for charts. No charting library.
- **Vitest** + **fake-indexeddb** for unit tests. **Playwright** for one happy-path e2e.
- **eslint + prettier**, configs mirrored from `Adaptive-Training`.
- **pnpm + Turbo monorepo** with `apps/web` as the single app. Cheap insurance for adding a Worker with API code later without restructuring.

Deployment: **Cloudflare Worker with Static Assets** (the post-April-2026 default; Pages is being phased out per Cloudflare's own docs). The Worker has a stub `worker.ts` that proxies to `env.ASSETS.fetch(req)` — no application logic. Config:

```toml
# apps/web/wrangler.toml
name = "streak-app"
main = "src/worker.ts"
compatibility_date = "2026-05-01"

[assets]
directory = "./dist"
not_found_handling = "single-page-application"
binding = "ASSETS"

[[routes]]
pattern = "streak.jasonmatthew.dev"
custom_domain = true
```

Origin: **`streak.jasonmatthew.dev`** — locked from day one because IndexedDB is origin-keyed and migration is destructive.

CF infra (Terraform in `jasonm4130-cf`):
- Add `streak` CNAME to `dns_jasonmatthew_dev.tf` pointing at the Worker
- Add `cloudflare_workers_custom_domain` resource in `workers.tf` binding `streak.jasonmatthew.dev` → `streak-app` Worker

The Terraform patch will be produced as a side artefact during implementation, not auto-applied — the user reviews and runs `terraform apply` deliberately.

## 4. Data model

Three Dexie tables. Single user, no multi-tenancy.

```ts
interface DayLog {
  date: string;                     // 'YYYY-MM-DD' local TZ, primary key
  session?: 'done' | 'modified' | 'skipped';
  sessionNote?: string;
  sleepHours?: number;
  weightKg?: number;
  hydrationOk?: boolean;            // pale-straw urine check
  proteinGrams?: number;
  mobilityDone?: boolean;
  readingDone?: boolean;
  strengthDone?: boolean;
  strengthNote?: string;
  photoBlobId?: string;             // FK to Photo.id; weekly cadence
  restDay?: boolean;                // rebases day score from /7 to /6 (no session expected)
  updatedAt: number;                // epoch ms
}

interface Photo {
  id: string;                       // ulid
  blob: Blob;                       // JPEG, downsized to 800px longest edge, q=0.8
  takenAt: string;                  // 'YYYY-MM-DD'
}

interface Settings {
  id: 'singleton';                  // single-row table
  bodyWeightKg: number;
  marathonDate: string;             // 'YYYY-MM-DD'; default '2026-08-30'
  proteinFloorPerKg: number;        // default 1.6
  sleepFloorHours: number;          // default 7
  mobilityFloorMin: number;         // default 5
  readingFloorPages: number;        // default 10
}
```

Initial Dexie schema version: `1`.

## 5. Adherence scoring

```ts
// src/lib/scoring.ts
function dayScore(d: DayLog, s: Settings): { hit: number; total: 6 | 7 } {
  const total: 6 | 7 = d.restDay ? 6 : 7;
  let hit = 0;
  if (!d.restDay && (d.session === 'done' || d.session === 'modified')) hit++;
  if (d.sleepHours !== undefined && d.sleepHours >= s.sleepFloorHours) hit++;
  if (d.weightKg !== undefined) hit++;
  if (d.hydrationOk) hit++;
  if (d.proteinGrams !== undefined &&
      d.proteinGrams >= s.proteinFloorPerKg * s.bodyWeightKg) hit++;
  if (d.mobilityDone) hit++;
  if (d.readingDone) hit++;
  return { hit, total };
}

function adherence(days: DayLog[], s: Settings): number {
  if (days.length === 0) return 0;
  const { hit, total } = days.reduce(
    (acc, d) => {
      const ds = dayScore(d, s);
      return { hit: acc.hit + ds.hit, total: acc.total + ds.total };
    },
    { hit: 0, total: 0 }
  );
  return hit / total;
}
```

Bands:
- ≥85% → green
- 70%–85% → amber
- <70% → red

Headline: **28-day adherence** as the primary metric (large), **7-day adherence** as the secondary (smaller, with trend arrow vs the prior 7-day window).

Strength sessions are tracked per-day but **do not** contribute to daily adherence. Aggregated as "sessions this week" on the Stats screen, target = 2.

## 6. Week numbering

```ts
// src/lib/week.ts
// Week 15 ends on race day Sunday. Week N runs Mon–Sun.
function weekFor(date: Date, marathonDate: Date): {
  weekNumber: number | 'pre' | 'post';
  dayOfWeek: number;                // 1..7
} { ... }
```

For marathonDate = 2026-08-30 (Sun):
- Week 1: Mon 2026-05-18 → Sun 2026-05-24
- Week 15: Mon 2026-08-24 → Sun 2026-08-30 (race day)
- Before Week 1 (today included): shown as "Pre-week · Week 1 starts Mon"
- After race: "Race complete · day +N"

## 7. UI structure

Bottom-tab navigation, four tabs, no nested nav, no modals except the photo viewer.

### 7.1 Today (default)
Vertical stack on a single screen:
- Header: date (`Sun 17 May`) · week tag (`Pre-week` / `Week 4 · day 3/7` / `Race complete · day +2`) · adherence pill (28-day %)
- Optional rest-day toggle (rebases score)
- Session: three-button group (Done / Modified / Skipped) + free-text note
- Sleep: number input (hours, one decimal)
- Weight: number input (kg, one decimal) + small text showing 7-day rolling average and trend arrow
- Hydration: tap-to-toggle (pale-straw urine check)
- Protein: number input (grams) + computed g/kg + target reminder
- Mobility: tap-to-toggle
- Reading: tap-to-toggle
- Strength (optional, weekly): tap-to-toggle + free-text note. Shows weekly tally `1 / 2`.
- Photo (weekly nudge): camera button if no photo this week; thumbnail if logged.

Every input writes to Dexie on blur/change with debounce; `updatedAt` stamped.

### 7.2 History
Vertical scroll of past days, newest first.
- Default window: last 28 days.
- One-line row per day: `Sun 17/05 · 6/7 · 86%`, coloured by band.
- Tap to expand inline showing all filled fields.
- Long-press to enter edit mode for a past day (retroactive logging).
- "Load older" button at bottom loads previous 28-day chunk.

### 7.3 Stats
Stacked SVG charts:
1. **Weight** — daily points scatter + 7-day rolling average line (dual-line per RESEARCH.md correction).
2. **28-day adherence sparkline** — one bar per day, coloured by band.
3. **Per-field 28-day hit %** — seven horizontal bars, monospace labels (e.g. `session 92%  ████████░`).
4. **Weekly strength tally** — 15 columns, each shows 0/1/2+ sessions vs target.

All charts hand-rolled SVG. No animations beyond crossfade on data change.

### 7.4 Settings
- Body weight (kg) — drives protein target
- Marathon date — drives Week N counter
- Per-field targets: sleep floor, protein g/kg, mobility floor (min), reading floor (pages)
- Export to JSON (downloads `streak-export-YYYY-MM-DD.json`)
- Import from JSON (merge-by-date; "wipe and import" override checkbox)
- Danger zone: wipe all data

### 7.5 Onboarding
Forced 3-step wizard on first launch (no Settings row exists):
1. Body weight (kg) input. Continue.
2. Marathon date picker, default `2026-08-30`. Continue.
3. Drop to Today screen.

Targets default per §10. User can adjust later in Settings.

## 8. Visual brief (handed to frontend-design at implementation time)

> **Aesthetic:** Terminal / data-tool. Monospace primary typeface (JetBrains Mono or SF Mono). Dark background (`#0d1117` GitHub-dark family). High contrast. Information density over white space.
>
> **Tone:** Honest, unbranded, no marketing energy. No emoji decoration. Status uses single-glyph indicators: `[x]`, `[ ]`, `●`, `○`, `↑`, `↓`, `→`.
>
> **Colour:** Three signal colours only — green (`#7ee787` good), amber (`#f0883e` borderline), red (`#f85149` missed). All other UI in greyscale (`#c9d1d9` body, `#6e7681` muted, `#21262d` borders).
>
> **Typography:** Monospace for data/labels; system-ui sans for free-text note inputs. Hierarchy via colour and weight, not size jumps.
>
> **Charts:** Hand-rolled SVG. Sparklines, simple line + scatter, horizontal bars. No 3D, no animations beyond crossfade on data change.
>
> **Reference apps for vibe:** Plausible Analytics dashboard, htop, the GitHub commit graph, Linear's keyboard-first command bar. Reject: Apple Fitness, Whoop, anything with gradients or 3D rings.
>
> **Accessibility floor:** WCAG AA contrast on all signal-colour text against the dark background. Tap targets ≥44pt on phone.
>
> **Don't ship:** Loading spinners. Skeleton screens. Splash screen. Toasts. Any ornament that doesn't carry information.

## 9. JSON export / import format

```json
{
  "schema": 1,
  "exportedAt": "2026-05-17T03:11:00Z",
  "settings": { "id": "singleton", "bodyWeightKg": 100, "marathonDate": "2026-08-30", "proteinFloorPerKg": 1.6, "sleepFloorHours": 7, "mobilityFloorMin": 5, "readingFloorPages": 10 },
  "days": [ { "date": "2026-05-17", "session": "done", "sessionNote": "12km easy", "sleepHours": 7.5, "weightKg": 99.4, "hydrationOk": true, "proteinGrams": 168, "mobilityDone": true, "readingDone": true, "strengthDone": false, "restDay": false, "updatedAt": 1716086400000 } ],
  "photos": [ { "id": "01HXY...", "takenAt": "2026-05-17", "dataUrl": "data:image/jpeg;base64,..." } ]
}
```

Import default: **merge by primary key**. Existing day rows are overwritten by imported ones with newer `updatedAt`; rows present locally but missing in import are preserved. If either side is missing `updatedAt`, treat as `0` for the comparison (the side with a real timestamp wins; if both are missing, the imported row replaces the local one). Photos merge by `id`. "Wipe and import" checkbox in Settings does a destructive replace.

## 10. Defaults

| Field | Default | Override location |
|---|---|---|
| `Settings.bodyWeightKg` | no default; captured in onboarding step 1 (user is ~100 kg) | Settings |
| `Settings.marathonDate` | `2026-08-30` | Onboarding & Settings |
| `Settings.proteinFloorPerKg` | 1.6 | Settings |
| `Settings.sleepFloorHours` | 7 | Settings |
| `Settings.mobilityFloorMin` | 5 | Settings |
| `Settings.readingFloorPages` | 10 | Settings |
| App display name | `streak` | hardcoded |
| Manifest theme colour | `#0d1117` | hardcoded |
| Manifest icon | mono glyph `[x]` on dark bg, 512px PNG | generated at build |
| Photo storage | downsize 800px longest edge, JPEG q=0.8 | hardcoded |
| Date format (display) | `Sun 17 May` | hardcoded |
| Date format (storage/export) | ISO `YYYY-MM-DD` | hardcoded |
| Timezone | device local | hardcoded |
| Adherence bands | ≥85% green, 70–85% amber, <70% red | hardcoded |

## 11. Repo layout

```
streak-app/
├── apps/web/
│   ├── src/
│   │   ├── main.tsx                # entry
│   │   ├── App.tsx                 # tab router
│   │   ├── worker.ts               # CF Worker stub (assets passthrough)
│   │   ├── db.ts                   # Dexie schema + instance
│   │   ├── lib/
│   │   │   ├── scoring.ts          # dayScore + adherence
│   │   │   ├── week.ts             # weekFor()
│   │   │   ├── export.ts           # JSON export/import
│   │   │   └── photos.ts           # blob downsize/encode
│   │   ├── screens/
│   │   │   ├── Today.tsx
│   │   │   ├── History.tsx
│   │   │   ├── Stats.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── Onboarding.tsx
│   │   ├── components/             # populated by frontend-design
│   │   └── styles/                 # tokens + globals
│   ├── public/
│   │   ├── icon-512.png
│   │   └── manifest.webmanifest    # generated by vite-plugin-pwa
│   ├── tests/
│   │   ├── scoring.test.ts
│   │   ├── db.test.ts
│   │   └── e2e/happy-path.spec.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── wrangler.toml
│   ├── package.json
│   └── tsconfig.json
├── docs/superpowers/specs/
│   └── 2026-05-17-streak-app-design.md   # this file
├── infra/
│   └── terraform-patch.md          # Terraform changes to apply in jasonm4130-cf
├── RESEARCH.md
├── package.json                    # pnpm workspace root
├── pnpm-workspace.yaml
├── turbo.json
├── .gitignore
└── README.md
```

`.gitignore` includes `.superpowers/`, `node_modules`, `dist`, `.wrangler`, `.DS_Store`.

## 12. Testing

Three test files only:

1. **`scoring.test.ts`** (Vitest) — every branch of `dayScore` + `adherence`. Includes rest-day rebase, empty days, all-fields-hit, all-fields-miss, partial fills, undefined handling.
2. **`db.test.ts`** (Vitest, fake-indexeddb) — write/read/update/delete a DayLog; schema migration round-trip; export → wipe → import idempotency.
3. **`happy-path.spec.ts`** (Playwright) — load app → onboard → log all 7 fields → adherence shows 100% → reload survives → export JSON → wipe → import → state restored.

No component snapshot tests.

## 13. Build & deploy commands

`apps/web/package.json` scripts:
- `dev` → `vite`
- `build` → `vite build`
- `typecheck` → `tsc --noEmit`
- `test` → `vitest`
- `e2e` → `playwright test`
- `deploy:preview` → `wrangler deploy --env preview`
- `deploy:production` → `wrangler deploy`

Root `package.json` scripts use Turbo to fan these out.

CI (GitHub Actions, on push to `main`): typecheck → vitest → playwright → wrangler deploy. CI workflow is **deferred** — implementation phase ships without it; user can opt in later. Local development + `pnpm deploy:production` is the v1 loop.

## 14. Out-of-scope for v1 (deliberate)

- Web Push notifications (would require a backend; user opted for no reminders)
- Strava/Garmin run ingestion (manual logging via note field is sufficient)
- Multi-device sync (single-phone usage; JSON export covers backup)
- Structured strength logging (checkbox + note is enough)
- Training plan generation
- CI/CD workflow
- D1 / KV / R2 bindings
- Auth / Cloudflare Access
- Multi-user support
- Localisation (English-only)
- Light theme (dark only)

Each of these is a clean follow-on once v1 has been used for a few weeks and the actual gaps emerge.

## 15. Implementation handoff

Once this spec is approved, the next step is the `writing-plans` skill, which produces a step-by-step implementation plan with review checkpoints. The plan will invoke the **`frontend-design` skill** at the component-generation step against the brief in §8.

Open items the implementation plan needs to handle explicitly:
- Generating the 512px icon PNG at build time
- Verifying iOS PWA install behaviour on a real iPhone (Add to Home Screen → onboarding works → IndexedDB persists across restart → app opens offline)
- Producing the Terraform patch text for the user to paste into `jasonm4130-cf`
- A README explaining setup, deploy, and the export/import discipline
