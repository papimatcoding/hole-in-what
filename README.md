# Hole in What?

Mobile-first 2D arcade minigolf built with Phaser + TypeScript.

> **SOURCE OF TRUTH / CHAT HANDOFF — 2026-08-29**
>
> Read this file first when continuing in another chat. Update it after meaningful changes to campaign state, architecture, validation, backend/live ops, beta status or immediate priorities.

## Current state

### Public BETA RC6 — live on `dev`

- Public Pages: `https://papimatcoding.github.io/troll-golf/` **until the repository rename is executed**;
- Pages source: `dev`;
- current public **runtime code** head: `02357338a6eadbd4480c47d2cf0b9ef15e81a044`;
- latest runtime change: **direct RC6 experience hotfix** `02357338…`, explicitly requested as an exception to the normal feature workflow so new testers would not keep hitting already-known UX problems;
- hotfix public Pages run `33180376039` — **SUCCESS**;
- hotfix public CI run `33180375917` — **SUCCESS** including typecheck, build, physics, mechanic contracts, geometry, clearance, full campaign simulation and originality;
- previous runtime fixes:
  - PR #14, Phaser DOM drift;
  - PR #12, modern in-hole report;
  - PR #11, preserve shot input kind;
  - PR #8, editable DOM fields + ES/EN foundation.
- emergency rollback anchor before RC6 campaign promotion: `8075b162dc2b3e7b73b2fd0d36e6fbc5248120f4`;
- maintenance: **OFF**;
- backend patch label: **BETA RC6**;
- backend build ID: `hole-in-what-beta-rc6`;
- live campaign: **Classic 01–13 + HARD 01–05**;
- product name: **Hole in What?**.

Documentation-only commits may move the `dev` branch SHA beyond the runtime-code SHA above without changing the deployed game code. Legacy `troll-golf-*` localStorage keys intentionally remain stable so existing anonymous beta identity/progression is not reset.

## Repository / Pages rename migration — prepared, rename pending

Target repository name: **`hole-in-what`**.

PR #17 (`feature/repo-rename`) prepares the migration before the GitHub repository itself is renamed:

- `vite.config.ts` derives the Pages base from `GITHUB_REPOSITORY` instead of hardcoding `/troll-golf/`;
- while the repository is still named `troll-golf`, GitHub Actions therefore keeps building for `/troll-golf/`;
- after the repository is renamed to `hole-in-what`, the next GitHub Actions build automatically targets `/hole-in-what/`;
- package/devcontainer display metadata now uses **Hole in What?**;
- legacy `troll-golf-*` localStorage keys **must not be renamed** during this migration.

Safe execution order:

1. merge PR #17 to `dev` and require the normal CI + Pages deploy to succeed under the current `/troll-golf/` path;
2. rename the GitHub repository from `troll-golf` to `hole-in-what`;
3. make/trigger a fresh `dev` build so `GITHUB_REPOSITORY` is evaluated with the new name;
4. verify `https://papimatcoding.github.io/hole-in-what/` on desktop + mobile before sharing the Reddit link;
5. update this README so the new Pages URL becomes the sole public beta URL.

Do not send the new Pages URL to testers until step 4 passes.

## RC6 experience hotfix — deployed directly to `dev`

This was an explicit owner-approved exception to the default `feature/** → dev → main` flow because all three items were already harming the experience of people entering the current beta.

### 1. HARD preview no longer sells the trap

The previous HARD preview hid latent geometry but still displayed phrases such as **`TRAMPA OCULTA`**, **`JUEGA PARA DESCUBRIR LA TRAMPA`** and counts of **visible** objects. That was geometrically spoiler-safe but psychologically spoiler-heavy: it told players to enter each HARD hole looking for the trick instead of making a genuine first read.

Hotfix behavior:

- HARD cards show the start-visible miniature, level ID and star targets only;
- no `TRAMPA`, `OCULTA`, `VISIBLE`, `SIN SPOILERS` or discovery language;
- footer is neutral (`HARD`);
- latent `popWalls`, `popBumpers` and `popVoids` remain absent from the miniature;
- Classic preview/editor behavior is unchanged.

