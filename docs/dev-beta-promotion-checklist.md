# Hole in What? · `dev` beta promotion checklist

This checklist promotes an already-certified `feature/**` candidate into the public `dev` beta.

**Branch contract:**

- `feature/**` = artificial validation only: technical smoke + Full Audit + design/originality review.
- `dev` = public/developer BETA where real humans test mobile + desktop and produce telemetry/feedback.
- `main` = official release only after an accepted beta.

Human testing is therefore **not a precondition for merging feature → dev**. Any problem found by humans on `dev` returns to a new `feature/**` fix and must pass the artificial gates again before another beta promotion.

## Candidate identity

- Public product name: **Hole in What?**
- Candidate beta label: **BETA RC6**
- Candidate telemetry build ID: `hole-in-what-beta-rc6`
- Public GitHub Pages source remains `dev`.
- Keep repository/path `troll-golf` for RC6 so existing links do not break.
- Keep legacy localStorage keys so tester identity, saves and survey state survive the rename.
- Certified campaign geometry: `466b5297c4f6517092dac8c09b1c05532cc21736`.
- Accepted campaign Full Audit: run `33158002310`.
- Known-good rollback `dev`: `8075b162dc2b3e7b73b2fd0d36e6fbc5248120f4`.

## Gate 1 · feature artificial certification

Campaign certification is closed. Do not reopen geometry during release housekeeping.

- [x] Batch A C01–05 CLOSED.
- [x] Batch B C06–10 CLOSED.
- [x] Batch C C11–13 CLOSED.
- [x] Batch D H01–05 CLOSED.
- [x] Latest campaign-affecting geometry has a successful Full Audit over C01–13 + H01–05.
- [x] **18/18 PASS · 0 REVIEW · 0 BLOCKER** in the accepted full human-model run.
- [x] Strict Classic solver: 13/13 clean; only intentional teaching-dip warnings remain.
- [x] Strict HARD solver: 5/5 clean, 0 bypass/no-route/warnings.
- [x] H03 RC5→RC5.1 regression fixture PASS.
- [x] Originality: 0 structurally similar/fatal pairs.
- [x] Campaign ordering pass documented: preserve current order and IDs for RC6.
- [x] Feature and `dev` Full workflows use the same full certification standard.
- [x] Policy/workflow housekeeping does not alter certified campaign geometry.
- [ ] Final feature head passes Lab Smoke Checks after release docs/Patch Notes are frozen.

## Gate 2 · migration preflight

No human gameplay approval is required here. This gate only ensures we know exactly what is being promoted and how to roll it back.

- [ ] Re-read current PR #5 head SHA and confirm target is `dev`.
- [ ] Re-read current `dev` SHA immediately before promotion.
- [ ] Re-read backend `maintenance`, `patch_label` and `current_build_id`.
- [ ] Record the rollback values before changing live state.
- [ ] Confirm the candidate build ID remains `hole-in-what-beta-rc6`.
- [ ] Confirm no campaign-affecting commit has appeared after the accepted Full Audit without a new Full Audit.

## Gate 3 · controlled feature → dev deployment

Only after Gates 1–2 are green:

1. Enable backend maintenance.
2. Mark PR #5 ready and merge/promote the **exact checked feature head** into `dev`.
3. Do not make exploratory edits directly on `dev`.
4. Let GitHub Pages deploy the new `dev` commit.
5. Verify the public Pages deployment corresponds to the new `dev` SHA/build.
6. Set backend patch label to `BETA RC6` and `current_build_id` to `hole-in-what-beta-rc6` only after the new Pages build is confirmed.
7. Verify app status reports the same build.
8. Disable maintenance.
9. A client left on Maintenance should hard-reload into RC6 automatically.

## Gate 4 · human beta validation on `dev`

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

Do not edit a level because one tester fails it. Compare real telemetry, qualitative feedback and Full Audit together. A human-beta problem returns to `feature/**` and receives a new Full Audit before another `dev` promotion.

## Rollback

If RC6 deployment is broken:

1. keep maintenance ON;
2. restore `dev` to the recorded previous known-good SHA;
3. let Pages redeploy;
4. restore the previous backend build ID / patch label;
5. verify the public build;
6. only then disable maintenance.

Never repair broken public `dev` through exploratory edits on `dev`; return to `feature/**`.
