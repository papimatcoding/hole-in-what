# Campaign progression

The campaign should feel deliberately authored rather than sorted by raw solver difficulty. Each hole needs a role: **teach**, **apply**, **combine**, **exam**, or **troll escalation**.

Difficulty is allowed to dip when a new mechanic is introduced. The important rule is that the dip is intentional and followed by meaningful application.

## Classic · current structure

| Hole | Role | Main lesson | Direction |
|---|---|---|---|
| C01 | Teach | Basic angle/power and wall reading | Very forgiving opener |
| C02 | Apply | Route selection around a wall | Slightly tighter than C01 |
| C03 | Apply | Commit to a side / obstacle reading | Keep readable on touch |
| C04 | Exam | First multi-shot placement problem | First real difficulty peak |
| C05 | Teach | Bumper introduction | Intentional reset after C04; bumper must feel useful, not punishing |
| C06 | Apply | Deliberate rebound setup | Primary bumper must matter to a competitive route |
| C07 | Exam | Geometry / placement under pressure | Bridge from bumper block into broader course reading |
| C08 | Teach | Sand and loss of speed | Second intentional reset; generous first contact |
| C09 | Apply | Use sand placement to plan the next shot | More commitment than C08 |
| C10 | Exam | Bumper + sand + reverse finish | Clear Block 1 finale |
| C11 | Teach | Ice changes stopping distance | Intentional Block 2 reset; strategy over precision |
| C12 | Apply | Ice setup / stopping control | Must avoid long moving-timeout outcomes |
| C13 | Teach | Booster alignment | Robust introduction; future holes should demand application |

### Block 1 target rhythm

`easy → easy+ → medium → peak → reset → medium → medium+ → reset → medium+ → exam`

Do not make C05 harder just to remove the C04→C05 numerical dip. If C05 teaches bumpers cleanly, the reset is desirable. Improve execution margin and mechanic relevance first.

### Block 2 target rhythm

`ice teach → ice apply → booster teach → booster apply → combine → exam`

C11–13 are not expected to continue C10's raw difficulty. They start a new learning wave. However, a mastery HIO should demonstrate the mechanic rather than bypass it accidentally.

## HARD · current structure

HARD should not mean pixel-perfect. Its identity is **surprise on the first attempt, understanding on the second**.

| Hole | Role | Troll lesson | Direction |
|---|---|---|---|
| H01 | Teach troll language | Obvious lane closes | Learned route must be broad enough for touch |
| H02 | Apply | Obvious lane wakes a bumper | Slightly more demanding than H01 |
| H03 | Escalate | False bridge / floor collapse | Learned escape should remain fair |
| H04 | Combine | Two-stage gate joke | Tests adaptation after the first reveal |
| H05 | Exam | Ambush + moving crossing + final guard | Current chapter finale |

Target HARD rhythm: `surprise tutorial → application → stronger trap → chained trap → chapter exam`.

## Level quality rule

A level is ready when:

1. its intended lesson is understandable after one or two attempts;
2. the primary mechanic affects a strong route rather than acting as decoration;
3. touch execution is forgiving enough that knowledge matters more than finger precision;
4. failure is understandable and recovery is usually possible;
5. the 3-star route expresses mastery of the level's lesson;
6. it adds something different from neighbouring holes;
7. its difficulty role makes sense in the learning wave.

## Review method

Do **not** tune single levels from fast/noisy model output. Work in small batches and certify each batch with the full model over the entire campaign.

### Batch A — Classic 01–05

Questions:

- Is C01 a genuinely forgiving opener?
- Does C02 apply the first lesson without becoming easier by accident?
- Is C03 readable and tolerant on touch?
- Does C04 earn its role as the first placement exam?
- Does C05 introduce bumpers cleanly, with a mastery route that uses the mechanic rather than precision cheese?

### Batch B — Classic 06–10

Questions:

- Is C06's bumper actually relevant to a strong human route?
- Does C07 test geometry without a precision spike?
- Is C08 a deliberate sand tutorial/reset?
- Does C09 meaningfully apply sand placement?
- Does C10 feel like an earned chapter exam rather than edge-rest frustration?

### Batch C — Classic 11–13

Questions:

- Does C11 teach ice through stopping-distance strategy rather than a broad bypass HIO?
- Does C12 apply ice without long timeout/stalling outcomes?
- Does C13 introduce booster alignment with a comfortable human window?

### Batch D — HARD 01–05

Questions:

- H01: broad learned route + reliable first-attempt bait.
- H02: surprise is readable afterwards and learned execution is not narrow.
- H03: preserve the accepted RC5.1 regression fix.
- H04: chained surprise remains fair after learning.
- H05: finale can be demanding, but knowledge must matter more than precision.

## Certification rule

After changes to a batch:

1. run the **Full adversarial campaign audit**;
2. run `audit:human:full`;
3. run design difficulty/originality analysis;
4. run originality audit;
5. inspect the complete report, including levels outside the edited batch;
6. retain the batch only if there are no regressions that undermine campaign quality.

Once all four existing batches are individually strong, do a separate progression/order pass. Only then start adding more authored levels, again in small Full-Audit-certified groups.
