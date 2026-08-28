# Hole in What?

Mobile-first 2D arcade minigolf built with Phaser + TypeScript.

> **SOURCE OF TRUTH / CHAT HANDOFF — 2026-08-28**
>
> Read this file first when continuing in another chat. Update it after meaningful changes to campaign state, architecture, validation, backend/live ops, beta status or immediate priorities.

## Current state

### Public BETA — RC5.1 still live on `dev`

The public build has **not** been changed while RC6 is prepared on a feature branch.

- Pages: `https://papimatcoding.github.io/troll-golf/`
- Pages source: `dev`
- maintenance: **OFF**
- live campaign: Classic 01–10 + HARD 01–05
- live backend build ID: `beta-block-1-friends-rc5-1` (legacy value; do not rename until deployment)
- live patch label is still the legacy RC5.1 label
- rollback `dev` SHA: `8075b162dc2b3e7b73b2fd0d36e6fbc5248120f4`

Do **not** rename the repository or Pages path during RC6. Keep old public links stable.

### RC6 candidate — `feature/block-2-authoring`

This branch is **not deployed**.

- product name: **Hole in What?**
- beta label: **BETA RC6**
- candidate telemetry build ID: `hole-in-what-beta-rc6`
- PR: **#5**, base `dev`
- campaign geometry certified at commit: `466b5297c4f6517092dac8c09b1c05532cc21736`
- accepted campaign Full Audit: run `33158002310`

The feature branch now contains:

- Classic 11–13: ice teach, ice apply, booster teach;
- C06 bumper-route redesign;
- C11/C12 short ice bands + grass braking instead of timeout-prone ice lakes;
- final H01 redesign for a forgiving learned route without a clean trap bypass;
- profile/input DOM stacking fix;
- Community comments and all remaining text-report flows using in-game textareas rather than browser `prompt()`;
- opt-in global survey + stable one-time 5-gem reward;
- maintenance polling + hard reload after maintenance ends;
- concise spoiler-free RC6 Patch Notes;
- **Hole in What?** browser/menu branding;
- anonymous attempt + shot telemetry linked through to completed runs;
- feature and `dev` Full Audit workflows aligned to the same certification policy.

Do **not** change backend `current_build_id` or patch label until the new `dev` Pages build has actually been verified live.

## Official workflow

**`feature/**` → `dev` (BETA + human review) → `main` (official release)**

### `feature/**`

Active development only. New levels, mechanics, UI, telemetry and fixes live here. Technical smoke checks run on relevant pushes; campaign-affecting changes require Full Audit. Never deploy Pages from a feature branch.

### `dev`

Public beta and current Pages source. It receives already-certified feature work, then real mobile/desktop testing and telemetry decide what needs another feature iteration. Do not use `dev` as a scratchpad.

### `main`

Official shipped state. Promote an accepted `dev` only when the game has enough content and polish for a real release.

There is no normal `release/**` branch. See `docs/release-process.md`.

## Existing campaign — certification CLOSED

All current authored levels are individually certified for the RC6 candidate.

- **Batch A · C01–05 — CLOSED.** No geometry changes required.
- **Batch B · C06–10 — CLOSED.** Only C06 required redesign.
- **Batch C · C11–13 — CLOSED.** C11/C12 ice timeout risk removed; C13 retained.
- **Batch D · H01–05 — CLOSED.** Only H01 required redesign.

Final Full Audit over Classic 01–13 + HARD 01–05:

- **18/18 PASS · 0 REVIEW · 0 BLOCKER** in Audit 2.1 full human-model;
- Classic strict solver: 13/13 clean, 0 bypass, 0 no-route;
- HARD strict solver: 5/5 clean, 0 bypass, 0 no-route, 0 warnings;
- authored mechanics / behavior contracts PASS;
- geometry PASS;
- persistent-trap clearance PASS;
- HARD 03 RC5→RC5.1 regression fixture PASS;
- originality: **0 structurally similar pairs**.

