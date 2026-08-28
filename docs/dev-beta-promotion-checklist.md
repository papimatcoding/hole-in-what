# Hole in What? · `dev` beta promotion checklist

This checklist promotes an already-certified `feature/**` candidate into the public `dev` beta. It does **not** replace Full Audit or real human testing.

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

## Gate 1 · feature certification

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
- [ ] Policy-only Lab Full recheck triggered by the final workflow-path correction finishes green.
- [ ] Final housekeeping head passes Lab Smoke Checks after README/Patch Notes/checklist are frozen.

## Gate 2 · human feature smoke before merge

Test at least one **real touch device** and one **desktop browser**. Machine audit cannot sign this gate.

### Core game

- [ ] Fresh load reaches menu without boot error.
- [ ] Menu says **HOLE IN WHAT?**.
- [ ] Classic and HARD level selectors open.
- [ ] Shot drag/release feels unchanged on touch and mouse.
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

## Gate 3 · controlled deployment window

Only after Gates 1–2 are green:

1. Re-read current `dev` SHA and backend `current_build_id` / patch label immediately before deployment.
2. Enable backend maintenance.
3. Verify PR #5 still targets `dev` and record the **exact head SHA** being approved.
4. Merge/promote that exact head into `dev`; do not merge if the head moved after human approval.
5. Let GitHub Pages deploy `dev`.
6. Open the real public URL in a clean/private browser and hard-refresh once.
7. Verify menu/title/assets are RC6 and core gameplay starts.
8. **Only now** set backend patch label to `BETA RC6` and `current_build_id` to `hole-in-what-beta-rc6`.
9. Verify presence/status calls report the same current build.
10. Disable maintenance.
11. Verify a client already sitting on Maintenance hard-reloads into RC6 automatically.

## Gate 4 · immediate public-beta smoke

After maintenance is OFF:

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

Only then share the beta link with the wider tester cohort.

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
