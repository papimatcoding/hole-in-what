# Troll Golf

Mobile-first 2D arcade minigolf built with Phaser + TypeScript.

> **SOURCE OF TRUTH / CHAT HANDOFF — 2026-08-28**
>
> Read this file first when continuing in another chat. Update it after meaningful changes to campaign state, architecture, validation, backend/live ops, beta status or immediate priorities.

## Current status

### BETA — RC5.1 live

The public GitHub Pages build currently comes from `dev`. Maintenance is OFF.

Current live campaign:

- 10 authored Classic holes;
- 5 authored HARD/Troll holes;
- shared pure-TypeScript physics;
- automated adversarial/human-model auditing;
- anonymous beta telemetry + in-game feedback;
- player profile/alias;
- Community Maps single-hole MVP;
- maintenance/update flow and approximate online presence.

RC5.1 HARD 03 was manually validated on mobile after widening a route that had been mathematically solvable but practically pixel-perfect. Keep the RC5→RC5.1 regression fixture permanently in Audit 2.1.

## Current feature work

Active branch:

- `feature/block-2-authoring`

This branch is **not deployed**. `dev` remains the playable beta while work continues.

Current candidate changes include:

- Classic 11–13 authored as first Block 2 candidates;
- certified ice / booster / portal behavior contracts;
- profile/input DOM stacking fix so HTML inputs remain visible/clickable above the Phaser canvas;
- Community comments changed from browser `prompt()` to an in-game textarea editor;
- global survey changed to an opt-in invitation before the full questionnaire;
- one-time beta survey reward of 5 gems, keyed independently from patch number to prevent normal patch-to-patch farming;
- maintenance screen polling + full-page reload after maintenance ends;
- concise Beta RC6 Patch Notes;
- first H01 touch-route adjustment is still a candidate and must be judged by Full Audit, not by the old fast model.

Candidate beta build ID:

- `beta-block-2-rc6`

Do not update backend `current_build_id` to RC6 until RC6 is actually promoted to `dev`.

## Branch / release model

The official workflow is now:

**`feature/**` → `dev` (beta + human review) → `main` (official release)**

### `feature/**`

- all active development;
- new mechanics, levels, UI and fixes;
- automated testing and Full Audit;
- never deployed to the public game.

### `dev`

- public **beta**;
- current GitHub Pages source;
- receives only already-certified feature work;
- real mobile/desktop human testing happens here;
- player telemetry/feedback is used to discover problems the model cannot prove;
- never use `dev` as a scratchpad.

### `main`

- official shipped version;
- promote the accepted `dev` state only when the game/version has enough polished content and is genuinely ready to release.

There is no normal `release/**` stage. See `docs/release-process.md`.

## Level-development rule

We are deliberately separating **level quality** from **campaign ordering**.

Current plan:

1. audit and improve every existing level;
2. only after individual quality is acceptable, evaluate/reorder the campaign progression if necessary;
3. add more levels in small authored batches;
4. Full Audit each batch;
5. move the certified version to `dev` for human beta testing;
6. repeat until there is enough strong content for an official release.

Do not redesign the whole campaign at once.

### Existing-level audit batches

Review several related levels at a time, but always with full-precision certification:

1. **Classic 01–05**
2. **Classic 06–10**
3. **Classic 11–13**
4. **HARD 01–05**

For each batch:

- confirm the intended teaching/troll purpose;
- inspect Full Audit evidence;
- make only justified changes;
- run Full Audit across the complete campaign to catch regressions outside the edited batch;
- keep changes only if they improve human margin, mechanic relevance, originality/progression or trap fairness without adding cheese/bypasses.

The fast workflow is **not** an acceptance tool for levels.

## Audit 2.1 — acceptance policy

Audit 2.1 is the internal level-design critic.

Core scripts:

- `scripts/courseAudit.ts` — adversarial/strict campaign solver;
- `scripts/audit2.ts` — human execution critic;
- `scripts/audit2Design.ts` — difficulty/originality + design advice;
- `scripts/courseOriginalityAudit.ts` — structural originality.

### Full Audit is authoritative for automated level review

Use:

```bash
FULL_AUDIT=1 npm run audit:courses
npm run audit:human:full
npm run audit:design
npm run audit:originality
```

The GitHub workflow `.github/workflows/lab-full-audit.yml` runs the full certification and cancels stale runs when a newer revision is pushed.

`.github/workflows/lab-audit.yml` is now only a **technical smoke workflow** (typecheck, build, physics, mechanics, geometry, clearance). Do not use a quick/fast model to approve or reject authored levels.

A Full Audit result is still not a replacement for real playtesting:

> **Mathematical solution ≠ automated human model ≠ real human validation.**

All three layers matter.

### What Audit 2.1 checks

- best / blind / learned / naive routes;
- HIO and cheese/bypass search;
- route-family diversity;
- touch, casual and mouse execution;
- angle/power perturbation;
- per-shot tolerance;
- recovery after imperfect shots;
- boundary-rest risk;
- trap trigger/consequence;
- primary-mechanic relevance;
- moving-state / timeout / softlock risk;
- geometry and clearance;
- structural originality.

Machine difficulty/originality and player ratings stay separate. Never average them together.

## Campaign design principles

### Classic

Each hole needs both:

- a distinct silhouette;
- a distinct strategic question.

The useful rhythm is generally:

**teach → apply → combine → exam**

A new mechanic may create a controlled difficulty reset. The campaign does not need a perfectly monotonic difficulty graph, but accidental cliffs/dips should be investigated.

Block 1 original teaching intent:

