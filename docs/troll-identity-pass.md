# Troll identity — feature candidate, NOT deployed

Base: `feature/validation-funnel-pass` at `935cd9b`. This candidate includes the
unmerged geometry/funnel work; do not merge it as though it were based on dev.

## Product direction

### Stars / prestige follow-up

Stars remain central to replay and progression. Never reveal stroke targets during
gameplay, including retries. The level selector reveals a target only after that
hole has been completed; Results reveals both targets after every completion.

The first prestige track uses existing 10/20/35/50-star cosmetic milestones.
Cosmetics are enabled and equipable; the shop stays disabled. Results shows
cumulative progress toward the next milestone and links to Prestige. Stars are
best-per-hole, never spent; rewards are permanent and automatically granted once.
Tests cover milestone crossing, equipping, duplicate claims and replay farming.

Chapter entry requirements are still pending campaign grouping/pacing decisions;
this pass does not pretend they are implemented. Future ranked access may use
progression, but ranked and its eligibility thresholds remain out of scope.

- One campaign; troll is the identity from the very first shot, not a difficulty.
- First shot reveals a persistent wall and a bilingual, non-modal welcome.
- A unified 21-hole selector and continuous Results navigation preserve legacy
  level IDs and telemetry modes. Current C01–C16, H01–H05 order is provisional;
  this is not the completed campaign rework or a 30–40-hole release.
- Spanish and English for all new copy, using the existing language selector.
- Future competitive play combines strategy and chaos; not in this sprint.
- CrazyGames and monetization are the destination, not implemented integrations.

## Reversibility

Set `TROLL_MENU_ENABLED=false` in `src/config/product.ts` to restore the previous
menu palette, unrotated logo and undecorated background. Campaign navigation and
tutorial behavior remain independent of this switch. No save keys were renamed.

## Release discipline

`feature/**` (agent-only checks, no player deployment) → `dev` (beta and metrics)
→ `main` (accepted final release). Pages now rejects manual dispatch from non-dev
branches. No feature preview is published. Final-release hosting is still pending.

Current beta: https://papimatcoding.github.io/hole-in-what/

## Validation and outstanding gates

Build/typecheck, hole physics, mechanic integrity/behavior, geometry and clearance
passed locally. `test:tutorial` covers idle invisibility, 12 direction/power
combinations, first-shot reveal, actual wall collision, persistence, no repeat,
retry reset, unique campaign IDs and legacy-to-unified navigation mapping.

Fast course audit found all 21 holes solvable, no bypass and no no-route result.
C01 initially had TOO_EASY_FOR_TARGET with provisional 3/5 star limits. The full
human-model probe found a two-shot human route (touch acceptance 94%, casual 75%,
minimum tolerance 58%, recovery 89%). Targets are now 2/3. These percentages are
simulator perturbation metrics, not real player completion or retention rates.

Trap relevance now follows the presence of trap primitives, not legacy mode labels.
Fresh/resumed save tests cover C16→H01→H02 unlocks, stable IDs and unchanged currency.
Local Vite serves a connect-src CSP blocking external telemetry during agent tests.
The welcome hides while the ball crosses its bounds instead of concealing gameplay.

DO NOT PROMOTE YET:
- Browser visual/input QA in desktop/mobile ES/EN is not complete: the local
  local browser download failed; the connected cloud browser subsequently blocked
  the local URL with ERR_BLOCKED_BY_CLIENT. Neither attempt certifies the visuals.
- Full Audit has not been certified for this candidate.
- C01's revised 2/3 targets and new trap audit need final Full Audit certification.
- Portal/Beta Lab separation and less intrusive surveys remain pending.
- CrazyGames SDK, monetization and platform compliance have not been implemented
  or certified. Existing live metrics must not be used as evidence for this build.

Before release, audit existing UI translations beyond this pass, verify resumed
saves and C16→H01 navigation interactively, and review the provisional ordering.
