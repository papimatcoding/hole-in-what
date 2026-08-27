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

Block 1 contains:

- 10 authored Classic holes;
- 5 authored HARD/Troll holes;
- shared pure-TypeScript physics;
- automated validation + adversarial solvers;
- anonymous beta telemetry and in-game feedback;
- player identity/profile;
- online presence + maintenance/update flow;
- Community Maps single-hole MVP.

The owner manually re-tested RC5.1 HARD 03 on mobile after the final widening pass and accepted it as difficult but human-playable. **Do not reopen HARD 03 or micro-tune block 1 without new multi-user evidence.**

## Branch / release model

- `main` — stable history.
- `dev` — stable friends-beta release candidate and GitHub Pages source.
- `feature/**` / `lab/**` — development laboratory. These branches **must not deploy Pages**.

GitHub Pages:

- https://papimatcoding.github.io/troll-golf/

New development flow:

1. create/work on a feature branch;
2. run fast lab validation continuously;
3. iterate without maintenance and without affecting friends;
4. open PR to `dev`;
5. run full pre-release lab certification;
6. human playtest when gameplay changed;
7. merge to `dev` only when ready;
8. use maintenance only for a real production transition that could affect live clients.

`dev` should no longer be used as a scratchpad.

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

This failure is now a permanent **Audit 2.1 regression fixture**. Audit changes should continue to distinguish the bad RC5 geometry from the accepted RC5.1 geometry.

## Audit 2.1

Audit 2.1 is the current internal level-design critic. It was developed on `feature/audit-2-human` and certified through PR #1 before promotion to `dev`.

Core scripts:

- `scripts/audit2.ts` — physics/human-model critic;
- `scripts/audit2Design.ts` — difficulty/originality ranking + design recommendations.

Workflows:

- `.github/workflows/lab-audit.yml` — fast feature-branch feedback;
- `.github/workflows/lab-full-audit.yml` — full PR/manual pre-release certification.

### What Audit 2.1 measures

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

Audit 2.1 explicitly separates:

- **best route** — lowest-stroke route found;
- **human route** — most robust route found within at most +1 stroke of optimum.

This prevents a fragile 2-stroke speedrun line from making an otherwise comfortable 3-stroke solution look pixel-perfect.

Important calibration rule:

> **A mathematical solution is not human validation.**

The human model is a critic, not an oracle. It remains advisory/reporting rather than replacing manual playtests or the strict campaign gate.

### Difficulty and originality

Both design metrics use **1.0–5.0**, not LOW/MEDIUM/HIGH labels.

Keep machine and player scores separate:

- `difficultyAudit: 1–5`
- `difficultyPlayers: 1–5`
- `originalityAudit: 1–5`
- `originalityPlayers: 1–5`

Do not average them together. Disagreement is valuable evidence.

Examples:

- audit difficulty 2.2 / players 4.3 → investigate controls, readability or missing knowledge before changing geometry;
- audit originality 4.0 / players 2.0 → structurally different may still feel repetitive.

### Audit 2.1 full calibration — accepted baseline

Full Lab Audit:

- run `33085175970`: **success**;
- strict campaign solver: **Classic 10/10 + HARD 5/5 clean**;
- Audit 2.1 human model: **13 PASS / 2 REVIEW / 0 BLOCKER**;
- originality audit: **0 structurally similar pairs**.

The two advisory reviews are:

- Classic 06 — `MECHANIC_RELEVANCE_LOW` in the selected robust route;
- HARD 01 — touch/tolerance margin worth watching.

Do **not** reopen frozen block 1 from these advisory flags alone. Cross them with real player evidence first.

HARD 03 regression in the full model:

- bad RC5 fixture: human score ~61%, touch ~71%, tolerance ~43%;
- accepted RC5.1: human route **3 strokes**, human score ~83%, touch ~89%, tolerance ~72%;
- regression result: **PASS**.

Current simulation-only difficulty order from the full Design Advisor:

1. Classic 01 — difficulty 2.0/5 · originality 3.7/5
2. Classic 05 — 2.2/5 · 3.4/5
3. Classic 07 — 2.2/5 · 2.9/5
4. Classic 03 — 2.3/5 · 3.5/5
5. Classic 02 — 2.4/5 · 3.5/5
6. Classic 08 — 2.4/5 · 3.5/5
7. Classic 06 — 2.4/5 · 3.5/5
8. Classic 04 — 2.6/5 · 3.6/5
9. Classic 09 — 2.8/5 · 3.4/5
10. HARD 03 — 2.9/5 · 3.6/5
11. HARD 04 — 2.9/5 · 3.4/5
12. HARD 01 — 3.1/5 · 3.4/5
13. HARD 05 — 3.1/5 · 4.1/5
14. HARD 02 — 3.2/5 · 3.7/5
15. Classic 10 — 3.4/5 · 2.9/5

These are calibration outputs, **not authored truth**. Reorder/redesign only after combining them with human evidence.

### Feedback-aware Design Advisor

`audit2Design.ts` accepts an optional aggregated feedback snapshot containing, per level:

- sample size;
- average fun;
- average originality;
- average difficulty;
- bug rate;
- HARD surprise/caught score;
- recurring themes.

Recommendations distinguish cases such as:

- low fun + low difficulty → add a memorable decision/mechanic/risk-reward, not precision;
- low fun + high difficulty → reduce friction/precision and improve readability;
- reasonable difficulty + low fun → redesign the strategic question/silhouette;
- low originality → introduce a genuinely new interaction, not cosmetic geometry;
- weak HARD surprise → improve bait/consequence without making the learned answer arbitrary;
- player/audit difficulty disagreement → investigate input/readability/knowledge first.

Current RC5.1 feedback remains tiny and owner-weighted. One H03 response currently gives roughly 3/5 fun, 3/5 originality, 3/5 difficulty and 5/5 surprise. Do not overfit to n=1.

When importing feedback into Audit 2.1, use **aggregated/non-identifying snapshots**. Do not commit tester aliases, UUIDs or raw private comments just to run design analysis.

## Validation commands

Normal release checks:

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
- “Mejorados los controles cerca de los bordes.”
- “Mejoras y correcciones en Community Maps.”

Do not expose:

- trap solutions;
- exact routes;
- internal telemetry/build architecture;
- implementation details;
- long AI-sounding explanations.

README/documentation can stay technical. Patch Notes are for players.

Files:

- `src/systems/PatchNotesSystem.ts`
- `src/scenes/PatchNotesScene.ts`

## Player identity / feedback

- `tester_id` is stable anonymous browser identity;
- alias is editable in-game and **must not change tester_id**;
- changing alias must not unlock another survey/rating;
- feedback/report UI should be in-game, not browser prompts.

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
7. update server build ID if gameplay/data comparability changes;
8. maintenance OFF.

With feature/lab branches, most level design and audit work should happen with **no maintenance at all**.

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

**Block 1 is frozen. Audit 2.1 is merged into `dev`, fully calibrated against the H03 regression, and is now the standard development critic.**

1. Verify post-merge CI/Pages remain green. No maintenance is required because campaign physics/geometry is unchanged.
2. Run Community Maps end-to-end with at least two testers: create → draft → playtest → publish → discover → play → rate → comment → report → creator delete / self-rating blocked.
3. Start **campaign block 2 on a new feature branch**, never directly on `dev`.
4. Before authoring many new holes, define a small set of genuinely new mechanics and add each mechanic to `GolfSimulation` + renderer/editor support + audit coverage first.
5. Use Audit 2.1 to rank candidate holes by difficulty/originality and recommend changes, then manually play them before promotion.
6. When reviewing beta feedback, query Supabase, create an aggregated/non-identifying snapshot and feed it to `audit2Design.ts`.
7. Build a private DEV/review dashboard only when enough fresh beta/community data exists to justify it.

## Development principle

**Author deliberately → audit adversarially → model humans → play manually → test with humans → curate → approve.**
