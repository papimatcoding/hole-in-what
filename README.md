# Troll Golf

Mobile-first 2D arcade minigolf built with Phaser + TypeScript. The current goal is **not** metagame expansion: it is to make the core shot, authored campaign and HARD troll identity good enough to retain real players.

> **Source of truth / chat handoff** — Last updated 2026-08-27. If development continues in another chat/session, read this file before changing campaign architecture or adding features.

## Play / branches

- Public beta / GitHub Pages: https://papimatcoding.github.io/troll-golf/
- `main`: stable history.
- `dev`: active development and Pages beta deploy.
- Pages must deploy through **GitHub Actions**, not branch/static-source deploy.
- Vite base is `/troll-golf/`.

## Current priority

Build an exceptional vertical slice before multiplayer, ranked, seasons, ads or more economy.

Current external-beta target:

- **10 Classic authored holes**
- **5 HARD authored holes**
- shared physics + automated audits
- fast anonymous beta feedback
- Community Maps MVP

Campaign quality matters more than level count. A level is deleted/rebuilt rather than protected because work was already spent on it.

## Core design rules

### Classic

- Every hole needs a different silhouette **and** a different strategic question.
- Do not count `same map + different mechanic`, mirrors or trivial rotations as original levels.
- Difficulty should rise as a curve. Small breathers are fine; large inversions are not.
- New mechanics are introduced with space to learn them, then reused in new contexts.
- Early HIOs can be accessible. Later HIOs should normally be narrow mastery lines, not obvious highways.
- Objects must affect a decision. Decorative gameplay objects are a design failure.

Current block-1 teaching plan:

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

### HARD

HARD is the main differentiator of Troll Golf and must be troll from hole 1.

A good trap:

1. makes the obvious first read attractive;
2. surprises the player;
3. is deterministic and understandable afterwards;
4. leaves a fair route after discovery;
5. creates the reaction “qué cabrón” rather than “esto es random”.

Existing trap vocabulary deliberately stays small and composable: pop wall, surprise bumper, disappearing floor/void, cross-gate, false safe lane, rebound punishment and late combinations. Future candidates include a cup that dodges/relocates, reactive obstacles and richer deterministic state changes, but they must live in `GolfSimulation`, not as render-only hacks.

Level Select must **not** reveal HARD mechanics/traps before play.

## Architecture

### Physics authority

`src/systems/GolfSimulation.ts`

Pure TypeScript simulation owns ball state and gameplay physics:

- launch / friction
- bounds and wall collisions
- triangles / curves
- bumpers
- sand / ice
- boosters / fans
- portals
- moving walls / bumpers
- ramps / trampolines / vertical jump state
- void
- pop traps
- hole sweep / lip / sink detection

This simulation is shared by gameplay, course audit research and Community Maps. Phaser should primarily own input, rendering, audio, haptics and FX.

Do **not** reintroduce a second physics implementation in an auditor.

### Main runtime

- `src/scenes/GameplayScene.ts` — campaign gameplay.
- `src/systems/CourseRenderer.ts` — course drawing/dynamic visuals.
- `src/data/campaign.ts` — player-facing authored campaign only.
- `src/data/authored/classic.ts` — Classic authored holes.
- `src/data/authored/hard.ts` — HARD authored holes.
- `src/systems/SaveSystem.ts` — progress/cosmetics/wallet.

The old `GameScene -> V8 -> V81 -> V82` inheritance chain was removed from runtime. Do not start a new V83/V84 patch-class chain.

### Procedural status

Procedural generation is **not** allowed to choose player-facing campaign levels anymore. It may remain as an internal prototyping/tooling aid. Campaign holes are authored and explicitly approved.

Do not silently fall back to generated levels if an authored level is missing.

## Level validation pipeline

Normal CI runs:

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

Use the long solver before approving a block:

```bash
FULL_AUDIT=1 npm run audit:courses
```

### What each check means

- `test:hole` — regression battery for cup physics, including speed and rim cases.
- `test:mechanics` — authored primary mechanic survives sanitization.
- `test:geometry` — catches accidental authored object overlaps.
- `test:clearance` — checks ball-sized navigability in initial and persistent troll states. Moving-obstacle snapshots are warnings because waiting is allowed.
- `audit:courses` — shared-physics solver/audit; tracks HIOs, best-known strokes, robustness, mechanic interaction and traps.
- `audit:originality` — structural similarity check designed to catch clones even when modifiers differ.

The solver is a critic, **not the designer**. Do not lower star targets just to make warnings green. First inspect whether a shortcut bypasses the interesting decision.

## Stars

Current philosophy:

- 1★ = complete.
- 2★ = solid strokes.
- 3★ = realistic mastery/par.
- Time is stored as a separate record and does **not** remove stars.

Targets are authored per level. Do not assign one par automatically to a whole difficulty band.

## Hole physics

The old cup bug behaved like an invisible circular collider. Current cup logic uses continuous segment sweep:

- reasonable centred/valid entries sink;
- an excessively fast shot can pass through;
- a real tangential rim graze can lip;
- lip feedback must never become an invisible wall;
- sinking must never depend on shot count or elapsed simulation state.

Keep `scripts/holePhysicsCheck.ts` green when touching cup physics.

## Beta testing mode

`src/config/beta.ts` controls tester-mode UX separately from real campaign progression.

During beta:

- all authored Classic/HARD holes can be accessed;
- Level Select does not spoil mechanics;
- keyboard/gameplay previous-next navigation is available;
- Results has fast feedback/reporting and leaderboard access;
- editor/previews are available for design work.

Do not fake unlocks by corrupting `SaveSystem`; beta access should remain a separate concern.

## Beta telemetry / Supabase

Supabase project: **Troll Golf** (`xtekdrkqgfjnnwawyoim`). Do not commit service-role keys or admin secrets.

Anonymous tester identity:

- browser receives a persistent UUID in localStorage;
- alias is optional;
- backend can distinguish testers/builds/levels;
- deleting storage/incognito can create a new identity, which is acceptable for the current friends-only beta.

Current beta build ID lives in `src/systems/BetaTelemetrySystem.ts`. Change it when a campaign revision should collect fresh per-level surveys.

Backend tables include:

- `beta_testers`
- `beta_runs`
- `beta_level_feedback`
- `beta_game_feedback`

Per-level feedback is unique for `tester + build + level`. Global feedback is one per tester/build.

Current quick level survey is deliberately lightweight:

- Fun
- Originality
- Difficulty
- optional BUG
- HARD optional “me pilló”

The three core answers auto-submit. Separate quick-report exists for concrete problems. Global survey remains after completing the whole beta slice.

## Community Maps — MVP

Backend schema added in Supabase:

- `community_maps`
- `community_map_runs`
- `community_map_feedback`

Edge Function: `community-maps`.

Current MVP flow:

1. Build a draft in **BETA LAB / Editor**.
2. Open **Community Maps**.
3. `+ PUBLICAR` publishes the current local editor draft with title/description.
4. Other testers can browse newest/top maps and play them using the shared `GolfSimulation`.
5. Players can rate fun/originality/difficulty.
6. Creator **cannot rate their own map**. This is enforced both by API logic and a PostgreSQL trigger, not only UI.
7. One tester gets one rating per map.

Publication validation currently limits JSON size/object counts and applies a simple per-tester publishing rate limit. Community maps do **not** automatically enter the official campaign.

### Community promotion plan

Good community maps should eventually enter a private review queue:

1. strong player feedback / enough votes;
2. automated geometry/clearance/shared-physics audit;
3. manual review by project owner (and optionally one trusted co-tester);
4. only then consider adaptation/promotion into official content.

### Community MVP deliberately does NOT include yet

- accounts/social profiles
- follows/comments
- full moderation tooling
- automatic official-campaign promotion
- pagination/search/tags
- rich preview thumbnails
- private dev review dashboard

## Private DEV zone

**Not implemented yet.**

Do not secure it with a hidden frontend button or hard-coded password. It must use backend authorization. Intended access: project owner and optionally one trusted tester/designer. Planned capabilities:

- see aggregated beta feedback;
- inspect comments/bugs by build + level;
- see difficulty/fun/originality trends;
- review top Community Maps;
- run/record audit status for promotion candidates;
- feature/hide/reject community maps.

## Beta Lab / level editor

The editor is an internal design tool and the main way to author future maps. It supports selection/manipulation, grid/snap, duplication/deletion, rotation where physics supports it, playtest and JSON draft storage/export.

Important: current wall physics is axis-aligned, so arbitrary visual rotation must not be exposed unless `GolfSimulation` supports the same collision rotation. Honest 90° transforms are preferable to fake free rotation.

The preview gallery exists to compare silhouettes before playing every hole and catch repeated compositions early.

## Current campaign status / known risks

- Campaign count is intentionally small: 10 Classic + 5 HARD.
- This is the first real external-beta block, not a finished 80-hole campaign.
- Classic 05 has been repeatedly rebuilt after geometry/clearance failures and is currently being revalidated as an open bumper lesson.
- The difficulty curve still needs real-player data; audit metrics are supporting evidence only.
- HARD identity needs continued iteration and future troll primitives, but avoid adding many mechanics at once.
- `BetaTelemetry.beginAttempt()` is currently called on result flow; true abandoned/retry attempt counting can be improved later.
- Community play is intentionally minimal compared with campaign gameplay.
- Bundle-size warning exists (>500 kB minified chunk); not a current core blocker, but code splitting can be revisited.

## Things deliberately NOT being built now

Do not spend current core-slice time on:

- multiplayer
- ranked/MMR
- smart bots as a player feature
- battle pass / seasons
- Daily Hole
- ads
- lootboxes
- extra currencies
- more shop screens
- large backend account system

Coins/cosmetics that already exist can stay, but core level design and retention have priority.

## Immediate next steps

1. Get current 10 Classic + 5 HARD through all CI checks, especially clearance/full audit.
2. Manually play the entire slice on PC and mobile.
3. Open the beta to a small group of friends using the Pages URL.
4. Collect enough per-level feedback to identify low-fun/repetitive/difficulty-spike holes.
5. Curate/rebuild specific levels from data; do not regenerate the campaign wholesale.
6. Validate Community Maps MVP with a few published maps.
7. Build the **secure** private DEV/review dashboard once enough feedback/community data exists to make it useful.
8. Only after block 1 is genuinely strong, author the next small block.

## Development principle

The project previously got stuck in a loop of procedural generation -> patch -> regenerated repetition -> patch. Do not return to that loop.

**Author deliberately -> audit adversarially -> play manually -> test with humans -> curate -> approve.**
