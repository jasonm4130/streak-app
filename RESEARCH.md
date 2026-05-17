# Streak App — Research & Decisions

Date: 2026-05-17. Target: Sydney Marathon, August 2026 (~15 weeks out). Sub-4:00 goal.

This file captures the research underlying the streak app's design — what the science actually supports vs the 75 Hard framing, and which deployment path was chosen and why.

---

## Part 1: Marathon framework stress-test

The starting framework was "75 Hard but science-backed for a marathon block." Five parallel research agents stress-tested each claim. Net result: most held up; two needed correction; one needed softening.

### What held up

- **Zero rest days harms adaptation.** Strongly supported. Meeusen et al. 2013 ECSS/ACSM consensus on overtraining + Bellinger 2020 functional-vs-non-functional overreaching meta-analysis show unrelieved load tips into NFO within 2–4 weeks. 75 Hard's no-rest mechanic is the most physiologically problematic part.
- **Weekly structure: 1 quality + 1 long + easy aerobic + 1–2 rest.** Supported. Muniz-Pumares et al. 2024 *Sports Medicine* analysed 120k Strava marathoners — across every finish-time bucket from sub-2:30 to 6:00+, faster runners didn't do more hard work, they did more easy. The pattern is pyramidal/polarised (80/15/5 or 80/20).
- **Heavy strength 2×/week.** Strongly supported with concrete effect sizes:
  - Running economy improves ~3.65–4.83% (Caputo 2016 meta-analysis; Berryman 2018 SMD 0.65)
  - Lauersen et al. 2014 BJSM: strength training cuts overall sports injury risk by ~62% (RR 0.338) across 7,738 athletes
  - This is the highest-leverage non-running input.
- **Hydrate to thirst / pale-straw urine, not a fixed volume.** Strongly supported. IMMDA 2006/2010 + Hew-Butler 2017 EAH consensus papers explicitly recommend thirst-driven drinking. The "gallon a day" target sits in the EAH risk zone without performance benefit.
- **Restart rules are psychologically counterproductive.** Supported via abstinence violation effect (Marlatt; Larimer 1999) and SDT meta-analyses (Teixeira 2012). Introjected/guilt-driven adherence predicts short-term compliance and long-term abandonment. Lally 2010 also showed a single miss does not materially harm the habit trajectory.
- **Daily reading habit.** Clean. Low-friction + stable cue = the Lally/Fogg/Clear sweet spot for habit formation.

### What was overstated and got corrected

- **"Two-a-days are absurd volume."** Too strong. Doubles per se aren't the problem — a 2019 *J Appl Physiol* study found doubles (with proper inter-session recovery + carb refuel) improved mitochondrial efficiency vs equivalent single sessions. The specific issue is 75 Hard's *unperiodised daily doubles + no rest days*. Net: doubles fine if placed on easy days within periodisation; not fine as a daily rule.
- **"Daily weigh-in/photo is noise without signal."** Wrong. The weight-loss self-monitoring literature (Steinberg 2015 JAND; VanWormer 2011; Pacanowski 2016 critical review) supports daily weighing — VanWormer found a dose-response, and the WEIGH RCT saw 6.1 kg more loss over 6 months for daily weighers. The athletic-context nuance (glycogen/water swings 1–3 kg) is real, but the correct fix is **daily weight + 7-day rolling average for the actionable signal**, not weekly point reads. Photos weekly is fine — visual change is undetectable day-to-day.
- **"Sleep is the biggest non-training lever."** Direction right, magnitude overstated. Lopes 2023 meta-analysis puts sleep deprivation's effect on endurance at SMD ≈ −0.52 (moderate), 2025 Frontiers review ~0.4% loss per hour awake. Sleep matters; whether it outranks recovery management is not clearly established.
- **"Protein 1.6–2.0 g/kg."** Floor right, ceiling slightly overstated. Morton 2018 BJSM meta-analysis pinned the breakpoint at 1.62 g/kg for FFM gains under resistance training. ISSN 2017 stand notes added protein doesn't improve endurance performance per se — it preserves lean mass under deficit and reduces damage markers. So 1.6 g/kg as floor; push to 1.8–2.0 only during deficit weeks.

