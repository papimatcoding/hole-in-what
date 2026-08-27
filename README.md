# Troll Golf

Mobile-first 2D arcade minigolf built with Phaser + TypeScript.

> **SOURCE OF TRUTH / CHAT HANDOFF — 2026-08-27**
>
> Read this file first when continuing in another chat. Update it after any meaningful change to campaign state, architecture, validation, backend/live ops, beta status or immediate priorities.

## Current status

### FRIENDS BETA: GO — RC5.1 live

Live build:

- `beta-block-1-friends-rc5-1`
- maintenance: **OFF**
- first campaign block: **FROZEN after human validation**
- live Pages source: `dev`

Block 1 contains:

- 10 authored Classic holes;
- 5 authored HARD/Troll holes;
- shared pure-TypeScript physics;
- automated validation + Audit 2.1 human-model critic;
- anonymous beta telemetry and in-game feedback;
- player identity/profile;
- online presence + maintenance/update flow;
- Community Maps single-hole MVP.

The owner manually re-tested RC5.1 HARD 03 on mobile after the final widening pass and accepted it as difficult but human-playable. **Do not reopen HARD 03 or micro-tune block 1 without new multi-user evidence.**

### Active work right now

There are two separate milestones; do not mix their concerns:

1. **Desktop/PC UI pass** — active branch `feature/desktop-ui-feedback`.
2. **Block 2 mechanic groundwork** — ice/booster/portal contracts were certified in PR #2 and merged into `dev` as `b4d75538`.

The owner's first real PC pass found that the phone-oriented presentation is noticeably less satisfying on desktop: several labels are too small, some controls can visually collide, profile naming feels broken/unavailable, and the automatic post-hole survey closes too abruptly. **Desktop UI validation is the immediate priority before authoring Classic 11+.**

## Branch / release model

- `main` — stable history.
- `dev` — stable friends-beta release candidate and GitHub Pages source.
- `feature/**` / `lab/**` — development laboratory. These branches **must not deploy Pages**.

GitHub Pages:

- https://papimatcoding.github.io/troll-golf/

Development flow:

1. create/work on a feature branch;
2. run fast lab validation continuously;
3. iterate without maintenance and without affecting friends;
4. open PR to `dev`;
5. run full pre-release lab certification;
6. human playtest when gameplay or presentation changed;
7. merge to `dev` only when ready;
8. use maintenance only for a real production transition that could affect live clients.

`dev` is not a scratchpad.

## Physics authority

`src/systems/GolfSimulation.ts` is the **single physics authority** for campaign, audits and Community Maps.

It owns:

- launch / friction;
- bounds / walls;
- triangles / curves;
- bumpers;
- sand / ice;
- boosters / fans;
- portals;
- moving objects;
- ramps / trampolines;
- voids / pop traps;
- cup sweep / lip / sink.

Phaser owns rendering, input, audio, haptics and FX.

**Responsive desktop/mobile presentation must never fork or change the physics rules.** The same level coordinates, GolfSimulation and shot behaviour are used on PC and mobile.

Do not revive a second physics implementation or the old `GameScene -> V8 -> V81 -> V82` patch chain.

Runtime campaign files:

- `src/scenes/GameplayScene.ts`
- `src/systems/CourseRenderer.ts`
- `src/systems/ShotInputSystem.ts`
- `src/data/campaign.ts`
- `src/data/authored/classic.ts`
- `src/data/authored/hard.ts`
- `src/systems/SaveSystem.ts`

Procedural generation is tooling only; never campaign/fallback content.

## Desktop / mobile presentation

Mobile remains the baseline interaction model, but PC is now a first-class presentation target.

Current desktop detection in `src/config/display.ts` is presentation-only:

- viewport at least `820×600`;
- `(hover: hover)`;
- `(pointer: fine)`.

Current `feature/desktop-ui-feedback` changes:

- desktop-only small-text floor: authored 8–11 px labels are raised to 11–12 px when `sharpenSceneText()` runs;
- `#game` is positioned so Phaser DOM controls follow the centred canvas instead of the browser viewport;
- desktop canvas gets restrained framing/shadow/background treatment;
- menu player identity is now an obvious real button rather than a tiny text link;
- profile input is larger on desktop, supports ENTER, focuses automatically for unnamed testers, and saves locally first;
- alias changes are instant and no longer wait on Supabase; backend registration sync happens in the background;
- post-hole survey no longer auto-submits 350 ms after the third choice;
- survey now uses an explicit `ENVIAR` action, `SALTAR` remains available, and the panel closes immediately while the network submission continues in the background.

Still required before merging this UI branch:

- owner desktop smoke test for font readability;
- identify the exact remaining overlapping buttons/screens, preferably with screenshots;
- confirm profile input is aligned/clickable and alias survives refresh;
- confirm post-hole survey feels fast but not rushed;
- quick mobile regression to ensure desktop-only presentation rules did not worsen touch UI.

