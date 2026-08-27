# Troll Golf

Mobile-first 2D arcade minigolf built with Phaser + TypeScript. Current priority is **core shot + authored campaign + HARD troll identity + real beta evidence**, not metagame expansion.

> **SOURCE OF TRUTH / CHAT HANDOFF — Last updated 2026-08-27 after Friends Beta RC2 (`245618d`) + `beta-feedback` Edge Function v5**
>
> If development continues in another chat/session, read this file before changing campaign architecture, beta systems or priorities. The exact resume point is in **Immediate next steps**. Keep this README updated whenever state, priorities, risks, architecture or next actions change.

## Play / branches

- Friends beta / GitHub Pages: https://papimatcoding.github.io/troll-golf/
- `main`: stable history.
- `dev`: active development and Pages beta deploy.
- Pages deploy through **GitHub Actions**.
- Vite base: `/troll-golf/`.

## CURRENT STATE — important

### FRIENDS BETA: GO

Friends are actively testing the first external-beta vertical slice.

Current slice:

- **10 authored Classic holes**
- **5 authored HARD/Troll holes**
- shared pure-TypeScript physics
- automated geometry/clearance/solver/originality audits
- anonymous beta telemetry
- per-level survey + global survey
- remote bug/map reports that can be submitted **before completing a hole**
- approximate live player count
- remotely configurable maintenance screen
- Community Maps MVP

### Technical certification

Current gameplay remains certified:

- latest normal CI after RC2: **green**;
- latest Pages build/deploy after RC2: **green**;
- typecheck/build/hole physics/mechanic integrity/geometry/clearance all pass;
- originality audit flags **0 structurally similar pairs**;
- fast campaign audit: **Classic 10/10 clean**;
- fast campaign audit: **Troll 5/5 clean**;
- Full Audit (`FULL_AUDIT=1`): **Classic 10/10 clean**;
- Full Audit (`FULL_AUDIT=1`): **Troll 5/5 clean**;
- no certified long-solver level is `TOO_EASY_FOR_TARGET`, `MECHANIC_BYPASSED` or `NO_ROUTE_FOUND`;
- RC2 changes are input/UI/telemetry/live-ops only and do **not** alter authored geometry or shared golf physics, so the previous Full Audit remains valid.

### Latest authored certification fixes

The first Full Audit exposed three real mechanic bypasses that the fast probe missed:

1. **Classic 05** — old outer-bank HIO skipped the first bumper. Current elite HIO uses the bumper.
2. **Classic 10** — old two-stroke route skipped the chapter-exam bumper. Current mastery route uses it.
3. **Troll 05** — old optimal route ignored the moving crossing. Current best route uses the moving mechanic and still triggers the intended troll sequence.

Representative Full Audit results:

- Classic 05: best 1, HIO yes, bumper used yes, difficulty 24.5, status OK;
- Classic 09: best 2, HIO no, sand used yes, difficulty 35.9, status OK;
- Classic 10: best 2, blind 3, bumper used yes, difficulty 36.6, status OK;
- Troll 05: best 2, blind 3, moving used yes, trap triggered yes, difficulty 48.8, status OK.

Do not redesign Classic 05 simply to remove its intentional difficulty dip after Classic 04. Human data decides whether that breather works.

## Friends Beta RC2 — current patch

Friends Beta RC1 exposed beta-UX/telemetry issues before enough campaign evidence existed. RC2 addresses them without changing course geometry.

### HARD / touch-input issue

The project owner reported that HARD 01–03 could become impossible to shoot on their device.

Evidence says this is **not a universal geometry/physics failure**:

- another tester successfully completed HARD 01 in 2 strokes on RC1;
- the reporting tester had previously completed HARD 03 and HARD 04;
- automated physics/clearance/solver checks remain green.

Treat it as an input/touch/tutorial problem until RC2 evidence says otherwise.

RC2 protections:

- ball touch-grab radius increased from **62 → 88 design px**;
- stale near-zero `moving` state is defensively released before a new shot;
- HARD no longer shows mechanic tutorial cards that can block/spoil the first shot;
- gameplay navigation buttons have larger hit areas;
- a visible `⚑ REPORTAR` action exists **inside the hole**, so a broken/unfinishable map can still be reported.