Full metrics and batch history: `docs/campaign-audit-2026-08-28.md`.

### Key accepted fixes

**C06** — bumper relevance:

- touch 86%; casual 77%; tolerance 85%; human score 86%; recovery 100%; PASS.

**C11** — ice teach:

- touch 98%; casual 84%; tolerance 75%; recovery 100%; PASS.

**C12** — ice apply:

- touch 71%; casual 62%; tolerance 54%; recovery 94%; PASS.

**H01** — troll-language opener:

- baseline: touch 29%, casual 41%, tolerance 32%;
- final: **touch 95%, casual 82%, tolerance 78%, human score 89%, recovery 94%, trap consequence 66%**;
- the final adversarial HIO triggers the trap; `TROLL_SOLVES_WITHOUT_TRAP` is gone.

## Campaign order decision

**Keep the current order and IDs for RC6. Do not renumber.**

The large difficulty dips are intentional teaching resets:

- C04 → C05 introduces bumpers;
- C10 → C11 introduces ice.

The authored `teach → apply → exam` sequence is more important than making a machine difficulty graph monotonic. Renumbering would also create unnecessary save/progression risk.

Human beta should watch the remaining design-advisor observations on C02/C04/C08 edge rests and C11 strategic depth, but these are not reasons to reopen certified geometry automatically.

See `docs/campaign-progression.md`.

## Audit 2.1 policy

Audit is an internal critic, not an oracle. **Only Full Audit may accept/reject level design.** Fast audit/smoke output is never level-design evidence.

Full design certification:

```bash
FULL_AUDIT=1 npm run audit:courses
npm run audit:human:full
npm run audit:design
npm run audit:originality
```

Core scripts:

- `scripts/courseAudit.ts` — strict/adversarial solver;
- `scripts/audit2.ts` — human execution model;
- `scripts/audit2Design.ts` — difficulty/originality + design advice;
- `scripts/courseOriginalityAudit.ts` — structural originality.

`.github/workflows/lab-audit.yml` is technical smoke only: typecheck, build, physics, mechanics, geometry and clearance.

`.github/workflows/lab-full-audit.yml` is feature campaign certification. It triggers only for campaign/simulation/type/audit/validation changes so UI/docs commits cannot cancel a valid long audit.

`.github/workflows/full-audit.yml` now re-checks the same full standard on the exact campaign state that lands on public `dev`.

> Mathematical solution ≠ synthetic human model ≠ real human validation.

### Permanent HARD 03 regression

Keep the known-bad RC5 fixture against accepted RC5.1 geometry permanently. Future Audit calibration must continue rating the accepted version materially better.

## Physics authority

`src/systems/GolfSimulation.ts` is the **single physics authority** for campaign, audits and Community Maps.

Current core constants include:

- ball radius 13;
- max pull 172;
- power 7.4;
- grass friction 0.9875;
- ice friction 0.9982;
- sand friction 0.955;
- stop speed 18.

Phaser owns rendering, input, audio/haptics and FX; it must not implement a second physics model.

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

Procedural generation is tooling only, never player-facing campaign fallback.

## Anonymous beta telemetry

Detailed contract: `docs/beta-telemetry.md`.

The goal is to calibrate Audit against real behaviour without collecting unnecessary personal data.

### Identity / privacy

- `tester_id` is a random browser UUID;
- alias is optional and separate;
- changing alias never changes tester ID;
- legacy `troll-golf-*` localStorage keys intentionally survive the rename;
- client uses coarse device class/pointer + rounded viewport rather than requiring a full user-agent string;
- do not collect physical pointer/finger trajectories.

### RC6 attempt chain

The candidate links the same anonymous UUID across:

**attempt → shots → completed run**

`beta_attempts` records starts/completion/abandonment; `beta_shots` records gameplay-space start/end, angle, normalized power, input kind, duration, outcome and simulation event kinds; `beta_runs` remains the completed result record.

