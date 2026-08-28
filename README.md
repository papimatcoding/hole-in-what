# Hole in What?

Mobile-first 2D arcade minigolf built with Phaser + TypeScript.

> **SOURCE OF TRUTH / CHAT HANDOFF — 2026-08-28**
>
> Read this file first when continuing in another chat. Update it after meaningful changes to campaign state, architecture, validation, backend/live ops, beta status or immediate priorities.

## Current status

### Public BETA — RC5.1 live on `dev`

The public GitHub Pages build still comes from `dev` and is intentionally unchanged while the next version is developed on a feature branch.

- Pages URL: `https://papimatcoding.github.io/troll-golf/`
- maintenance: **OFF**
- live campaign: Classic 01–10 + HARD 01–05
- live branding is still the old Troll Golf build until the next certified promotion

Do **not** rename the repository/Pages path yet. The public beta link must remain stable until a deliberate URL migration is planned.

## Current feature laboratory

Active branch:

- `feature/block-2-authoring`

This branch is **not deployed**.

Working title/brand for the next beta:

- **Hole in What?**
- candidate build ID: `hole-in-what-beta-rc6`

A broad exact-name web/game-store/trademark-index search found no exact existing videogame called `Hole in What?`. Treat that as practical indie-name clearance, **not** a professional legal trademark opinion. Do a final direct registry/class check before a significant commercial launch.

The feature branch currently includes:

- Classic 11–13 Block 2 candidates;
- C06 redesign so its bumper matters to a strong human route;
- second C11/C12 ice pass using shorter braking bands rather than large continuous ice lakes;
- certified ice / booster / portal mechanic contracts;
- profile/input DOM stacking fix;
- Community comments moved from browser `prompt()` to an in-game textarea editor;
- opt-in global survey invitation + stable one-time 5-gem reward;
- maintenance polling + hard page reload when maintenance ends;
- concise beta Patch Notes;
- **Hole in What?** browser/menu branding;
- anonymous attempt + shot telemetry groundwork for real Audit calibration.

Do not update backend `current_build_id` to the candidate build until the version is actually promoted to `dev`.

## Official branch / release workflow

**`feature/**` → `dev` (BETA + human review) → `main` (official release)**

### `feature/**`

- all active development;
- new mechanics, levels, UI, telemetry and fixes;
- technical smoke checks on every relevant push;
- Full Audit for campaign-affecting changes;
- never deploy public Pages from here.

### `dev`

- public beta and current Pages source;
- receives already-certified feature work;
- real mobile/desktop human testing happens here;
- telemetry + feedback reveal problems the model cannot prove;
- never use `dev` as a scratchpad.

### `main`

- official shipped state;
- promote an accepted `dev` only when content/polish are sufficient for a real release.

There is no normal `release/**` stage. See `docs/release-process.md`.

## Level-development workflow

Separate **individual level quality** from **campaign ordering**.

1. audit/improve all existing levels in small related batches;
2. Full Audit the complete campaign after every gameplay batch;
3. only after individual quality is strong, review/reorder progression if necessary;
4. add new levels in small authored groups;
5. Full Audit each new group;
6. promote the closed feature state to `dev` for human beta testing;
7. use beta evidence to create the next feature fixes.

### Existing-level batches

- **Batch A · C01–05 — CLOSED / no geometry changes needed.**
- **Batch B · C06–10 — CLOSED.** C06 was the only required change.
- **Batch C · C11–13 — IN PROGRESS.** C13 already passes strongly; C11/C12 are being tuned specifically for ice moving-timeout risk.
- **Batch D · H01–05 — NEXT.** H01 is currently back on the accepted RC5.1 baseline until its own batch begins.

### C06 accepted Full result

After the bumper-route correction:

- touch: **86%**;
- casual: **77%**;
- minimum shot tolerance: **85%**;
- human score: **86%**;
- recovery: **100%**;
- `MECHANIC_RELEVANCE_LOW`: removed;
- status: **PASS**.

### C11/C12 history

First reduced-lake pass improved execution but did not remove the actual timeout problem:

- C11: touch 97%, tolerance 75%, `MOVING_TIMEOUT_RISK:11%`;
- C12: touch 95%, tolerance 68%, `MOVING_TIMEOUT_RISK:14%`.

