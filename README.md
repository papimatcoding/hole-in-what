# Hole in What?

Mobile-first 2D arcade minigolf built with Phaser + TypeScript.

> **SOURCE OF TRUTH / CHAT HANDOFF — 2026-08-28**
>
> Read this file first when continuing in another chat. Update it after meaningful changes to campaign state, architecture, validation, backend/live ops, beta status or immediate priorities.

## Current state

### Public BETA RC6 — live on `dev`

- Public Pages: `https://papimatcoding.github.io/troll-golf/`
- Pages source: `dev`
- current public **runtime code** head: `9377551d78e0fb29e82b1b88bb44836e7dee2d03`
- latest runtime promotion: PR #14, **BETA RC6 · fix Phaser DOM drift**
- previous runtime fixes:
  - PR #12, modern in-hole report;
  - PR #11, preserve shot input kind;
  - PR #8, editable DOM fields + ES/EN foundation.
- PR #14 feature smoke: run `33169927639` — **SUCCESS**
- PR #14 public Pages: run `33170005536` — **SUCCESS**
- PR #14 public CI: run `33170005527` — **SUCCESS**
- emergency rollback anchor before RC6 campaign promotion: `8075b162dc2b3e7b73b2fd0d36e6fbc5248120f4`
- maintenance: **OFF**
- backend patch label: **BETA RC6**
- backend build ID: `hole-in-what-beta-rc6`
- live campaign: **Classic 01–13 + HARD 01–05**
- product name: **Hole in What?**

Documentation-only commits may move the `dev` branch SHA beyond the runtime-code SHA above without changing the deployed game code. Do not rename the repository or Pages path during RC6. Legacy `troll-golf-*` localStorage keys intentionally remain stable so existing anonymous beta identity/progression is not reset.

The original RC6 campaign promotion landed as `e90bf9b194044fb7af86a73e282a81bdc3133a9d`. Before the broader independent cohort starts, approved beta-unblock fixes have corrected boot branding, 1–5 post-hole ratings, spoiler-safe HARD previews, editable fields, ES/EN, shot input classification, in-hole reporting and the Phaser DOM alignment issue found by real mobile smoke.

## RC6 human validation status

### DOM forms — fix deployed, human re-check pending

Real mobile smoke on 2026-08-28 proved that the HTML input/textarea elements were visible but horizontally displaced relative to Phaser UI. The profile input and Assistance textarea showed the same offset, proving this was a shared renderer problem rather than scene-specific layout.

Root cause: Phaser **4.2.1** upstream issue `phaserjs/phaser#7329` / PR `#7330`. Scene-level `DOMElement`s with the default centered origin drift when `camera.zoom != 1` because the renderer applies the origin offset twice. Hole in What? deliberately uses a high-DPI design camera zoom (`RENDER_SCALE`, normally 2), so the bug is visible on real devices.

PR #14 applies a narrow RC6 workaround in `src/styles.css`:

```css
#game input,
#game textarea {
  transform-origin: 0 0 !important;
}
```

This matches the transform origin used by Phaser's correct parent-container render path and preserves the existing high-DPI/camera architecture. It affects only player form fields; gameplay, physics, campaign geometry, saves, telemetry schema and backend build ID are unchanged.

**Human acceptance still required:** refresh the current public build on the same mobile device and verify Profile + Assistance alignment first, then Results/in-hole report and one Community textarea. Repeat critical fields on desktop.

### Current player-facing beta flow

- Player Profile name editing;
- Assistance textarea;
- Community comment/report textareas;
- Results report detail textarea;
- in-hole quick report with explicit category + optional textarea + SEND/CLOSE;
- no browser `window.prompt()` in the active Results or in-hole report flows;
- persistent ES/EN selector;
- Spanish default for fresh Spanish/Catalan locales, English otherwise;
- translated normal tester flow;
- report panels close/guard before awaiting network requests to reduce accidental duplicate sends.

## Workflow