### Final framework (what the app should encode)

**Daily (must be possible to log in <60 seconds)**
- Did you execute the prescribed session today? (yes / modified / skipped + why)
- Sleep hours (7+ target, no streak penalty)
- Weight (daily input, 7-day rolling average is the shown signal)
- Hydration heuristic (pale-straw urine check; no volume target)
- Protein intake (target g/kg/day; flag if below floor)
- Mobility/activation done (5–15 min)
- Reading done (10 pages or 20 min)

**Weekly**
- Progress photo (single, optional)
- Strength sessions: 2× completed?
- Adherence rolling % (target ≥85%, no restart)
- Rest/active-recovery days hit?

**Behavioural design rules baked in**
- No restart-on-miss. Continue from where you are.
- Adherence shown as 7-day and 28-day rolling %, with 85% as green threshold (not 100%).
- Streak counter optional/de-emphasised; rolling adherence is the primary metric.
- Daily weight chart shows both daily points AND 7-day rolling average overlay.
- Planned deload weeks visible — rest days during deload don't count against adherence.

---

## Part 2: Deployment decision — Cloudflare Workers + Static Assets

### Path considered

1. PWA on home screen, static-hosted
2. Expo Go (RN, no build)
3. Expo + EAS Build → TestFlight
4. Native SwiftUI sideloaded via Xcode
5. Capacitor
6. No-code (Glide, Adalo, etc.)

### Why PWA wins for this use case

- Time-to-first-install: ~1 day
- No Apple Developer Program ($99/yr) needed for v0
- iOS Home Screen PWAs are exempt from Safari's 7-day ITP storage wipe (per WebKit's tracking-prevention docs)
- Web Push supported on iOS 16.4+
- IndexedDB persists across restarts
- Service workers enable offline
- Single-origin data lock means we just need to pick the production origin from day 1

Footguns mitigated: `navigator.storage.persist()` on first launch + Export-JSON-to-iCloud button to neutralise the "user clears Safari history → data gone" + "lose phone" cases.

### Why Cloudflare Workers (not Pages, not Vercel)

Per Apr 2026 Cloudflare docs + community consensus: **Workers with Static Assets is the new default; Pages is on a slow deprecation glide path.**

- Cloudflare's own migration guide (Apr 2026) recommends new projects start on Workers, not Pages
- Workers Sites is deprecated in Wrangler v4
- All new platform features land on Workers first or only: Secrets Store, Workflows, Containers, Durable Objects, Cron Triggers, Queues, Email Workers, Rate Limiting, full Workers Logs, source maps, gradual deployments
- For static-first projects, migration is a one-line config swap

Stack alignment with existing Jason infra (`jasonm4130-cf` Terraform repo, `Adaptive-Training` monorepo):
- Cloudflare account fully wired via Terraform — Workers, D1, KV, R2 patterns all established
- `endurebyte` D1 + KV namespace already provisioned (candidate for reuse if this is the unfinished fitness project)
- pnpm + Turbo + `apps/web` monorepo shape is the established frontend pattern
- Adaptive-Training already uses `deploy:preview` / `deploy:production` Turbo tasks targeting Workers
- Drizzle ORM is the established D1 ORM in this codebase

### Concrete unlocks for the streak app

1. **One deployment unit.** Static PWA + any future API endpoints (Strava webhook, daily-summary endpoint, backup-sync) ship as a single Worker. No Pages-project + separate Worker split.
2. **Cron Triggers** — Pages can't do these. Free scheduled tasks: daily reminder push, weekly photo nudge, rolling 7-day weight average computation, automated weekly adherence summary.
3. **Native D1 + KV bindings** via `wrangler.toml`. Can reuse the existing `endurebyte` D1 instance for backup/sync, or provision a new `streak` D1.

