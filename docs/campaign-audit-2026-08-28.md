# Campaign audit · 28 Aug 2026

Full Audit 2.1 baseline: **14 PASS · 4 REVIEW · 0 BLOCKER** across Classic 01–13 and HARD 01–05. Geometry, mechanic contracts, clearance, full solver, human model and originality all passed structurally.

## Review queue

| Hole | Touch | Casual | Tolerance | Reason |
|---|---:|---:|---:|---|
| C06 | 70% | 70% | 64% | Main bumper is avoidable on the competitive route |
| C11 | 69% | 60% | 51% | Ice moving-timeout risk 8%; Block 2 reset is very easy |
| C12 | 96% | 86% | 67% | Ice moving-timeout risk 17% |
| H01 | 29% | 41% | 32% | First HARD learned route is too narrow on touch |

## Progression signal

Classic solver difficulty: `18.0 → 21.2 → 20.4 → 34.3 → 24.5 → 25.7 → 33.3 → 33.8 → 35.9 → 36.6 → 22.4 → 22.8 → 22.3`.

HARD solver difficulty: `30.1 → 30.9 → 42.6 → 40.9 → 48.8`.

Main pacing questions: C04→C05 drops sharply inside Block 1; C10→C11 is a large reset that can be intentional when teaching ice, but should gain strategy rather than precision.

## Work order

1. **P0 beta shell:** deploy C11–13, fix name/comment DOM fields, opt-in global survey with one-time gem reward, maintenance auto-refresh and concise patch notes.
2. **P1 review holes:** H01 first, then C06, C12 and C11. Change one or two holes per audit pass.
3. **P2 progression:** revisit C04/C05 pacing and manually inspect C02/C04/C08 edge-rest warnings.
4. Only then continue authoring C14+ and HARD 06+.

## Promotion rule

A hole is not finished because the solver can beat it. Promotion requires no structural blockers, plausible touch execution, recoverability, relevant primary mechanic, no accidental cheese route, a clear progression role, and manual mobile + desktop smoke testing.

Do not mass-edit or blindly reorder existing IDs; preserve level identity/save compatibility and improve in small audited batches.