Do not solve desktop complaints by changing GolfSimulation, level geometry or shot controls.

## Player identity / feedback

- `tester_id` is a stable anonymous browser identity;
- alias is editable in-game and **must not change tester_id**;
- changing alias must not unlock another survey/rating;
- alias persistence is local-first and server sync is best-effort/background;
- feedback/report UI should be in-game rather than browser prompts where practical.

Backend uniqueness:

- `beta_game_feedback`: `(tester_id, build_id)`;
- `beta_level_feedback`: `(tester_id, build_id, level_id)`.

Main-menu **ASISTENCIA AL JUGADOR** contains profile/alias, global survey and support message categories.

Beta tables include:

- `beta_testers`
- `beta_runs`
- `beta_level_feedback`
- `beta_game_feedback`
- `beta_reports`
- `beta_support_messages`
- `beta_presence`
- `app_status`

Supabase project:

- Troll Golf — `xtekdrkqgfjnnwawyoim`

Never commit service-role/admin secrets.

## Block 1 design source of truth

### Classic

Teaching plan:

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

Each hole needs a distinct silhouette **and** strategic question. Teach mechanics, then reuse them.

### HARD

A good troll trap:

1. makes the obvious read attractive;
2. surprises;
3. is deterministic and understandable afterwards;
4. genuinely changes the failed/learned route;
5. leaves a fair learned answer;
6. has normal human execution margin;
7. creates “qué cabrón”, not “esto es random”.

The learned optimal route may avoid the trap if avoiding it is the lesson, but the naive attractive read must be demonstrably punished.

Do not spoil HARD traps in level select, tutorial overlays or Patch Notes.

### HARD 03 historical regression

RC5 HARD 03 was mathematically solvable but effectively pixel-perfect for a human. RC5.1 widened the learned route while keeping the trap meaningful.

This failure is a permanent **Audit 2.1 regression fixture**. Audit changes must continue to distinguish the bad RC5 geometry from the accepted RC5.1 geometry.

## Audit 2.1

Audit 2.1 is the internal level-design critic. It was developed on `feature/audit-2-human`, certified through PR #1 and promoted to `dev`.

Core scripts:

- `scripts/audit2.ts` — physics/human-model critic;
- `scripts/audit2Design.ts` — difficulty/originality ranking + design recommendations.

Workflows:

- `.github/workflows/lab-audit.yml` — fast feature-branch feedback;
- `.github/workflows/lab-full-audit.yml` — full PR/manual pre-release certification.

Audit 2.1 measures:

- learned / naive / explorer agents;
- best and blind solvability;
- HIO / cheese search;
- route-family diversity;
- mouse / touch / casual execution models;
- angle and power perturbation;
- per-shot tolerance;
- recovery after imperfect shots;
- rests near boundaries;
- trap trigger and real consequence;
- primary-mechanic relevance;
- moving-state / softlock risk;
- traditional geometry / clearance / originality checks.

It explicitly separates:

- **best route** — lowest-stroke route found;
- **human route** — most robust route found within at most +1 stroke of optimum.

> **A mathematical solution is not human validation.**

The human model is a critic, not an oracle. It remains advisory/reporting rather than replacing manual playtests or the strict campaign gate.

### Audit 2.1 accepted baseline

Full Lab Audit run `33085175970`:

- strict campaign solver: **Classic 10/10 + HARD 5/5 clean**;
- Audit 2.1 human model: **13 PASS / 2 REVIEW / 0 BLOCKER**;
- originality audit: **0 structurally similar pairs**.

Advisory reviews only:

- Classic 06 — `MECHANIC_RELEVANCE_LOW` in the selected robust route;
- HARD 01 — touch/tolerance margin worth watching.

Do **not** reopen frozen block 1 from these advisory flags alone.

HARD 03 regression in the full model:

- bad RC5 fixture: human score ~61%, touch ~71%, tolerance ~43%;
- accepted RC5.1: human route 3 strokes, human score ~83%, touch ~89%, tolerance ~72%;
- regression result: **PASS**.

Design Advisor outputs 1.0–5.0 difficulty/originality scores. Machine scores and player scores stay separate; disagreement is evidence, not something to average away.

When importing beta feedback into Audit 2.1, use **aggregated/non-identifying snapshots**. Never commit tester aliases, UUIDs or raw private comments just to run design analysis.

## Block 2 mechanic groundwork

PR #2 (`feature/block-2-mechanics`) is merged into `dev`.

The first mechanic batch is:

1. ice;
2. booster;
3. portal.

`mechanicBehaviorCheck.ts` provides deterministic GolfSimulation contracts that verify physical effect plus event/telemetry behaviour; portal coverage also checks exit direction/cooldown behaviour. These contracts run in fast lab, full lab and normal release CI.

