# Audit 3.0 — Map Design Advisor

Audit 3.0 is the design layer for Hole in What?. It does **not** replace human playtests and it does not replace the adversarial/human solvers. It combines those execution signals with spatial composition so that level work is reviewed like map design rather than only as solvability.

## What it evaluates

For every hole Audit 3.0 measures:

- **Clarity** — dead/tight gaps, edge-rest risk and human blockers.
- **Flow** — touch/casual success, shot tolerance, recovery and route-family count.
- **Variety** — rectangle dominance, diagonality, silhouette and perceptual similarity to nearby holes.
- **Composition** — density, open space, visual scale and possible off-route/redundant pieces.
- **Mechanic quality** — whether the primary mechanic affects a competitive route instead of behaving like decoration.
- **Goals** — 3-star target versus the modeled human route.

The report also records route length/detour, hard turns, side changes, structural coverage, apparent scale and shape mix.

## Designer outcomes

Each level receives one action:

- `KEEP`: preserve the core. Only change it when human feedback provides a reason.
- `CLEANUP`: the central question works, but polish/composition/repetition issues should be addressed.
- `REDESIGN`: the spatial question or execution model needs a meaningful rethink before piling more content on top.

Advice has priorities:

- `P0`: blocker. Fix before other design work.
- `P1`: meaningful gameplay/design debt. Review before extending the campaign.
- `P2`: polish or design opportunity. Apply when it improves the level rather than mechanically chasing a score.

## Visual clearance rule

The ball diameter is 26 px. Audit 3.0 uses **34 px** as the visual comfort threshold for corridor-like gaps:

- `<26 px`: `SEALED` — visually suspicious because the ball physically cannot pass.
- `26–34 px`: `TIGHT` — physically possible or nearly possible but visually/execution-wise questionable.

The design rule is simple: **if a gap looks like a route, the ball should fit with margin; otherwise close it clearly.**

## Repetition model

The old originality audit remains useful for near-duplicate geometry. Audit 3.0 adds *perceptual repetition* by comparing:

- shape mix,
- wall orientation,
- structural density,
- occupied spread,
- route axis/diagonal balance,
- detour/turn structure,
- mechanic mix,
- silhouette,
- and raster similarity.

This catches levels that are technically different but still feel like the same design grammar (for example repeated horizontal shelves with alternating side changes).

## Campaign-level review

Audit 3.0 looks across the sequence and reports:

- repeated silhouette runs,
- repeated apparent-scale runs,
- rectangle-heavy campaign share,
- non-rectangular usage,
- and the highest-priority levels to review.

A new hole should be describable by a **spatial sentence** before mechanics are added: _the island_, _the V_, _the ring_, _the funnel_, _the open field_, _the diagonal_. Repeating the same sentence in neighboring levels is a warning even when coordinates differ.

## Commands

```bash
npm run audit:3          # fast human model + design/originality + Audit 3.0
npm run audit:3:full     # full human model + Audit 3.0
npm run audit:3:strict   # full model; fails on true blockers
```

Outputs:

- `artifacts/audit3-report.json` — machine-readable metrics and advice.
- `artifacts/audit3-report.md` — campaign matrix + designer brief for every hole.

## Philosophy

The audit is deliberately advisory on aesthetics and composition. We should never add walls merely to improve a number. Solver trickshots can remain as mastery lines when they use the intended mechanic and are not broad human cheese. Stars follow the human route; geometry follows a clear, memorable and satisfying spatial question.
