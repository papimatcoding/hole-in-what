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
| C11 | Teach | Ice changes stopping distance | Current candidate uses one short crossable ice band + grass braking |
| C12 | Apply | Repeat ice stopping/setup control | Current candidate uses two staggered short bands separated by grass |
| C13 | Teach | Booster alignment | Current Full model already strong; leave unchanged unless regression appears |

### Block 1 rhythm

`easy → easy+ → medium → peak → reset → application → exam → reset → application → exam`

Do not make C05 artificially hard just to remove the C04→C05 numerical dip. The reset is part of teaching a new mechanic.

### Block 2 current rhythm

`ice teach → ice apply → booster teach → booster apply → combine → exam`

C11–13 are allowed to reset raw difficulty after C10. They still need strategic purpose and safe stopping behaviour; do not convert a teaching hole into a precision gate merely to make a graph monotonic.

## HARD · current structure

HARD should mean **surprise first attempt, understanding second attempt**, not pixel-perfect execution.

| Hole | Role | Troll lesson | Direction |
|---|---|---|---|
| H01 | Teach troll language | Obvious lane closes | Next review target after Batch C; baseline learned route is too narrow on touch |
| H02 | Apply | Obvious lane wakes a bumper | Leave unless Full evidence shows a real problem |
| H03 | Escalate | False bridge / floor collapse | RC5.1 accepted regression baseline; do not casually retune |
| H04 | Combine | Two-stage gate joke | Leave unless Full evidence shows a real problem |
| H05 | Exam | Ambush + moving crossing + final guard | Current chapter finale |

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

### Batch C · C11–13 — IN PROGRESS

C13 already has strong human margins. C11/C12 were REVIEW because random/recovery shots could remain moving on large ice regions long enough to hit the simulation timeout.

First reduced-lake pass improved execution but retained timeout risk:

- C11: touch 97%, tolerance 75%, timeout 11%;
- C12: touch 95%, tolerance 68%, timeout 14%.

Current candidate replaces those lakes with short ice bands and grass braking. Close the batch only from the next completed Full Audit.

### Batch D · H01–05 — NEXT

Start with H01 only. Do not mix HARD edits into Batch C. H02–H05 remain unchanged unless their own Full evidence justifies intervention.

## After existing-level certification

Only after A–D are closed:

1. compare authored order with Audit difficulty, real-beta completion/abandonment and player feedback;
2. reorder only if progression evidence supports it and save compatibility can be preserved safely;
3. author additional levels in small groups;
4. Full Audit each group;
5. promote the closed candidate to `dev` for real human beta testing.
