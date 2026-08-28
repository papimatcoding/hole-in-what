# Hole in What? · anonymous beta telemetry

This document defines the beta data contract. Collect gameplay evidence only when it has a concrete design, reliability or Audit-calibration use.

## Goal

The beta should answer four questions with real player evidence:

1. Where do players abandon or retry?
2. Which shots/mechanics create execution friction on touch vs mouse?
3. Does perceived difficulty match Audit 2.1 predictions?
4. How should the synthetic mouse/touch/casual profiles be recalibrated from real play?

The telemetry is not a substitute for surveys or manual playtesting. It provides behavioural evidence that can be compared with them.

## Stable anonymous identity

`tester_id` is a random browser UUID. It is deliberately stored under the legacy `troll-golf-*` localStorage key after the rename to **Hole in What?** so existing testers do not become statistically new people.

An optional player alias may be attached to the same tester ID for leaderboards/community features. Changing the alias never changes the anonymous identity.

## Device context

New beta builds record only coarse context needed to interpret controls:

- device class: `mobile | tablet | desktop | unknown`;
- whether the primary pointer is coarse;
- viewport width/height rounded to the nearest 100 px.

New builds do **not** submit the full browser user-agent string or exact viewport dimensions for analytics.

## Attempt telemetry

Every campaign level entry creates a random `attempt_id` in `beta_attempts` with:

- anonymous tester ID;
- build ID;
- level/mode;
- attempt number for that build + level;
- start/end time;
- completion state;
- exit reason when known;
- strokes, elapsed gameplay time and void count when the attempt ends normally.

A stale attempt with no end event is useful evidence: it usually represents a tab/app close or another abrupt abandonment and must not be silently treated as a completed run.

## Shot telemetry

Each launched campaign shot may create one row in `beta_shots`:

- attempt ID;
- level/build/mode;
- shot number;
- input kind: `touch | mouse | pen | unknown`;
- ball start position in the fixed game-design coordinate system;
- shot angle and normalized power;
- ball end position in game-design coordinates;
- shot duration;
- outcome: `rest | void | hole`;
- unique simulation event kinds observed during the shot.

Coordinates are **game-board coordinates**, not physical finger/mouse screen coordinates. Pointer movement paths are not collected.

## Existing completion and feedback data

`beta_runs` remains the compact completed-run dataset used for leaderboard and historical comparisons:

- attempts count;
- strokes/time/stars;
- mechanics and traps touched;
- voids;
- completion.

`beta_level_feedback` and `beta_game_feedback` remain subjective evidence and must stay separate from machine-derived metrics. Never average Audit ratings and player ratings into one score; disagreement is a diagnostic signal.

## Metrics to calculate once the next beta has enough samples

Per level/build/input class:

- unique players;
- attempt count and attempts/player;
- completion rate;
- stale/abandoned-attempt rate;
- retry rate;
- median/P75 strokes and completion time;
- void rate;
- first-shot and later-shot route clusters;
- shot outcome rate;
- distribution of angle/power around successful route families;
- mechanic/trap contact rate;
- survey difficulty/fun/originality with sample size and confidence.

Campaign-wide:

- level-to-level continuation funnel;
- first-session depth;
- mobile vs desktop retention;
- where a mechanic introduction causes a statistically unusual abandonment/retry spike.

## Audit 2.1 calibration plan

Do not tune the human profiles from tiny samples.

Current synthetic profiles are priors, not ground truth. Once a useful sample exists, compare real shot dispersion around successful route families with the Audit route and estimate robust angular/power error separately for touch and mouse. Prefer median/MAD or trimmed estimates so deliberate alternate routes and experimental shots do not inflate the control-error model.

Calibration stages:

- `< 30` external players: qualitative/diagnostic only;
- `30–50`: first provisional per-device estimates if individual levels have enough shots;
- `50–100+`: start recalibrating global touch/mouse priors, always retaining holdout levels for validation;
- larger samples: consider skill cohorts (new / typical / strong) only if the data clearly supports them.

A model update is accepted only if it predicts held-out human results better than the previous profile and still passes known regressions such as the bad vs accepted HARD 03 fixture.

## Privacy / data-minimisation rules

Do not add telemetry fields merely because they are easy to collect.

Do not collect for Audit calibration:

- email or account identity;
- IP addresses in application tables;
- full browser fingerprint/user-agent in new analytics events;
- raw physical pointer/finger trajectories;
- arbitrary page browsing history;
- private free text outside explicit feedback/support fields.

Raw comments/support messages are human feedback, not model-training/calibration input by default. Audit snapshots should use aggregated/non-identifying values.

## Operational rule

Telemetry failure must never block, slow or alter gameplay. Uploads are best-effort and asynchronous. `dev` is the human-testing beta; feature branches prepare and validate the collection logic before promotion.
