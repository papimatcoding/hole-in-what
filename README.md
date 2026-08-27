# Troll Golf

Mobile-first 2D arcade minigolf built with Phaser + TypeScript. Current priority is **core shot quality + authored campaign quality + HARD troll identity + trustworthy beta evidence + a usable Community Maps loop**. Do not expand the metagame before these are genuinely strong.

> **SOURCE OF TRUTH / CHAT HANDOFF — Last updated 2026-08-27 after Friends Beta RC5 · Player UX**
>
> If development continues in another chat/session, read this file first. The exact resume point is in **Immediate next steps**. Update this README whenever campaign state, priorities, beta/live-ops behavior, architecture, backend schema, validation or next actions change.

## Play / branches

- Friends beta / GitHub Pages: https://papimatcoding.github.io/troll-golf/
- `main`: stable history.
- `dev`: active development and Pages beta deploy.
- Vite base: `/troll-golf/`.

## CURRENT STATE

### FRIENDS BETA: GO — RC5 technically certified

The first vertical slice contains:

- **10 authored Classic holes**;
- **5 authored HARD/Troll holes**;
- one shared pure-TypeScript physics authority;
- automated physics/mechanics/geometry/clearance/solver/originality checks;
- anonymous beta telemetry with stable tester identity;
- per-level feedback + in-game global survey;
- in-hole reports + menu-level player assistance;
- approximate online presence;
- remotely controlled maintenance/update-required flow;
- Patch Notes with unread indicator;
- Community Maps editor/publish/discovery/play/social loop.

Current telemetry build ID:

- **`beta-block-1-friends-rc5`**

Analyse RC1/RC2/RC3/RC4/RC5 separately. Do not mix old level/input feedback into RC5 conclusions when layouts or UX changed.

## RC5 — Player UX + HARD 03 recovery

RC5 responds directly to owner beta feedback. In RC4 the owner rated HARD 03 **1/5 fun, 1/5 originality, 1/5 difficulty**, named it the weakest level, and rated HARD overall 2/5. HARD 05 was the favourite HARD level. Treat this as owner evidence, not external consensus, but it was strong enough to reject the old H03.

### Player identity is now in-game

Files:

- `src/systems/BetaTelemetrySystem.ts`
- `src/scenes/MenuScene.ts`
- `src/scenes/AssistanceScene.ts`

Rules:

- `tester_id` is the stable anonymous browser identity and **never changes when the player edits their name**;
- alias is stored separately and can be changed in-game;
- the current alias is visible from the game/menu so the tester knows who they are;
- do not bring back browser `prompt()` for username selection;
- alias changes re-register metadata but preserve the same tester ID.

Anti-duplicate survey integrity is backend-enforced, not alias-enforced:

- `beta_game_feedback`: unique `(tester_id, build_id)`;
- `beta_level_feedback`: unique `(tester_id, build_id, level_id)`.

Therefore changing alias cannot legitimately unlock another survey submission for the same tester/build.

### Asistencia al jugador

The old idea of a floating/general “Comentarios” control is replaced by a main-menu **ASISTENCIA AL JUGADOR** area.

It provides:

- current player identity / alias editing;
- access to the global survey;
- direct support messages with category `comment | bug | suggestion | other`.

Backend:

- table `beta_support_messages`;
- Edge Function `beta-feedback` **v7**, ACTIVE.

Per-hole reports/feedback remain available where relevant; Assistance is the general entry point from the menu.

### Community Maps ownership / deletion

Creators can now delete their own published maps from Community discovery with an in-game confirmation.

Security rule:

- the client showing `BORRAR` is only UX;
- the `community-maps` backend validates `creator_tester_id` before deletion;
- never trust a client-supplied ownership claim by itself.

Backend Edge Function:

- `community-maps` **v3**, ACTIVE.

The owner's old empty test map was removed during RC5. At RC5 handoff the database has **0 published Community Maps**.

### HARD 03 final RC5 design

RC5 H03 is a **false bridge / floor-collapse lesson followed by an S-turn**.

Current authored definition lives in `src/data/authored/hard.ts`.

Design:

1. spawn makes the centre/left commitment look natural;
2. entering the obvious trigger area opens a broad pop-void beneath/ahead of the ball;
3. the naive line genuinely falls instead of merely flashing a trap;
4. the learned first move escapes far right before the dangerous commitment;
5. above the collapse, offset shelves force the player to cross back rather than bank directly to the cup;
6. no one-shot outer-bank solution survives the long solver.

Current authored geometry:

```ts
const h3=base("troll",3,pt(270,842),pt(420,142),3,4,"void");
h3.walls=[r(330,520,182,24),r(28,330,300,24)];
h3.popVoids=[{x:28,y:590,w:372,h:126,triggerX:270,triggerY:750,triggerRadius:105}];
path(h3,pt(452,730),pt(452,568),pt(220,500),pt(220,390),pt(390,278),pt(420,142));
trap(h3,"floor-drop");
```

