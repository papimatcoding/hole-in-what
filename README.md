# Troll Golf

Mobile-first 2D arcade minigolf built with Phaser + TypeScript. The current goal is **not** metagame expansion: it is to make the core shot, authored campaign and HARD troll identity good enough to retain real players.

> **SOURCE OF TRUTH / CHAT HANDOFF — Last updated 2026-08-27 after commit `8d8c432`**
>
> If development continues in another chat/session, read this file first. The exact resume point is in **Immediate next steps** below. Keep this README updated whenever campaign state, priorities, architecture, risks or next actions change.

## Play / branches

- Public beta / GitHub Pages: https://papimatcoding.github.io/troll-golf/
- `main`: stable history.
- `dev`: active development and Pages beta deploy.
- Pages deploy through **GitHub Actions**.
- Vite base: `/troll-golf/`.

## Current milestone

Build an exceptional first external-beta vertical slice before multiplayer, ranked, seasons, ads or economy expansion.

Current slice:

- **10 authored Classic holes**
- **5 authored HARD/Troll holes**
- shared pure-TypeScript physics
- automated geometry/clearance/solver/originality audits
- anonymous beta telemetry + per-level feedback
- Community Maps MVP

Campaign quality matters more than level count. Do not protect a weak level because time was already spent on it.

## CURRENT STATE — important

Current gameplay revision is certified by both the fast CI audit and the long solver.

- normal CI is **green**;
- typecheck/build/hole physics/mechanic integrity/geometry/clearance all pass;
- originality audit flags **0 structurally similar pairs**;
- fast campaign audit: **Classic 10/10 clean**;
- fast campaign audit: **Troll 5/5 clean**;
- Full Audit (`FULL_AUDIT=1`): **Classic 10/10 clean**;
- Full Audit (`FULL_AUDIT=1`): **Troll 5/5 clean**;
- no current level is `TOO_EASY_FOR_TARGET`, `MECHANIC_BYPASSED` or `NO_ROUTE_FOUND` in the certified long solver;
- the remaining long-solver warning is only the intentional difficulty dip from Classic 04 to the first-bumper lesson in Classic 05;
- `.github/workflows/full-audit.yml` now fails fast through mechanic, geometry and clearance checks before running the long solver.

### Latest certification fixes

The first Full Audit exposed three real mechanic bypasses that the fast probe had missed:

1. **Classic 05** — an outer bank HIO skipped the first bumper. The lower shelf plus right-side guard now remove that bypass. Full solver still finds an elite HIO, but it **uses the bumper** (best full-solver line `342°@0.96`, robustness 8%).
2. **Classic 10** — a two-stroke solver route skipped the chapter-exam bumper. A lower gate now forces bumper interaction while preserving a two-stroke mastery route in the full solver.
3. **Troll 05** — the optimal route ignored the moving crossing. The waist was narrowed so the best route now **uses the moving mechanic** while still triggering the intended troll sequence.

Current representative Full Audit results:

- Classic 05: best 1, HIO yes, bumper used yes, difficulty 24.5, status OK;
- Classic 09: best 2, HIO no, sand used yes, difficulty 35.9, status OK;
- Classic 10: best 2, blind 3, bumper used yes, difficulty 36.6, status OK;
- Troll 05: best 2, blind 3, moving used yes, trap triggered yes, difficulty 48.8, status OK.

Do not redesign Classic 05 merely to remove its difficulty-dip warning. It is intentionally the first open bumper lesson after the harder setup-shot level; verify the pacing manually before changing it.

### Beta approval gate

The project owner can send the Pages link to friends only after all of these are true:

1. normal CI green — **DONE**;
2. Full Audit green on the current authored slice — **DONE**;
3. one complete manual desktop playthrough with no blocker-level issue — **PENDING**;
4. one complete mobile/touch playthrough with no blocker-level issue — **PENDING**;
5. feedback submission flow works in the deployed Pages build — **PENDING FINAL CHECK**.

When these are satisfied, the handoff should explicitly say **FRIENDS BETA: GO**.

Current status: **FRIENDS BETA: HOLD** — automated certification is complete; manual desktop/mobile validation is now the blocker.

## Core design rules

### Classic

Every hole needs a different silhouette **and** a different strategic question. Mirrors, trivial rotations or “same layout + different mechanic” do not count as new levels.

Difficulty should rise as a curve. Small breathers are acceptable; large inversions are not. New mechanics need room to be learned, then reused in different contexts. Early HIOs may be accessible; later HIOs should normally be narrow mastery lines rather than obvious highways. Gameplay objects must affect a decision.

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

HARD is the main differentiator and must feel troll from hole 1.

A good trap:

1. makes the obvious first read attractive;
2. surprises the player;
3. is deterministic and understandable afterwards;
4. leaves a fair route after discovery;
5. creates “qué cabrón”, not “esto es random”.

Current trap vocabulary deliberately stays small and composable: pop wall, surprise bumper, disappearing floor/void, cross-gate, false safe lane, rebound punishment and combinations. Future candidates include a dodging/relocating cup and richer deterministic state changes, but gameplay behavior must live in `GolfSimulation`, never render-only hacks.

Level Select must not spoil HARD traps before play.

## Architecture

### Physics authority

`src/systems/GolfSimulation.ts` is the single gameplay-physics authority.

It owns ball launch/friction, bounds/walls, triangles/curves, bumpers, sand/ice, boosters/fans, portals, moving objects, ramps/trampolines, void, pop traps and cup sweep/lip/sink logic.

