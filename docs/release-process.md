# Hole in What? · release process

The normal project flow is:

**`feature/**` → `dev` (BETA) → `main` (official release)**

## Branch roles

- `feature/**` — active development. New mechanics, levels, UI, telemetry and fixes live here. Never deployed to the public game.
- `dev` — **public beta** and current GitHub Pages source. Real humans validate the candidate here.
- `main` — **official release**. Promote an accepted `dev` state only when the game/version is genuinely ready to ship.

There is no normal `release/**` stage. `dev` itself is the human-validation stage.

## Feature development

1. Keep all active work outside `dev`.
2. Every relevant push gets technical smoke checks.
3. Campaign-affecting pushes get the expensive **Full Audit**.
4. Work on authored levels in small batches rather than mass-editing the campaign.
5. UI, branding, telemetry, docs and SQL changes must not cancel an in-progress level certification.
6. A Full Audit PASS is automated evidence, not human release approval.

## Current existing-level batches

1. Classic 01–05
2. Classic 06–10
3. Classic 11–13
4. HARD 01–05

For each batch:

1. confirm the teaching/troll purpose of each level;
2. inspect Full Audit evidence;
3. change only what evidence justifies;
4. Full Audit the complete campaign to catch regressions outside the edited level;
5. keep changes only when execution margin, mechanic relevance, fairness, recovery, originality or progression improve without new cheese/bypasses.

Do not reorder the campaign while individual level quality is unsettled. First certify existing holes, then review ordering/progression as a separate phase.

## Closing a feature candidate

Before promotion to `dev`:

1. intended feature scope is complete;
2. every gameplay batch has an accepted Full Audit;
3. final typecheck/build/physics/mechanic/geometry/clearance smoke checks are green;
4. telemetry/backend changes are backward compatible with the currently live beta;
5. README and relevant docs describe the exact handoff;
6. player-facing Patch Notes are short and spoiler-free;
7. maintenance remains OFF until the real live transition starts.

## Promote to `dev` · BETA

For a meaningful beta deployment:

1. enable backend maintenance immediately before the live transition if clients need protection;
2. merge/promote the closed feature state to `dev`;
3. wait for GitHub Pages to publish;
4. test the actual public URL on mobile + desktop;
5. verify important backend flows and matching build identity;
6. if broken, keep maintenance ON and rollback `dev`;
7. if accepted, maintenance OFF and clients hard-reload the new build.

Human evidence can reject an automated PASS. Fixes found on `dev` return to a feature branch; never use `dev` as a scratchpad.

## Promote to `main` · official release

Promote the exact accepted `dev` state only when:

- campaign/content volume is sufficient;
- major human beta issues are resolved;
- telemetry/feedback show no unresolved release blocker;
- branding/presentation are ready;
- the release candidate has received final human acceptance.

Tag/version the official release from that accepted state.

## Maintenance rule

Maintenance is a deployment shield, not development mode. Keep it OFF while work is isolated to feature branches.

## Rollback rule

If a beta deployment fails:

1. keep maintenance ON;
2. restore `dev` to the previous known-good commit;
3. wait for Pages to redeploy;
4. smoke the restored public build;
5. restore matching backend build/status state;
6. maintenance OFF.

Never push a broken beta forward merely to avoid rolling back.

## Legacy identifiers during the rebrand

The repository/Pages path and some localStorage keys still contain `troll-golf`. Keep them until a deliberate migration is planned. Renaming them casually can break the public beta URL or split one returning tester into multiple statistical identities.
