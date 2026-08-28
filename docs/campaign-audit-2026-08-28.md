# Campaign audit · 28 Aug 2026

Existing-level certification is **CLOSED** for the RC6 feature candidate.

Accepted campaign geometry commit: `466b5297c4f6517092dac8c09b1c05532cc21736`

Accepted Full Audit run: `33158002310`

Final automated result across Classic 01–13 + HARD 01–05:

- **18/18 PASS · 0 REVIEW · 0 BLOCKER** in Audit 2.1 full human-model;
- Classic strict solver: **13/13 clean**, 0 bypass, 0 too-easy, 0 no-route;
- HARD strict solver: **5/5 clean**, 0 bypass, 0 too-easy, 0 no-route, 0 warnings;
- authored mechanic contracts PASS;
- geometry PASS;
- persistent-trap clearance PASS;
- HARD 03 RC5→RC5.1 regression fixture PASS;
- originality: **0 structurally similar pairs**, 0 fatal pairs.

The only strict-solver warnings left in Classic are intentional teaching difficulty dips at C04→C05 and C10→C11. They are not unresolved level-quality reviews.

## Final human-model snapshot

| Hole | Touch | Casual | Tolerance | Human score | Recovery | Trap consequence | Status |
|---|---:|---:|---:|---:|---:|---:|---|
| C01 | 97% | 86% | 78% | 90% | 91% | — | PASS |
| C02 | 79% | 74% | 62% | 73% | 97% | — | PASS |
| C03 | 80% | 74% | 49% | 70% | 97% | — | PASS |
| C04 | 95% | 87% | 67% | 85% | 100% | — | PASS |
| C05 | 84% | 81% | 77% | 81% | 100% | — | PASS |
| C06 | 86% | 77% | 85% | 86% | 100% | — | PASS |
| C07 | 84% | 76% | 67% | 78% | 100% | — | PASS |
| C08 | 99% | 97% | 93% | 97% | 97% | — | PASS |
| C09 | 89% | 76% | 47% | 74% | 100% | — | PASS |
| C10 | 85% | 77% | 46% | 71% | 100% | — | PASS |
| C11 | 98% | 84% | 75% | 90% | 100% | — | PASS |
| C12 | 71% | 62% | 54% | 65% | 94% | — | PASS |
| C13 | 91% | 81% | 73% | 85% | 97% | — | PASS |
| H01 | **95%** | **82%** | **78%** | **89%** | **94%** | **66%** | PASS |
| H02 | 63% | 61% | 37% | 54% | 100% | 57% | PASS |
| H03 | 89% | 77% | 72% | 83% | 100% | 80% | PASS |
| H04 | 81% | 79% | 54% | 72% | 100% | 33% | PASS |
| H05 | 80% | 69% | 53% | 70% | 97% | 41% | PASS |

The human model is synthetic evidence, not a substitute for real mobile/desktop beta testing.

## Batch closure

### Batch A · C01–05 — CLOSED

No geometry changes were justified. All five retained their authored roles.

### Batch B · C06–10 — CLOSED

Only C06 changed. Its first bumper and lower shelf were adjusted so the bumper is relevant to a broad intended route rather than decorative/bypassable.

Accepted C06 result: touch 86%, casual 77%, tolerance 85%, human score 86%, recovery 100%, PASS.

### Batch C · C11–13 — CLOSED

C11/C12 originally used large continuous ice regions that could leave recovery shots moving until simulation timeout. They now use shorter ice bands with grass braking zones.

Accepted results:

- C11: touch 98%, casual 84%, tolerance 75%, recovery 100%, PASS;
- C12: touch 71%, casual 62%, tolerance 54%, recovery 94%, PASS;
- C13 unchanged: touch 91%, casual 81%, tolerance 73%, recovery 97%, PASS;
- no `MOVING_TIMEOUT_RISK` remains;
- ice remains relevant to the intended routes.

### Batch D · H01–05 — CLOSED

H02–H05 required no changes. H01 was the only baseline REVIEW.

Baseline H01: touch 29%, casual 41%, tolerance 32%, trap consequence 43%.

A trigger-radius-only experiment did not improve human execution and was rejected. The accepted redesign instead:

1. preserves the original broad trap trigger (`150`);
2. lowers the top of the persistent vertical divider while keeping its lower endpoint, widening the learned crossover from 66 px to 102 px;
3. adds a short low-left guard that blocks an unrelated full-power outer-bank HIO found by the adversarial solver without narrowing the learned route.

Final H01: touch **95%**, casual **82%**, tolerance **78%**, human score **89%**, recovery **94%**, trap consequence **66%**, PASS.

The final strict solver best HIO is `326°@0.82` and triggers `wall:0`; the previous `TROLL_SOLVES_WITHOUT_TRAP` warning is gone.

## Progression/order decision

**Keep the current campaign order and IDs for RC6. Do not renumber.**

Reasons:

- C04→C05 is an intentional reset to teach bumpers after the first placement exam;
- C10→C11 is an intentional reset to teach ice after the Block 1 finale;
- the authored sequence better expresses `teach → apply → exam` than sorting by raw difficulty;
- preserving IDs avoids unnecessary save/progression migration risk.

Remaining design-advisor notes on C02/C04/C08 edge rests and C11 strategic depth are **human-beta observation items**, not automated reasons to reopen certified geometry.

## Promotion rule from here

The automated level-design gate is closed. Before `dev` promotion, perform the real-device candidate smoke in `docs/dev-beta-promotion-checklist.md` and keep backend/live state unchanged until the deployment window begins.

Human beta evidence may still reject an automated PASS. Any resulting level fix returns to `feature/**` and receives a new Full Audit before going back to `dev`.
