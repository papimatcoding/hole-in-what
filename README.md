# Hole in What?

Mobile-first 2D arcade minigolf built with Phaser + TypeScript.

> **SOURCE OF TRUTH / CHAT HANDOFF — 2026-08-28**
>
> Read this file first when continuing in another chat. Update it after meaningful changes to campaign state, architecture, validation, backend/live ops, beta status or immediate priorities.

## Current state

### Public BETA RC6 — live on `dev`

- Public Pages: `https://papimatcoding.github.io/troll-golf/`
- Pages source: `dev`
- current public **runtime code** head: `1310062e4840642f81b22e6417faa6fc871ccdd4`
- latest runtime promotion: PR #12, **BETA RC6 · modernize in-hole report**
- previous telemetry hotfix: PR #11, **BETA RC6 · preserve shot input kind**
- UX/i18n foundation: PR #8, **BETA UX hotfix · editable fields + ES/EN**
- PR #11 feature smoke: run `33168448479` — **SUCCESS**
- PR #12 feature smoke: run `33168710796` — **SUCCESS**
- PR #11 public Pages: run `33168521414` — **SUCCESS**
- PR #11 public CI: run `33168521423` — **SUCCESS**
- PR #12 public Pages: run `33168834819` — **SUCCESS**
- PR #12 public CI: run `33168834814` — **SUCCESS**
- emergency rollback anchor before RC6 campaign promotion: `8075b162dc2b3e7b73b2fd0d36e6fbc5248120f4`
- maintenance: **OFF**
- backend patch label: **BETA RC6**
- backend build ID: `hole-in-what-beta-rc6`
- live campaign: **Classic 01–13 + HARD 01–05**
- product name: **Hole in What?**

Documentation-only commits may move the `dev` branch SHA beyond the runtime-code SHA above without changing the deployed game code. Do not rename the repository or Pages path during RC6. Legacy `troll-golf-*` localStorage keys intentionally remain stable so existing anonymous beta identity/progression is not reset.

The original RC6 campaign promotion landed as `e90bf9b194044fb7af86a73e282a81bdc3133a9d`. Before the broader independent cohort starts, approved beta-unblock fixes have corrected boot branding, 1–5 post-hole ratings, spoiler-safe HARD previews, editable DOM fields, ES/EN, shot input classification and the in-hole report UX. From here, treat `dev` as the human-validation build rather than an exploratory scratchpad.

### RC6 UX / reporting unblock — MERGED

PR #8 established the shared DOM/i18n layer. PR #11 and PR #12 close two data-quality/testing gaps found while preparing the real cohort.

Current player-facing beta flow includes:

- Player Profile name editing;
- Assistance textarea;
- Community comment/report textareas;
- Results report detail textarea;
- in-hole quick report with explicit category selection + optional textarea + explicit SEND/CLOSE;
- **no browser `window.prompt()` in the active Results or in-hole report flows**;
- persistent **ES / EN** selector in the main menu;
- Spanish default for fresh Spanish/Catalan browser locales and English otherwise;
- translated normal tester flow, including gameplay/tutorial text and the remaining `TOCA` → `TAP` case;
- client-side report guards that close the report panel before awaiting the network request, preventing the obvious same-panel repeat-tap duplicate path.

Artificial checks and public deployment are green. The remaining acceptance gate is **real browser validation on mobile/touch and desktop** because CI cannot prove DOM visibility, focus, keyboard behavior, readable localisation or real browser pointer classification.

## Workflow

**`feature/**` → `dev` (public BETA / human validation) → `main` (official release)**

- `feature/**`: all active development and artificial acceptance. Use technical smoke for normal changes and Full Audit for campaign/simulation/design-affecting work. No public Pages deployment.
- `dev`: public beta. Humans validate real touch/mouse behavior, readability, fun, fairness and forms. Once external cohort testing starts, do not use it as an exploratory scratchpad.
- `main`: official shipped state only. Promote accepted `dev` when content and polish justify a real release.