Do not redesign HARD 01–03 blindly. First verify RC2 on the affected mobile device(s) and collect reports.

### Reporting before completion

`src/systems/BetaReportOverlay.ts` provides a reusable report overlay.

From inside campaign gameplay, testers can report the current level without completing it. Categories:

- bug
- too easy
- too hard
- repetitive
- unnecessary object/map issue
- other + optional note

Reports are written remotely to `beta_reports` through the `beta-feedback` Edge Function and also retained in local storage as fallback.

### Better telemetry

Friends-beta build ID is now:

- **`beta-block-1-friends-rc2`**

RC1 and RC2 must be analysed separately.

RC2 also fixes telemetry quality:

- `BetaTelemetry.beginAttempt()` now runs when the gameplay scene starts, not after finishing;
- each completed run now sends actual `mechanics_used` from `GolfSimulation.state.touchedMechanics`;
- actual `traps_triggered` is sent;
- actual void count is sent;
- retries/prev/next that reopen gameplay increment the attempt counter before the run.

Abandoned runs are still not inserted as explicit incomplete `beta_runs`, so `attempts` is improved but still not a perfect abandonment metric.

## Live players / presence

RC2 adds approximate live presence.

Backend table:

- `beta_presence`

Client behavior:

- heartbeat approximately every **30 seconds** while the tab is visible;
- a tester counts as online when their last heartbeat is within roughly **75 seconds**;
- the menu shows `● N ONLINE`;
- the count is approximate, not a websocket-perfect concurrent-player count;
- presence includes current scene for future aggregate analysis.

The heartbeat uses the same anonymous tester UUID as beta telemetry.

## Maintenance / live ops

RC2 introduces a remotely controlled maintenance flow so testers do not interpret a deploy/patch as a broken game.

Backend table:

- `app_status`

Important fields:

- `maintenance` — boolean
- `patch_label` — human-readable patch name
- `eta_text` — human-readable ETA, e.g. `10–15 min`
- `message` — maintenance explanation
- `updated_at`

Runtime:

- `src/scenes/BootScene.ts` checks remote status before opening the menu;
- `src/scenes/MaintenanceScene.ts` shows patch label, message, ETA and a large retry button;
- maintenance screen auto-checks roughly every 15 seconds;
- `src/systems/LiveOpsSystem.ts` also sees maintenance changes during an open session through presence heartbeats;
- `beta-feedback` Edge Function v5 serves `status` and `presence` in addition to normal telemetry/report actions.

### Required patch protocol from now on

For any patch likely to affect the live Pages build:

1. set `app_status.maintenance = true` **before** deploying;
2. set an honest `patch_label`, `message` and `eta_text`;
3. deploy the patch to `dev` / Pages;
4. wait for CI and Pages deploy to be green;
5. perform the required smoke check;
6. set `maintenance = false` when the build is safe;
7. update this README with the new patch state.

Do not invent overly precise ETAs. If timing is uncertain, use a broad human-readable estimate.

Current maintenance state after RC2: **OFF**.

## Early Friends Beta feedback snapshot — RC1

Snapshot source: `build_id = beta-block-1-friends-rc1` before RC2 input/telemetry fixes.

### Tester volume

Five tester identities had been seen by the backend at the snapshot. Four had submitted level ratings.

Rating contribution:

- `Matkiller`: **9** level ratings, average fun 2.33, originality 3.00, difficulty 2.11, 1 BUG tag;
- `CuloConCaca`: **3** ratings, average fun 1.33, originality 2.33, difficulty 1.67;
- anonymous tester A: **1** rating, fun 3;
- anonymous tester B: **1** rating, fun 5;
- `neegy` had registered/visited but had not submitted level feedback at this snapshot.

This means RC1 evidence is **heavily concentrated in one tester**. Do not treat raw averages as consensus yet.

### Per-level RC1 signal

Very small sample sizes:

- Classic 01: n=3, avg fun **2.67**, originality 2.33, difficulty 2.33;
- Classic 02: n=2, avg fun **1.50**, originality 3.00, difficulty 2.00;
- Classic 03: n=2, avg fun **2.00**, originality 3.00, difficulty 3.00;
- Classic 04: n=1, fun 3;
- Classic 05: n=1, fun 3;
- Classic 06: n=1, fun 3, difficulty 1;
- Classic 07: n=1, fun 2, difficulty 1;
- Troll 01: n=1, fun 3, difficulty 1, surprise 3;
- **Troll 03: n=1, fun 1, BUG tag present**;
- Troll 04: n=1, fun 3, difficulty 3, **surprise 5**.

Run variance reinforces an onboarding/input hypothesis: Classic 01 was completed by different testers anywhere from roughly **1 stroke / 4.5 s** to **6 strokes / 44.8 s**.

Interpretation for the next chat:

- the strongest concrete RC1 signal is the reported HARD/Troll 03 bug/input problem;
- Classic 02–03 look weak in fun, but n is far too small for a redesign decision;
- Classic 01 has extreme performance/opinion variance, suggesting controls/onboarding/device differences may be confounding level quality;
- Troll 04 produced the desired `ME PILLÓ` reaction in the one available rating;
- there was **no global survey response yet** at this snapshot;
- `beta_reports` had no RC1 rows because the remote report path was only fixed at the end of RC1; RC2 is the first reliable remote-report cohort;
- RC1 `mechanics_used` / `traps_triggered` arrays were empty because Results did not forward simulation state. RC2 fixes this.

Do **not** rebuild Classic 01–03 from RC1 alone. Compare with RC2 after the input fixes and wait for more independent testers.

## Core design rules

### Classic

Every hole needs a different silhouette **and** strategic question. Mirrors, trivial rotations or “same layout + different mechanic” do not count as original levels.

Difficulty should broadly rise. Small breathers are fine; large unexplained inversions are not. Introduce mechanics with room to learn and reuse them differently. Early HIOs may be accessible; later HIOs should normally be narrow mastery lines rather than obvious highways. Gameplay objects must affect decisions.

Block-1 teaching plan:

1. control / comfortable HIO
2. first bank
3. route choice
4. setup shot
5. first bumper
6. bumper used differently
7. geometry exam
8. first sand
9. sand as route choice
10. chapter exam using known rules

### HARD / Troll

HARD is the main differentiator and must troll from hole 1.

A good trap:

1. makes the obvious first read attractive;
2. surprises;
3. is deterministic and understandable afterwards;
4. leaves a fair learned route;
5. creates “qué cabrón”, not “esto es random”.

Current vocabulary stays deliberately small and composable: pop wall, surprise bumper, disappearing floor/void, cross-gate, false safe lane, rebound punishment and combinations.

Level Select must not spoil HARD traps. HARD gameplay should also avoid tutorial cards that pre-explain the surprise.

## Architecture

### Physics authority

`src/systems/GolfSimulation.ts` is the single gameplay-physics authority.

It owns launch/friction, bounds/walls, triangles/curves, bumpers, sand/ice, boosters/fans, portals, moving objects, ramps/trampolines, void, pop traps and cup sweep/lip/sink logic.

Gameplay, audits and Community Maps share this simulation. Phaser mainly owns input/render/audio/haptics/FX. **Do not reintroduce a second auditor physics implementation.**

### Main runtime

- `src/scenes/BootScene.ts` — remote status gate
- `src/scenes/MaintenanceScene.ts` — patch/ETA maintenance UX
- `src/scenes/MenuScene.ts` — menu + online counter
- `src/scenes/GameplayScene.ts` — campaign gameplay + in-hole reports
- `src/scenes/ResultsScene.ts` — results/surveys/ranking
- `src/systems/LiveOpsSystem.ts` — presence + live maintenance checks
- `src/systems/BetaTelemetrySystem.ts` — beta identity/runs/feedback API
- `src/systems/BetaReportOverlay.ts` — report-before-completion overlay
- `src/systems/CourseRenderer.ts` — course drawing/dynamic visuals
- `src/data/campaign.ts` — player-facing authored campaign
- `src/data/authored/classic.ts` — Classic authored holes
- `src/data/authored/hard.ts` — HARD authored holes
- `src/systems/SaveSystem.ts` — progress/cosmetics/wallet

Do not restart the removed `GameScene -> V8 -> V81 -> V82` patch-inheritance pattern.