### RC5 automated certification

Gameplay commit certified:

- `333943172df21eebe5e34165bc9e127c8a2654cd` — `hard: make troll 03 collapse consequential`

Normal CI:

- run `33075619341`: **success**;
- typecheck/build/hole physics/mechanics/geometry/clearance: **green**;
- fast campaign audit: **Classic 10/10 clean + Troll 5/5 clean**;
- originality: **0 structurally similar pairs**.

Pages:

- run `33075619290`: **success**.

Strict Full Audit:

- run `33075619311`: **success**;
- **Classic 10/10 clean**;
- **Troll 5/5 clean**;
- **0 bypass · 0 too-easy · 0 no-route**.

RC5 H03 in the Full Audit:

- target 3★: **3 strokes**;
- best known: **3 strokes**;
- HIO: **no**;
- robustness: **21%**;
- difficulty score: **53.4**;
- primary mechanic: `void`, used **yes**;
- naive trap consequence: **yes**;
- status: **OK**;
- warning: `GUIDED_ROUTE_ONLY:no-blind-route`.

That warning is not an automated blocker. It says the blind beam search did not discover a route while the guided solver did. This may mean the hole now requires genuine learning, or it may be too opaque. **Only human playtesting decides which. Do not redesign it again solely to silence the warning.**

H04 receives a secondary informational difficulty-dip warning because H03 now scores harder. Again, validate pacing manually before changing geometry.

Classic retains its known informational 04→05 difficulty dip. Do not automatically redesign Classic 05 merely to flatten a solver graph.

## Physics authority

`src/systems/GolfSimulation.ts` is the **single gameplay-physics authority** for campaign, audits and Community Maps.

It owns launch/friction, bounds/walls, triangles/curves, bumpers, sand/ice, boosters/fans, portals, moving objects, ramps/trampolines, voids, pop traps and cup sweep/lip/sink.

Phaser owns input, rendering, audio, haptics and FX. Do not revive a second physics implementation or the old `GameScene -> V8 -> V81 -> V82` patch chain.

Runtime campaign files:

- `src/scenes/GameplayScene.ts`
- `src/systems/CourseRenderer.ts`
- `src/data/campaign.ts`
- `src/data/authored/classic.ts`
- `src/data/authored/hard.ts`
- `src/systems/SaveSystem.ts`

Procedural generation is tooling only; never use it as campaign/fallback content.

## Campaign design rules

### Classic block 1 teaching plan

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

Every hole needs a distinct silhouette **and** strategic question. New mechanics teach, then get reused. Early HIOs can be accessible; later mastery should narrow.

### HARD

A good troll trap:

1. makes the obvious read attractive;
2. surprises;
3. is deterministic and understandable afterwards;
4. genuinely changes the failed/learned route;
5. leaves a fair learned answer;
6. creates “qué cabrón”, not “esto es random”.

The learned optimal route may avoid the trap if avoiding it is the lesson, but the naive attractive read must be demonstrably punished. Do not spoil HARD traps in Level Select/tutorial overlays.

## Stars

- 1★ complete;
- 2★ solid stroke result;
- 3★ mastery/par;
- time is tracked separately.

## Community Maps

Current publishing flow:

**Editor working map → save explicit draft → choose draft → complete playtest → publish**

Do not return to implicit “publish whatever is in localStorage”. Editing/replacing a draft invalidates its previous playtest certification.

Discovery supports:

- TENDENCIA
- MEJORES
- NUEVOS

Social/current features:

- title + creator alias;
- single/course metadata;
- 1–5 ★ rating;
- plays / unique players / approximate players inside;
- one rating per tester/map;
- creator cannot self-rate;
- one editable comment per tester/map;
- map reports;
- creator-owned deletion with backend ownership verification.

Tables:

- `community_maps`
- `community_map_runs`
- `community_map_feedback`
- `community_map_comments`
- `community_map_reports`

Community Play must use the same `GolfSimulation`, `CourseRenderer`, shot resolver, cosmetics and base feedback feel as campaign. Community-specific code may alter HUD/social flow, not physics.

Database groundwork already supports future multi-hole courses:

- `map_kind: single | course`
- `hole_count: 1–18`
- `holes_json`

Do not build full multi-hole Community Courses until single-hole Community survives real multi-user testing.

## Touch controls

Shared input: `src/systems/ShotInputSystem.ts`.

- campaign and Community share the shot resolver;
- shared grab radius: 96 design px;
- edge assist amplifies backward pull only when the physical screen would otherwise cap a strong shot;
- shot angle is preserved;
- launch power remains 0–1 and flows through `GolfSimulation`;
- feedback/report actions use larger real touch targets on mobile.