1. control / comfortable HIO
2. first bank
3. route choice
4. setup shot
5. first bumper
6. bumper reused differently
7. geometry exam
8. first sand
9. sand route choice
10. chapter exam

Block 2 begins with ice → ice application → booster, then will expand only after the first batch survives Full Audit and human beta testing.

### HARD

A good troll trap:

1. makes the obvious read attractive;
2. surprises;
3. is deterministic and understandable afterwards;
4. changes the failed/learned route;
5. leaves a fair learned answer;
6. has normal human execution margin;
7. feels like “qué cabrón”, not “esto es random”.

Never spoil HARD solutions in selection screens, tutorials or Patch Notes.

## Physics authority

`src/systems/GolfSimulation.ts` is the **single physics authority** for campaign, audits and Community Maps.

It owns:

- launch / friction;
- bounds / walls / triangles / curves;
- bumpers;
- sand / ice;
- boosters / fans;
- portals;
- moving objects;
- ramps / trampolines;
- voids / pop traps;
- cup sweep / lip / sink.

Phaser owns rendering, input, audio, haptics and FX.

Do not create a second gameplay/input implementation for desktop or Community Maps.

Runtime campaign files:

- `src/scenes/GameplayScene.ts`
- `src/systems/CourseRenderer.ts`
- `src/systems/ShotInputSystem.ts`
- `src/data/campaign.ts`
- `src/data/authored/classic.ts`
- `src/data/authored/classicBlock2.ts`
- `src/data/authored/hard.ts`
- `src/systems/SaveSystem.ts`

Procedural generation is tooling only, never campaign fallback content.

## Responsive presentation

Gameplay must be device-invariant; presentation may adapt.

- same physics/course coordinates/shot sensitivity on desktop and touch;
- `src/config/display.ts` owns presentation-only detection;
- no user-agent gameplay forks;
- desktop may use denser layouts, larger typography and hover states;
- touch keeps larger targets and compact vertical flow.

## Player identity / feedback

- `tester_id` is stable anonymous browser identity;
- alias is editable and must never change `tester_id`;
- changing alias must not unlock another rating/survey;
- feedback/comment entry should be in-game, not browser prompts.

Global survey:

- invitation first;
- player may decline without disruption;
- completion reward candidate: **5 gems**;
- reward uses a stable claim ID rather than patch/build ID so normal updates cannot be farmed repeatedly.

Backend uniqueness:

- `beta_game_feedback`: `(tester_id, build_id)`;
- `beta_level_feedback`: `(tester_id, build_id, level_id)`.

Supabase project:

- Troll Golf — `xtekdrkqgfjnnwawyoim`

Never commit service-role/admin secrets.

## Community Maps

Current single-hole publishing loop:

**Editor → explicit draft → playtest → publish → discover → play → rate/comment/report**

Editing a draft invalidates its playtest certification.

Discovery tabs:

- TENDENCIA
- MEJORES
- NUEVOS

Creator protections:

- creator alias;
- self-rating blocked;
- creator-owned delete validated server-side.

Schema remains prepared for future multi-hole courses (`map_kind`, `hole_count`, `holes_json`), but do not build the full multi-hole editor until the single-hole loop survives real multi-user beta testing.

## Live ops / maintenance

Backend table: `app_status`.

Maintenance is **OFF during feature development**.

For a real beta deployment:

1. feature work + Full Audit complete;
2. maintenance ON immediately before promotion to `dev`;
3. merge/promote certified feature state to `dev`;
4. Pages deploys the new beta;
5. smoke test the actual deployed build;
6. update backend `current_build_id`/patch text if appropriate;
7. maintenance OFF.

Maintenance clients poll status and perform a full page reload after maintenance ends to avoid stale assets.

If deployment is broken, keep maintenance enabled and rollback `dev` to the previous known-good commit before reopening the beta.

## Patch Notes policy

Player-facing notes must be short, natural and spoiler-free.

Use **BETA**, never “Friends Beta”.

Do not expose:

- trap solutions;
- exact routes;
- internal audit/telemetry architecture;
- implementation details;
- long technical explanations.

## Known non-blockers

- bundle remains relatively large (~1.55 MB minified / ~410 kB gzip);
- beta sample is currently small;
- abandonment analytics are approximate;
- Community search/pagination can wait for real volume;
- multi-hole Community is not implemented;
- private DEV/review dashboard is not a current priority.

## Deliberately not building now

Do not spend this milestone on ranked/MMR multiplayer, battle pass/seasons, Daily Hole, ads/lootboxes, extra currencies or large account systems.

Long-term ideas such as ~40 Classic + ~40 HARD, competitive online play, bots/ranks and seasons remain future possibilities, not current scope.

## Immediate next steps — resume here

1. Treat the current feature branch as the RC6 development laboratory; do **not** merge it to `dev` yet.
2. Obtain a fresh **Full Audit baseline** for the complete current campaign (C01–13 + H01–05), including the candidate H01 adjustment.
3. Review/improve existing levels by batch: **C01–05 → C06–10 → C11–13 → H01–05**. Each batch gets one Full Audit over the complete campaign before moving on.
4. Do not use the old fast human-model output for design decisions.
5. Once all existing levels are individually strong, evaluate the campaign ordering/progression as a separate pass and reorder only where evidence supports it.
6. Add additional Classic/HARD levels in small batches, Full Audit each batch, and continue until there is a substantial high-quality campaign.
7. Promote the certified feature state to `dev` for real beta playtesting; fix human-only issues through new feature branches.
8. Promote accepted `dev` to `main` only when the game/version is ready for official release.
9. Before the next beta deployment, verify profile inputs, Community comment editor, survey invitation/reward and maintenance auto-reload on both mobile and desktop.
