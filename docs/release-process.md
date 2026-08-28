# Release workflow

## Branch roles

- `feature/**` — active development. New mechanics, levels, UI and fixes are built here. Never deployed to the public game.
- `dev` — **beta branch**. GitHub Pages currently deploys this branch. Code reaches `dev` only after automated certification; this is where real humans test the candidate build.
- `main` — **official release branch**. Promote `dev` to `main` only when the game/version is considered ready for public release.

There is no separate `release/**` stage in the normal workflow. `dev` itself is the human-validation stage.

## Core flow

**feature → dev (beta) → main (official release)**

### 1. Feature development

1. Work on one or more `feature/**` branches.
2. Keep typecheck/build/physics/mechanic integrity checks green while developing.
3. For authored levels, work in small batches rather than changing the whole campaign at once.
4. Every level batch must pass the **Full Audit** before it can be proposed for `dev`.
5. The fast/smoke workflow is useful for catching code breakage, but its human-model output is not an acceptance criterion for level design.

### 2. Level audit batches

Current campaign review batches:

1. Classic 01–05
2. Classic 06–10
3. Classic 11–13
4. HARD 01–05

For each batch:

1. define the intended teaching/troll role of every level;
2. inspect the latest Full Audit evidence;
3. change several related levels only when evidence justifies it;
4. run the **Full Audit** over the complete campaign to detect local improvements and global regressions;
5. keep only changes that improve the intended experience without introducing precision traps, cheese, bypasses or progression problems.

Do not reorder the campaign while individual level quality is still unsettled. First make every existing level good; then evaluate progression/order as a separate pass.

### 3. Promote to `dev`

Once a feature/batch is fully certified:

1. merge it into `dev`;
2. GitHub Pages publishes the beta;
3. perform real mobile + desktop human playtests;
4. collect level/global feedback and telemetry;
5. fix any human-only problems on a new feature branch and repeat Full Audit before returning to `dev`.

`dev` is a beta/review branch, not a scratchpad.

### 4. Promote to `main`

When the campaign has enough high-quality content and the beta is considered release-ready:

1. finish the final Full Audit and human regression pass on `dev`;
2. update release notes/versioning;
3. promote the exact accepted `dev` state to `main`;
4. treat `main` as the official shipped version.

## Maintenance during beta deployments

Do not enable maintenance while feature work is happening.

For a real `dev` deployment window:

1. enable backend maintenance immediately before promoting the certified feature build;
2. merge/promote to `dev`;
3. wait for GitHub Pages to publish;
4. verify the deployed build and backend `current_build_id` agree;
5. disable maintenance.

Clients on the maintenance screen poll the status and perform a full page reload when maintenance ends so they cannot continue with stale assets.

## Rollback

If a beta deployment is broken, keep maintenance enabled, restore `dev` to the previous known-good commit, let Pages redeploy it, restore the previous backend build ID, verify, then disable maintenance.