## Patch Notes

Files:

- `src/systems/PatchNotesSystem.ts`
- `src/scenes/PatchNotesScene.ts`

Latest entry:

- **Friends Beta RC5 · Player UX**

Menu shows the unread marker until the latest patch is opened in that browser. Every meaningful friends-beta patch should add a human-readable entry.

## Live ops / maintenance / version drift

Backend table: `app_status`.

Important fields:

- `maintenance`
- `patch_label`
- `eta_text`
- `message`
- `updated_at`
- `current_build_id`

Runtime:

- `BootScene` checks live status;
- `MaintenanceScene` handles maintenance;
- `LiveOpsSystem` heartbeats and can move current clients into maintenance;
- if maintenance is off but server `current_build_id` differs from client `BETA_BUILD_ID`, route to update-required rather than silently accepting stale code.

Mandatory meaningful-beta deploy protocol:

1. maintenance ON;
2. honest patch label/message;
3. code/backend deploy;
4. CI + Pages green;
5. required audits/smoke checks;
6. README + Patch Notes updated;
7. set server `current_build_id` to released build and maintenance OFF only after certification.

## Beta backend / security

Supabase project:

- **Troll Golf** — `xtekdrkqgfjnnwawyoim`

Never commit service-role/admin secrets.

Beta tables:

- `beta_testers`
- `beta_runs`
- `beta_level_feedback`
- `beta_game_feedback`
- `beta_reports`
- `beta_support_messages`
- `beta_presence`
- `app_status`

Edge Functions:

- `beta-feedback` v7
- `community-maps` v3

Community mutations remain backend-mediated. Do not rely on a hidden client button/password for privileged operations.

Known non-blocker: `BetaTelemetry.beginAttempt()` still begins later than a perfect analytics model would, so abandoned/retried attempt counts remain approximate.

## Validation pipeline

Normal:

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

Long:

```bash
FULL_AUDIT=1 npm run audit:courses
```

`.github/workflows/full-audit.yml` fail-fasts through mechanics → geometry → clearance before the expensive solver.

**Full Audit certification requires every authored course status to be `OK`.** Inspect the textual summaries; do not rely on workflow color alone. The solver is a critic, not the designer.

## Feedback interpretation

Known owner alias in old evidence: `Matkiller`. Owner feedback is useful for catching obvious flaws but is not independent public consensus.

RC4 owner signal that motivated RC5:

- variety 2/5;
- difficulty curve 2/5;
- HARD 2/5;
- HARD 05 favourite;
- HARD 03 weakest;
- HARD 03 fun/originality/difficulty all 1/5.

Do not attribute old H03 feedback to the RC5 layout. Collect fresh RC5 evidence.

## Known non-blockers

- bundle ~1.55 MB minified / ~410 kB gzip; code splitting can wait;
- current beta sample remains tiny and owner-weighted;
- abandoned attempts are approximate;
- Community comments can receive richer text UX later;
- Community discovery can gain pagination/search after actual map volume exists;
- multi-hole Community is schema-prepared but not implemented;
- private DEV/review dashboard is not implemented.

## Deliberately NOT building now

Do not spend this milestone on ranked/MMR multiplayer, smart bots, seasons/battle pass, Daily Hole, ads/lootboxes, extra currencies, large accounts/profile systems or complex recommendations.

Historical ideas such as ~40 Classic + ~40 HARD, competitive online up to 10, bots, ranked/MMR and thematic seasons remain possible later but are explicitly deprioritized.

## Immediate next steps — resume here

**RC5 is automatically certified. Human RC5 validation is now the only release-quality question.**

1. Finalize live ops: server build → `beta-block-1-friends-rc5`, maintenance OFF after this README deploy is green.
2. Owner manually tests RC5 on desktop/mobile, especially:
   - HARD 03: first read should genuinely drop/troll; learned route should feel understandable and not obnoxiously opaque;
   - visible player alias + in-game edit;
   - alias edit preserves survey-completed state;
   - Asistencia al jugador sends a support message correctly;
   - general survey opens in-game;
   - Community list is empty after test-map deletion;
   - create/publish a fresh test map and verify creator-only delete end-to-end.
3. If H03 feels unfair/cryptic despite automated OK, tune readability/geometry from human observation; do not chase the `GUIDED_ROUTE_ONLY` warning mechanically.
4. Test Community end-to-end with at least two actual testers: publish → discover → play → rate → comment → report → creator deletion/self-rating rules.
5. Collect fresh RC5 level/global/support evidence and redesign only data-identified weak content.
6. Build a private DEV/review dashboard only once enough fresh beta data exists to justify it.
7. Author campaign block 2 only when block 1 is genuinely strong.

## Development principle

**Author deliberately → audit adversarially → play manually → test with humans → curate → approve.**
