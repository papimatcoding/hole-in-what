# Release workflow

## Branch roles

- `feature/*`: active development and experiments. Never deployed to the public beta.
- `release/*`: frozen release candidate. Only fixes, audits and final copy changes.
- `dev`: published beta. GitHub Pages deploys only this branch.

## Preparing a patch

1. Work entirely on a `feature/*` branch.
2. Keep automated audits green while iterating.
3. When feature scope is complete, create `release/<version>` from the exact feature head.
4. Stop adding features. Run full audits and manual mobile + desktop tests on the release candidate.
5. Update concise patch notes and build ID before promotion.

## Publishing

1. Set backend maintenance on immediately before the deployment window.
2. Merge the frozen release candidate into `dev`.
3. Wait for the `Deploy Pages` workflow to publish the new `dev` build.
4. Verify the deployed build and backend `current_build_id` agree.
5. Set backend maintenance off. Clients on the maintenance screen automatically reload the page and receive the new assets.

## Rollback

If the deployed build is broken, keep maintenance enabled, revert `dev` to the previous known-good commit, let Pages deploy it, restore the previous backend build ID, verify, then disable maintenance.

`dev` should never be used as an active workbench. A patch reaches it only as one reviewed promotion.