Principle: **HARD must surprise through play, not announce that a surprise exists.**

### 2. Gameplay HUD no longer treats a shot release as a button click

External human feedback reported that when the ball reached the HUD area, dragging it and releasing over a UI button could accidentally trigger the button.

Root cause: gameplay HUD buttons executed their action on `pointerup` without requiring the same pointer to have begun its press on that button.

Hotfix behavior:

- back, beta previous/next and in-hole REPORT buttons now arm only from their own `pointerdown`;
- a pointer that began elsewhere and merely releases over a button cannot activate it;
- when a stationary ball is physically underneath a button, a pointer-down inside the ball grab radius prioritises the shot gesture instead of arming the HUD button.

This is a gameplay-input fix only; physics and level geometry are unchanged.

### 3. Exact duplicate beta reports are suppressed client + server

RC6 produced a real external duplicate report pair only ~15 ms apart, proving the old client-only close/submitting guards were insufficient.

Current mitigation:

- client `BetaTelemetry.submitReport()` coalesces identical in-flight reports and suppresses identical recently successful submissions for 3 seconds;
- Supabase has a `BEFORE INSERT` trigger on `beta_reports` that serialises identical report fingerprints and rejects an exact duplicate within 3 seconds;
- the DB guard is backward-compatible with already deployed clients;
- a transactional smoke confirmed first identical insert = **1 row**, immediate second identical insert = **0 rows**.

Do not delete historical duplicate rows; preserve them as evidence of the previous behavior.

## RC6 human validation status

### DOM forms

Real mobile smoke exposed Phaser 4.2.1 DOMElement origin drift under camera zoom. PR #14 deployed the CSS workaround:

```css
#game input,
#game textarea {
  transform-origin: 0 0 !important;
}
```

Human re-check remains useful for Profile, Assistance, Results/in-hole report and Community textareas on touch + desktop, especially keyboard/focus behavior.

### Current player-facing beta flow

- Player Profile name editing;
- Assistance textarea;
- Community comment/report textareas;
- Results report detail textarea;
- in-hole quick report with explicit category + optional textarea + SEND/CLOSE;
- no browser `window.prompt()` in active Results or in-hole report flows;
- persistent ES/EN selector;
- Spanish default for fresh Spanish/Catalan locales, English otherwise;
- translated normal tester flow;
- neutral HARD preview with no trap-signposting language.

## Workflow — default project rule

Unless the project owner explicitly says otherwise, **all work follows this promotion path**:

**`feature/**` → artificial review → `dev` → human review → `main`**

- `feature/**`: active development and **artificial acceptance only**. Technical smoke for normal changes; Full Audit for campaign/simulation/design-affecting work. Feature branches are not the public human-test build.
- `dev` during beta: receives work after relevant artificial checks pass. It is the **human-validation / public beta build**. Human-discovered problems normally return to a fresh `feature/**` branch and must pass artificial review before coming back to `dev`.
- `main` during beta: do not promote ordinary beta iteration here. `main` receives the game when beta is complete and the build is accepted as the real shipped game.
- **After beta completion:** `main` becomes the player/release build and `dev` becomes the ongoing **developer build** for future development and human validation before later promotions to `main`.

Do not bypass a stage unless the owner explicitly requests an exception. The 2026-08-28 RC6 experience hotfix above is such an explicit exception and should not be treated as a new default.

## Current human feedback snapshot — RC6 external only

Exclude legacy `Matkiller` and every alias prefixed `DEV |` from external-cohort interpretation.

At the latest 2026-08-28 snapshot there are **5 external RC6 browser/tester identities** with activity, all currently classified desktop:

- **39 attempts**;
- **20 completed attempts**;
- **17 level ratings**;
- at least one tester progressed cleanly through Classic 01–10 before reporting the HUD overlap/input problem at C11;
- new post-PR #11 external shot telemetry contains **73 `mouse` shots**; the only 4 external `unknown` shots are from the older pre-fix session.

