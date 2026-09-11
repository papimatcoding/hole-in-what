# RC7 · Product Validation

RC7 is a validation build, not a content-expansion build. Its purpose is to determine whether the current core slice can turn a cold external visitor into a player who understands the controls, progresses into the campaign, discovers HARD, and expresses intent to keep playing.

## Scope freeze

During RC7 validation:

- authored campaign geometry, golf physics and scoring stay frozen unless a reproducible blocker appears;
- Shop and Customization are product-gated as **Coming Soon**;
- gameplay renders the default ball, no trail and default hole effect so legacy tester saves do not create different visual/game-feel cohorts;
- progression and stars remain active;
- HARD remains the strongest identity signal and is measured explicitly rather than treated as a secondary afterthought.

## Cohort

Product decisions exclude:

- any `beta_testers.alias` beginning with `DEV` (case-insensitive);
- legacy `Matkiller` data;
- RC6 and earlier data when evaluating RC7 conversion.

The target validation wave is 20–30 new external testers who receive no extra explanation beyond the game itself.

## RC7 product telemetry

Build ID: `hole-in-what-beta-rc7`.

Existing `beta_attempts`, `beta_runs`, `beta_shots` and level feedback remain the authority for play behavior. RC7 adds a separate product layer:

- `beta_product_events`: session/menu/product funnel events;
- `beta_product_pulses`: one low-friction product-intent response per tester/build;
- `product-telemetry` Edge Function: validated anonymous write gateway using the server-side service role;
- `scripts/productValidationReport.sql`: external-cohort report.

The product pulse appears only after meaningful play (a completed HARD hole or at least three completed Classic holes), never for a `DEV*` alias. It asks:

1. whether the tester would keep playing;
2. whether they would buy a complete version at €1.99: yes / maybe / no.

Purchase intent is directional research, **not a sales forecast**.

## Primary decision metrics

The report tracks:

- external tester count;
- attempts and completed runs;
- C01 start/completion and tutorial completion rate;
- reach to C03 and C05;
- HARD discovery, start and completion;
- average completed session duration;
- return on another calendar day;
- voluntary level replay;
- pulse response rate;
- keep-playing intent;
- €1.99 purchase intent;
- per-level fun/originality/difficulty/surprise.

## Working validation targets

These are directional product gates, not mathematical truths:

- C01 completion: **≥ 85–90%**;
- reach C03: **≥ 70%**;
- HARD should retain roughly **4/5 fun** among players who reach it;
- Classic should move toward **3.3–3.5+ fun** while preserving its teaching role;
- HARD discovery → play conversion should be strong enough that it clearly functions as the payoff of the funnel;
- voluntary replays and multi-day returns are especially valuable positive signals.

Do not compensate for weak retention by blindly adding levels or difficulty. Diagnose the exact funnel break first.

## RC7 UI policy

Gameplay HUD is split into two reserved rows:

- top row: back, star objective, beta previous/next;
- bottom row: strokes, report, level ID and time.

No navigation/report control is allowed to float independently over authored course space.

Menu hierarchy prioritizes the playable product. Shop and Customization remain visible only as disabled **Coming Soon** affordances so testers do not mistake unfinished economy systems for part of the validated experience.

## Release gate

Before RC7 is promoted to public `dev`:

1. TypeScript/build CI must pass;
2. existing gameplay/audit checks in CI must remain green;
3. Supabase security advisors must show no new actionable security issue;
4. product report SQL must execute successfully on an empty RC7 cohort;
5. mobile + desktop human visual smoke should confirm HUD spacing, menu spacing and pulse interaction;
6. once Pages is live, `app_status.current_build_id` and patch label must be updated to RC7 together with the public runtime.

Only after an external RC7 wave should we decide whether the next major investment is more content, another onboarding/Classic correction, or commercial presentation / Steam wishlist work.