Completed attempts are retained in memory until Results submits the run; abandoned/retried attempts are detached immediately. The run captures the intended attempt before rapid navigation can start another one.

Uploads remain best-effort/asynchronous and must never block gameplay.

At the latest pre-promotion backend check, the new `beta_attempts` and `beta_shots` tables still had **0 rows**, so no RC5.1 public traffic had polluted RC6 shot data.

## Community Maps

Current single-hole loop:

**Editor → explicit draft → playtest → publish → discover → play → rate/comment/report**

Comments and report details use in-game DOM textareas. Editing invalidates previous playtest certification; creator self-rating is blocked and creator-owned deletion is server validated.

Schema may support future multi-hole courses, but do not expand it until the single-hole loop survives real multi-user beta testing.

## Campaign design principles

### Classic

Each level needs a distinct silhouette and strategic question. Preferred rhythm:

**teach → apply → reinterpret/combine → exam**

A mechanic introduction may intentionally lower raw difficulty. Never add precision solely to smooth a graph.

### HARD

A good trap:

1. makes an obvious read attractive;
2. surprises first attempt;
3. is deterministic and understandable afterwards;
4. changes the failed/learned route;
5. leaves a fair learned answer;
6. rewards knowledge more than pixel precision;
7. creates “qué cabrón”, not “esto es random”.

Never spoil HARD solutions in selection screens, tutorials or Patch Notes.

## Live ops / controlled `dev` promotion

Detailed checklist: `docs/dev-beta-promotion-checklist.md`.

Maintenance remains **OFF during feature work**.

Deployment order:

1. Gate 1 automated feature certification green;
2. real mobile + desktop candidate smoke;
3. record current `dev` SHA and backend rollback values;
4. maintenance ON immediately before promotion;
5. merge the exact accepted feature head to `dev`;
6. let Pages deploy and verify the actual public assets/build;
7. then set backend patch label to **BETA RC6** and `current_build_id` to `hole-in-what-beta-rc6`;
8. maintenance OFF;
9. verify a maintenance client hard-reloads into RC6;
10. perform immediate public-beta smoke before sharing widely.

If broken: keep maintenance ON, restore the known-good `dev` + backend state, verify Pages, then reopen.

Never make exploratory fixes directly on live `dev`; return to `feature/**`.

## Patch Notes policy

Use **BETA**, never “Friends Beta”. Player-facing notes are concise, natural and spoiler-free. Do not expose exact trap solutions, routes, Audit internals or telemetry implementation detail.

## Deliberately not building now

Do not spend RC6 on ranked/MMR multiplayer, battle pass/seasons, Daily Hole, ads/lootboxes, extra currencies or large account systems.

Long-term possibilities — larger Classic/HARD campaign, competitive online, bots/ranks and seasons — remain future work.

## Immediate next steps — resume here

1. **Do not change campaign geometry. Existing campaign certification is CLOSED.**
2. Finish RC6 release housekeeping and ensure the final feature head has green Full-policy recheck + Lab Smoke Checks.
3. Perform **Gate 2 human smoke on at least one real touch device and one desktop browser**. Validate controls, C11/C12 settling, H01/H03 usability, profile/forms, surveys and telemetry linkage.
4. Only after Gate 2 is green, open the controlled deployment window: maintenance ON → merge exact head to `dev` → Pages verification → backend build/patch update → maintenance OFF.
5. Run immediate public RC6 smoke, then share the beta with a larger independent tester cohort.
6. Use real completion/abandonment/shot/feedback evidence to decide the next `feature/**` fixes. Human beta evidence may reject an automated PASS.
7. After RC6 evidence is reviewed, add the next small Classic/HARD content batch. Do **not** preemptively reopen these 18 levels or build a huge block before learning from the cohort.
8. Promote an accepted `dev` to `main` only when content and polish are sufficient for an official release.
