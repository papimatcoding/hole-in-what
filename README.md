# Hole in What?

Mobile-first 2D arcade minigolf built with Phaser + TypeScript.

> **SOURCE OF TRUTH / CHAT HANDOFF — 2026-08-28**
>
> Read this file first when continuing in another chat. Update it after meaningful changes to campaign state, architecture, validation, backend/live ops, beta status or immediate priorities.

## Current state

### Public BETA — RC6 live on `dev`

RC6 has been promoted from the certified feature candidate to the public developer/beta build.

- Pages: `https://papimatcoding.github.io/troll-golf/`
- Pages source: `dev`
- latest runtime hotfix code SHA: `e4419d9fcc234986b0ece7526321083c6ece704c`
- previous known-good / rollback `dev`: `8075b162dc2b3e7b73b2fd0d36e6fbc5248120f4`
- maintenance: **OFF**
- backend patch label: **BETA RC6**
- backend build ID: `hole-in-what-beta-rc6`
- live campaign: Classic 01–13 + HARD 01–05
- product name: **Hole in What?**

The original RC6 runtime promotion landed as `e90bf9b194044fb7af86a73e282a81bdc3133a9d`. Before the wider tester cohort began, three explicitly approved beta hotfixes were applied directly on `dev`: the Phaser boot screen was renamed from `TROLL GOLF` to `HOLE IN WHAT?`; post-hole originality/difficulty ratings were expanded from the sparse `1/3/5` UI to true **1–5** controls; and the campaign previsualizer was made spoiler-safe for HARD while gaining a direct **MENU** exit plus a separate **EDITOR** action. Runtime hotfix head `e4419d9…` passed CI and Pages deployment successfully.

RC6 telemetry is no longer empty because the first personal smoke has started: at the spoiler-preview hotfix checkpoint there were **23 attempts, 40 shots, 8 runs and 8 level-feedback rows**, all from the single alias `Matkiller`. No independent external cohort had entered RC6 yet at that checkpoint, so keeping the same build ID avoids fragmenting the beta dataset while those personal smoke rows can later be excluded from external-player calibration.

Do **not** rename the repository or Pages path during RC6. Keep the existing public link stable.

### Human beta begins on `dev`

The important workflow rule is now explicit:

- `feature/**` = artificial review only;
- `dev` = real human beta/developer build;
- `main` = official release.

There is no human pre-merge gate between feature and dev. If RC6 humans find a problem, create a new `feature/**` fix, run the artificial gates there, then promote the accepted fix back to `dev`.

The three direct RC6 hotfixes above were a deliberate **pre-cohort exception** requested before the beta link was distributed to independent testers. Once the external cohort starts, return to the normal `feature/** → dev` fix flow rather than editing live beta code directly.

The previous authoring branch/PR is closed by promotion:

- merged PR #5: **BETA RC6 candidate · 18-hole campaign certified**
- certified feature head before squash merge: `635df7afcf7843b262bc1abacecf1c61020ae40c`
- certified campaign geometry: `466b5297c4f6517092dac8c09b1c05532cc21736`
- accepted campaign Full Audit: run `33158002310`

## Official workflow

**`feature/**` → `dev` (BETA / human review) → `main` (official release)**

### `feature/**`

All active development and **all artificial acceptance** live here:

- new/fixed levels, mechanics, UI and telemetry;
- technical smoke checks;
- Full Audit for campaign-affecting work;
- synthetic human model, adversarial solver, design advice and originality review;
- no public Pages deployment;
- no requirement for human gameplay before promotion.

### `dev`

Public developer/beta build and Pages source.

- receives already-artificially-certified feature work;
- real mobile/desktop players validate controls, readability, fun and fairness;
- telemetry + qualitative feedback expose failures the artificial review cannot prove;
- do not use as an exploratory scratchpad once cohort testing has started.

Human problems on `dev` return to `feature/**`.

### `main`

Official shipped state. Promote an accepted `dev` only when content/polish are sufficient for a real release.

There is no normal `release/**` stage. See `docs/release-process.md`.

## Existing campaign — artificial certification CLOSED

All currently live RC6 levels passed the pre-beta artificial campaign review.

- **Batch A · C01–05 — CLOSED.** No geometry changes required.
- **Batch B · C06–10 — CLOSED.** Only C06 required redesign.
- **Batch C · C11–13 — CLOSED.** C11/C12 ice timeout risk removed; C13 retained.
- **Batch D · H01–05 — CLOSED.** Only H01 required redesign.

Accepted Full Audit over Classic 01–13 + HARD 01–05:

