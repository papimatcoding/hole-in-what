# Hole in What?

Mobile-first 2D arcade minigolf built with Phaser + TypeScript.

> **SOURCE OF TRUTH / CHAT HANDOFF — 2026-08-28**
>
> Read this file first when continuing in another chat. Update it after meaningful changes to campaign state, architecture, validation, backend/live ops, beta status or immediate priorities.

## Current state

### Public BETA RC6 — live on `dev`

- Public Pages: `https://papimatcoding.github.io/troll-golf/`
- Pages source: `dev`
- current `dev` HEAD before the UX/i18n candidate: `a87ef6d080f0023d918f36a9f726a082ef1a2763`
- latest live runtime hotfix code before that docs head: `e4419d9fcc234986b0ece7526321083c6ece704c`
- previous known-good / emergency rollback anchor: `8075b162dc2b3e7b73b2fd0d36e6fbc5248120f4`
- maintenance: **OFF**
- backend patch label: **BETA RC6**
- backend build ID: `hole-in-what-beta-rc6`
- live campaign: **Classic 01–13 + HARD 01–05**
- product name: **Hole in What?**

Do not rename the repository or Pages path during RC6. Legacy `troll-golf-*` localStorage keys intentionally remain stable so existing beta identity/progression is not reset.

The original RC6 campaign promotion landed as `e90bf9b194044fb7af86a73e282a81bdc3133a9d`. Before the independent cohort started, explicitly approved direct-`dev` hotfixes corrected boot branding, expanded post-hole originality/difficulty ratings to true 1–5 controls, and made HARD previews spoiler-safe with a direct MENU exit plus separate EDITOR action. After that exception, use the normal feature flow again.

### Active beta UX/i18n candidate

Current branch: **`feature/beta-input-i18n`**, created from `dev` `a87ef6d…`.

Purpose: remove two blockers before sharing RC6 with a broader international tester cohort.

1. **Editable in-game text fields.** The name input, Community comment editor, support textarea and report-detail textareas already existed as Phaser DOM elements, but the page CSS was centering/padding the canvas independently of Phaser's absolute DOM overlay. The candidate removes that competing flex/padding layout and makes Phaser ScaleManager the sole canvas + DOM positioning authority. This is a root fix for the whole form family rather than separate per-scene hacks.
2. **Spanish / English player UI.** A persistent `ES / EN` selector is now in the main menu. First visit defaults Spanish for Spanish/Catalan browser locales and English otherwise; an explicit user choice is stored under the legacy-compatible `troll-golf-language` key. The translation layer covers the normal external-tester path: menu, campaign navigation/objectives, gameplay onboarding and mechanic tutorials, results/post-hole feedback, profile/support, global survey and Community browsing/play/comments/reports. Developer-only authoring surfaces may remain Spanish until they become a public-player requirement.

Implementation is deliberately presentation-only: no campaign geometry, physics, save schema or beta build ID changes.

Artificial smoke runs already green during implementation include `33166999405` and `33167107047`; the final dictionary/engine split must also be green before promotion. **DOM visibility/focus cannot be proven by CI and must be verified by real touch + desktop browsers after the candidate reaches `dev`.**

### Audit V3 — active internal model work

Separate branch: **`feature/audit-v3`**. Draft PR #7: **Audit V3 · troll cognition + human/map intelligence**. Do not merge it just because the beta UX hotfix is ready.

Audit V3 keeps every useful V2 signal and adds:

- blind / curious / suspicious belief agents without privileged `designPath` or hidden-trigger knowledge;
- HARD lifecycle reasoning: bait → consequence → comprehension → mastery;
- bait strength, consequence, causal clarity, learned fairness, bypass resistance, trap originality, knowledge-gain potential and advisory Troll Score;
- tooling-only troll intent (`soft`, `hard`, `terminal`) outside runtime `LevelDefinition`;
- possible accidental terminal/softlock detection;
- map intelligence: visible blocked/hazard footprint, hidden trap footprint, connectivity, spatial entropy, symmetry, density/layout context and structural-neighbour similarity;
- human/artificial metric fusion where synthetic execution is a prior and real beta evidence increasingly dominates with sample size;
- explicit model-vs-human disagreement as a diagnostic instead of averaging players away;
- boosted anonymised telemetry snapshot including first attempt vs retry, mobile vs desktop completion and coarse first-shot route clusters.

First full V3 shadow calibration: run **`33164327421`**, success.

- **18/18 PASS · 0 REVIEW · 0 BLOCKER** inherited from the certified V2 campaign;
- no accidental terminal states;
- no structurally similar map pairs;
- HARD advisory scores: H01 83, H02 74, H03 87, H04 60, H05 78;
- H04 emitted `WEAK_CONSEQUENCE:15%`, but this is treated as a **model limitation**, not an automatic geometry issue: H04 has chained consequence and current V3 overweights immediate post-trigger displacement.

