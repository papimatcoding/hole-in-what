# Hole in What? · `dev` beta promotion checklist

This checklist records the RC6 promotion from an artificially-certified `feature/**` candidate into the public `dev` beta.

**Branch contract:**

- `feature/**` = artificial validation only: technical smoke + Full Audit + design/originality review.
- `dev` = public/developer BETA where real humans test mobile + desktop and produce telemetry/feedback.
- `main` = official release only after an accepted beta.

Human testing is **not** a precondition for merging feature → dev. Human problems found on `dev` return to a new `feature/**` fix and must pass artificial validation again before another promotion.

## RC6 identity / deployment record

- Public product name: **Hole in What?**
- Beta label: **BETA RC6**
- Telemetry build ID: `hole-in-what-beta-rc6`
- Public GitHub Pages source: `dev`
- Live `dev` SHA after promotion: `e90bf9b194044fb7af86a73e282a81bdc3133a9d`
- Previous known-good / rollback `dev`: `8075b162dc2b3e7b73b2fd0d36e6fbc5248120f4`
- Certified feature head: `635df7afcf7843b262bc1abacecf1c61020ae40c`
- Certified campaign geometry: `466b5297c4f6517092dac8c09b1c05532cc21736`
- Accepted campaign Full Audit: run `33158002310`
- Final feature smoke: run `33159784439` — SUCCESS
- Pages deployment: run `33159887971` — build + deploy SUCCESS
- Post-merge `dev` CI: run `33159888019` — SUCCESS
- Backend patch label: `BETA RC6`
- Backend current build: `hole-in-what-beta-rc6`
- Maintenance after deployment: **OFF**

Keep repository/path `troll-golf` for RC6 so existing links do not break. Keep legacy localStorage keys so tester identity, saves and survey state survive the rename.

## Gate 1 · feature artificial certification — CLOSED

- [x] Batch A C01–05 CLOSED.
- [x] Batch B C06–10 CLOSED.
- [x] Batch C C11–13 CLOSED.
- [x] Batch D H01–05 CLOSED.
- [x] Latest campaign-affecting geometry has a successful Full Audit over C01–13 + H01–05.
- [x] **18/18 PASS · 0 REVIEW · 0 BLOCKER** in the accepted full synthetic human-model run.
- [x] Strict Classic solver: 13/13 clean; only intentional teaching-dip warnings remain.
- [x] Strict HARD solver: 5/5 clean, 0 bypass/no-route/warnings.
- [x] H03 RC5→RC5.1 regression fixture PASS.
- [x] Originality: 0 structurally similar/fatal pairs.
- [x] Campaign ordering pass documented: preserve current order and IDs for RC6.
- [x] Feature and `dev` validation workflows aligned.
- [x] Commits after certified geometry were checked: no later campaign/physics change before promotion.
- [x] Final feature head passed Lab Smoke Checks.

## Gate 2 · migration preflight — CLOSED

- [x] PR #5 targeted `dev`; final head was `635df7af…`.
- [x] Pre-promotion `dev` re-read as `8075b162…`.
- [x] Backend re-read before migration: maintenance OFF, legacy RC5.1 patch/build values.
- [x] Rollback values recorded before live-state changes.
- [x] Candidate build ID confirmed as `hole-in-what-beta-rc6`.
- [x] Compare from campaign certification to feature head confirmed no later campaign-affecting change.

## Gate 3 · controlled feature → dev deployment — CLOSED

- [x] Backend maintenance enabled before merge.
- [x] PR #5 marked ready.
- [x] Exact checked head merged with SHA protection.
- [x] Squash merge created `dev` commit `e90bf9b194044fb7af86a73e282a81bdc3133a9d`.
- [x] Pages built and deployed that `dev` SHA successfully.
- [x] Post-merge `dev` CI passed.
- [x] Backend patch label changed to `BETA RC6` only after Pages deploy.
- [x] Backend `current_build_id` changed to `hole-in-what-beta-rc6` only after Pages deploy.
- [x] Maintenance disabled after backend/build synchronization.
- [ ] Verify on a real client that a tab left on Maintenance hard-reloads into RC6 automatically.