### Procedural status

Procedural generation is internal prototyping/tooling only. It must not choose player-facing campaign levels or silently replace missing authored content.

## Validation pipeline

Normal CI:

```bash
npm run typecheck
npm run build
npm run test:hole
npm run test:mechanics
npm run test:geometry
npm run test:clearance
npm run audit:courses
npm run audit:originality
```

Long block certification:

```bash
FULL_AUDIT=1 npm run audit:courses
```

`.github/workflows/full-audit.yml` runs mechanic integrity, geometry and clearance before the expensive long solver.

Solver = critic, not designer. Never lower star targets just to turn warnings green.

## Stars

- 1★ = complete
- 2★ = solid strokes
- 3★ = realistic mastery/par
- time is a separate record

Targets are authored per level.

## Beta backend

Supabase project: **Troll Golf** (`xtekdrkqgfjnnwawyoim`). Never commit service-role/admin secrets.

Beta tables:

- `beta_testers`
- `beta_runs`
- `beta_level_feedback`
- `beta_game_feedback`
- `beta_reports`
- `beta_presence`
- `app_status`

Tester identity is a persistent anonymous browser UUID.

The beta tables intentionally use RLS with no direct browser policies; browser clients go through Edge Functions.

## Community Maps MVP

Backend tables:

- `community_maps`
- `community_map_runs`
- `community_map_feedback`

Edge Function: `community-maps`.

Flow: Editor draft → publish → browse newest/top → play using shared simulation → rate fun/originality/difficulty. Creator self-rating is blocked in API/database, one tester gets one rating per map.

Security/performance cleanup already done:

- `prevent_creator_community_rating()` has explicit safe `search_path`;
- covering indexes exist for Community Maps tester/creator foreign keys.

Still absent deliberately: accounts/social profiles, comments/follows, full moderation, search/tags/pagination, rich thumbnails, automatic campaign promotion and private review dashboard.

## Private DEV zone

**Not implemented yet.** It requires backend authorization, not a hidden frontend password.

Build it only when enough real feedback/community data exists. Intended functions: aggregate feedback, inspect reports by build+level, trends, top Community Maps and promotion/rejection actions.

## Known non-blockers

- bundle warning remains around ~1.5 MB minified / ~395 kB gzip;
- RC2 attempt count is improved but explicit abandoned-run rows are still absent;
- Classic difficulty/fun still needs more independent human data;
- HARD will eventually need additional deterministic troll primitives;
- Community play is intentionally more minimal than campaign play.

## Things deliberately NOT being built now

Do not spend this milestone on multiplayer, ranked/MMR, player-facing smart bots, battle pass/seasons, Daily Hole, ads, lootboxes, extra currencies, more shop screens or a large account system.

## Immediate next steps — resume here

**FRIENDS BETA RC2 IS LIVE. Do not author block 2 or redesign the campaign from the tiny RC1 sample.**

1. Ask current friends to **reload the Pages build** so they are actually on `beta-block-1-friends-rc2`.
2. Re-test HARD 01, 02 and 03 specifically on the device(s) where shooting failed. If anything still blocks play, use the new in-hole `⚑ REPORTAR` immediately.
3. Confirm new `beta_reports` rows arrive remotely from in-hole reports.
4. Confirm new RC2 `beta_runs` contain non-empty `mechanics_used` / `traps_triggered` when those mechanics/traps are actually touched.
5. Collect more independent RC2 ratings before redesigning Classic 01–03. Compare RC1 vs RC2 because input changes are a major confounder.
6. Watch whether Classic 02–03 remain low-fun once controls work reliably; only then consider rebuilding them.
7. Watch Troll 03 reports closely; it is the first HARD level with a concrete RC1 BUG signal.
8. Keep Troll 04’s strong surprise signal in mind, but wait for more than one tester.
9. Use the maintenance protocol for the **next** live patch.
10. Validate Community Maps end-to-end with a few testers after the current campaign/input issues settle.
11. Build the secure DEV/review dashboard only once enough feedback exists.
12. Author block 2 only when block 1 is genuinely strong.

## Development principle

**Author deliberately → audit adversarially → play manually → test with humans → curate → approve.**
