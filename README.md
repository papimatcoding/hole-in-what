# Hole in What?

Mobile-first 2D arcade minigolf built with Phaser + TypeScript.

> **SOURCE OF TRUTH / CHAT HANDOFF — 2026-08-28**
>
> Read this file first when continuing in another chat. Update it after meaningful changes to campaign state, architecture, validation, backend/live ops, beta status or immediate priorities.

## Current state

### Public BETA RC6 — live on `dev`

- Public Pages: `https://papimatcoding.github.io/troll-golf/`
- Pages source: `dev`
- current public `dev` HEAD: `9816d0044f8acb4f01b8d850544c0eb7caf39d94`
- current promotion: PR #8, **BETA UX hotfix · editable fields + ES/EN**
- post-merge `dev` CI: run `33167542495` — **SUCCESS**
- post-merge Pages deploy: run `33167542462` — **SUCCESS**
- previous pre-UX docs/runtime head: `a87ef6d080f0023d918f36a9f726a082ef1a2763`
- emergency rollback anchor before RC6 campaign promotion: `8075b162dc2b3e7b73b2fd0d36e6fbc5248120f4`
- maintenance: **OFF**
- backend patch label: **BETA RC6**
- backend build ID: `hole-in-what-beta-rc6`
- live campaign: **Classic 01–13 + HARD 01–05**
- product name: **Hole in What?**

Do not rename the repository or Pages path during RC6. Legacy `troll-golf-*` localStorage keys intentionally remain stable so existing anonymous beta identity/progression is not reset.

The original RC6 campaign promotion landed as `e90bf9b194044fb7af86a73e282a81bdc3133a9d`. Before the independent cohort started, approved direct-`dev` hotfixes corrected boot branding, expanded post-hole originality/difficulty ratings to true 1–5 controls and made HARD previews spoiler-safe. After that pre-cohort exception, use the normal feature flow again.

### RC6 UX/i18n unblock — MERGED

PR #8 is now on public `dev`. It was presentation/UI-only and did not change campaign geometry, physics, save schema, Supabase schema or beta build ID.

It adds/fixes:

- the shared Phaser DOM-overlay alignment problem affecting editable player-facing fields;
- Player Profile name editing;
- Assistance textarea;
- Community comment/report textareas;
- result/report detail textarea instead of a browser prompt in the active Results flow;
- persistent **ES / EN** selector in the main menu;
- Spanish default for fresh Spanish/Catalan browser locales and English otherwise;
- translated normal external-tester flow: menu, campaign navigation/objectives, gameplay onboarding/tutorials, results/feedback, profile/support, global survey and Community browsing/play/comments/reports.

Artificial checks and deployment are green. The remaining acceptance gate for this change is **real browser validation on mobile/touch and desktop** because CI cannot prove DOM visibility, focus, keyboard behavior or readable localisation.

## Official workflow — CLOSED

**`feature/**` → `dev` (public BETA / human validation) → `main` (official release)**

### `feature/**`

All active development and artificial acceptance happen here.

- implement/fix levels, mechanics, UI, telemetry and internal tooling;
- technical smoke for normal changes;
- Full Audit for campaign/simulation/design-affecting work;
- no human pre-merge gate;
- no public Pages deployment.

### `dev`

Public developer/beta build and Pages source.

- receives feature work after artificial checks pass;
- humans validate real touch/mouse behavior, readability, fun, fairness and forms;
- telemetry + qualitative feedback expose failures artificial models cannot prove;
- once external cohort testing starts, do not use `dev` as an exploratory scratchpad.

If humans find an issue on `dev`, create a **new `feature/**` fix**, pass the relevant artificial gates, then promote it back to `dev`.

### `main`

Official shipped state only. Promote accepted `dev` when content and polish are sufficient for a real release. There is no normal `release/**` stage. See `docs/release-process.md`.

## Campaign artificial certification — CLOSED

The live 18-hole RC6 campaign is already certified. Do not reopen geometry because of unrelated UX/i18n work.

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

Campaign order remains intentional. C04→C05 and C10→C11 are teaching resets, not automatic balance errors. Human beta may still reject any level.

Full history: `docs/campaign-audit-2026-08-28.md` and `docs/campaign-progression.md`.

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

Permanent rule: keep the known-bad RC5 HARD03 fixture against accepted RC5.1 so future model calibration cannot regress silently.

> Mathematical solution ≠ synthetic human model ≠ real human validation.

## Audit V3 — active internal model work

Separate branch: **`feature/audit-v3`**. Draft PR #7: **Audit V3 · troll cognition + human/map intelligence**. Keep it in shadow mode while calibration continues.

V3 adds:

- blind / curious / suspicious belief agents without privileged `designPath` or hidden-trigger knowledge;
- HARD lifecycle reasoning: bait → consequence → comprehension → mastery;
- bait strength, consequence, causal clarity, learned fairness, bypass resistance, trap originality, knowledge-gain potential and advisory Troll Score;
- tooling-only troll intent (`soft`, `hard`, `terminal`);
- possible accidental terminal/softlock detection;
- map intelligence: visible/hazard/hidden footprint, connectivity, spatial entropy, symmetry, density/layout context and structural-neighbour similarity;
- human/artificial metric fusion where synthetic execution is a prior and real beta evidence increasingly dominates with sample size;
- explicit model-vs-human disagreement as a diagnostic;
- anonymised beta aggregates including first attempt vs retry, mobile vs desktop and coarse first-shot route clusters.

First full V3 shadow calibration: run `33164327421` — **SUCCESS**.

