# Troll Golf

Mobile-first 2D arcade minigolf built with Phaser + TypeScript. Current priority is **core shot + authored campaign + HARD troll identity + real beta evidence + a usable Community Maps loop**. Do not expand metagame before those are genuinely good.

> **SOURCE OF TRUTH / CHAT HANDOFF — Last updated 2026-08-27 after Friends Beta RC3 (`146c712`) + Community Maps Edge Function v2**
>
> If development continues in another chat/session, read this file first. The exact resume point is in **Immediate next steps**. Update this README whenever campaign state, priorities, beta/live-ops behavior, architecture, backend schema or next actions change.

## Play / branches

- Friends beta / GitHub Pages: https://papimatcoding.github.io/troll-golf/
- `main`: stable history.
- `dev`: active development and Pages beta deploy.
- Vite base: `/troll-golf/`.

## CURRENT STATE

### FRIENDS BETA: GO

Friends are actively testing the first vertical slice.

Current campaign:

- **10 authored Classic holes**
- **5 authored HARD/Troll holes**
- shared pure-TypeScript physics
- automated physics/mechanics/geometry/clearance/solver/originality checks
- anonymous beta telemetry
- per-level survey + global survey
- in-hole remote bug reports
- approximate online presence
- remotely controlled maintenance screen
- patch notes with unread indicator
- Community Maps RC3 social loop

Latest technical state after RC3:

- latest normal CI: **green**;
- latest Pages build/deploy: **green**;
- typecheck/build/hole physics/mechanics/geometry/clearance: **green**;
- fast campaign audit: **Classic 10/10 clean + Troll 5/5 clean**;
- originality audit: **0 structurally similar pairs**;
- last Full Audit (`FULL_AUDIT=1`), unchanged authored geometry/physics: **Classic 10/10 + Troll 5/5 clean**;
- RC3 changes affect input/UI/community/live-ops, not authored campaign geometry or `GolfSimulation` physics rules.

Friends-beta telemetry build ID is now:

- **`beta-block-1-friends-rc3`**

Analyse RC1, RC2 and RC3 separately.

## RC3 — Community Maps rebuild

The old Community Maps implementation was technically functional but confusing and less fluid than campaign play. RC3 rebuilds the flow around explicit drafts, playtesting, clear publishing and social feedback.

### Publishing flow

Publishing no longer means “upload whatever happens to be in editor localStorage”.

Current flow:

**Editor working map → save as explicit draft → choose draft → playtest that exact draft → publish**

Files:

- `src/systems/CommunityDraftSystem.ts`
- `src/scenes/CommunityPublishScene.ts`

Behavior:

- saved Community drafts are distinct from the editor autosave;
- publish screen shows **MIS BORRADORES** explicitly;
- if there are no saved drafts, publishing is blocked;
- an editor working map can be converted into a named saved draft;
- each draft shows whether it has passed playtest;
- a draft must be successfully completed before the backend accepts publication;
- editing/replacing a saved draft invalidates its previous playtest status;
- creator selects exactly which draft gets published;
- title + optional description are entered only after selecting a valid tested draft.

Do not return to implicit “publish current localStorage map” behavior.

### Community discovery

`CommunityMapsScene` now has three explicit sorts:

- **TENDENCIA**
- **MEJORES**
- **NUEVOS**

Cards show:

- title
- creator alias
- single/course type + hole count
- average ★ rating + vote count
- total plays
- unique players
- live `● N JUGANDO` when applicable

Trend score currently favors:

1. players currently in the map;
2. unique players in the last 24 h;
3. recent completed runs;
4. total plays;
5. rating with bounded vote weight.

Do not over-engineer recommendation algorithms with this tiny beta population.

### Community ratings

Community ratings are now **one overall 1–5 star rating**, as requested.

- creator cannot rate own map;
- one rating per tester/map;
- old feedback rows were backfilled into a star value for schema compatibility;
- difficulty remains available internally for future use but is not the headline score.

### Comments

Backend table:

- `community_map_comments`

Current behavior:

- comments visible from Community Play;
- max 500 chars;
- one comment per tester/map;
- posting again edits/replaces that tester's previous comment;
- alias + timestamp are stored;
- no replies/threads/likes/mentions yet.

Keep comments simple until actual usage justifies richer social features.

### Community map reports

Backend table:

- `community_map_reports`

Report categories:

- bug
- impossible
- inappropriate
- spam
- other

Reports are intentionally separate from ★ rating.

### Multi-hole groundwork

RC3 prepares the database for Golf It-style courses without building the full multi-hole editor yet.

`community_maps` now includes:

- `map_kind`: `single | course`
- `hole_count`: 1–18
- `holes_json`: reserved JSON payload for future course collections

All current maps publish as:

- `map_kind = single`
- `hole_count = 1`

**Do not implement the multi-hole course builder until the RC3 single-hole loop has been manually validated.** When it is built, reuse the same per-hole gameplay runtime rather than creating another physics layer.

## Community Play parity

The previous Community Play shared `GolfSimulation`, but its presentation/input layer was simplified enough to feel worse than campaign. RC3 reduces that divergence.

Community Play now uses:

- the same `GolfSimulation` authority;
- `CourseRenderer` / dynamic course rendering;
- equipped ball cosmetic;
- equipped trail cosmetic;
- ball shadow / airborne visual lift;
- campaign-style aim line;
- campaign-style shot audio;
- wall/bumper/surface/portal/moving/jump/void/trap/hole feedback;
- animated void reset;
- same shot-input resolver as campaign;
- comments/report/rating result UX.

Gameplay behavior must remain shared. Community-specific code may change HUD/social flow, **not physics rules**.

## Touch controls — RC3

Friend feedback identified two transversal UX problems:

1. ball near screen edge could make strong shots physically difficult because the finger ran out of screen;
2. feedback controls such as `SALTAR/CERRAR` and small survey choices could miss taps.

### Edge-assisted shot input

New shared file:

- `src/systems/ShotInputSystem.ts`

Campaign and Community both call `resolveShotPull()`.

Rules:

- in normal board positions, assist = 1 and controls behave normally;
- near an edge, only when the required backward drag is physically constrained by the screen, the pull distance is amplified;
- shot angle is preserved;
- full power remains reachable near borders/corners;
- simulation launch power remains 0–1 and still goes through `GolfSimulation`;
- shared grab radius is **96 design px**.

Do not create different control sensitivity for Community and campaign again.

### Feedback hitboxes

RC3 enlarges touch targets in Results and in-hole reporting:

- survey choices ~44 px high;
- BUG / ME PILLÓ / SALTAR are real rectangle buttons;
- `SALTAR` is no longer clickable text only;
- report categories are larger;
- `CERRAR`, ranking close, nav and report actions have larger targets;
- per-level survey still auto-submits after the three required ratings to avoid adding another mandatory tap.

## Patch Notes

Files:

- `src/systems/PatchNotesSystem.ts`
- `src/scenes/PatchNotesScene.ts`

Menu behavior:

- `PATCH NOTES · ● NUEVO` appears when the latest patch has not been opened on that browser;
- opening Patch Notes marks the latest patch as read;
- RC3 and RC2 notes are currently included;
- every meaningful friends-beta patch should add/update a human-readable entry.

Use this rather than relying on WhatsApp/Discord to explain every update.

## Live players / presence

Backend table:

- `beta_presence`

Client behavior:

- heartbeat ~30 s while visible;
- online window ~75 s;
- menu shows approximate `● N ONLINE`;
- Community Play sets scene context to `community:<map UUID>`;
- Community map cards can therefore show approximate `N JUGANDO`.

This is intentionally approximate presence, not websocket-perfect concurrency.

## Maintenance / live ops

Backend table:

- `app_status`

Fields:

- `maintenance`
- `patch_label`
- `eta_text`
- `message`
- `updated_at`

Runtime:

- `BootScene` checks status before menu;
- `MaintenanceScene` shows patch/message/ETA and retries automatically;
- `LiveOpsSystem` can move an already-open session into maintenance on heartbeat.

### Mandatory deploy protocol

For a live beta patch likely to affect Pages:

1. set `maintenance = true` before deploy;
2. set honest patch label/message/ETA;
3. push code/backend changes;
4. wait for CI + Pages green;
5. perform required smoke checks;
6. set `maintenance = false`;
7. update this README + Patch Notes.

Do not invent precise ETAs if uncertain.

## Physics authority

`src/systems/GolfSimulation.ts` is the **single gameplay-physics authority**.

It owns:

- launch/friction
- walls/bounds
- curves/triangles
- bumpers
- sand/ice
- boosters/fans
- portals
- moving objects
- ramps/trampolines
- void
- pop traps
- cup sweep/lip/sink

Campaign, audits and Community Maps must share it. Phaser owns input, rendering, audio, haptics and FX.

Do not revive a second physics implementation or the old `GameScene -> V8 -> V81 -> V82` patch chain.

## Campaign design rules

### Classic block 1

1. control / comfortable HIO
2. first bank
3. route choice
4. setup shot
5. first bumper
6. bumper used differently
7. geometry exam
8. first sand
9. sand route choice
10. chapter exam

Every hole needs a distinct silhouette **and** strategic question. Do not preserve a weak level because time was spent on it.

### HARD

A good troll trap:

1. makes the obvious read attractive;
2. surprises;
3. is deterministic and understandable afterwards;
4. leaves a fair learned route;
5. creates “qué cabrón”, not “esto es random”.

Do not spoil HARD traps in Level Select/tutorial overlays.

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

Long block certification:

```bash
FULL_AUDIT=1 npm run audit:courses
```

`.github/workflows/full-audit.yml` runs mechanic integrity, geometry and clearance before the expensive long solver.

The solver is a critic, not the designer.

## Beta backend / security

Supabase project:

- **Troll Golf** (`xtekdrkqgfjnnwawyoim`)

Never commit service-role/admin secrets.

Beta tables:

- `beta_testers`
- `beta_runs`
- `beta_level_feedback`
- `beta_game_feedback`
- `beta_reports`
- `beta_presence`
- `app_status`

Community tables:

- `community_maps`
- `community_map_runs`
- `community_map_feedback`
- `community_map_comments`
- `community_map_reports`

Edge Functions:

- `beta-feedback` v5
- `community-maps` v2

New Community comments/reports have RLS enabled and direct anon/authenticated table access revoked; browser interaction is mediated through Edge Functions. Supabase security advisor currently shows only expected `rls_enabled_no_policy` INFO notices for this architecture, not warning-level vulnerabilities.

RC3 added covering indexes for new comment/report tester foreign keys after performance advisor feedback.

## Early beta evidence — interpret carefully

RC1 snapshot before RC2 input fixes:

- 5 testers were initially seen; total tester identities later reached 6 before RC3;
- `Matkiller` is the project owner and contributed most early ratings;
- RC1 therefore **must not be treated as public consensus**.

Early level signals:

- Classic 01: n=3, fun 2.67; huge run variance (roughly 1 stroke/4.5 s to 6 strokes/44.8 s);
- Classic 02: n=2, fun 1.50;
- Classic 03: n=2, fun 2.00;
- Classic 07: n=1, fun 2, difficulty 1;
- Troll 03: n=1, fun 1 + BUG tag;
- Troll 04: n=1, fun 3 + surprise 5/5.

RC2 separated telemetry after input fixes, and RC3 opens another clean bucket after edge/input/community changes.

Do **not** redesign Classic 02/03 or Troll 03 solely from these tiny RC1 samples. Re-test on RC3 first, then combine reports + runs + comments from multiple testers.

## Known non-blockers

- bundle remains roughly ~1.5 MB minified / ~395 kB gzip; splitting can wait;
- abandoned runs are still not inserted as explicit incomplete `beta_runs`, so attempt count is improved but not perfect abandonment analytics;
- global survey still needs more real completions;
- Community comments currently use native prompt for writing/editing; a richer in-game keyboard/form can wait;
- Community list currently shows only a small first page; pagination/search can wait for actual map volume;
- multi-hole courses are schema-prepared but not implemented;
- private DEV dashboard is still not implemented.

## Deliberately NOT building now

Do not spend this milestone on:

- ranked/MMR multiplayer
- smart bots as a player feature
- battle pass/seasons
- Daily Hole
- ads/lootboxes
- extra currencies
- large account/social profile system
- complex recommendation algorithm

## Immediate next steps — resume here

**RC3 is technically green. The next job is human validation, not more blind feature expansion.**

1. Ensure maintenance is **OFF** and have current testers refresh once to load RC3.
2. Project owner should re-test the specific reported problems:
   - strong shots with the ball near left/right/top/bottom edges;
   - HARD 01–03 touch input;
   - per-level `SALTAR` and feedback/report buttons.
3. Validate Community Maps end-to-end with at least two testers:
   - create/edit working map;
   - save explicit draft;
   - choose draft in Publish;
   - verify publication is blocked before successful playtest;
   - complete playtest;
   - publish selected draft;
   - discover under Nuevos/Tendencia;
   - play with campaign-like feel;
   - ★ rate from another tester;
   - comment;
   - report;
   - creator self-rating remains blocked;
   - `N JUGANDO` appears when two sessions overlap if timing allows.
4. Collect RC3 campaign feedback before redesigning weak maps.
5. First campaign review targets once enough RC3 evidence exists:
   - **Troll 03** because RC1 contained an explicit BUG;
   - **Classic 02–03** because early fun scores were low;
   - HARD 01–03 only if the touch/input complaint survives RC3.
6. After the single-hole Community loop survives human testing, design **multi-hole Community Courses** (Golf It-style) using `map_kind=course`, `hole_count`, `holes_json` and the same per-hole runtime.
7. Build a minimal private DEV/review dashboard only when enough fresh RC3 data exists to make it useful.
8. Author campaign block 2 only when block 1 is genuinely strong.

## Development principle

**Author deliberately → audit adversarially → play manually → test with humans → curate → approve.**