### Worker config defaults the app needs

- `assets.directory = "./dist"` — built Vite output
- `assets.not_found_handling = "single-page-application"` — SPA routing returns `index.html`
- `assets.run_worker_first = false` — let the edge serve static assets directly; Worker only runs for `/api/*` routes
- Cron triggers added later when sync/notification logic exists

---

## Sources

### Marathon — training structure
- Muniz-Pumares D et al. (2024). Strava marathon analysis, *Sports Medicine* — summary at Outside Online, "Why Easy Is Better than Hard," Nov 2024
- Meeusen R et al. (2013). ECSS/ACSM joint consensus on overtraining syndrome — https://pubmed.ncbi.nlm.nih.gov/23247672/
- Seiler S, Stöggl T (2019). Polarised training, *Frontiers in Physiology*
- Bellinger P (2020). Functional vs non-functional overreaching meta-analysis, *Springer*

### Strength training
- Lauersen JB et al. (2014). "Strength training prevents sports injuries." *BJSM* 48(11). RR 0.338 — https://bjsm.bmj.com/content/48/11/871
- Berryman N et al. (2018). Strength training for middle-/long-distance performance meta-analysis
- Caputo F et al. (2016). Explosive + heavy training improves running economy meta-analysis, *Sports Medicine*

### Sleep / hydration / protein
- Lopes TR et al. (2023). Sleep deprivation & endurance meta-analysis, *Eur J Sport Sci* 23(7):1279–92 — https://onlinelibrary.wiley.com/doi/10.1080/17461391.2022.2155583
- Hew-Butler T et al. (2017). EAH review, *Frontiers in Medicine* 4:21 — https://www.frontiersin.org/articles/10.3389/fmed.2017.00021/full
- IMMDA (2006). Fluid recommendations — https://immda.org/wp-content/uploads/2015/08/Spring-2006-Updated-Fluid-Recommendations.pdf
- Morton RW et al. (2018). Protein supplementation meta-analysis, *BJSM* 52(6):376–84 — https://bjsm.bmj.com/content/52/6/376
- ISSN protein position stand (2017) — https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8

### Adherence / habit formation
- Larimer ME, Palmer RS, Marlatt GA (1999). Relapse Prevention overview — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6760427/
- Lally P et al. (2010). "How are habits formed," *Eur J Soc Psychol*
- Teixeira PJ et al. (2012). SDT and exercise meta-analysis — https://pmc.ncbi.nlm.nih.gov/articles/PMC3441783/
- Steinberg DM et al. (2015). Daily weighing RCT, *JAND* — https://pmc.ncbi.nlm.nih.gov/articles/PMC4380831/
- Pacanowski CR, Bertz F, Levitsky DA (2016). Daily self-weighing critical review — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4846305/

### Deployment
- Migrate from Pages to Workers — https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/ (Apr 2026)
- Static Assets — Cloudflare Workers Docs — https://developers.cloudflare.com/workers/static-assets/
- Wrangler Deprecations — https://developers.cloudflare.com/workers/wrangler/deprecations/ (Mar 2025)
- Workers vs Pages compatibility matrix — https://developers.cloudflare.com/workers/static-assets/compatibility-matrix/
- Pages vs Workers in 2026 Migration Guide — https://dev.to/rickcogley/cloudflare-pages-vs-workers-in-2026-migration-guide-ka7 (Mar 2026)
- WebKit tracking-prevention (PWA home-screen ITP exemption) — https://webkit.org/tracking-prevention/
- WebKit Web Push for iOS Home Screen — https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/

### Citation caveats
- 2023 *J Behavioral Medicine* paper on streak-tracker abandonment was found via secondary citation only — treat as single-source.
- Muniz-Pumares 2024 Strava paper cited primarily through *Outside Online*'s summary, not the original PDF.