- **18/18 PASS · 0 REVIEW · 0 BLOCKER** inherited from certified V2;
- no accidental terminal states;
- no structurally similar map pairs;
- HARD advisory scores: H01 83, H02 74, H03 87, H04 60, H05 78;
- H04 emitted `WEAK_CONSEQUENCE:15%`, currently treated as a **model limitation**, not a geometry defect: H04 has chained consequence and V3 currently overweights immediate post-trigger displacement.

Next V3 calibration work: **consequence look-ahead / chained-state reasoning**, then memory across attempts. Longer-term enabling architecture: a shared declarative **Trigger → Action** world-state engine consumed by runtime and Audit V3.

Do not alter H04 geometry merely to satisfy the current V3 proxy.

## Physics authority

`src/systems/GolfSimulation.ts` is the single physics authority for campaign, audits and Community Maps. Phaser owns rendering/input/audio/haptics/FX and must not implement a second gameplay physics model.

Core constants currently include ball radius 13, max pull 172, power 7.4, grass friction 0.9875, ice friction 0.9982, sand friction 0.955 and stop speed 18.

Procedural generation is tooling only, never campaign fallback content.

## Anonymous beta telemetry

Detailed contract: `docs/beta-telemetry.md`.

Current RC6 personal smoke snapshot in Supabase, all from alias `Matkiller`:

- **33 attempts**;
- **10 completed attempts**;
- **49 shots**;
- **10 completed run rows**;
- **8 level-feedback rows**;
- **1 game-feedback row**;
- no independent external tester with RC6 gameplay activity at the latest query.

Exclude `Matkiller` when calibrating against independent external players unless developer/self-test behavior is intentionally being studied.

### Telemetry linkage — exact contract

The client generates one anonymous attempt UUID per level attempt.

- `beta_attempts.attempt_id` is the attempt authority;
- every `beta_shots` row stores that `attempt_id` directly;
- completed/abandoned summary state is written back to the same `beta_attempts` row;
- `beta_runs` is a parallel completed-result record used for leaderboard/result aggregates.

**Important correction:** `beta_runs` currently has **no `attempt_id` column**, so it is not directly FK/key-linked to `beta_attempts`. The run upload sends an `attemptId` to the Edge Function, but that ID is currently used to update the completed attempt row rather than being persisted on `beta_runs`.

Therefore do not describe the database contract as a literal `attempt → shots → run` foreign-key chain. Direct traceability is currently **attempt ↔ shots**, plus completed-attempt summary and a parallel run record. If a future analysis genuinely needs exact run-row linkage, add it deliberately through a reviewed Supabase schema/function change instead of assuming it already exists.

Uploads are best-effort/asynchronous and must never block gameplay. Do not collect physical pointer/finger trajectories.

### Personal-smoke qualitative signal — not cohort evidence

The current self-test game survey says:

- overall fun 3/5;
- controls 4/5;
- variety 2/5;
- difficulty curve 3/5;
- HARD 3/5;
- would keep playing: yes;
- favourite: H05;
- worst: C11;
- idea: **more levels / more variety**.

Treat this as useful owner smoke, not balance authority. Do not redesign C11 or the campaign from one developer row; external human evidence is still missing.

### Report duplicate observation

The personal smoke produced four `troll-05` report rows in two near-simultaneous pairs (`bug` ×2 and `object` ×2). These rows predate the PR #8 public head.

Current Results report code closes/destroys its report panel synchronously before awaiting the network request, so the obvious double-tap path is reduced in the deployed version. However the backend report endpoint has no request-id/idempotency key, so exact server-side duplicate protection does not currently exist.

Before changing backend schema, re-test one report on the current public PR #8 build and confirm whether exactly one row arrives. If duplicates still reproduce, fix them on a fresh `feature/**` branch and prefer an explicit idempotency design rather than data cleanup after the fact.

## Community Maps

Current supported loop:

**Editor → explicit draft → playtest → publish → discover → play → rate/comment/report**

Editing invalidates old playtest certification. Creator self-rating is blocked and creator deletion is server-validated. Do not expand to multi-hole community courses until the current loop survives real multi-user beta.

The current public UX specifically needs human verification that Community comment and report DOM textareas are visible, focusable and writable on real touch and desktop browsers.

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

1. **Human-smoke the current public Pages head `9816d004…` on mobile/touch first.** Verify Profile name editing, on-screen keyboard, Assistance textarea, Community comment/report fields, Results report detail field, no browser `prompt()` in the normal tester flow, ES/EN switching + persistence, readable English and spoiler-safe HARD previews.
2. Repeat the critical UI/form checks on a **desktop browser**.
3. During that smoke, send exactly one test report and one editable-text submission. Then query Supabase and verify exactly one expected row arrives per action.
4. Re-check RC6 telemetry after the smoke: attempt start → shots → attempt completion/abandon; confirm attempt UUID linkage in `beta_attempts`/`beta_shots` and completed summary integrity.
5. If mobile + desktop smoke are green, share the same public beta URL with the broader independent/PlayMyGame cohort. Keep **BETA RC6 / `hole-in-what-beta-rc6`** so the cohort remains one dataset.
6. Watch external completion/abandonment, first-attempt vs retry lift, strokes/time, touch-vs-mouse gaps, route clusters, level ratings and qualitative comments. Exclude `Matkiller` from external calibration.
7. Any human-discovered problem on public `dev` returns to a new `feature/**` branch; do not exploratory-fix live `dev` once external testing is active.
8. In parallel, continue **Audit V3 consequence look-ahead**, especially chained consequence on H04. Keep V3 shadow-only until calibrated against real players.
9. After the RC6 evidence is reviewed, author the next **small** Classic/HARD content batch with stronger mechanic/visual variety instead of a huge content dump.
10. Promote accepted `dev` to `main` only when content and polish justify an official release.