No Block 2 campaign holes have been authored yet. **Do not start Classic 11+ until the current desktop UI pass is manually accepted.**

Likely next mechanic batch after the first authored holes prove the pipeline:

- fan / wind;
- moving bumper;
- ramp / trampoline.

These deserve their own contracts because continuous forces and airborne/Z behaviour are more failure-prone.

## Validation commands

Normal release checks:

```bash
npm run typecheck
npm run build
npm run test:hole
npm run test:mechanics
npm run test:mechanic-behavior
npm run test:geometry
npm run test:clearance
npm run audit:courses
npm run audit:originality
```

Strict campaign solver:

```bash
FULL_AUDIT=1 npm run audit:courses
```

Audit 2.1:

```bash
npm run audit:human
npm run audit:human:full
npm run audit:design
```

Full campaign certification still requires every authored campaign course to be `OK`. Inspect textual summaries; workflow colour is not a substitute for understanding the output.

## Patch Notes policy

Player-facing Patch Notes must be **short, natural and spoiler-free**.

Good examples:

- “Solucionado un problema que hacía HARD 03 demasiado difícil de resolver.”
- “Mejorada la interfaz en ordenador.”
- “Mejoras y correcciones en Community Maps.”

Do not expose trap solutions, exact routes, internal telemetry/build architecture, implementation details or long AI-sounding explanations.

Files:

- `src/systems/PatchNotesSystem.ts`
- `src/scenes/PatchNotesScene.ts`

## Community Maps

Publishing flow:

**Editor → save explicit draft → select draft → complete playtest → publish**

Editing a draft invalidates its previous playtest certification.

Discovery:

- TENDENCIA
- MEJORES
- NUEVOS

Current loop:

- creator alias;
- 1–5★ rating;
- plays / unique players / approximate active players;
- comments;
- reports;
- creator-owned delete, validated server-side;
- creator cannot self-rate.

Community Play must share GolfSimulation, CourseRenderer, shot input, cosmetics and core gameplay feedback with campaign.

Schema is prepared for future multi-hole courses:

- `map_kind: single | course`
- `hole_count: 1–18`
- `holes_json`

Do not build the full multi-hole editor until the single-hole Community flow survives real multi-user testing.

## Live ops

Backend table: `app_status`.

- Boot checks current build/maintenance;
- stale clients can be sent to update-required;
- maintenance scene shows patch/message/ETA;
- presence heartbeat supplies approximate online count.

Meaningful production deploy protocol:

1. prepare/certify on feature branch first;
2. maintenance ON only when the actual live transition begins and needs protection;
3. deploy code/backend;
4. CI + Pages green;
5. final smoke checks;
6. concise Patch Notes + README handoff;
7. update server build ID only if gameplay/data comparability changes;
8. maintenance OFF.

UI-only beta refinements normally do not need maintenance or a telemetry build-ID reset.

## Known non-blockers

- bundle ~1.55 MB minified / ~410 kB gzip;
- beta sample is still small and owner-weighted;
- abandonment analytics are approximate;
- Community discovery/search/pagination waits for real map volume;
- multi-hole Community is schema-prepared but not implemented;
- private DEV/review dashboard not implemented;
- Audit 2.1 thresholds remain advisory and should not auto-redesign frozen levels without human evidence.

## Deliberately not building now

Do not spend the current milestone on ranked/MMR multiplayer, battle pass/seasons, Daily Hole, ads/lootboxes, extra currencies or large account systems.

Historical ideas such as ~40 Classic + ~40 HARD, competitive online up to 10, bots, ranked/MMR and thematic seasons remain possible later.

## Immediate next steps — resume here

**Immediate blocker is desktop presentation validation, not campaign authoring.**

1. Finish fast CI on `feature/desktop-ui-feedback` and open PR to `dev`.
2. Run Full Lab. Because physics/geometry are unchanged, solver results should remain the accepted Block 1 baseline.
3. Promote the UI branch to `dev` only when automated checks are green, then let the owner test the real Pages build on PC.
4. Owner checks: menu readability, exact overlapping controls, name choose/edit + refresh persistence, post-hole survey flow, Results/Level Select/Assistance readability.
5. Fix only concrete desktop/mobile presentation regressions found in that pass; ask for screenshots where overlap location is ambiguous.
6. Quick mobile smoke regression.
7. Once PC/mobile UI is accepted, return to Block 2 and author the first small Classic 11–15 candidate set using ice → booster → portal rather than mass-producing levels.
8. Audit 2.1 those candidates, then manual playtest before promotion.
9. Separately run Community Maps end-to-end with at least two testers.

## Development principle

**Author deliberately → audit adversarially → model humans → play manually → test with humans → curate → approve.**