Current rating signal is small-N but directionally strong:

| Mode | Ratings | Avg fun | Avg originality | Avg difficulty | Avg surprise |
| --- | ---: | ---: | ---: | ---: | ---: |
| Classic | 13 | **2.08/5** | **2.23/5** | 1.92/5 | — |
| HARD | 4 | **4.25/5** | **4.00/5** | 1.75/5 | **4.00/5** |

Per-level external signal currently includes:

- C01: 2.0 fun / 1.0 originality / 1.0 difficulty;
- C02: 2.0 / 1.0 / 1.0;
- C03: **1.5 / 1.5 / 1.0**;
- C09–C10: 3.0 fun in the first fuller external run;
- H01: 3 fun / 3 originality / 3 surprise;
- H03: **5 fun / 5 originality / 5 surprise**;
- H04: **4 fun / 4 originality / 5 surprise**;
- H05: **5 fun / 4 originality** in the newest external rating.

Interpretation, not yet a redesign decision:

- Classic is succeeding at being accessible but currently reads as **too plain / low-variety**, especially C01–C03;
- the problem is not simply “make Classic harder”; early difficulty being low is expected for teaching levels;
- HARD is currently expressing the identity/fun of the game much more strongly;
- the small sample is enough to guide the next feature discussion, but not enough to blindly rewrite individual levels.

## Campaign artificial certification — CLOSED

The live 18-hole RC6 campaign is certified. Do not reopen geometry solely because of unrelated UX/i18n/telemetry work.

Accepted campaign Full Audit: run `33158002310`.

- **18/18 PASS · 0 REVIEW · 0 BLOCKER** synthetic human model;
- Classic strict solver: 13/13 clean, 0 bypass, 0 no-route;
- HARD strict solver: 5/5 clean, 0 bypass, 0 no-route, 0 warnings;
- authored mechanics / behavior contracts PASS;
- geometry PASS;
- persistent-trap clearance PASS;
- permanent HARD03 RC5→RC5.1 regression PASS;
- originality: **0 structurally similar pairs**.

Key final synthetic checkpoints:

- C06 touch 86%, casual 77%, tolerance 85%, human 86%, recovery 100%;
- C11 touch 98%, casual 84%, tolerance 75%, human 90%, recovery 100%;
- C12 touch 71%, casual 62%, tolerance 54%, human 65%, recovery 94%;
- H01 touch 95%, casual 82%, tolerance 78%, human 89%, recovery 94%, trap consequence 66%;
- H03 touch 89%, casual 77%, tolerance 72%, human 83%, recovery 100%, trap 80%.

Campaign order remains intentional. C04→C05 and C10→C11 are teaching resets. Full history: `docs/campaign-audit-2026-08-28.md` and `docs/campaign-progression.md`.

## Audit policy

Audit is an internal critic, not an oracle. Mathematical solution ≠ synthetic human model ≠ real human validation.

Current V2 authority:

```bash
FULL_AUDIT=1 npm run audit:courses
npm run audit:human:full
npm run audit:design
npm run audit:originality
```

Physics authority: `src/systems/GolfSimulation.ts`.
Keep the known-bad RC5 HARD03 fixture against accepted RC5.1 permanently.

## Audit V3.1 — active shadow work

Branch: **`feature/audit-v3`**. Draft PR #7. Keep it shadow-only until meaningful human calibration exists.

V3 adds blind/curious/suspicious belief agents, HARD bait→consequence→comprehension→mastery reasoning, troll-quality metrics, accidental terminal detection, map intelligence, human/artificial metric fusion and anonymised first-attempt/retry/device/route-cluster aggregates.

### V3.1 consequence look-ahead — synthetic calibration accepted

Accepted candidate: `4e61ec0e213c5e8d8bc56077c0f05a619b13fdce`.
Full Audit run `33168040095` / job `98838118811` — **SUCCESS**.
Artifact `9684761826`.

