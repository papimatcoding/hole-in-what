# Hole in What?

Mobile-first 2D arcade minigolf built with Phaser + TypeScript.

> **SOURCE OF TRUTH / CHAT HANDOFF — 2026-08-28**
>
> Read this file first when continuing in another chat. Update it after meaningful changes to campaign state, architecture, validation, backend/live ops, beta status or immediate priorities.

## Current state

### Public BETA RC6 — live on `dev`

- Public Pages: `https://papimatcoding.github.io/troll-golf/`
- Pages source: `dev`
- current live `dev` HEAD: **`9816d0044f8acb4f01b8d850544c0eb7caf39d94`**
- previous `dev` before the UX/i18n promotion: `a87ef6d080f0023d918f36a9f726a082ef1a2763`
- emergency pre-RC6 rollback anchor: `8075b162dc2b3e7b73b2fd0d36e6fbc5248120f4`
- maintenance: **OFF**
- backend patch label: **BETA RC6**
- backend build ID: **`hole-in-what-beta-rc6`**
- live campaign: **Classic 01–13 + HARD 01–05**
- product name: **Hole in What?**

Do not rename the repository or Pages path during RC6. Keep legacy `troll-golf-*` localStorage keys stable so beta identity/progression is not reset.

The original RC6 campaign promotion landed as `e90bf9b194044fb7af86a73e282a81bdc3133a9d`. Earlier pre-cohort direct-`dev` exceptions fixed boot branding, expanded post-hole originality/difficulty to 1–5, and made HARD previews spoiler-safe. The normal feature workflow is now restored.

### RC6 UX + ES/EN hotfix — LIVE

PR **#8 · `BETA UX hotfix · editable fields + ES/EN`** was merged from `feature/beta-input-i18n` into `dev` by SHA-protected squash merge.

Accepted feature head: **`60fde96209068b24a0cb146a5ee119319f20211e`**  
Resulting `dev` commit: **`9816d0044f8acb4f01b8d850544c0eb7caf39d94`**

Artificial validation:

- feature smoke run **`33167445521`** — SUCCESS;
- Pages run **`33167542462`** — SUCCESS;
- post-merge `dev` CI run **`33167542495`** — SUCCESS;
- post-merge CI passed typecheck, build, hole physics, mechanic integrity/behavior, authored geometry, clearance, full authored-campaign simulation and originality;
- backend rechecked after promotion: maintenance OFF, `BETA RC6`, build `hole-in-what-beta-rc6`.

What changed:

1. **Shared in-game DOM input fix.** Player-name input, Community comment editor, Assistance textarea and report-detail textareas already existed. The real bug was layout: CSS independently centered/padded the canvas while Phaser ScaleManager positioned its absolute DOM overlay. The live fix removes that competing layout and makes Phaser the sole canvas + DOM positioning authority.
2. **Spanish / English selector.** Main menu now exposes persistent `ES / EN`. Fresh Spanish/Catalan browser locales default ES; other locales default EN; explicit choice persists under `troll-golf-language`.
3. **External-tester English path.** Translation covers menu, campaign navigation/objectives, control + mechanic onboarding, results/post-hole feedback, profile/support, global survey, and Community browse/play/comments/reports. Developer-only authoring surfaces may remain Spanish until they become a public-player requirement.

No campaign geometry, GolfSimulation physics, save schema, Supabase schema or beta build ID changed.

**Important:** CI cannot prove real DOM focus/mobile keyboard behavior. The current human gate is to verify these fields on the actual Pages build, mobile/touch first and then desktop. See `docs/beta-ux-i18n-rc6.md`.

## Audit V3 / V3.1 — active internal model work

Separate branch: **`feature/audit-v3`**. Draft PR **#7 · `Audit V3 · troll cognition + human/map intelligence`**. This is internal QA/design tooling and is not part of the player bundle.

V3 preserves V2 as the authoritative campaign base and adds:

- blind / curious / suspicious belief agents without privileged `designPath`, hidden trigger coordinates or troll intent;
- HARD lifecycle reasoning: **bait → consequence → comprehension → mastery**;
- bait strength, consequence, causal clarity, learned fairness, bypass resistance, trap originality, knowledge-gain potential and advisory Troll Score;
- tooling-only troll intent (`soft`, `hard`, `terminal`) outside runtime `LevelDefinition`;
- accidental terminal/softlock detection;
- map intelligence: visible blocked/hazard footprint, hidden trap footprint, connectivity, spatial entropy, symmetry, density/layout context and structural-neighbour similarity;
- artificial/human metric fusion where the synthetic model is a prior and real beta evidence increasingly dominates with sample size;
- boosted anonymous telemetry aggregate with first-attempt vs retry, device completion and coarse first-shot route clusters.

