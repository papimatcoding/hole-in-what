# Hole in What?

Mobile-first 2D arcade minigolf built with Phaser + TypeScript.

> **SOURCE OF TRUTH / CHAT HANDOFF — 2026-08-29**
>
> Read this file first when continuing in another chat. Update it after meaningful changes to campaign state, architecture, validation, backend/live ops, beta status or immediate priorities.

## Current state

### Public BETA RC6 — live on `dev`

- Public Pages: `https://papimatcoding.github.io/hole-in-what/`
- Repository: `papimatcoding/hole-in-what`
- Pages source: `dev`
- Current public runtime head: `767d887d32cd1f40299b3f24aaa91c34d437feca`
- Latest change: **open-beta UI hotfix**, PR #18
- Feature/artificial-review CI run: `33245412783` — **SUCCESS**
- Post-merge CI run: `33245469424` — **SUCCESS**
- Post-merge Pages run: `33245469418` — **SUCCESS**
- Maintenance: **OFF**
- Backend patch label: **BETA RC6**
- Backend build ID: `hole-in-what-beta-rc6`
- Live campaign: **Classic 01–13 + HARD 01–05**
- Product name: **Hole in What?**

The open-beta UI hotfix changes presentation/localisation only. Golf physics, scoring and campaign geometry were not changed, so the accepted campaign certification remains valid.

Legacy `troll-golf-*` localStorage keys intentionally remain stable so existing anonymous tester identity, save data and progression are not reset after the repository rename.

## Open-beta UI hotfix — PR #18

Branch: `feature/open-beta-ui-hotfix` → artificial review → `dev`.

Merged as `767d887d32cd1f40299b3f24aaa91c34d437feca`.

### 1. ES/EN localisation sweep

The original RC6 dictionary covered the main tester flow well but newer surfaces had been added after it and still contained untranslated Spanish.

The audit covered the player-facing scenes, with explicit new coverage for:

- Editor / Beta Lab;
- Customization / cosmetic collection;
- Shop;
- Rewards;
- Level Preview;
- Community Publish / draft flow;
- Patch Notes;
- Maintenance;
- Update Required;
- compound/dynamic labels such as rarity, shop rotation, object counts and build status.

`src/systems/I18nSurfaceDictionary.ts` now supplements the original RC6 dictionary.

Native browser `window.prompt()` / `window.confirm()` calls are also localised centrally by `I18nSystem`, which fixes Editor and Community Publish dialogs that could previously bypass the selected language.

Older screens re-checked during the audit — Menu, Level Select, Profile, Assistance, Results, Global Survey, Community Maps and Community Play — were already substantially covered by the original RC6 dictionary.

### 2. Seasonal cosmetics no longer imply an active pass

The seasonal cosmetic teasers remain visible so players can see future content, but an unavailable season pass is no longer advertised.

Current behavior for unowned seasonal cosmetics:

- status: `PRÓXIMAMENTE` / `COMING SOON`;
- detail: `Contenido de temporada · próximamente` / `Seasonal content · coming soon`;
- no `PASE` / `PASS` purchase implication.

Current seasonal definitions remain future content:

- Spirit Orb;
- Spirit Petals;
- Spirit Bloom.

Do not implement pass ownership/unlock behavior until the season-pass system actually exists.

### 3. Cosmetic UI alignment

Visual alignment was reviewed separately from gameplay rendering.

Fixed UI presentation:

- trail composition in the large Customization preview;
- trail icons in Customization cards;
- trail icons in Shop cards;
- hole-effect preview vertical centering;
- hole-effect list icon vertical centering.

The actual ball renderer was reviewed: ball centers are consistent; intentionally asymmetric details such as Orbit's satellite are decorative and not object offsets.

Gameplay cosmetic positioning, golf physics and collision geometry are unchanged.

### 4. CI now matches the documented workflow

`.github/workflows/ci.yml` now runs on pull requests targeting both `dev` and `main`.

This means the documented default workflow is now mechanically supported:

**`feature/**` → artificial review/CI → `dev` → human review → `main`**

PR #18 itself passed that feature-branch CI before merge.

## Repository rename — COMPLETE

The repository was renamed from `troll-golf` to `hole-in-what` on 2026-08-29 before the Reddit/open-beta wave.

PR #17 prepared the migration safely:

- Vite derives the Pages base path from `GITHUB_REPOSITORY`;
- pre-rename builds continued to work under `/troll-golf/`;
- post-rename builds automatically target `/hole-in-what/`;
- package/devcontainer metadata uses **Hole in What?**;
- legacy browser-storage keys were deliberately preserved.

Validation history:

- PR #17 merge: `2d34b5f7478f46933077b71fa229e59193b94cc8`
- pre-rename CI: `33244050708` — SUCCESS
- pre-rename Pages: `33244050721` — SUCCESS
- first post-rename trigger: `5a19e7b2c2c8c95d4358d4ccfe629dc2cd3b7a84`
- post-rename Pages: `33244590415` — SUCCESS with environment URL `https://papimatcoding.github.io/hole-in-what/`

The old `/troll-golf/` Pages path is not canonical and must not be shared with new testers.

## Previous RC6 experience hotfix

Latest mechanics-independent UX fixes before PR #18 were shipped in runtime commit `02357338a6eadbd4480c47d2cf0b9ef15e81a044`.

### HARD preview

HARD cards show only the start-visible miniature, level ID and star targets. They must not announce or hint that a trap exists.

Forbidden trap-signposting includes language such as:

- `TRAMPA`;
- `OCULTA`;
- `VISIBLE`;
- `SIN SPOILERS`;
- discovery instructions.

Latent `popWalls`, `popBumpers` and `popVoids` remain absent from the miniature.

Principle: **HARD must surprise through play, not announce that a surprise exists.**

### Gameplay HUD accidental activation

Back, beta previous/next and in-hole REPORT buttons arm from their own pointer-down. A shot gesture that starts elsewhere and releases over a button must not activate that button.

If a stationary ball is physically underneath a HUD button, a pointer-down inside the ball grab radius prioritises the shot gesture.

### Duplicate beta reports

Exact duplicate reports are suppressed client + server:

- identical in-flight client reports are coalesced;
- identical recently-successful reports are suppressed for 3 seconds;
- Supabase has a BEFORE INSERT guard for identical report fingerprints within 3 seconds;
- transactional smoke confirmed first identical insert = 1 row, immediate second = 0 rows.

Historical duplicate rows remain preserved as evidence.

## RC6 human-validation status

### DOM forms

Real mobile smoke exposed Phaser 4.2.1 DOMElement origin drift under camera zoom. PR #14 deployed:

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
- Community comments/reports;
- Results report detail textarea;
- in-hole quick report with explicit category + optional detail;
- persistent ES/EN selector;
- Spanish default for fresh Spanish/Catalan locales, English otherwise;
- seasonal cosmetics clearly marked as future content;
- neutral HARD previews.

## Current human feedback snapshot — external RC6 only

Exclude legacy `Matkiller` and every alias prefixed `DEV |` from external-cohort interpretation.

Snapshot from 2026-08-28:

- 5 external RC6 browser/tester identities with activity;
- all then classified desktop;
- 39 attempts;
- 20 completed attempts;
- 17 level ratings;
- 73 post-input-fix external `mouse` shots;
- only 4 external `unknown` shots, all from older pre-fix data.

| Mode | Ratings | Avg fun | Avg originality | Avg difficulty | Avg surprise |
| --- | ---: | ---: | ---: | ---: | ---: |
| Classic | 13 | **2.08/5** | **2.23/5** | 1.92/5 | — |
| HARD | 4 | **4.25/5** | **4.00/5** | 1.75/5 | **4.00/5** |

Per-level signal includes:

- C01: 2.0 fun / 1.0 originality / 1.0 difficulty;
- C02: 2.0 / 1.0 / 1.0;
- C03: 1.5 / 1.5 / 1.0;
- C09–C10: 3.0 fun in the first fuller external run;
- H01: 3 fun / 3 originality / 3 surprise;
- H03: 5 fun / 5 originality / 5 surprise;
- H04: 4 fun / 4 originality / 5 surprise;
- H05: 5 fun / 4 originality in the newest external rating.

Interpretation only, not a redesign decision:

- Classic is accessible but early C01–C03 currently read as too plain / low-variety;
- do not simply make Classic harder, because the early holes are teaching levels;
- HARD currently expresses the game's identity/fun substantially more strongly;
- sample size is still too small for blind level rewrites.

## Campaign artificial certification — CLOSED

Accepted campaign Full Audit: run `33158002310`.

- **18/18 PASS · 0 REVIEW · 0 BLOCKER** synthetic human model;
- Classic strict solver: 13/13 clean, 0 bypass, 0 no-route;
- HARD strict solver: 5/5 clean, 0 bypass, 0 no-route, 0 warnings;
- authored mechanics / behavior contracts PASS;
- geometry PASS;
- persistent-trap clearance PASS;
- permanent HARD03 RC5→RC5.1 regression PASS;
- originality: 0 structurally similar pairs.

Key accepted synthetic checkpoints:

- C06 touch 86%, casual 77%, tolerance 85%, human 86%, recovery 100%;
- C11 touch 98%, casual 84%, tolerance 75%, human 90%, recovery 100%;
- C12 touch 71%, casual 62%, tolerance 54%, human 65%, recovery 94%;
- H01 touch 95%, casual 82%, tolerance 78%, human 89%, recovery 94%, trap consequence 66%;
- H03 touch 89%, casual 77%, tolerance 72%, human 83%, recovery 100%, trap consequence 80%.

Campaign order is intentional. C04→C05 and C10→C11 are teaching resets.

Do not reopen campaign geometry solely because of unrelated UX/i18n/telemetry work.

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

## Audit V3.1 — shadow work

Branch: `feature/audit-v3`. Draft PR #7. Keep shadow-only until meaningful human calibration exists.

Accepted V3.1 candidate: `4e61ec0e213c5e8d8bc56077c0f05a619b13fdce`.
Full Audit run `33168040095`, job `98838118811` — SUCCESS. Artifact `9684761826`.

| HARD | V3 consequence | V3.1 consequence | Option loss | Troll Score |
| --- | ---: | ---: | ---: | ---: |
| H01 | 62% | 78% | 25% | 83 → 86 |
| H02 | 45% | 64% | 8% | 74 → 77 |
| H03 | 91% | 91% | 53% | 87 → 87 |
| H04 | 15% | 73% | 20% | 60 → 71 |
| H05 | 51% | 66% | 11% | 78 → 81 |

Next cognition work: memory / learning across attempts.
Future architecture direction: shared declarative **Trigger → Action** world-state engine for runtime + Audit V3 and trap-specific counterfactuals.

## Anonymous beta telemetry contract

Detailed contract: `docs/beta-telemetry.md`.

Current developer mobile-smoke alias: `DEV | Matkiller444`.

- `beta_attempts.attempt_id` is the attempt authority;
- `beta_shots` stores `attempt_id`;
- completion/abandon summary updates that same attempt row;
- `beta_runs` is a parallel completed-result record;
- `beta_runs` currently has **no `attempt_id` column**.

Never describe the DB as a literal attempt→shots→run foreign-key chain.

Historical RC6 shots before PR #11 can have `input_kind = unknown`; post-fix desktop data validates `mouse`. A fresh real-device mobile shot is still useful to reconfirm `touch` in the current public build.

## Community Maps

Supported loop:

**Editor → draft → playtest → publish → discover → play → rate/comment/report**

Rules:

- editing invalidates playtest certification;
- creator self-rating is blocked;
- creator deletion is server-validated;
- do not expand to multi-hole community courses until this loop survives real multi-user beta.

## HARD design principles

A good troll trap:

1. makes an obvious read attractive;
2. surprises the first attempt;
3. is deterministic and understandable afterwards;
4. changes the failed/learned route;
5. leaves a fair learned answer;
6. rewards knowledge more than pixel precision;
7. creates “qué cabrón”, not “esto es random”.

Never spoil HARD solutions **or the mere existence/location/type of a trap** in selectors, previews, tutorials, Patch Notes or translations.

## Product direction after beta validation

Longer-term vision remains:

- expand campaign toward roughly 40 Classic/learning holes + 40 difficult/troll holes;
- stars drive replay/optimisation;
- competitive online up to 10 players, with bots filling empty slots and difficulty scaling with rank;
- competitive winner = least strokes, then fastest time as tiebreak;
- ranked points/ranks;
- seasonal pass + themed season holes only once the underlying system actually exists;
- first season concept: dreamy / spiritual-flower, ethereal, floral and mystical.

Do not let roadmap cosmetics imply a live pass before that feature exists.

## Immediate next steps — resume here

1. **Human-smoke the public UI hotfix** at `https://papimatcoding.github.io/hole-in-what/` in both ES and EN.
2. Priority translation checks: Editor, Customization, Shop, Rewards, Level Preview, Community Publish prompts, Patch Notes, Maintenance/Update screens where reproducible.
3. Visual check Customization + Shop: trail compositions and hole-effect previews/icons should look optically centered; seasonal teasers should say `PRÓXIMAMENTE` / `COMING SOON`, never `PASE`.
4. Recheck DOM fields on a real mobile device and make a fresh mobile shot; confirm `input_kind = touch`.
5. Recheck shot-release-over-HUD behavior and one normal in-hole report if not already reconfirmed on the current URL.
6. If no blocker appears, **the build is ready for the Reddit/open-beta wave**. Use only the canonical `/hole-in-what/` Pages URL.
7. Keep collecting external data while feature work continues. Do not promote ordinary beta iteration to `main` until beta acceptance.