Gameplay, audits and Community Maps share this simulation. Phaser should mainly own input, rendering, audio, haptics and FX. **Do not reintroduce a second auditor physics implementation.**

### Main runtime

- `src/scenes/GameplayScene.ts` — campaign gameplay
- `src/systems/CourseRenderer.ts` — drawing/dynamic visuals
- `src/data/campaign.ts` — player-facing authored campaign
- `src/data/authored/classic.ts` — Classic holes
- `src/data/authored/hard.ts` — HARD holes
- `src/systems/SaveSystem.ts` — progress/cosmetics/wallet

The old `GameScene -> V8 -> V81 -> V82` patch-inheritance chain is gone. Do not create V83/V84-style patch classes.

### Procedural status

Procedural generation may remain as internal prototyping/tooling only. It must **not** choose player-facing campaign holes and must never silently replace missing authored content.

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

Long solver / block certification:

```bash
FULL_AUDIT=1 npm run audit:courses
```

`.github/workflows/full-audit.yml` runs the long certification automatically on authored/physics/auditor changes and supports manual dispatch. It now runs mechanic integrity, geometry and clearance first so invalid maps fail fast before the expensive solver.

The solver is a critic, not the designer. Never lower star targets merely to turn warnings green. First inspect whether the solver found a route that bypasses the intended decision.

## Stars

- 1★ = complete
- 2★ = solid strokes
- 3★ = realistic mastery/par
- time is stored separately and does not remove stars

Targets are authored per level.

## Beta mode / telemetry

`src/config/beta.ts` separates tester UX from real progression. During beta all authored holes are accessible, level-select spoilers are hidden, previous/next navigation is available, Results supports fast feedback/reporting, and editor/previews are available.

Supabase project: **Troll Golf** (`xtekdrkqgfjnnwawyoim`). Never commit service-role/admin secrets.

Backend beta tables:

- `beta_testers`
- `beta_runs`
- `beta_level_feedback`
- `beta_game_feedback`

Tester identity is a persistent anonymous browser UUID. Current quick survey: Fun, Originality, Difficulty, optional BUG, and HARD optional “me pilló”.

`BetaTelemetry.beginAttempt()` still starts too late (result flow), so abandoned/retry counting is imperfect; this is backlog, not a beta blocker.

## Community Maps MVP

Backend tables:

- `community_maps`
- `community_map_runs`
- `community_map_feedback`

Edge Function: `community-maps`.

Current flow: create draft in Beta Lab/Editor → publish with title/description → browse newest/top → play using shared simulation → rate fun/originality/difficulty. Creator self-rating is blocked in API/database, and each tester gets one rating per map.

Latest community fix before this campaign pass: `community: avoid Phaser loader name collision`.

Still deliberately absent: accounts/social profiles, comments/follows, full moderation, search/tags/pagination, rich thumbnails, automatic campaign promotion and private review dashboard.

## Private DEV zone

**Not implemented yet.** Do not protect it with a hidden frontend button or hard-coded password. It needs backend authorization.

Build it only once there is enough real beta/community data to make it useful. Intended functions: aggregate feedback, inspect bugs/comments by build+level, see trends, review top community maps and feature/hide/reject promotion candidates.

## Beta Lab / editor

Internal authoring tool with selection/manipulation, grid/snap, duplicate/delete, honest rotations where physics supports them, playtest and JSON draft storage/export.

Wall physics is currently axis-aligned. Do not expose fake arbitrary visual rotation that disagrees with collision physics.

## Known non-blockers

- bundle warning remains around ~1.5 MB minified / ~395 kB gzip; code splitting can wait;
- difficulty still needs real human data despite green audits;
- Classic 05 intentionally dips after Classic 04 and needs human pacing validation rather than automatic redesign;
- HARD will eventually need more troll primitives, but do not add many at once;
- Community play is intentionally more minimal than campaign play.

## Things deliberately NOT being built now

Do not spend this milestone on multiplayer, ranked/MMR, smart bots as a player feature, battle pass/seasons, Daily Hole, ads, lootboxes, extra currencies, more shop screens or a large account system.

## Immediate next steps — resume here

**AUTOMATED CERTIFICATION IS COMPLETE: 10/10 Classic + 5/5 Troll clean in fast CI and Full Audit. Do not author more levels yet.**

1. Manually play all 15 holes in sequence on desktop. Evaluate fun, readability, repetition, difficulty curve and whether each teaching/trap idea is actually felt. Specifically judge whether Classic 05 feels like a welcome first-bumper breather or an awkward difficulty collapse.
2. Fix only blocker-level/manual issues discovered in that desktop pass, then re-run CI/Full Audit only if authored geometry or shared physics changes.
3. Repeat the whole slice on mobile/touch; pay special attention to narrow corridors, aiming precision, UI obstruction and restart/next-level flow.
4. Verify the deployed feedback/report flow once more (per-level rating, optional bug report and global feedback).
5. If steps 1–4 have no blocker, change this README to **FRIENDS BETA: GO** and send the Pages URL to a small group of friends.
6. Collect per-level feedback and rebuild only levels that real data identifies as weak/repetitive/spiky. Do not regenerate the campaign wholesale.
7. Validate Community Maps end-to-end with a few maps/testers (publish → discover → play → rate → self-rating blocked).
8. Build the secure DEV/review dashboard only after enough feedback exists.
9. Author block 2 only when block 1 is genuinely strong.

## Development principle

The project previously got stuck in procedural generation → patch → regenerated repetition → patch.

**Author deliberately → audit adversarially → play manually → test with humans → curate → approve.**
