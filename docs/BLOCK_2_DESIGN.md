# Troll Golf — Block 2 design plan

Status: **AUTHORING LAB** — `feature/block-2-authoring`

Block 1 remains frozen. Block 2 starts only from the mechanic contracts already merged into `dev`: **ice, booster and portal**.

## Goal

Block 2 should feel like a new chapter rather than ten harder versions of Block 1. The player already understands shot control, banks, setup shots, bumpers and sand. This chapter teaches how **momentum and displacement** can be manipulated.

The pacing rule is:

> introduce → practise → reinterpret → combine → exam

Every hole still needs a unique silhouette and a unique strategic question. New mechanics must materially affect the intended route rather than decorate it.

## Classic 11–20

### Classic 11 — ICE: trust less power

**Teaching goal:** first clean introduction to low friction.

A wide, readable ice lane sits on the intended route. The player should immediately notice that a normal grass-strength shot travels much farther. The learned answer is not precision; it is deliberately reducing power.

- primary mechanic: `ice`
- target mastery: 2 strokes
- silhouette: broad central ice runway with generous recovery space
- no portals, boosters or troll behavior

### Classic 12 — ICE: choose where to stop

**Teaching goal:** use ice for controlled placement rather than merely surviving it.

The player crosses an ice section but must leave it in a useful position for the finish. A safer grass route costs distance/strokes; the ice route is faster but demands power judgement.

- primary mechanic: `ice`
- target mastery: 2–3 strokes
- strategic question: safe grass route vs committed ice route
- must not be a straight runway like Classic 11

### Classic 13 — BOOSTER: align before acceleration

**Teaching goal:** first booster introduction.

A large booster gives an obvious advantage only when entered with sensible alignment. Entering badly should be recoverable, not fatal.

- primary mechanic: `booster`
- target mastery: 2 strokes
- silhouette: offset launch corridor into a directional pad
- booster changes the route materially; it is not optional decoration

### Classic 14 — BOOSTER: speed is a resource

**Teaching goal:** booster power creates a route choice.

One route takes a booster shortcut but requires a controlled exit/setup. The other is slower and simpler. Mastery should reward using the booster without making it compulsory for basic completion.

- primary mechanic: `booster`
- target mastery: 2–3 strokes
- strategic question: fast committed line vs safe conventional line

### Classic 15 — PORTAL: displacement without a trick

**Teaching goal:** teach portal behavior transparently.

The entry and exit are both visible and the intended route clearly points through them. Direction preservation should be understandable from the geometry after one use.

- primary mechanic: `portal`
- target mastery: 2 strokes
- no surprise destination and no trap

### Classic 16 — PORTAL: entry angle becomes exit angle

**Teaching goal:** exploit preserved travel direction.

The portal is not simply a shortcut. The player must enter at the correct angle so the ball leaves the remote endpoint on a useful line.

- primary mechanic: `portal`
- target mastery: 2–3 strokes
- strategic question: aim at the portal or aim through the portal?
- silhouette must make the remote continuation visually legible

### Classic 17 — ICE + BOOSTER: manage momentum

**Teaching goal:** combine acceleration with low friction.

The booster supplies speed; the ice determines how long the consequence lasts. The intended answer requires thinking about the whole chain before shooting.

- primary mechanic: `booster`
- secondary mechanic: ice
- target mastery: 3 strokes
- avoid a full-power one-shot bypass

### Classic 18 — PORTAL + GEOMETRY: remote bank

**Teaching goal:** combine known wall geometry with displacement.

The player enters a portal and must use the post-exit line to reach a bank/setup that was impossible from the original side of the course.

- primary mechanic: `portal`
- target mastery: 3 strokes
- strategic question: solve geometry in two separated spaces as one continuous shot

### Classic 19 — THREE-WAY ROUTE CHOICE

**Teaching goal:** reinterpret the chapter mechanics rather than introduce anything new.

Offer genuinely different route families, for example:

- short/risky booster route;
- medium portal route;
- long/control-oriented ice or grass route.

The best route may depend on execution skill. All routes must be intentional and recoverable.

- primary mechanic: whichever route Audit 2.1 confirms is the mastery route
- target mastery: 3 strokes
- originality comes from decision structure, not obstacle count

### Classic 20 — BLOCK 2 EXAM

**Teaching goal:** prove chapter mastery.

Use all three mechanics, but in a readable sequence rather than an obstacle soup. A good shape is:

1. setup/choice;
2. booster or ice momentum section;
3. portal displacement;
4. final geometry finish.

- target mastery: 3–4 strokes
- every mechanic must matter to the robust mastery route
- should be one of the harder Classic holes without becoming HARD
- no surprise traps

## HARD 06–10

HARD 06–10 reuse the new chapter vocabulary to lie to the player. The surprise must remain deterministic and understandable afterwards.

### HARD 06 — BOOSTER BAIT

The obvious fast lane advertises a booster as the solution. Committing to it triggers a deterministic obstruction or forces a bad continuation. The learned answer still uses the visible information but approaches the booster differently or rejects the bait.

- desired reaction: “claro, me he flipado con el turbo”
- learned route must have normal human margin

### HARD 07 — PORTAL BAIT

The portal looks like the obvious shortcut. Its exit line is the real joke: the player arrives exactly where the course wanted them to arrive, but not where they wanted to go.

The trap must come from readable geometry/deterministic triggered primitives, not a random teleport destination.

### HARD 08 — ICE OVERSHOOT

The course visually invites a normal-power commitment onto ice. The first attempt carries too much momentum into a deterministic punishment. Once learned, the answer is obvious: respect the surface and deliberately undershoot/setup.

This should test knowledge, not tiny power windows.

### HARD 09 — FALSE COMBO

The level appears to ask for a satisfying booster → portal chain. That exact combination is bait. The learned route breaks the chain at one deliberate point and creates a safer second shot.

The trap consequence must meaningfully alter the route rather than merely add animation.

### HARD 10 — CHAPTER TROLL EXAM

A two-stage troll using Block 2 vocabulary. Solving the first deception should not immediately reveal the second, but both must be fair in hindsight.

Use at most two meaningful surprise events. Do not build a chaotic gauntlet.

## Acceptance criteria for every candidate

Before promotion to `dev`:

1. strict campaign solver: `OK`;
2. Audit 2.1: no BLOCKER;
3. primary mechanic is actually used by the robust human route;
4. no broad accidental HIO/bypass that deletes the level idea;
5. originality audit finds no structural duplicate;
6. manual desktop + touch playtest;
7. HARD trap trigger/consequence verified manually;
8. stars reflect actual mastery rather than authored wishful thinking.

## Authoring order

Do **not** author all 15 holes before learning anything from the audit.

Recommended batches:

- Batch A: Classic 11–13 — prove ice and booster teaching language.
- Batch B: Classic 14–16 — route choice + portal language.
- Batch C: Classic 17–20 — combinations and exam.
- Batch D: HARD 06–08 — one clean troll per new mechanic.
- Batch E: HARD 09–10 — combination trolls only after the simpler traps work.

Each batch should be audited and manually played before expanding the next one.
