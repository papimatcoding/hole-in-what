# Hole in What? · `dev` beta promotion checklist

This checklist is for promoting an already-certified `feature/**` candidate into the public `dev` beta. It does **not** replace Full Audit or human beta testing.

## Candidate identity

- Public product name: **Hole in What?**
- Candidate beta label: **BETA RC6**
- Candidate telemetry build ID: `hole-in-what-beta-rc6`
- Public GitHub Pages source remains `dev`.
- Keep the existing repository/path name `troll-golf` for this beta so old links do not break.
- Keep legacy localStorage keys so existing anonymous tester identity, saves and survey state survive the rename.

## Gate 1 · feature certification

Do not promote until all are true:

- [ ] Batch A C01–05 CLOSED.
- [ ] Batch B C06–10 CLOSED.
- [ ] Batch C C11–13 CLOSED.
- [ ] Batch D H01–05 CLOSED.
- [ ] Latest campaign-affecting commit has a successful Full Audit over C01–13 + H01–05.
- [ ] 0 campaign BLOCKER.
- [ ] No unresolved REVIEW that contradicts the intended level role.
- [ ] H03 RC5→RC5.1 regression fixture PASS.
- [ ] Originality audit has no fatal/structural duplicate.
- [ ] Latest feature head passes Lab Smoke Checks.
- [ ] Campaign ordering pass is documented; do not renumber IDs just to smooth raw difficulty.

## Gate 2 · feature smoke before merge

Test at least one real touch device and one desktop browser.

### Core game

- [ ] Fresh load reaches menu without boot error.
- [ ] Menu says **HOLE IN WHAT?**.
- [ ] Classic and HARD level selectors open.
- [ ] Shot drag/release feels unchanged on touch and mouse.
- [ ] C11/C12 visibly use the intended ice bands and balls settle normally.
- [ ] H01 learned route is usable while the obvious route still triggers the joke.
- [ ] H03 remains human-playable.
- [ ] Results, retry, previous/next and level-select navigation work.

### Beta UI / forms

- [ ] Player-name input is visible, editable and clickable above the Phaser canvas.
- [ ] Community comment textarea is visible/editable and saves correctly.
- [ ] Assistance textarea is visible/editable and submits correctly.
- [ ] Level feedback opens and submits without blocking gameplay.
- [ ] Global survey asks for consent/invitation before opening the full survey.
- [ ] Global survey grants the 5-gem reward at most once for a normal tester identity.
- [ ] Patch Notes show `BETA RC6` and contain no HARD solutions/spoilers.

### Anonymous telemetry

- [ ] Existing tester keeps the same anonymous `tester_id` after the rename.
- [ ] New attempt creates a `beta_attempts` row with build `hole-in-what-beta-rc6`.
- [ ] A completed shot creates `beta_shots` data with logical course start/end, power, angle, input kind and outcome.
- [ ] Leaving/retrying a level produces an ended or stale non-completed attempt rather than a fake completed run.
- [ ] Completing a level still creates the normal `beta_runs` row.
- [ ] No full user-agent string is required by the new client.
- [ ] `scripts/betaTelemetryAggregate.sql` returns aggregate per-level metrics without exposing tester IDs.

## Gate 3 · deployment window

Only after Gates 1–2 are green:

1. Confirm current `dev` SHA and backend `current_build_id` so rollback is known.
2. Enable backend maintenance immediately before the promotion.
3. Keep the candidate PR targeted at `dev` and verify its head SHA has not moved since the accepted checks.
4. Merge/promote the exact certified feature head into `dev`.
5. Let GitHub Pages deploy `dev`.
6. Open the actual public URL in a clean/private browser and hard-refresh once.
7. Verify menu/title/assets are the new build and core gameplay starts.
8. Update backend patch label to **BETA RC6** and `current_build_id` to `hole-in-what-beta-rc6` only when the new Pages build is confirmed live.
9. Verify presence/status calls report the same current build.
10. Disable maintenance.
11. Verify a client that was sitting on Maintenance hard-reloads into the new build automatically.

## Gate 4 · immediate public-beta smoke

After maintenance is OFF:

- [ ] Mobile public URL works from a normal cached browser.
- [ ] Desktop public URL works.
- [ ] One Classic run completes and appears under RC6 telemetry.
- [ ] One HARD run completes and appears under RC6 telemetry.
- [ ] One intentional abandon/retry appears in attempt telemetry.
- [ ] No RC5.1 asset mix/stale title remains.
- [ ] Community Maps discovery/play/comment still works.
- [ ] Online-presence counter still updates.

Once these are green, share the beta link with the wider tester cohort.

## What to watch from the wider cohort

Prioritize evidence that the automated audit cannot prove:

- level-start → completion funnel;
- abandon/stale-attempt rate per level;
- extra attempts per player;
- median/P75 strokes and time;
- touch vs mouse outcome differences;
- void/error-heavy shots;
- favourite / weakest levels;
- fun, originality and perceived difficulty;
- repeated route clusters that reveal cheese or unexpectedly narrow solutions.

Do not automatically edit a level because one tester fails it. Compare real telemetry, qualitative feedback and Full Audit together.

## Rollback

If the deployed beta is broken:

1. keep maintenance ON;
2. restore `dev` to the recorded previous known-good SHA;
3. let Pages redeploy;
4. restore the previous backend `current_build_id` / patch label;
5. verify the public build;
6. only then disable maintenance.

Never try to repair a broken live `dev` by making exploratory edits directly on `dev`; return to `feature/**`.