- **18/18 PASS · 0 REVIEW · 0 BLOCKER** in the full synthetic human model;
- Classic strict solver: 13/13 clean, 0 bypass, 0 no-route;
- HARD strict solver: 5/5 clean, 0 bypass, 0 no-route, 0 warnings;
- authored mechanics / behavior contracts PASS;
- geometry PASS;
- persistent-trap clearance PASS;
- HARD 03 RC5→RC5.1 regression fixture PASS;
- originality: **0 structurally similar pairs**.

Full metrics and history: `docs/campaign-audit-2026-08-28.md`.

### Key accepted fixes

**C06 — bumper relevance**

- touch 86%; casual 77%; tolerance 85%; human score 86%; recovery 100%; PASS.

**C11 — ice teach**

- touch 98%; casual 84%; tolerance 75%; recovery 100%; PASS.

**C12 — ice apply**

- touch 71%; casual 62%; tolerance 54%; recovery 94%; PASS.

**H01 — troll-language opener**

- baseline: touch 29%, casual 41%, tolerance 32%;
- final: **touch 95%, casual 82%, tolerance 78%, human score 89%, recovery 94%, trap consequence 66%**;
- adversarial HIO now activates the trap; `TROLL_SOLVES_WITHOUT_TRAP` is gone.

Artificial PASS is not the end of balance review: humans on `dev` may still reject a level.

## Campaign order decision

**Keep the current order and IDs for RC6. Do not renumber.**

The main dips are intentional teaching resets:

- C04 → C05 introduces bumpers;
- C10 → C11 introduces ice.

The authored `teach → apply → exam` sequence matters more than a monotonic machine difficulty graph, and renumbering would add save/progression risk.

Human beta should watch C02/C04/C08 edge-rest observations and C11 strategic depth, but these are not automatic reasons to reopen geometry.

See `docs/campaign-progression.md`.

## RC6 scope now live

RC6 contains:

- Classic 11–13: ice teach, ice apply, booster teach;
- C06 bumper-route redesign;
- C11/C12 short ice bands + grass braking rather than timeout-prone lakes;
- H01 wider learned route + anti-cheese guard while preserving the troll trap;
- profile/input DOM stacking fix;
- Community comments and report-detail flows using in-game textareas instead of browser `prompt()`;
- opt-in global survey + stable one-time 5-gem reward;
- maintenance polling + hard reload when maintenance ends;
- concise spoiler-free **BETA RC6** Patch Notes;
- **Hole in What?** browser/menu/boot branding;
- post-hole diversión, originalidad and dificultad ratings all using a full **1–5** scale;
- HARD campaign previews hide `popWalls`, `popBumpers` and `popVoids`, suppress trap-mechanic metadata/counts and cannot open official HARD geometry into the editor by clicking a card;
- previsualizer navigation exposes an explicit **MENU** exit and a separate **EDITOR** action;
- anonymous attempt + shot telemetry linked to completed runs;
- aligned feature/dev validation workflows.

## Audit policy

Audit is an internal critic, not an oracle. **Only Full Audit may accept/reject level design before `dev`.** Fast smoke output is never level-design evidence.

Feature campaign certification:

```bash
FULL_AUDIT=1 npm run audit:courses
npm run audit:human:full
npm run audit:design
npm run audit:originality
```

Core scripts:

- `scripts/courseAudit.ts` — strict/adversarial solver;
- `scripts/audit2.ts` — synthetic human execution model;
- `scripts/audit2Design.ts` — difficulty + design advice;
- `scripts/courseOriginalityAudit.ts` — structural originality.

`.github/workflows/lab-audit.yml` is technical smoke only.

`.github/workflows/lab-full-audit.yml` is expensive feature campaign certification and only needs to trigger for campaign/simulation/type/audit/validation changes.

`.github/workflows/full-audit.yml` may re-check the exact state landing on `dev`, but **human validation happens on `dev` and is a separate evidence source**.

> Mathematical solution ≠ synthetic human model ≠ real human validation.

### Permanent HARD 03 regression

Keep the known-bad RC5 fixture against accepted RC5.1 geometry permanently. Future Audit calibration must continue rating the accepted version materially better.

## Physics authority

`src/systems/GolfSimulation.ts` is the **single physics authority** for campaign, audits and Community Maps.

Core constants:

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

Procedural generation is tooling only, never campaign fallback content.

## Anonymous beta telemetry

Detailed contract: `docs/beta-telemetry.md`.

The purpose is to learn from real beta behaviour without collecting unnecessary personal data.

### Identity / privacy