Next V3 calibration work is **consequence look-ahead** / chained-state reasoning: evaluate how a trigger changes the *next* shot and later state, then add memory across attempts. Longer-term enabling architecture is a shared declarative **Trigger → Action** world-state engine consumed by runtime and Audit V3.

See `docs/audit-v3.md` on the V3 branch.

## Official workflow — CLOSED

**`feature/**` → `dev` (public BETA / human validation) → `main` (official release)**

### `feature/**`

All active development and all artificial acceptance happen here.

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
- once cohort testing is active, do not use `dev` as an exploratory scratchpad.

If humans find an issue on `dev`, create a **new `feature/**` fix**, pass the relevant artificial gates, then promote it back to `dev`.

### `main`

Official shipped state only. Promote accepted `dev` when content/polish are sufficient for a real release.

There is no normal `release/**` stage. See `docs/release-process.md`.

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

## Physics authority

`src/systems/GolfSimulation.ts` is the single physics authority for campaign, audits and Community Maps. Phaser owns rendering/input/audio/haptics/FX and must not implement a second gameplay physics model.

Core constants currently include ball radius 13, max pull 172, power 7.4, grass friction 0.9875, ice friction 0.9982, sand friction 0.955 and stop speed 18.

Procedural generation is tooling only, never campaign fallback content.

## Anonymous beta telemetry

Detailed contract: `docs/beta-telemetry.md`.

RC6 links the same anonymous attempt UUID across:

**attempt → shots → completed run**

- `tester_id` is a random browser UUID;
- alias is optional and separate;
- changing alias does not change tester ID;
- client uses coarse device/pointer + rounded viewport, not full physical pointer trajectories;
- uploads are asynchronous/best-effort and must never block gameplay.

The current personal smoke identity `Matkiller` should be excluded when calibrating against independent external players unless developer/self-test behavior is intentionally being studied. At the last explicit external-cohort query, excluding `Matkiller` produced **0 external players / 0 external attempts**, so human-fusion conclusions must not pretend a cohort already exists.

Audit V3's boosted aggregate adds first-attempt/retry completion, device split and coarse first-shot route clusters without exporting tester IDs.

## Community Maps

Current supported loop:

**Editor → explicit draft → playtest → publish → discover → play → rate/comment/report**

Editing invalidates old playtest certification. Creator self-rating is blocked and creator deletion is server-validated. Do not expand to multi-hole community courses until the current loop survives real multi-user beta.

The UX/i18n candidate specifically needs human verification that Community comment and report DOM textareas are now visible, focusable and writable on real touch and desktop browsers.

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

1. **Finish `feature/beta-input-i18n` artificial smoke.** If green, open a PR to `dev`; this feature does not need Full Campaign Audit because it changes presentation/UI only and smoke still checks physics/mechanics/geometry/clearance regressions.
2. Merge the exact accepted UX/i18n head to `dev` through PR/squash with expected-head protection. Keep backend label/build ID as **BETA RC6 / `hole-in-what-beta-rc6`**; do not fragment telemetry for this presentation hotfix.
3. Verify post-merge `dev` CI and Pages deployment.
4. Human-test the public Pages build on **mobile/touch first, then desktop**:
   - Player Profile name field visible, tappable/clickable, keyboard opens, text can be edited and saved;
   - Assistance textarea visible and writable;
   - Community comment field visible, write/save/edit works;
   - Results/community report detail textareas visible and writable;
   - no browser `prompt()` flows;
   - ES/EN selector changes the player flow and persists after reload;
   - fresh Spanish/Catalan browser defaults ES; fresh other-language browser defaults EN;
   - English campaign onboarding/objectives/results/surveys/Community are understandable and HARD spoilers remain hidden.
5. After human smoke, query Supabase to verify alias/comment/report/telemetry behavior as appropriate and separate `Matkiller` self-test rows from external cohort calibration.
6. If this is green, share the same public beta URL with the broader independent/PlayMyGame cohort.
7. In parallel/after the beta unblock, continue **Audit V3 consequence look-ahead**, especially H04 chained consequence. Do **not** alter H04 geometry merely to satisfy the current V3 proxy.
8. Next major HARD architecture after V3 look-ahead: shared declarative **Trigger → Action** state transitions for delayed events, false holes, state swaps and intentional terminal traps.
9. Any new human issue on `dev` returns to a fresh `feature/**` branch.
10. Promote accepted `dev` to `main` only when content and polish justify an official release.