The unchecked item above belongs to real human beta smoke, not feature acceptance.

## Gate 4 · human beta validation on `dev` — CURRENT PHASE

This is where real testing begins. Test at least one **real touch device** and one **desktop browser**, then expand to the external cohort.

### Core game

- [ ] Fresh load reaches menu without boot error.
- [ ] Menu says **HOLE IN WHAT?**.
- [ ] Classic and HARD level selectors open.
- [ ] Shot drag/release feels correct on touch and mouse.
- [ ] C11/C12 visibly use the intended ice bands and balls settle normally.
- [ ] H01 learned route is comfortably usable while the obvious route still triggers the joke.
- [ ] H03 remains human-playable.
- [ ] Results, retry, previous/next and level-select navigation work.

### Beta UI / forms

- [ ] Player-name input is visible, editable and clickable above the Phaser canvas.
- [ ] Community comment textarea is visible/editable and saves correctly.
- [ ] Community map report detail opens as an in-game textarea and submits/cancels correctly.
- [ ] Post-level `OTRO` report opens as an in-game textarea and submits/cancels correctly.
- [ ] Assistance textarea is visible/editable and submits correctly.
- [ ] No report/comment flow opens a browser `prompt()`.
- [ ] Level feedback opens and submits without blocking gameplay.
- [ ] Global survey asks for consent/invitation before opening the full survey.
- [ ] Global survey grants the 5-gem reward at most once for a normal tester identity.
- [ ] Patch Notes show `BETA RC6` and contain no HARD solutions/spoilers.

### Anonymous telemetry

- [ ] Existing tester keeps the same anonymous `tester_id` after the rename.
- [ ] New level entry creates a `beta_attempts` row with build `hole-in-what-beta-rc6`.
- [ ] A shot creates `beta_shots` with logical course start/end, angle, power, input kind and outcome.
- [ ] Attempt → shots → completed `beta_runs` row share the intended attempt UUID.
- [ ] Leaving/retrying produces an ended or stale non-completed attempt, not a fake completed run.
- [ ] Rapid finish → retry/navigation does not attach the previous completed run to the new attempt.
- [ ] No full user-agent string is required by the new client.
- [ ] Gameplay still works normally with telemetry requests unavailable/failed.
- [ ] `scripts/betaTelemetryAggregate.sql` returns aggregate per-level metrics without exposing tester IDs.

### Immediate public-beta smoke

- [ ] Mobile public URL works from a normal cached browser.
- [ ] Desktop public URL works.
- [ ] One Classic run completes and appears under RC6 telemetry.
- [ ] One HARD run completes and appears under RC6 telemetry.
- [ ] One intentional abandon/retry appears correctly in attempt telemetry.
- [ ] Attempt → shot → run join is queryable for the smoke run.
- [ ] No RC5.1 asset mix/stale title remains.
- [ ] Community Maps discovery/play/comment/report still works.
- [ ] Online-presence counter still updates.
- [ ] Maintenance remains OFF after verification.

Once the first human smoke is green, share the same `dev`/Pages beta with the wider tester cohort.

## Wider-cohort evidence to watch

Prioritize what automated audit cannot prove:

- level-start → completion funnel;
- abandon/stale-attempt rate per level;
- attempts per player;
- median/P75 strokes and time;
- touch vs mouse outcome differences;
- void/error-heavy shots;
- favourite / weakest levels;
- fun, originality and perceived difficulty;
- route clusters revealing cheese or unexpectedly narrow answers.

Do not edit a level because one tester fails it. Compare real telemetry, qualitative feedback and Full Audit together. A human-beta problem returns to `feature/**` and receives new artificial validation before another `dev` promotion.

## Rollback

If RC6 is broken:

1. enable/keep maintenance ON;
2. restore `dev` to `8075b162dc2b3e7b73b2fd0d36e6fbc5248120f4`;
3. let Pages redeploy;
4. restore backend build ID `beta-block-1-friends-rc5-1` and the previous RC5.1 patch label;
5. verify the public build;
6. only then disable maintenance.

Never repair broken public `dev` through exploratory gameplay edits; return to `feature/**`.