First V3.0 Full Audit: **run `33164327421` — SUCCESS**.

- 18/18 PASS · 0 REVIEW · 0 BLOCKER inherited from certified V2;
- no accidental terminals;
- no structurally similar map pairs;
- HARD advisory Troll Scores: H01 83, H02 74, H03 87, H04 60, H05 78;
- H04 emitted `WEAK_CONSEQUENCE:15%`; this was treated as a model limitation, not a geometry failure, because H04 is a chained/two-stage joke.

### V3.1 consequence look-ahead

Current V3 work adds **one-stroke post-trigger look-ahead** rather than measuring only immediate displacement.

- new `scripts/audit3LookAhead.ts`;
- compares a triggered real state against the same first shot on a counterfactual copy with hidden pop traps removed;
- samples the next shot without `designPath` or hidden intent;
- measures best progress, breadth of safe progress and survival to estimate **next-shot agency**;
- derives `optionLoss`, `consequenceV31` and `trollScoreV31` while preserving V3.0 numbers for calibration;
- may emit `CHAINED_CONSEQUENCE` when delayed loss of options explains an apparently weak immediate trap;
- remains **shadow-only** and is not a new strict gate.

Integrated V3.1 smoke head `a90376ef43b46eaabf8067b9c011d75f96a023a5` passed run **`33167831026`**. A follow-up workflow commit `4e61ec0e213c5e8d8bc56077c0f05a619b13fdce` explicitly makes Full Audit run the complete V3.1 stack; its Full Audit calibration is the current artificial task. Do not change H04 geometry merely to improve this proxy.

Longer-term enabling architecture after V3.1 calibration: a shared declarative **Trigger → Action** world-state engine for delayed events, false holes, state swaps, cages/terminal traps and future HARD authoring. Runtime and Audit must consume the same state engine rather than reimplementing trap behavior.

## Official workflow — CLOSED

**`feature/**` → `dev` (public BETA / human validation) → `main` (official release)**

### `feature/**`

All active development and all artificial acceptance happen here.

- implement/fix levels, mechanics, UI, telemetry and internal tooling;
- normal technical smoke for normal changes;
- Full Audit for campaign/simulation/design-affecting changes;
- no human pre-merge gate;
- no public Pages deployment.

### `dev`

Public developer/beta build and Pages source.

- receives feature work after artificial checks pass;
- humans validate real touch/mouse behavior, readability, fun, fairness, forms and language;
- telemetry + qualitative feedback expose failures artificial models cannot prove;
- once cohort testing is active, do not use `dev` as an exploratory scratchpad.

Any human-discovered problem on `dev` returns to a fresh `feature/**` branch.

### `main`

Official shipped state only. Promote an accepted `dev` when content and polish justify a real release. There is no normal `release/**` stage.

## Campaign artificial certification — CLOSED

The live 18-hole RC6 campaign is already certified. Do not reopen geometry because of unrelated UI/i18n/model work.

Accepted campaign geometry: **`466b5297c4f6517092dac8c09b1c05532cc21736`**  
Accepted campaign Full Audit: **run `33158002310`**

- **18/18 PASS · 0 REVIEW · 0 BLOCKER** synthetic human model;
- Classic strict solver: 13/13 clean, 0 bypass, 0 no-route;
- HARD strict solver: 5/5 clean, 0 bypass, 0 no-route, 0 warnings;
- mechanics / behavior contracts PASS;
- geometry PASS;
- persistent-trap clearance PASS;
- permanent HARD03 RC5→RC5.1 regression PASS;
- originality: **0 structurally similar pairs**.

Key final metrics:

- C06 touch 86%, casual 77%, tolerance 85%, human 86%, recovery 100%;
- C11 touch 98%, casual 84%, tolerance 75%, human 90%, recovery 100%;
- C12 touch 71%, casual 62%, tolerance 54%, human 65%, recovery 94%;
- H01 touch 95%, casual 82%, tolerance 78%, human 89%, recovery 94%, trap consequence 66%;
- H03 touch 89%, casual 77%, tolerance 72%, human 83%, recovery 100%, trap 80%.