- `tester_id` is a random browser UUID;
- alias is optional and separate;
- changing alias never changes tester ID;
- legacy `troll-golf-*` localStorage keys intentionally survive the rename;
- client uses coarse device class/pointer + rounded viewport rather than requiring a full user-agent string;
- do not collect physical pointer/finger trajectories.

### RC6 attempt chain

RC6 links the same anonymous attempt UUID across:

**attempt → shots → completed run**

`beta_attempts` records starts/completion/abandonment; `beta_shots` records gameplay-space start/end, angle, normalized power, input kind, duration, outcome and simulation event kinds; `beta_runs` remains the completed result record.

Uploads are best-effort/asynchronous and must never block gameplay.

The first RC6 human smoke must verify that this linkage really arrives in Supabase before the beta link is spread widely.

## Community Maps

Current single-hole loop:

**Editor → explicit draft → playtest → publish → discover → play → rate/comment/report**

Comments and report details use in-game DOM textareas. Editing invalidates previous playtest certification; creator self-rating is blocked and creator-owned deletion is server validated.

Do not expand to multi-hole community courses until the current loop survives real multi-user beta testing.

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

Never spoil HARD solutions in selection screens, previews, tutorials or Patch Notes. Player-facing previews may show only geometry that exists visibly at hole start; latent pop traps and trap-specific metadata stay hidden.

## Live ops / controlled beta promotion

Detailed checklist: `docs/dev-beta-promotion-checklist.md`.

RC6 deployment completed in this order:

1. feature artificial certification closed;
2. final feature smoke green;
3. rollback `dev` and backend state recorded;
4. maintenance ON;
5. exact feature head merged to `dev` by SHA-protected PR merge;
6. Pages deployed `e90bf9b…` successfully;
7. `dev` CI completed successfully;
8. backend changed to `BETA RC6` / `hole-in-what-beta-rc6`;
9. maintenance OFF;
10. before external cohort testing, user-approved direct `dev` hotfixes corrected boot branding, expanded post-hole originality/difficulty controls to 1–5, and made HARD previews spoiler-safe with direct menu navigation; runtime head `e4419d9…` passed CI and Pages deploy.

If a future beta deployment breaks: keep maintenance ON, restore the previous known-good `dev` + backend state, verify Pages, then reopen.

Once cohort testing begins, never make exploratory gameplay fixes directly on public `dev`; return to `feature/**`.

## Patch Notes policy

Use **BETA**, never “Friends Beta”. Player-facing notes are concise, natural and spoiler-free. Do not expose trap solutions, exact routes, Audit internals or telemetry implementation detail.

## Deliberately not building now

Do not spend the immediate RC6 validation cycle on ranked/MMR multiplayer, battle pass/seasons, Daily Hole, ads/lootboxes, extra currencies or large account systems.

Long-term possibilities — larger Classic/HARD campaign, competitive online, bots/ranks and seasons — remain future work.

## Immediate next steps — resume here

1. **RC6 is live on `dev` with the approved pre-cohort hotfixes deployed.** Do not re-merge PR #5 or reopen the certified campaign geometry.
2. Perform the first **human beta smoke directly on the public `dev`/Pages build**: one real touch device + one desktop browser.
3. Validate loading says **HOLE IN WHAT?**, menu branding is correct, Classic/HARD selectors work, and the post-hole survey shows **1–5 for diversión, originalidad and dificultad**.
4. Validate the previsualizer: HARD thumbnails reveal only start-visible geometry, HARD cards do not open official trap geometry in the editor, **MENU** exits directly to the menu and **EDITOR** remains separately available.
5. Validate controls, C11/C12 settling, H01/H03 usability, navigation, profile/forms, survey reward and absence of browser `prompt()` dialogs.
6. Validate Supabase telemetry end-to-end: level start → `beta_attempts`, shot → `beta_shots`, completion → `beta_runs`, all sharing the intended attempt UUID; also test abandon/retry.
7. When analyzing the external cohort, exclude the known personal-smoke `Matkiller` rows from calibration unless specifically studying developer/self-test behaviour.
8. If the smoke is green, share the same public beta link with a larger independent tester cohort.
9. Watch completion/abandonment, attempts, strokes/time, touch-vs-mouse differences, shot outcomes, route clusters and qualitative feedback.
10. Any human-discovered problem after cohort testing starts becomes a **new `feature/**` fix**, gets artificial review there, then is promoted back to `dev`.
11. After RC6 evidence is reviewed, author the next small Classic/HARD content batch rather than a huge block at once.
12. Promote an accepted `dev` to `main` only when content and polish are sufficient for an official release.
