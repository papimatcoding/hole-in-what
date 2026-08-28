# Hole in What? · campaign progression

The campaign should feel deliberately authored rather than sorted by raw solver difficulty. Each hole needs a role: **teach**, **apply**, **combine**, **exam**, or **troll escalation**.

Difficulty may dip when a new mechanic is introduced. The important rule is that the dip is intentional and followed by meaningful application.

## Classic · current structure

| Hole | Role | Main lesson | Current direction |
|---|---|---|---|
| C01 | Teach | Basic angle/power and wall reading | Certified opener; leave alone unless human beta evidence disagrees |
| C02 | Apply | Route selection around a wall | Certified; watch edge-rest advice during human testing |
| C03 | Apply | Commit to a side / obstacle reading | Certified; readable on touch |
| C04 | Exam | First multi-shot placement problem | Certified first difficulty peak |
| C05 | Teach | Bumper introduction | Certified intentional reset after C04 |
| C06 | Apply | Deliberate bumper rebound | **Certified after redesign:** bumper now matters to a robust route |
| C07 | Exam | Geometry / placement under pressure | Certified bridge into broader course reading |
| C08 | Teach | Sand and loss of speed | Certified second intentional reset; inspect edge-rest advice manually |
| C09 | Apply | Use sand placement to plan the next shot | Certified |
| C10 | Exam | Bumper + sand + reverse finish | Certified Block 1 finale |
| C11 | Teach | Ice changes stopping distance | **Certified:** one short ice band + grass braking; timeout risk removed |
| C12 | Apply | Repeat ice stopping/setup control | **Certified:** two staggered bands + grass braking; timeout risk removed |
| C13 | Teach | Booster alignment | Certified; strong touch margin and no regression after ice changes |

### Block 1 rhythm

`easy → easy+ → medium → peak → reset → application → exam → reset → application → exam`

Do not make C05 artificially hard just to remove the C04→C05 numerical dip. The reset is part of teaching a new mechanic.

### Block 2 current rhythm

`ice teach → ice apply → booster teach → booster apply → combine → exam`

C11–13 deliberately reset raw difficulty after C10. The accepted Full Audit keeps the ice strategically relevant while removing long low-friction timeout states.

## HARD · current structure

HARD should mean **surprise first attempt, understanding second attempt**, not pixel-perfect execution.

| Hole | Role | Troll lesson | Direction |
|---|---|---|---|
| H01 | Teach troll language | Obvious lane closes | Current Batch D candidate reduces trigger radius 150→126 to widen learned touch route while preserving the trap |
| H02 | Apply | Obvious lane wakes a bumper | Certified baseline; leave unless Full evidence shows a regression |
| H03 | Escalate | False bridge / floor collapse | RC5.1 accepted regression baseline; do not casually retune |
| H04 | Combine | Two-stage gate joke | Certified baseline; leave unless Full evidence shows a regression |
| H05 | Exam | Ambush + moving crossing + final guard | Certified baseline chapter finale |

Target rhythm: `surprise tutorial → application → stronger trap → chained trap → chapter exam`.

## Level quality rule

A level is ready when:

1. its intended lesson is understandable after one or two attempts;
2. the primary mechanic affects a strong route rather than acting as decoration;
3. touch execution is forgiving enough that knowledge matters more than finger precision;
4. failure is understandable and recovery is usually possible;
5. the 3-star route expresses mastery rather than a fragile accidental line;
6. it adds something different from neighbouring holes;
7. its difficulty role makes sense in the current learning wave;
8. Full Audit shows no unresolved blocker/review that directly contradicts that role.

## Batch status

### Batch A · C01–05 — CLOSED

No geometry changes required. Full evidence supported the authored roles.

### Batch B · C06–10 — CLOSED

Only C06 required a design change. Accepted Full result after the bumper-route correction:

- touch 86%;
- casual 77%;
- tolerance 85%;
- human score 86%;
- recovery 100%;
- mechanic-relevance warning removed;
- PASS.

### Batch C · C11–13 — CLOSED

The original large ice regions produced moving-timeout recovery failures. The accepted band-based version passed Full Audit across the complete 18-hole campaign:

- C11: touch 98%, casual 84%, tolerance 75%, recovery 100%, PASS;
- C12: touch 71%, casual 62%, tolerance 54%, recovery 94%, PASS;
- C13: touch 91%, casual 81%, tolerance 73%, recovery 97%, PASS;
- no `MOVING_TIMEOUT_RISK` on C11 or C12;
- ice remains the relevant primary mechanic;
- 0 originality pairs flagged;
- H03 regression fixture remains PASS.

### Batch D · H01–05 — IN PROGRESS

Baseline Full Audit left H01 as the only campaign REVIEW: touch 29%, tolerance 32%, with the trap still meaningful at 43% consequence. H02–H05 are already PASS.

Current candidate changes only H01 trigger radius from 150 to 126. Accept it only if Full Audit materially improves touch/tolerance while preserving the obvious-lane trap and without introducing cheese or H03 regressions.

## After existing-level certification

Only after A–D are closed:

1. compare authored order with Audit difficulty, real-beta completion/abandonment and player feedback;
2. reorder only if progression evidence supports it and save compatibility can be preserved safely;
3. prepare the current closed feature candidate for `dev` human beta;
4. after the beta cohort produces real telemetry, decide whether the next milestone is another small level batch or targeted fixes;
5. continue adding content in small Full-Audit-certified groups before any official `main` release.