The current second pass replaces long ice lakes with short crossable/staggered ice bands separated by grass. It must be accepted or rejected from a **Full Audit**, not intuition.

## Audit 2.1 policy

Audit 2.1 is an internal critic, not an oracle.

Core scripts:

- `scripts/courseAudit.ts` — strict/adversarial solver;
- `scripts/audit2.ts` — human execution model;
- `scripts/audit2Design.ts` — difficulty/originality + design advice;
- `scripts/courseOriginalityAudit.ts` — structural originality.

### Full Audit only for design acceptance

```bash
FULL_AUDIT=1 npm run audit:courses
npm run audit:human:full
npm run audit:design
npm run audit:originality
```

`.github/workflows/lab-audit.yml` is only **technical smoke**: typecheck, build, physics, mechanic contracts, geometry and clearance.

`.github/workflows/lab-full-audit.yml` is expensive campaign certification. It now reruns automatically only when campaign data, simulation, types, audit scripts or the Full workflow itself changes. UI/branding/telemetry/docs commits must not cancel a valid level audit.

> **Mathematical solution ≠ automated human model ≠ real human validation.**

### Main Audit signals

- learned / naive / explorer routes;
- best vs robust human route;
- HIO / cheese / bypass search;
- touch, mouse and casual perturbation profiles;
- per-shot angle/power tolerance;
- recovery after bad first shots;
- edge-rest risk;
- primary mechanic relevance;
- HARD trap trigger + real consequence;
- moving timeout / softlock risk;
- route diversity;
- geometry / clearance / structural originality.

Machine difficulty/originality and player ratings stay separate. Never average them into one score.

### Permanent HARD 03 regression

RC5 HARD 03 was mathematically solvable but effectively too precise for a human. RC5.1 widened the learned answer and was manually accepted.

Keep the bad-vs-accepted fixture permanently. Any future Audit calibration must continue rating the accepted geometry materially better than the known-bad RC5 version.

## Anonymous beta telemetry

Detailed contract: `docs/beta-telemetry.md`.

The purpose is to calibrate Audit 2.1 against real behaviour without collecting unnecessary personal data.

### Stable identity

- `tester_id` is a random browser UUID;
- optional alias is separate and editable;
- changing alias never changes tester ID;
- legacy `troll-golf-*` localStorage keys are intentionally retained after the **Hole in What?** rename so returning players do not become fake “new testers”.

### New coarse device context

New feature builds use:

- `mobile | tablet | desktop | unknown`;
- coarse-pointer yes/no;
- viewport dimensions rounded to nearest 100 px.

New analytics registration no longer needs the full browser user-agent or exact viewport dimensions.

### New attempt data

`beta_attempts` records every campaign level entry, not only successes:

- anonymous tester/build/level;
- attempt number;
- start/end;
- completed vs abandoned;
- exit reason when known;
- strokes/time/voids.

A stale unclosed attempt is useful abandonment evidence rather than being discarded.

### New shot data

`beta_shots` records gameplay-space information only:

- attempt + shot index;
- touch/mouse/pen/unknown;
- ball start/end coordinates in the fixed game field;
- angle + normalized power;
- duration;
- `rest | void | hole`;
- simulation event kinds touched during the shot.

Do **not** collect physical finger/mouse trajectories.

Backend schema is already additive and the `beta-feedback` Edge Function is v8/active. The current live `dev` client does not send the new shot events, so the public beta remains backward compatible until promotion.

Telemetry uploads are asynchronous/best-effort and must never block gameplay.

## Current beta sample

Across historical builds, assuming alias `Matkiller` is the owner/test device:

- 8 unique testers completed at least one level including owner;
- **7 external players** excluding owner;
- 32 external completed runs;
- only 1 external tester reached 10+ levels;
- 4/7 external players completed only 1–2 levels;
- 13 external browser tester identities were registered, with 6 never completing a level.

This is enough for diagnostics, not for statistically calibrating the human model. The next beta should target substantially more independent players and deeper sessions.

## Audit calibration from real beta data

Do not retune synthetic touch/mouse profiles from tiny samples.

Once the next beta has enough shots:

- cluster successful route families;
- compare real angle/power dispersion around those routes;
- use robust estimates (median/MAD or trimmed statistics) rather than ordinary variance polluted by exploratory shots;
- estimate touch and mouse separately;
- validate new parameters on held-out levels;
- retain HARD 03 as a known regression fixture.