Any human-discovered problem on `dev` returns to a new `feature/**` branch, passes the relevant artificial gates and is then promoted back to `dev`. There is no normal `release/**` stage; see `docs/release-process.md`.

## Campaign artificial certification — CLOSED

The live 18-hole RC6 campaign is already certified. Do not reopen geometry because of unrelated UX/i18n/telemetry work.

Accepted campaign Full Audit: run `33158002310`.

- **18/18 PASS · 0 REVIEW · 0 BLOCKER** synthetic human model;
- Classic strict solver: 13/13 clean, 0 bypass, 0 no-route;
- HARD strict solver: 5/5 clean, 0 bypass, 0 no-route, 0 warnings;
- authored mechanics / behavior contracts PASS;
- geometry PASS;
- persistent-trap clearance PASS;
- permanent HARD03 RC5→RC5.1 regression PASS;
- originality: **0 structurally similar pairs**.

Key final synthetic metrics:

- C06 touch 86%, casual 77%, tolerance 85%, human 86%, recovery 100%;
- C11 touch 98%, casual 84%, tolerance 75%, human 90%, recovery 100%;
- C12 touch 71%, casual 62%, tolerance 54%, human 65%, recovery 94%;
- H01 touch 95%, casual 82%, tolerance 78%, human 89%, recovery 94%, trap consequence 66%;
- H03 touch 89%, casual 77%, tolerance 72%, human 83%, recovery 100%, trap 80%.

Campaign order remains intentional. C04→C05 and C10→C11 are teaching resets, not automatic balance errors. Human beta may still reject any level. Full history: `docs/campaign-audit-2026-08-28.md` and `docs/campaign-progression.md`.

## Audit policy

Audit is an internal critic, not an oracle. Fast smoke is technical evidence only; only Full Audit may accept/reject campaign design before `dev`.

Current V2 authority:

```bash
FULL_AUDIT=1 npm run audit:courses
npm run audit:human:full
npm run audit:design
npm run audit:originality
```

Core authorities:

- `src/systems/GolfSimulation.ts` — single physics authority;
- `scripts/courseAudit.ts` — strict/adversarial solver;
- `scripts/audit2.ts` — synthetic human execution;
- `scripts/audit2Design.ts` — difficulty/design advice;
- `scripts/courseOriginalityAudit.ts` — structural originality.

Keep the known-bad RC5 HARD03 fixture against accepted RC5.1 permanently so future model calibration cannot regress silently.

> Mathematical solution ≠ synthetic human model ≠ real human validation.

## Audit V3.1 — active shadow work

Separate branch: **`feature/audit-v3`**. Draft PR #7: **Audit V3 · troll cognition + human/map intelligence**. Keep it shadow-only while human calibration is missing; do not merge it solely because RC6 beta is live.

V3 adds blind/curious/suspicious belief agents, HARD bait→consequence→comprehension→mastery reasoning, troll-quality metrics, accidental terminal detection, map intelligence, human/artificial metric fusion and anonymised first-attempt/retry/device/route-cluster aggregates.

### V3.1 consequence look-ahead — SYNTHETIC CALIBRATION ACCEPTED

`feature/audit-v3` contains `scripts/audit3LookAhead.ts` and integrated V3.1 reporting. It compares post-trap agency with a hidden-trap counterfactual and measures second-shot opportunity loss so chained consequences such as H04 can be represented instead of judged only by immediate displacement.

Accepted candidate: `4e61ec0e213c5e8d8bc56077c0f05a619b13fdce`.
Full Audit run `33168040095` / job `98838118811` — **SUCCESS**.
Artifact: `9684761826`.

- adversarial campaign audit: **SUCCESS**;
- Audit 2: **18/18 PASS · 0 REVIEW · 0 BLOCKER**;
- V3.1 shadow: **18/18 PASS · 0 REVIEW · 0 BLOCKER**;
- H03 permanent regression: **PASS**;
- accidental terminal warnings: **0**;
- originality: **0 structurally similar pairs**.

V3 → V3.1 chained-consequence calibration:

| HARD | V3 consequence | V3.1 consequence | Option loss | Troll Score |
| --- | ---: | ---: | ---: | ---: |
| H01 | 62% | 78% | 25% | 83 → 86 |
| H02 | 45% | 64% | 8% | 74 → 77 |
| H03 | 91% | 91% | 53% | 87 → 87 |
| H04 | **15%** | **73%** | 20% | **60 → 71** |
| H05 | 51% | 66% | 11% | 78 → 81 |

This is the desired synthetic calibration shape: H04's known chained consequence is recovered strongly while H01/H02/H05 only move +3 Troll Score and H03 remains unchanged. The old `WEAK_CONSEQUENCE:15%` warning is therefore a proxy limitation, not a geometry defect.

V3.1 remains **shadow-only** until a meaningful human sample can test model-human agreement. Known caveat: the counterfactual currently removes all hidden pop traps on a level instead of isolating one action at a time. The accepted calibration did not show broad score inflation, so this is not a blocker; the future shared declarative Trigger → Action engine should enable trap-specific counterfactuals.

Next cognition work: **memory / learning across attempts** — verify that a failed first read changes the next choice and that mastery becomes reliably executable after the joke is understood.

## Physics authority

`src/systems/GolfSimulation.ts` is the single physics authority for campaign, audits and Community Maps. Phaser owns rendering/input/audio/haptics/FX and must not implement a second gameplay physics model.

Core constants currently include ball radius 13, max pull 172, power 7.4, grass friction 0.9875, ice friction 0.9982, sand friction 0.955 and stop speed 18. Procedural generation is tooling only, never campaign fallback content.

## Anonymous beta telemetry

Detailed contract: `docs/beta-telemetry.md`.

### Current RC6 snapshot

Alias `Matkiller` personal/self-test data:

- **33 attempts**;
- **10 completed attempts**;
- **49 shots**;
- **10 completed run rows**;
- **8 level-feedback rows**;
- **1 game-feedback row**.

There is also one **anonymous session outside alias `Matkiller`**. Do not assume it is an independent external tester; it may simply be another browser/session until provenance is known.

That session currently provides one useful integrity smoke:

- desktop / non-coarse pointer classification;
- Classic 01, first attempt;
- completed in **4 strokes / 44.371 s / 1★ / 0 voids**;
- `beta_attempts` completion values and the parallel `beta_runs` row agree;
- **4 shot rows** are linked to the attempt;
- no level/game feedback.

Exclude `Matkiller` when calibrating against independent external players unless developer/self-test behavior is intentionally being studied.

### Input-kind data-quality fix

All telemetry shots recorded **before PR #11** in the currently queried RC6 dataset are `input_kind = unknown` (49 Matkiller shots + the 4-shot anonymous desktop session). Therefore those historical rows cannot support touch-vs-mouse conclusions.

PR #11 now adds a client fallback that:

1. preserves Phaser's supplied `touch` / `mouse` / `pen` kind when available;
2. otherwise remembers the latest real browser pointer event type;
3. only then falls back to coarse-device classification (`touch`) or desktop (`mouse`).

The fix keeps the same RC6 build ID. Its human acceptance test is still pending: make at least one **new desktop shot** and one **new mobile/touch shot** on the public build and query Supabase to confirm `mouse` / `touch`, not `unknown`.

### Exact telemetry linkage

The client generates one anonymous attempt UUID per level attempt.

- `beta_attempts.attempt_id` is the attempt authority;
- every `beta_shots` row stores that `attempt_id` directly;
- completed/abandoned summary state is written back to the same `beta_attempts` row;
- `beta_runs` is a parallel completed-result record used for leaderboard/result aggregates.

**Important:** `beta_runs` currently has **no `attempt_id` column**. The run upload sends an `attemptId` to the Edge Function, but that ID is currently used to update the completed attempt row rather than being persisted on `beta_runs`.

Do not describe the database as a literal `attempt → shots → run` foreign-key chain. Direct traceability is currently **attempt ↔ shots**, plus completed-attempt summary and a parallel run record. If future analysis genuinely needs exact run-row linkage, add it deliberately through a reviewed Supabase schema/function change instead of assuming it already exists.

