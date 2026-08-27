# Troll Golf

Mobile-first 2D arcade minigolf built with Phaser + TypeScript. The current goal is **not** metagame expansion: it is to make the core shot, authored campaign and HARD troll identity good enough to retain real players.

> **SOURCE OF TRUTH / CHAT HANDOFF — Last updated 2026-08-27 after commit `77964c8`**
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

As of commit `77964c87e9284268d07296d285e733570e1dc92f`:

- normal CI is green on the latest gameplay revision;
- typecheck/build/hole physics/mechanic integrity/geometry/clearance all pass;
- originality audit flags **0 structurally similar pairs**;
- fast campaign audit reports **Classic 10/10 clean**;
- fast campaign audit reports **Troll 5/5 clean**;
- no current level is `TOO_EASY_FOR_TARGET`, `MECHANIC_BYPASSED` or `NO_ROUTE_FOUND` in the fast audit;
- Classic 09 was the latest gameplay blocker and is fixed;
- `.github/workflows/full-audit.yml` now exists and runs `FULL_AUDIT=1 npm run audit:courses` on authored/physics/auditor changes and via manual dispatch;
- the first Full Audit run has been started for the current slice. **Do not declare external-beta approval until that run finishes successfully and manual desktop/mobile play is completed.**

### Beta approval gate

The project owner can send the Pages link to friends only after all of these are true:

1. normal CI green;
2. Full Audit green on the current authored slice;
3. one complete manual desktop playthrough with no blocker-level issue;
4. one complete mobile/touch playthrough with no blocker-level issue;
5. feedback submission flow works in the deployed Pages build.

When these are satisfied, the handoff should explicitly say **FRIENDS BETA: GO**. Until then it should say **FRIENDS BETA: HOLD**.

Current status: **FRIENDS BETA: HOLD** — waiting for Full Audit result and manual desktop/mobile validation.

### Latest Classic 09 work

Original problem: Classic 09 was meant to be **sand as route choice**, but the solver found broad one-shot solutions that either made the level far too easy or bypassed the sand entirely.

Two iterations were made:

1. lower shelf extended to close the obvious diagonal HIO;
2. a short right-side wall fin was added after the solver found a 288° full-power side-bank HIO that skipped the sand.

Current fast-audit result for Classic 09:

- 3★ target: 3 strokes
- best known: **2 strokes**
- blind solver: **2 strokes**
- HIO: **no**
- primary mechanic: sand
- mechanic used: **yes**
- robustness: **33%**
- difficulty score: **33.2**
- status: **OK**

Current Classic progression around the end of the block is now roughly:

- Classic 07: difficulty 32.8
- Classic 08: 31.9
- Classic 09: 33.2
- Classic 10: 35.8

Remaining fast-audit warnings are non-fatal and belong mainly to early accessible HIOs / intentional breathers (notably Classic 03 and 05). Do not redesign them automatically just to make warnings disappear; verify them manually first.

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

GitHub Actions now includes `.github/workflows/full-audit.yml`, which runs the long solver automatically when authored campaign files, shared physics, course validation or the auditor change. It also supports `workflow_dispatch` for manual certification runs.

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
- HARD will eventually need more troll primitives, but do not add many at once;
- Community play is intentionally more minimal than campaign play.

## Things deliberately NOT being built now

Do not spend this milestone on multiplayer, ranked/MMR, smart bots as a player feature, battle pass/seasons, Daily Hole, ads, lootboxes, extra currencies, more shop screens or a large account system.

## Immediate next steps — resume here

**The campaign is 10/10 Classic + 5/5 Troll clean in the normal fast CI audit. A dedicated Full Audit workflow has just been added and its first certification run is in progress. Do not immediately author more levels.**

1. Inspect the current **Full Audit** GitHub Actions run. If it exposes a shortcut/bypass, fix only the affected authored level and re-run normal CI + Full Audit.
2. Once Full Audit is green, manually play all 15 holes in sequence on desktop, evaluating fun, readability, repetition, difficulty curve and whether each teaching/trap idea is actually felt.
3. Repeat the whole slice on mobile/touch; pay special attention to narrow corridors, aiming precision, UI obstruction and restart/next-level flow.
4. Verify the deployed feedback/report flow once more.
5. If steps 1–4 have no blocker, change this README to **FRIENDS BETA: GO** and send the Pages URL to a small group of friends.
6. Collect per-level feedback and rebuild only levels that real data identifies as weak/repetitive/spiky. Do not regenerate the campaign wholesale.
7. Validate Community Maps end-to-end with a few maps/testers (publish → discover → play → rate → self-rating blocked).
8. Build the secure DEV/review dashboard only after enough feedback exists.
9. Author block 2 only when block 1 is genuinely strong.

## Development principle

The project previously got stuck in procedural generation → patch → regenerated repetition → patch.

**Author deliberately → audit adversarially → play manually → test with humans → curate → approve.**