Rough evidence stages:

- `<30` external players: diagnostic only;
- `30–50`: provisional estimates where per-level samples are adequate;
- `50–100+`: reasonable point to begin recalibrating global touch/mouse priors if holdout performance improves.

## Physics authority

`src/systems/GolfSimulation.ts` is the **single physics authority** for campaign, audits and Community Maps.

It owns launch/friction, bounds, walls, triangles, curves, bumpers, sand, ice, boosters, fans, portals, moving objects, ramps, trampolines, voids/pop traps and cup interaction.

Phaser owns rendering, input, audio, haptics and FX.

Runtime campaign files:

- `src/scenes/GameplayScene.ts`
- `src/systems/GolfSimulation.ts`
- `src/systems/CourseRenderer.ts`
- `src/systems/ShotInputSystem.ts`
- `src/data/campaign.ts`
- `src/data/authored/classic.ts`
- `src/data/authored/classicBlock2.ts`
- `src/data/authored/hard.ts`
- `src/systems/SaveSystem.ts`

Procedural generation is tooling only, never campaign fallback content.

## Campaign design principles

### Classic

Each level needs a distinct silhouette **and** strategic question.

Preferred learning rhythm:

**teach → apply → reinterpret/combine → exam**

A mechanic introduction may intentionally lower raw difficulty. Do not “fix” a teaching reset by adding precision for its own sake.

### HARD

A good trap:

1. makes an obvious read attractive;
2. surprises on the first attempt;
3. is deterministic and understandable afterwards;
4. changes the failed/learned route;
5. leaves a fair learned answer;
6. rewards knowledge more than pixel precision;
7. creates “qué cabrón”, not “esto es random”.

Never spoil HARD solutions in selection screens, tutorials or Patch Notes.

## Community Maps

Current single-hole loop:

**Editor → explicit draft → playtest → publish → discover → play → rate/comment/report**

Editing invalidates previous playtest certification. Creator self-rating is blocked and creator-owned deletion is server validated.

Schema is prepared for future multi-hole courses, but do not expand there until the single-hole loop survives real multi-user beta testing.

## Live ops / maintenance

Backend table: `app_status`.

Maintenance stays **OFF during feature development**.

Real beta deployment:

1. close feature scope and campaign Full Audit;
2. final technical smoke + documentation;
3. maintenance ON immediately before the live transition;
4. promote feature state to `dev`;
5. wait for Pages deploy and smoke the actual URL;
6. set matching backend build/patch state;
7. maintenance OFF; clients hard reload.

If deployment is broken, keep maintenance enabled and rollback `dev` before reopening.

## Patch Notes policy

Use **BETA**, never “Friends Beta”. Player-facing notes are concise, natural and spoiler-free.

Do not expose trap solutions, exact routes, internal telemetry/audit architecture or long implementation detail.

## Deliberately not building now

Do not spend this milestone on ranked/MMR multiplayer, battle pass/seasons, Daily Hole, ads/lootboxes, extra currencies or large account systems.

Long-term ideas such as a much larger Classic/HARD campaign, competitive online, bots/ranks and seasons remain future possibilities.

## Immediate next steps — resume here

1. Keep everything on `feature/block-2-authoring`; **do not merge to `dev` yet**.
2. Finish the current Full Audit of the second C11/C12 ice-band pass. Batch C closes only if C11/C12 lose the moving-timeout review without introducing execution/mechanic/cheese regressions.
3. If Batch C closes, start **Batch D · H01–05**. Change H01 first and only if Full evidence supports it; H02–H05 stay untouched unless their Full evidence justifies work.
4. Verify the new anonymous attempt/shot telemetry end-to-end before beta promotion. It must never affect gameplay if the backend is unavailable.
5. After all existing levels are individually certified, evaluate campaign order/progression as a separate pass.
6. Then author additional Classic/HARD levels in small Full-Audit-certified batches until the campaign has substantial content.
7. Only after feature scope is closed, promote to `dev` and share the public beta link with a larger tester pool.
8. Use the resulting human data to calibrate Audit 2.1 statistically; do not tune it from the current tiny sample.
9. Promote an accepted `dev` to `main` only when the game is ready for an official release.