**`feature/**` → `dev` (public BETA / human validation) → `main` (official release)**

- `feature/**`: active development and artificial acceptance. Technical smoke for normal changes; Full Audit for campaign/simulation/design-affecting work. No public Pages deployment.
- `dev`: public beta. Humans validate touch/mouse behavior, readability, fun, fairness and forms. Once external cohort testing starts, do not use it as an exploratory scratchpad.
- `main`: official shipped state only.

Any human-discovered problem on `dev` returns to a new `feature/**` branch, passes the relevant artificial gates and is promoted back to `dev` for human re-validation.

## Campaign artificial certification — CLOSED

The live 18-hole RC6 campaign is certified. Do not reopen geometry because of unrelated UX/i18n/telemetry work.

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

### Current known data

Legacy developer/self-test alias `Matkiller` currently has:

- 33 attempts;
- 10 completed attempts;
- 49 shots;
- 10 completed run rows;
- 8 level-feedback rows;
- 1 game-feedback row.

There is also one other anonymous browser/session with C01 completed in **4 strokes / 44.371 s / 1★**, with attempt/run summary consistency and four linked shot rows. Do not automatically treat that browser as an independent tester without provenance.

The current developer mobile smoke alias is **`DEV | Matkiller444`**. Treat aliases prefixed `DEV |` as developer/self-test data, alongside the legacy `Matkiller` alias; do not let them enter external-cohort calibration.

### Input-kind fix

Historical RC6 shots recorded before PR #11 are `input_kind = unknown`, so they cannot support touch-vs-mouse conclusions.

PR #11 now preserves Phaser pointer type, falls back to the latest browser pointer event, then finally coarse-device classification. Human acceptance is pending: make one **new mobile shot** and one **new desktop shot** and confirm Supabase records `touch` / `mouse`, not `unknown`.

### Exact linkage

- `beta_attempts.attempt_id` is the attempt authority;
- `beta_shots` rows store that `attempt_id`;
- completion/abandon summary updates the same attempt row;
- `beta_runs` is a parallel completed-result record.

`beta_runs` currently has **no `attempt_id` column**. Do not describe the DB as a literal attempt→shots→run foreign-key chain.

### Report duplicates

Older `troll-05` developer smoke produced duplicate report pairs. Current Results and in-hole report flows reduce the obvious client double-tap path. Supabase still has no report idempotency key, so the acceptance test remains: send exactly one current-build report and verify exactly one row arrives before adding backend complexity.

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

Never spoil HARD solutions in selectors, previews, tutorials, Patch Notes or translations.

## Immediate next steps — resume here

1. **Refresh public runtime `9377551d…` on the same mobile device.** Re-check Profile input and Assistance textarea alignment. This is the immediate gate created by the 2026-08-28 screenshot smoke.
2. If aligned, check one Results/in-hole report textarea and one Community textarea on mobile; verify keyboard/focus remains usable.
3. Make at least one new mobile gameplay shot. Query Supabase and confirm `input_kind = touch`, not `unknown`.
4. Send exactly one in-hole test report and verify exactly one `beta_reports` row arrives.
5. Repeat critical form checks and one gameplay shot on desktop; confirm `input_kind = mouse`.
6. Keep developer/self-test rows (`Matkiller` and `DEV |*`) excluded from independent-cohort calibration.
7. If mobile + desktop smoke are green, share the same RC6 URL with the broader independent/PlayMyGame cohort. Keep `hole-in-what-beta-rc6` so the cohort remains one dataset.
8. Watch completion/abandonment, first-attempt vs retry lift, strokes/time, touch-vs-mouse gaps, route clusters, ratings and qualitative comments.
9. In parallel, continue Audit V3 with **memory across attempts**; keep V3.1 shadow-only until calibrated against humans.
10. After RC6 evidence is reviewed, author the next **small** Classic/HARD content batch with stronger mechanic/visual variety rather than a huge dump.
11. Promote accepted `dev` to `main` only when content and polish justify an official release.
