# Troll Golf

Mobile-first 2D arcade minigolf built with Phaser + TypeScript. The current goal is **not** metagame expansion: it is to make the core shot, authored campaign and HARD troll identity good enough to retain real players.

> **SOURCE OF TRUTH / CHAT HANDOFF — Last updated 2026-08-27 after commit `4e1d77e` + beta backend v3**
>
> If development continues in another chat/session, read this file first. The exact resume point is in **Immediate next steps** below. Keep this README updated whenever campaign state, priorities, architecture, risks or next actions change.

## Play / branches

- Friends beta / GitHub Pages: https://papimatcoding.github.io/troll-golf/
- `main`: stable history.
- `dev`: active development and Pages beta deploy.
- Pages deploy through **GitHub Actions**.
- Vite base: `/troll-golf/`.

## Current milestone

The first external-beta vertical slice is now technically certified and deployed.

Current slice:

- **10 authored Classic holes**
- **5 authored HARD/Troll holes**
- shared pure-TypeScript physics
- automated geometry/clearance/solver/originality audits
- anonymous beta telemetry + per-level feedback + global survey + remote quick reports
- Community Maps MVP

Campaign quality matters more than level count. Do not protect a weak level because time was already spent on it.

## CURRENT STATE — important

### FRIENDS BETA: GO

The first small external friend beta is approved.

Technical release state:

- latest normal CI is **green**;
- latest Pages build/deploy is **green**;
- typecheck/build/hole physics/mechanic integrity/geometry/clearance all pass;
- originality audit flags **0 structurally similar pairs**;
- fast campaign audit: **Classic 10/10 clean**;
- fast campaign audit: **Troll 5/5 clean**;
- Full Audit (`FULL_AUDIT=1`): **Classic 10/10 clean**;
- Full Audit (`FULL_AUDIT=1`): **Troll 5/5 clean**;
- no current level is `TOO_EASY_FOR_TARGET`, `MECHANIC_BYPASSED` or `NO_ROUTE_FOUND` in the certified long solver;
- latest telemetry/reporting changes do not touch gameplay physics or authored geometry, so the long certification still applies to the deployed gameplay;
- deployed beta build ID is **`beta-block-1-friends-rc1`**, separating friend-beta data from prior internal test data;
- quick `REPORTAR` feedback now reaches Supabase remotely and is also kept locally as a fallback;
- backend has a dedicated `beta_reports` table with RLS enabled;
- Supabase `beta-feedback` Edge Function is on v3 with `report` support;
- Supabase security advisor has no remaining warning-level issue from this pass; the old mutable `search_path` warning on the Community Maps self-rating trigger was fixed;
- missing Community Maps foreign-key indexes flagged by the performance advisor were added.

The remaining job is **human validation**, which is now exactly what this controlled friend beta is for. Do not mistake `GO` for “finished game”: it means the build is technically healthy enough to put in front of real testers and trust the telemetry/feedback they generate.

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

Do not redesign Classic 05 merely to remove its difficulty-dip warning. It is intentionally the first open bumper lesson after the harder setup-shot level; use human data to decide whether that pacing works.

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

`.github/workflows/full-audit.yml` runs the long certification automatically on authored/physics/auditor changes and supports manual dispatch. It runs mechanic integrity, geometry and clearance first so invalid maps fail fast before the expensive solver.

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

Friends-beta build ID:

- `beta-block-1-friends-rc1`

Backend beta tables:

- `beta_testers`
- `beta_runs`
- `beta_level_feedback`
- `beta_game_feedback`
- `beta_reports`

Tester identity is a persistent anonymous browser UUID.

Per-level survey currently records Fun, Originality, Difficulty, optional BUG tag, and HARD optional “me pilló”. A global survey is triggered after completing the slice and records overall fun, controls, variety, difficulty curve, HARD, willingness to keep playing, favourite/worst level and ideas.

`REPORTAR` categories (`bug`, too easy, too hard, repetitive, object/map, other) are sent to the `beta-feedback` Edge Function and inserted into `beta_reports`. The same report is retained in local storage as a fallback/export copy so a temporary network failure does not destroy tester notes.

`BetaTelemetry.beginAttempt()` still starts in the result flow, so abandoned/retry counting is imperfect. This is a known non-blocker; do not interpret the `attempts` column as exact abandonment analytics yet.

The beta tables intentionally have RLS enabled and no direct client policies because browser clients do not access them directly; beta writes/reads are mediated by Edge Functions. The Supabase advisor therefore reports `rls_enabled_no_policy` as INFO, not as a vulnerability to “fix” with permissive policies.

## Community Maps MVP

Backend tables:

- `community_maps`
- `community_map_runs`
- `community_map_feedback`

Edge Function: `community-maps`.

Current flow: create draft in Beta Lab/Editor → publish with title/description → browse newest/top → play using shared simulation → rate fun/originality/difficulty. Creator self-rating is blocked in API/database, and each tester gets one rating per map.

Security/performance cleanup in the final friend-beta pass:

- `prevent_creator_community_rating()` now has an explicit safe `search_path`;
- covering indexes were added for Community Maps tester/creator foreign keys.

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
- attempt/abandonment telemetry is not exact yet;
- HARD will eventually need more troll primitives, but do not add many at once;
- Community play is intentionally more minimal than campaign play.

## Things deliberately NOT being built now

Do not spend this milestone on multiplayer, ranked/MMR, smart bots as a player feature, battle pass/seasons, Daily Hole, ads, lootboxes, extra currencies, more shop screens or a large account system.

## Immediate next steps — resume here

**FRIENDS BETA: GO. The first job is no longer to author/fix blindly; it is to collect real human evidence.**

1. Send the Pages build to a **small first wave** of friends, preferably with a mix of desktop and mobile users.
2. Ask them to play without coaching. Do not explain HARD traps or optimal Classic routes beforehand.
3. Let the per-level survey, `REPORTAR`, global survey and run telemetry collect evidence. Ask testers to use `REPORTAR` immediately when something feels broken, unfair, repetitive or pointless.
4. Review `beta_reports`, `beta_level_feedback`, `beta_game_feedback` and `beta_runs` grouped by `build_id = beta-block-1-friends-rc1`.
5. Rebuild only levels that real data identifies as weak/repetitive/spiky. Do not regenerate the campaign wholesale.
6. If a gameplay/physics change is made, re-run normal CI and Full Audit before sending the updated build back out.
7. Validate Community Maps end-to-end with a few maps/testers (publish → discover → play → rate → self-rating blocked).
8. Build the secure DEV/review dashboard only after enough feedback exists to make it useful.
9. Author block 2 only when block 1 is genuinely strong.

## Development principle

The project previously got stuck in procedural generation → patch → regenerated repetition → patch.

**Author deliberately → audit adversarially → play manually → test with humans → curate → approve.**
