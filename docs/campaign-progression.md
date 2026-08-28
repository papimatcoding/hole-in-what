# Hole in What? · campaign progression

The campaign is deliberately authored by learning role rather than sorted by raw solver difficulty. Each hole should act as **teach**, **apply**, **combine**, **exam**, or **troll escalation**.

A difficulty dip is valid when it introduces a new mechanic cleanly and is followed by meaningful application.

## Classic · RC6 candidate order

| Hole | Role | Main lesson | RC6 decision |
|---|---|---|---|
| C01 | Teach | Basic angle/power and wall reading | Certified opener |
| C02 | Apply | Route selection around a wall | Certified; observe edge-rest advice in human beta |
| C03 | Apply | Commit to a side / obstacle reading | Certified |
| C04 | Exam | First multi-shot placement problem | Certified first peak; observe edge-rest advice |
| C05 | Teach | Bumper introduction | Certified intentional reset after C04 |
| C06 | Apply | Deliberate bumper rebound | Certified after bumper-route redesign |
| C07 | Exam | Geometry / placement under pressure | Certified |
| C08 | Teach | Sand and loss of speed | Certified intentional reset; observe edge-rest advice |
| C09 | Apply | Sand placement for the next shot | Certified |
| C10 | Exam | Bumper + sand + reverse finish | Certified Block 1 finale |
| C11 | Teach | Ice changes stopping distance | Certified short ice band + grass braking |
| C12 | Apply | Ice stopping/setup control | Certified staggered bands + grass braking |
| C13 | Teach | Booster alignment | Certified |

### Classic rhythm

Block 1:

`easy → easy+ → medium → peak → bumper reset → application → exam → sand reset → application → exam`

Current Block 2 opening:

`ice teach → ice apply → booster teach`

Future Block 2 authoring can continue with:

`booster apply → combine → exam`

Do not make C05 or C11 artificially harder merely to remove a numerical difficulty dip.

## HARD · RC6 candidate order

HARD means **surprise first attempt, understanding second attempt**, not pixel-perfect execution.

| Hole | Role | Troll lesson | RC6 decision |
|---|---|---|---|
| H01 | Teach troll language | Obvious lane closes | **Certified redesign:** broad learned crossover + anti-cheese guard, original trap trigger preserved |
| H02 | Apply | Obvious lane wakes a bumper | Certified unchanged |
| H03 | Escalate | False bridge / floor collapse | Certified RC5.1 regression baseline; do not casually retune |
| H04 | Combine | Two-stage gate joke | Certified unchanged |
| H05 | Exam | Ambush + moving crossing + final guard | Certified chapter finale |

Target rhythm remains:

`surprise tutorial → application → stronger trap → chained trap → chapter exam`

Final H01 Full result: touch 95%, casual 82%, tolerance 78%, human score 89%, recovery 94%, trap consequence 66%, PASS. The adversarial solver no longer finds a clean trap-bypass solution.

## Level quality rule

A level is ready for beta when:

1. its intended lesson is understandable after one or two attempts;
2. the primary mechanic affects a strong route rather than acting as decoration;
3. touch execution is forgiving enough that knowledge matters more than finger precision;
4. failure is understandable and recovery is usually possible;
5. the 3-star route expresses mastery rather than a fragile accidental line;
6. it adds something different from neighbouring holes;
7. its difficulty role makes sense in the learning wave;
8. Full Audit shows no unresolved blocker/review contradicting that role.

## Existing-level batch status

- **Batch A · C01–05 — CLOSED.** No geometry changes needed.
- **Batch B · C06–10 — CLOSED.** Only C06 required redesign.
- **Batch C · C11–13 — CLOSED.** Ice timeout risk removed without losing the lesson.
- **Batch D · H01–05 — CLOSED.** Only H01 required redesign.

Accepted final Full Audit: run `33158002310`, campaign geometry commit `466b5297c4f6517092dac8c09b1c05532cc21736`.

Result: **18/18 PASS · 0 REVIEW · 0 BLOCKER**, H03 regression PASS, 0 structural originality pairs.

## RC6 ordering decision

**Preserve the current order and level IDs.**

Do not reorder C01–13 or H01–05 for RC6. The major raw-difficulty drops are intentional mechanic-teaching resets, while renumbering would add save/progression risk without evidence of a better learning sequence.

If real beta telemetry later shows abandonment or confusion at a specific transition, reassess the transition using human evidence plus Full Audit rather than sorting levels by one machine score.

## What happens next

The existing-level design phase is complete. The next stage is **`dev` human beta**, not another speculative geometry pass.

1. complete the real mobile + desktop candidate smoke;
2. promote the exact accepted feature candidate to `dev` using the maintenance checklist;
3. collect attempts, shots, runs and qualitative feedback from a larger cohort;
4. return any justified fixes to `feature/**` and re-audit them;
5. after RC6 human evidence is reviewed, add the next small Classic/HARD content batch.

Do not author a large new block before learning from this beta cohort.