Campaign order remains intentional. C04→C05 and C10→C11 are teaching resets, not automatic balance errors. Human beta may still reject any level.

## Audit policy

Audit is an internal critic, not an oracle. Fast smoke is technical evidence only; only Full Audit may accept/reject campaign design before `dev`.

V2 authoritative stack:

```bash
FULL_AUDIT=1 npm run audit:courses
npm run audit:human:full
npm run audit:design
npm run audit:originality
```

Audit V3 runs in shadow on top of that evidence until calibrated. Mathematical solution ≠ synthetic human model ≠ real human validation.

Permanent rule: keep the known-bad RC5 HARD03 fixture against accepted RC5.1 so future Audit calibration cannot silently regress.

## Physics authority

`src/systems/GolfSimulation.ts` is the **single gameplay-physics authority** for campaign, audits and Community Maps. Phaser owns rendering, input, audio/haptics and FX; it must not implement a second physics model.

Core constants currently include ball radius 13, max pull 172, power 7.4, grass friction 0.9875, ice friction 0.9982, sand friction 0.955 and stop speed 18.

Procedural generation is tooling only, never campaign fallback content.

## Anonymous beta telemetry

Detailed contract: `docs/beta-telemetry.md`.

RC6 links one anonymous attempt UUID across:

**attempt → shots → completed run**

- tester ID is a random browser UUID;
- alias is optional and separate;
- changing alias does not change tester ID;
- coarse device/pointer + rounded viewport are used instead of physical pointer trajectories;
- uploads are asynchronous/best-effort and must never block gameplay.

Known self-test alias **`Matkiller`** must be excluded from independent-cohort calibration unless intentionally studying developer/self-test behavior. At the last explicit query excluding it, external sample remained 0 players / 0 attempts.

Audit V3's boosted aggregate adds first-attempt/retry completion, mobile/desktop split and coarse first-shot route clusters without exporting tester IDs.

## Community Maps

Current supported loop:

**Editor → explicit draft → playtest → publish → discover → play → rate/comment/report**

Editing invalidates prior playtest certification. Creator self-rating is blocked and creator deletion is server validated. Do not expand to multi-hole community courses until the current single-hole loop survives real multi-user beta.

The live RC6 UX fix now specifically requires human validation that Community comment/report fields are visible, focusable and writable.

## HARD design principles

A good trap:

1. makes an obvious read attractive;
2. surprises a first attempt;
3. is deterministic and understandable afterwards;
4. changes the failed/learned route;
5. leaves a fair learned answer;
6. rewards knowledge more than pixel precision;
7. creates “qué cabrón”, not “esto es random”.

Never spoil HARD solutions in selectors, previews, tutorials, Patch Notes or translation strings. Player previews show only start-visible geometry; latent traps and trap metadata stay hidden.

## Immediate next steps — resume here

1. **Human-test the live Pages build now**, mobile/touch first, then desktop:
   - Player Profile name field visible, focusable, keyboard opens, edit/save works;
   - Assistance textarea visible/writable;
   - Community comment textarea visible, write/save/edit works;
   - Results + Community report-detail textareas visible/writable;
   - no browser `prompt()` flows;
   - ES/EN selector switches the player flow and persists after reload;
   - English onboarding/objectives/results/survey/Community are understandable;
   - HARD preview/spoiler protections remain intact.
2. After that smoke, inspect Supabase rows produced by the real client and verify alias/comment/report/attempt linkage as relevant.
3. If green, share the same public URL with the broader independent / PlayMyGame cohort. Keep build ID `hole-in-what-beta-rc6` so all RC6 evidence stays one dataset.
4. Any issue discovered by humans on `dev` becomes a fresh `feature/**` fix.
5. In parallel, complete the Full Audit calibration of **Audit V3.1 consequence look-ahead**, especially H04. Calibrate the model, not the level, unless independent evidence says H04 is actually bad.
6. After V3.1, add memory across attempts and then the shared declarative **Trigger → Action** state engine before authoring the next generation of complex HARD traps.
7. Author the next Classic/HARD batch in small increments after the RC6 evidence review rather than one huge block.
8. Promote accepted `dev` to `main` only when content/polish justify an official release.
