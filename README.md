# Troll Golf

Mobile-first 2D arcade minigolf built with Phaser + TypeScript. Current priority is **core shot quality + authored campaign quality + HARD troll identity + trustworthy beta evidence + a usable Community Maps loop**. Do not expand the metagame before these are genuinely strong.

> **SOURCE OF TRUTH / CHAT HANDOFF — Last updated 2026-08-27 during Friends Beta RC5.1 release**
>
> If development continues in another chat/session, read this file first. The exact resume point is in **Immediate next steps**. Update this README whenever campaign state, priorities, beta/live-ops behavior, architecture, backend schema, validation or next actions change.

## Play / branches

- Friends beta / GitHub Pages: https://papimatcoding.github.io/troll-golf/
- `main`: stable history.
- `dev`: active development and Pages beta deploy.
- Vite base: `/troll-golf/`.

## CURRENT STATE

### FRIENDS BETA: HOLD — RC5.1 certified, final documentation deploy in progress

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

RC5.1 client telemetry build ID:

- **`beta-block-1-friends-rc5-1`**

Current release procedure while this README commit deploys:

- `maintenance = true`;
- patch label `Friends Beta RC5.1 · HARD 03 Balance`;
- server `current_build_id` remains RC5 until final RC5.1 CI + Pages/documentation check is green;
- after that, set server `current_build_id = beta-block-1-friends-rc5-1` and maintenance OFF.

Analyse RC1/RC2/RC3/RC4/RC5/RC5.1 separately where level geometry or UX differs.

## Why RC5.1 exists

RC5 fixed the old HARD 03 design problem where the trap could be irrelevant, but the final RC5 geometry overcorrected.

### Human rejection of RC5 H03

Owner mobile playtest on 2026-08-27 rejected RC5 HARD 03:

- the owner could not complete it after roughly **10 attempts**;
- one run reached **18 strokes / ~70 s** without finishing;
- the visual route existed but the useful passage between the activated void and first shelf was effectively pixel-perfect;
- this confirmed that the Full Audit warning `GUIDED_ROUTE_ONLY:no-blind-route` represented a real human-playability problem, not merely solver conservatism.

Important design lesson:

> **A solver finding a route is not evidence that a human can execute or even read that route.**

Do not restore the RC5 narrow H03 geometry.

## HARD 03 — RC5.1 human-accessible version

The identity is unchanged:

1. the obvious centre commitment looks attractive;
2. committing to it activates a disappearing floor;
3. the naive read is genuinely punished;
4. the learned answer escapes right;
5. offset shelves then create an S-turn so the hole is not a straight shot to the cup.

The RC5.1 balance change widens the **learned** route rather than weakening the troll:

- void is shorter and narrower;
- right escape lane has meaningful margin;
- cross-gap between the void and first shelf is large enough for normal touch input;
- shelves remain offset to require a route change;
- a low-left guard blocks an unrelated outer-bank HIO without narrowing the intended route.

Current authored geometry:

```ts
const h3=base("troll",3,pt(270,842),pt(420,142),3,4,"void");
h3.walls=[
  r(350,500,162,24),
  r(28,310,282,24),
  r(28,760,190,24)
];
h3.popVoids=[{
  x:28,y:620,w:340,h:96,
  triggerX:270,triggerY:738,triggerRadius:82
}];
path(h3,pt(440,738),pt(440,574),pt(292,566),pt(250,430),pt(376,270),pt(420,142));
trap(h3,"floor-drop");
```

### RC5.1 automated certification

Final gameplay commit:

- `848483fd034b0c2937d7b5ffe6f5d543f0ea4c7c` — `hard: block troll 03 outer bank`

Supporting RC5.1 commits:

- `7704686a46c5c924506e7762e1d9d603cf2fe26d` — opened the human learned route;
- `10d85ae34bf2685b82bee82242efc875528e4588` — separated RC5.1 telemetry;
- `09429b2ef20336fb157b85fde1d5fc21800c9be0` — added RC5.1 Patch Notes.

Normal CI:

- run `33077377504`: **success**;
- typecheck/build/hole physics/mechanics/geometry/clearance: **green**;
- originality: **0 structurally similar pairs**;
- fast campaign audit: **Classic 10/10 clean + Troll 5/5 clean**;
- HARD fast summary: **0 bypass · 0 too-easy · 0 no-route · 0 warnings**.

