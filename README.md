# Troll Golf

Mobile-first 2D arcade minigolf built with Phaser + TypeScript. Current priority is **core shot + authored campaign quality + HARD troll identity + trustworthy beta evidence + a usable Community Maps loop**. Do not expand the metagame before these are genuinely good.

> **SOURCE OF TRUTH / CHAT HANDOFF — Last updated 2026-08-27 after Friends Beta RC4 · Quality Pass**
>
> If development continues in another chat/session, read this file first. The exact resume point is in **Immediate next steps**. Update this README whenever campaign state, priorities, beta/live-ops behavior, architecture, backend schema, validation or next actions change.

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
- per-level feedback + in-game global survey
- in-hole remote bug reports
- approximate online presence
- remotely controlled maintenance screen
- server-declared current build / stale-client update screen
- patch notes with unread indicator
- Community Maps social loop

Current telemetry build ID:

- **`beta-block-1-friends-rc4`**

Analyse RC1, RC2, RC3 and RC4 separately.

### RC4 certification

RC4 is technically certified for friends-beta use.

- normal CI on current code: **green**;
- Pages deploy on current code: **green**;
- typecheck/build/hole physics/mechanics/geometry/clearance: **green**;
- originality audit: **0 structurally similar pairs**;
- strict Full Audit run `33071135763`: **success**;
- Full Audit result: **Classic 10/10 clean + Troll 5/5 clean**;
- **0 bypass · 0 too-easy · 0 no-route** across HARD;
- Classic retains one informational difficulty-dip warning around 04→05; it is not a solver blocker.

Important RC4 commits near the release point:

- `6fef66a61fb37e4e29e34004720f8762fe35764e` — `hard: fix troll 03 dogleg wall clearance`
- `87b1224c72be93950c819f0eed57986277392bff` — `ci: make full campaign audit a strict gate`
- `37eb90008384706658e5da7551a171eb921a877e` — `ci: validate troll void traps by consequence`

## RC4 — Quality Pass

RC4 exists mainly because early beta feedback exposed versioning, survey UX and HARD 03 design problems.

### Reliable build/version detection

Earlier, a browser tab could keep old RC2/RC3 JavaScript in memory after a new Pages deploy. This caused two confusing symptoms:

- new feedback could be recorded under the old build ID even though a newer build had already been deployed;
- the user would not see new Patch Notes because the old client literally did not contain them.

RC4 fixes this structurally.

Backend `app_status` now declares `current_build_id` and the client compares it with `BETA_BUILD_ID`.

Runtime:

- `src/systems/LiveOpsSystem.ts`
- stale clients are routed to `update-required` when maintenance is off;
- the update screen requires a controlled refresh before continuing;
- heartbeat continues to carry the client build ID.

**Transition note:** clients that were already running RC2/RC3 may still require one manual refresh to obtain the RC4 code that knows how to detect future stale builds. From RC4 onward, silent version drift should not be accepted.

### Global survey is in-game

The old global survey relied too heavily on browser prompts/confirms and looked detached from the game.

RC4 replaces it with an actual in-game survey flow covering:

- overall fun;
- controls;
- variety;
- difficulty curve;
- HARD experience;
- whether the tester would keep playing;
- favourite / weakest content;
- priorities such as more levels, balance, variety, HARD, controls and Community.

Do not return to native browser-question UX for the global survey.

### HARD 03 redesign

User feedback correctly identified a design bug in old HARD 03: the trap could trigger while having essentially no consequence for the winning run. That is not acceptable troll design.

RC4 HARD 03 is now a **false-highway / two-stage dogleg**:

1. the cup looks tempting from the tee;
2. committing to the obvious lane activates a pop-void ahead of the ball;
3. the naive line is genuinely punished by the void;
4. once learned, the player escapes through the lower-left opening;
5. climbs the safe lane;
6. switches back to the right through the upper opening;
7. finishes at the cup.

Current Full Audit result for `troll-03`:

- target 3★: 3 strokes;
- best known: **2 strokes**;
- blind known: **2 strokes**;
- **HIO: no**;
- robustness: ~30%;
- primary: `void`;
- naive trap consequence verified: **yes**;
- status: **OK**.

The long-solver learned route currently avoids falling into the trap, which is intentional. A learned troll solution may avoid the trap **provided the naive attractive read is demonstrably punished**.

### Full Audit is now a real gate

Previously `FULL_AUDIT=1 npm run audit:courses` could print `TOO_EASY_FOR_TARGET` or `MECHANIC_BYPASSED` while the workflow itself still succeeded; only `NO_ROUTE_FOUND` was fatal.

RC4 changes this:

- fast CI remains a quick critic and only hard-fails route impossibility;
- **Full Audit hard-fails every non-`OK` course status**;
- `TOO_EASY_FOR_TARGET`, `MECHANIC_BYPASSED` and `NO_ROUTE_FOUND` all fail long certification.

For troll void traps, the audit now checks **consequence rather than requiring the learned route to hit the trap**:

- an obvious/naive probe must trigger the trap and actually void the ball;
- an optimal learned route is allowed to avoid that void;
- this models the design rule “first read gets trolled, learned answer is fair”.

## Community Maps

Community Maps was rebuilt in RC3 and remains the current base for future work.

### Publishing flow

Current flow:

**Editor working map → save explicit draft → choose draft → complete playtest → publish**

Key behavior:

- saved drafts are explicit and distinct from editor autosave;
- publish screen shows **MIS BORRADORES**;
- no draft = publication blocked;
- editing/replacing a draft invalidates previous playtest status;
- creator selects exactly which tested draft is published;
- title + optional description are entered for the selected draft.

Files:

- `src/systems/CommunityDraftSystem.ts`
- `src/scenes/CommunityPublishScene.ts`

Do not return to implicit “publish whatever is in localStorage” behavior.

### Discovery / social

Community discovery supports:

- **TENDENCIA**
- **MEJORES**
- **NUEVOS**

Cards can show:

- title + creator alias;
- single/course type + hole count;
- average 1–5 ★ rating + vote count;
- total plays;
- unique players;
- approximate `● N JUGANDO`.

Trend currently favours live players, recent unique players/runs, total plays and rating with bounded weight. Do not over-engineer recommendations with the tiny beta population.

Community social features:

- one 1–5 ★ rating per tester/map;
- creator cannot rate own map;
- comments up to 500 chars, one editable comment per tester/map;
- separate map reports: bug / impossible / inappropriate / spam / other.

Tables:

- `community_maps`
- `community_map_runs`
- `community_map_feedback`
- `community_map_comments`
- `community_map_reports`

### Community Play parity

Community Play must feel like campaign, not a simplified clone.

It uses:

- the same `GolfSimulation` authority;
- `CourseRenderer` / dynamic course rendering;
- equipped ball/trail cosmetics;
- shadows / airborne visual lift;
- campaign-style aim + shot audio + impacts;
- trap/void/hole feedback;
- animated void reset;
- the shared shot-input resolver.

Community-specific code may change HUD/social flow, **not gameplay physics**.

### Multi-hole groundwork

Database is prepared for Golf It-style courses:

- `map_kind`: `single | course`
- `hole_count`: 1–18
- `holes_json`: reserved for course collections

Current published content remains single-hole. Do not build the full multi-hole editor until the single-hole Community flow survives manual testing with multiple users.

## Touch controls

Shared file:

- `src/systems/ShotInputSystem.ts`

Current rules:

- campaign and Community use the same shot resolver;
- shared grab radius: **96 design px**;
- in normal positions, sensitivity is unchanged;
- near edges, backward pull is amplified only when the physical screen would otherwise prevent a strong shot;
- shot angle is preserved;
- launch power remains 0–1 and still flows through `GolfSimulation`.

Friend feedback also led to larger real touch targets for per-level feedback/report UI (`SALTAR`, `CERRAR`, choices, report categories, navigation). Avoid clickable text-only actions on mobile.

## Patch Notes

Files:

- `src/systems/PatchNotesSystem.ts`
- `src/scenes/PatchNotesScene.ts`

Current latest entry:

- **Friends Beta RC4 · Quality Pass**

Menu should show `PATCH NOTES · ● NUEVO` while the latest patch has not been opened in that browser. Opening Patch Notes marks the current note as read.

Every meaningful friends-beta patch should add a human-readable Patch Notes entry.

## Live players / presence

Backend table:

- `beta_presence`

Behavior:

- heartbeat roughly every 30 s while visible;
- online window roughly 75 s;
- menu shows approximate `● N ONLINE`;
- Community Play uses context `community:<map UUID>`;
- Community cards can display approximate players currently inside a map.

This is intentionally approximate presence, not websocket-perfect concurrency.

## Maintenance / live ops

Backend table:

- `app_status`

Important fields:

- `maintenance`
- `patch_label`
- `eta_text`
- `message`
- `updated_at`
- `current_build_id`

Runtime:

- `BootScene` checks live status;
- `MaintenanceScene` shows patch/message/ETA and retries;
- `LiveOpsSystem` can move already-open current clients into maintenance on heartbeat;
- when maintenance is off but server build differs from client build, the client is sent to the update-required screen.

### Mandatory deploy protocol

For a meaningful live beta patch:

1. set `maintenance = true` before deploy;
2. set honest patch label/message/ETA;
3. push code/backend changes;
4. wait for CI + Pages green;
5. run required audits/smoke checks;
6. update README + Patch Notes when state changed;
7. set `maintenance = false` only after the release candidate is certified.

Do not leave maintenance on after a certified patch is complete.

## Physics authority

`src/systems/GolfSimulation.ts` is the **single gameplay-physics authority**.

It owns:

- launch/friction;
- bounds/walls;
- triangles/curves;
- bumpers;
- sand/ice;
- boosters/fans;
- portals;
- moving objects;
- ramps/trampolines;
- void;
- pop traps;
- cup sweep/lip/sink.

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
4. genuinely changes the failed/learned route;
5. leaves a fair learned answer;
6. creates “qué cabrón”, not “esto es random”.

The learned optimal route does not have to touch the trap if avoiding it is the lesson. What matters is that the naive attractive read is actually punished.

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

Long certification:

```bash
FULL_AUDIT=1 npm run audit:courses
```

`.github/workflows/full-audit.yml` runs mechanic integrity, geometry and clearance before the expensive solver.

**Current rule:** a Full Audit is certified only when every authored course is `OK`.

The solver is a critic, not the designer. Never claim human fun/fairness solely from solver output.

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

Edge Function:

- `beta-feedback`

Community interactions are mediated through the Community Edge Function; direct public table access should remain constrained by RLS/revoked grants as designed.

## Early beta evidence — interpret carefully

Known identity detail useful for analysis:

- **`Matkiller` is the project owner**, not an independent external tester.

Early RC1/RC2 feedback was therefore heavily owner-weighted and must not be treated as public consensus.

Signals worth continuing to watch:

- Classic 02/03 received low early fun scores from more than one tester;
- Classic 07/08 had owner-reported low difficulty/fun signals but tiny n;
- old HARD 03 repeatedly received owner BUG/too-easy feedback because its trap did not affect the run; **RC4 specifically redesigns this and old HARD 03 feedback should not be attributed to the new layout**;
- controls improved substantially in owner global feedback after early input fixes;
- external friend feedback identified edge shots and missed feedback taps, both addressed by shared edge assist / larger hitboxes.

Do not mix old-build level ratings into RC4 conclusions as if the level/input were unchanged.

## Known non-blockers

- bundle remains ~1.5 MB minified / ~407 kB gzip; splitting can wait;
- abandoned attempts are not yet represented as perfect explicit incomplete runs, so abandonment analytics remain approximate;
- Community comments still use a simple input flow and can receive richer in-game text UX later;
- Community list is still small/basic; pagination/search can wait for map volume;
- multi-hole Community courses are schema-prepared but not implemented;
- private DEV/review dashboard is not implemented yet;
- current beta sample is still too small and owner-weighted for strong balance conclusions.

## Deliberately NOT building now

Do not spend this milestone on:

- ranked/MMR multiplayer;
- smart player bots;
- battle pass/seasons;
- Daily Hole;
- ads/lootboxes;
- extra currencies;
- large account/profile systems;
- complex recommendation algorithms.

Historical long-term ideas such as ~40 Classic + ~40 troll holes, ranked multiplayer, seasons/pass and thematic season holes remain possible later but are explicitly deprioritized.

## Immediate next steps — resume here

**RC4 Quality Pass is technically certified. The next job is fresh human validation and clean RC4 evidence.**

1. Ensure backend maintenance is **OFF** after the final RC4 documentation deploy.
2. Existing friends should refresh once if they came from RC2/RC3 so they definitely load RC4; future version drift should be caught by the update-required flow.
3. Owner should manually verify on RC4:
   - Patch Notes shows RC4 and unread state works;
   - global survey is fully in-game;
   - HARD 03: obvious lane gets punished and learned dogleg feels fair/fun;
   - edge-assisted strong shots feel natural;
   - per-level feedback/report buttons receive touch reliably.
4. Collect fresh RC4 level/global feedback before redesigning Classic 02/03.
5. Validate Community Maps end-to-end with at least two testers:
   - edit map;
   - save explicit draft;
   - select draft;
   - publication blocked before successful playtest;
   - complete playtest;
   - publish;
   - discover via Nuevos/Tendencia;
   - play with campaign-like feel;
   - ★ rate from another tester;
   - comment;
   - report;
   - creator self-rating remains blocked;
   - observe `N JUGANDO` if two sessions overlap.
6. Once single-hole Community survives human testing, design multi-hole Community Courses using `map_kind=course`, `hole_count`, `holes_json` and the same per-hole runtime.
7. Build a small private DEV/review dashboard when enough fresh beta data exists to make it useful.
8. Author campaign block 2 only when block 1 is genuinely strong.

## Development principle

**Author deliberately → audit adversarially → play manually → test with humans → curate → approve.**