| HARD | V3 consequence | V3.1 consequence | Option loss | Troll Score |
| --- | ---: | ---: | ---: | ---: |
| H01 | 62% | 78% | 25% | 83 → 86 |
| H02 | 45% | 64% | 8% | 74 → 77 |
| H03 | 91% | 91% | 53% | 87 → 87 |
| H04 | **15%** | **73%** | 20% | **60 → 71** |
| H05 | 51% | 66% | 11% | 78 → 81 |

H04's chained consequence is now represented without broad score inflation. The old `WEAK_CONSEQUENCE:15%` signal was a V3 proxy limitation, not a geometry defect.

Next cognition work: **memory / learning across attempts**. Future foundation: shared declarative **Trigger → Action** world-state engine for runtime + Audit V3 and trap-specific counterfactuals.

## Anonymous beta telemetry

Detailed contract: `docs/beta-telemetry.md`.

The current developer mobile smoke alias is **`DEV | Matkiller444`**. Treat aliases prefixed `DEV |` as developer/self-test data, alongside the legacy `Matkiller` alias; do not let them enter external-cohort calibration.

### Input-kind fix

Historical RC6 shots before PR #11 are `input_kind = unknown`. New external desktop data validates the fix: **73 post-fix external shots are currently `mouse`**. Mobile/touch still needs a new real-device shot confirming `touch`.

### Exact linkage

- `beta_attempts.attempt_id` is the attempt authority;
- `beta_shots` rows store that `attempt_id`;
- completion/abandon summary updates the same attempt row;
- `beta_runs` is a parallel completed-result record.

`beta_runs` currently has **no `attempt_id` column**. Do not describe the DB as a literal attempt→shots→run foreign-key chain.

## Community Maps

Supported loop:

**Editor → draft → playtest → publish → discover → play → rate/comment/report**

Editing invalidates playtest certification. Creator self-rating is blocked and creator deletion is server-validated. Do not expand to multi-hole community courses until this loop survives real multi-user beta.

## HARD design principles

A good troll trap:

1. makes an obvious read attractive;
2. surprises a first attempt;
3. is deterministic and understandable afterwards;
4. changes the failed/learned route;
5. leaves a fair learned answer;
6. rewards knowledge more than pixel precision;
7. creates “qué cabrón”, not “esto es random”.

Never spoil HARD solutions **or the mere existence/location/type of a trap** in selectors, previews, tutorials, Patch Notes or translations. A neutral start-state preview is allowed; trap-signposting language is not.

## Immediate next steps — resume here

1. Complete the repository rename migration in the exact order documented above; do not share the new Pages URL until the post-rename deploy passes.
2. **Human-check the public runtime after that deploy.** Open HARD preview and confirm it no longer mentions traps/hidden/visible/spoilers/discovery.
3. In gameplay, deliberately start a ball drag and release over BACK / level arrows / REPORT. The shot gesture must not activate the HUD button. Also test a stationary ball sitting underneath a HUD button if reproducible.
4. Send a normal in-hole report and confirm one expected DB row. The server exact-duplicate guard is already transactionally smoke-tested; keep watching real reports for recurrence.
5. Finish the mobile DOM re-check and make a fresh mobile shot; confirm `input_kind = touch`.
6. Only after the rename + smoke is clean, prepare/share the Reddit beta post using the new `hole-in-what` Pages URL.
7. Then return to the normal feature workflow. Main discussion should distinguish:
   - improving Classic's early fun/identity/variety without destroying its teaching role;
   - adding genuinely new mechanics/visual variety rather than only more holes with the same pieces;
   - deciding the next small Classic/HARD content batch;
   - Trigger → Action architecture and future troll vocabulary;
   - Audit V3 memory/learning work in parallel, still shadow-only.
8. Keep collecting external RC6 data while feature work happens. Do not promote beta iteration to `main` until the beta is complete and accepted.