Fast H03:

- best: **2 strokes**;
- blind: **2 strokes**;
- HIO: **no**;
- robustness: **56%**;
- difficulty: **38.3**;
- primary mechanic `void`: used **yes**;
- naive trap consequence: **yes**;
- status: **OK**.

Strict Full Audit:

- run `33077377499`: **success**;
- **Classic 10/10 clean**;
- **Troll 5/5 clean**;
- HARD: **0 bypass · 0 too-easy · 0 no-route · 0 warnings**.

Full H03:

- target 3★: **3 strokes**;
- best: **2 strokes**;
- blind: **2 strokes**;
- HIO: **no**;
- robustness: **12%**;
- difficulty: **42.6**;
- primary mechanic `void`: used **yes**;
- naive trap consequence: **yes**;
- status: **OK**;
- warnings: **none**.

This is much healthier than RC5: both the blind and guided searches now find the learned route, while the one-shot bypass remains closed. **Human playtesting is still the final judge.**

## RC5 player UX retained in RC5.1

### Player identity

- `tester_id` is the stable anonymous browser identity;
- changing the visible alias must never change `tester_id`;
- alias is editable entirely in-game;
- do not restore browser `prompt()` username UX.

Backend survey integrity:

- `beta_game_feedback`: unique `(tester_id, build_id)`;
- `beta_level_feedback`: unique `(tester_id, build_id, level_id)`.

Changing alias cannot legitimately unlock another survey for the same tester/build.

### Asistencia al jugador

Main-menu **ASISTENCIA AL JUGADOR** provides:

- current alias / alias editing;
- global in-game survey;
- direct support message categories `comment | bug | suggestion | other`.

Backend:

- `beta_support_messages`;
- Edge Function `beta-feedback` v7, ACTIVE.

### Community ownership / deletion

Creators may delete their own published Community Maps.

Security rule:

- client `BORRAR` button is UX only;
- `community-maps` validates `creator_tester_id` server-side;
- never trust a client ownership claim by itself.

Edge Function `community-maps` v3 is ACTIVE.

The owner's old empty test map was removed; the Community database was empty before the next end-to-end test map is created.

## Physics authority

`src/systems/GolfSimulation.ts` is the **single gameplay-physics authority** for campaign, audits and Community Maps.

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
- voids/pop traps;
- cup sweep/lip/sink.

Phaser owns input, rendering, audio, haptics and FX.

Do not revive a second physics implementation or the old `GameScene -> V8 -> V81 -> V82` patch chain.

Runtime campaign files:

- `src/scenes/GameplayScene.ts`
- `src/systems/CourseRenderer.ts`
- `src/data/campaign.ts`
- `src/data/authored/classic.ts`
- `src/data/authored/hard.ts`
- `src/systems/SaveSystem.ts`

Procedural generation is tooling only; never campaign/fallback content.

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

Every hole needs a distinct silhouette **and** strategic question. New mechanics teach, then get reused.

### HARD

A good troll trap:

1. makes the obvious read attractive;
2. surprises;
3. is deterministic and understandable afterwards;
4. genuinely changes the failed/learned route;
5. leaves a fair learned answer;
6. creates “qué cabrón”, not “esto es random”.

Additional RC5.1 rule:

- the learned route must have **human execution margin**; requiring a mathematically valid but pixel-perfect corridor is a design failure.

The learned optimal route may avoid the trap if avoiding it is the lesson, but the naive attractive read must be demonstrably punished. Do not spoil HARD traps in Level Select/tutorial overlays.

## Stars

- 1★ complete;
- 2★ solid stroke result;
- 3★ mastery/par;
- time tracked separately.

## Community Maps

Publishing flow:

**Editor working map → save explicit draft → choose draft → complete playtest → publish**

Do not return to implicit “publish whatever is in localStorage”. Editing/replacing a draft invalidates previous playtest certification.

Discovery:

- **TENDENCIA**
- **MEJORES**
- **NUEVOS**

Current social loop:

- creator alias;
- single/course metadata;
- 1–5 ★ rating;
- plays / unique players / approximate players inside;
- one rating per tester/map;
- creator cannot self-rate;
- one editable comment per tester/map;
- reports;
- creator-owned deletion with backend ownership verification.

Tables:

- `community_maps`
- `community_map_runs`
- `community_map_feedback`
- `community_map_comments`
- `community_map_reports`

Community Play must share `GolfSimulation`, `CourseRenderer`, shot resolver, cosmetics and base gameplay feedback with campaign.

Database groundwork for future multi-hole courses:

- `map_kind: single | course`
- `hole_count: 1–18`
- `holes_json`

Do not build full multi-hole Community Courses until the single-hole flow survives multi-user human testing.

## Touch controls

Shared input: `src/systems/ShotInputSystem.ts`.

- campaign and Community share the resolver;
- grab radius: 96 design px;
- edge assist only compensates physical-screen pull limitation;
- angle remains preserved;
- launch power remains 0–1 through `GolfSimulation`;
- feedback/report actions use larger real touch targets.

## Patch Notes

Latest entry:

- **Friends Beta RC5.1 · HARD 03 Balance**

Files:

- `src/systems/PatchNotesSystem.ts`
- `src/scenes/PatchNotesScene.ts`

Every meaningful friends-beta patch must get a human-readable note and separate telemetry when changed gameplay would contaminate comparison.

## Live ops / version drift

Backend table: `app_status`.

Runtime:

- `BootScene` checks live status;
- `MaintenanceScene` handles maintenance;
- `LiveOpsSystem` heartbeats and can move current clients into maintenance;
- stale clients route to update-required when server/client build IDs differ.

Mandatory meaningful-beta deploy protocol:

1. maintenance ON;
2. honest patch label/message;
3. code/backend deploy;
4. CI + Pages green;
5. required audits/smoke checks;
6. README + Patch Notes updated;
7. server build ID switched and maintenance OFF only after certification.

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

Known telemetry non-blocker: `BetaTelemetry.beginAttempt()` still starts later than a perfect analytics model, so abandonment counts are approximate.

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

**Full Audit certification requires every authored course status to be `OK`.** Inspect the textual summary; workflow colour alone is not enough. Solver = critic, never substitute for human play.

## Known non-blockers

- bundle ~1.55 MB minified / ~410 kB gzip;
- beta sample remains small and owner-weighted;
- abandoned attempt analytics remain approximate;
- Community comments can get richer text UX later;
- discovery pagination/search waits for real map volume;
- multi-hole Community is schema-prepared but not implemented;
- private DEV/review dashboard not implemented.

## Deliberately NOT building now

Do not spend the current milestone on:

- ranked/MMR multiplayer;
- smart player bots;
- battle pass/seasons;
- Daily Hole;
- ads/lootboxes;
- extra currencies;
- large account/profile systems;
- complex recommendations.

Historical ideas such as ~40 Classic + ~40 HARD, competitive online up to 10, bots, ranked/MMR and thematic seasons remain possible later.

## Immediate next steps — resume here

**RC5.1 automated gameplay certification is complete. Final release/human check is the only blocker before moving on to new holes/mechanics.**

1. Wait for the CI + Pages run caused by this README handoff commit to be green.
2. Then set backend `current_build_id = beta-block-1-friends-rc5-1`, maintenance OFF, and update this README to `FRIENDS BETA: GO — RC5.1 live`.
3. Owner refreshes and manually plays **HARD 03 on mobile**. Success criterion is not “pixel-perfect optimum”; it should be reasonably beatable after the troll is understood, ideally within a few learned attempts.
4. If H03 now feels fair and fun, **freeze block 1 campaign geometry** instead of endlessly micro-tuning it.
5. Verify RC5 player identity + Assistance briefly if not already confirmed.
6. Run Community Maps end-to-end with at least two testers: create → draft → playtest → publish → discover → play → rate → comment → report → creator delete / self-rating blocked.
7. Once H03 and Community single-hole flow pass human validation, begin **campaign block 2 and new mechanics**. Prefer adding genuinely new gameplay vocabulary rather than more variations of walls/bumper/sand/void.

## Development principle

**Author deliberately → audit adversarially → play manually → test with humans → curate → approve.**