Uploads are best-effort/asynchronous and must never block gameplay. Do not collect physical pointer/finger trajectories.

### Personal-smoke qualitative signal — not cohort evidence

The current self-test game survey says overall fun 3/5, controls 4/5, variety 2/5, difficulty curve 3/5, HARD 3/5, would keep playing yes, favourite H05, worst C11, and asks for **more levels / more variety**.

Treat this as useful owner smoke, not balance authority. Do not redesign C11 or the campaign from one developer row; meaningful external human evidence is still missing.

### Report duplicate history and current mitigation

The older personal smoke produced four `troll-05` report rows in two near-simultaneous pairs (`bug` ×2 and `object` ×2). Those rows predate the current reporting flows.

Now both active reporting routes reduce the obvious accidental duplicate path:

- Results report destroys/closes its panel before awaiting the network request;
- PR #12 in-hole report has explicit category selection, optional textarea, a submitting/closed guard and closes before awaiting the network request.

The Supabase report endpoint still has **no request-id/idempotency key**, so server-side exact duplicate protection does not exist. Do not add backend schema/function complexity unless a duplicate is reproducible on the current public build.

Human acceptance: send exactly one in-hole report on current RC6 and confirm exactly one `beta_reports` row arrives.

## Community Maps

Current supported loop:

**Editor → explicit draft → playtest → publish → discover → play → rate/comment/report**

Editing invalidates old playtest certification. Creator self-rating is blocked and creator deletion is server-validated. Do not expand to multi-hole community courses until the current loop survives real multi-user beta.

The public UX specifically needs human verification that Community comment and report DOM textareas are visible, focusable and writable on real touch and desktop browsers.

## HARD design principles

A good troll trap:

1. makes an obvious read attractive;
2. surprises a first attempt;
3. is deterministic and understandable afterwards;
4. changes the failed/learned route;
5. leaves a fair learned answer;
6. rewards knowledge more than pixel precision;
7. creates “qué cabrón”, not “esto es random”.

Never spoil HARD solutions in selectors, previews, tutorials, Patch Notes or translation strings. Player previews show only start-visible geometry; latent traps and trap metadata stay hidden.

## Immediate next steps — resume here

1. **Human-smoke public runtime `1310062e…` on mobile/touch first.** Verify Profile name editing, on-screen keyboard, Assistance textarea, Community comment/report fields, Results report detail field, **in-hole quick-report category + textarea + SEND**, no browser prompt, ES/EN switching + persistence, `TOCA`/`TAP`, readable English and spoiler-safe HARD previews.
2. Repeat the critical UI/form checks on a **desktop browser**.
3. Make at least one new gameplay shot on each device class; query Supabase and verify `input_kind = touch` on mobile and `input_kind = mouse` on desktop rather than `unknown`.
4. During the smoke, send exactly **one** in-hole test report and one other editable-text submission. Query Supabase and verify exactly one expected row arrives per action.
5. Re-check telemetry: attempt start → shots → attempt completion/abandon; confirm attempt UUID linkage in `beta_attempts`/`beta_shots` and completed summary/run consistency.
6. If mobile + desktop smoke are green, share the same public beta URL with the broader independent/PlayMyGame cohort. Keep **BETA RC6 / `hole-in-what-beta-rc6`** so the cohort remains one dataset.
7. Watch external completion/abandonment, first-attempt vs retry lift, strokes/time, touch-vs-mouse gaps, route clusters, level ratings and qualitative comments. Exclude `Matkiller` from external calibration.
8. Any human-discovered problem on public `dev` returns to a new `feature/**` branch; do not exploratory-fix live `dev` once external testing is active.
9. Keep V3.1 shadow-only and use the RC6 human sample to test its consequence/learning assumptions. The next synthetic development target is memory across attempts, not another H04 geometry edit.
10. After RC6 evidence is reviewed, author the next **small** Classic/HARD content batch with stronger mechanic/visual variety instead of a huge content dump. Promote accepted `dev` to `main` only when content and polish justify an official release.
