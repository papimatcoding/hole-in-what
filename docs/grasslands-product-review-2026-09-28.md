# Grasslands 01–10: product review in progress

Started 2026-09-28; updated 2026-09-29 after the owner's screenshots and playtest notes. Working branch: `feature/grasslands-design-review` from `dev` (`88ee0bd`). The existing PR #35 is included as a **candidate** in this branch, not accepted as final level design.

## What the current checks actually establish

- The original `dev` full course audit had a C02 target failure (3★ at 3 strokes while a one-stroke route exists). It did not evaluate whether the geometry adds a useful angle or whether a trap changes a human route.
- PR #35 introduces `baitPath` and checks trap intersection with that declared polyline. This catches decorative traps such as the original C03 wall. The polyline is authored metadata, not a trajectory measured from a real shot; passing it is **not** proof that a player will take or understand the route.
- On the PR #35 candidate, the full course solver found 10/10 solvable. The full human model found **5 PASS, 4 REVIEW, 1 BLOCKER**. C02, C03, C05, C06 had star objectives mismatched with the model's human route. C08 required too much precision (touch 21%, casual 18%, tolerance 16%).
- No rectangle overlaps or trapped states appeared in geometry and clearance checks. These checks cannot detect objects that visually or strategically duplicate each other.

## Changes in this working branch

- Return navigation remembers the menu section and carousel position when a full-screen section is opened, on desktop and mobile.
- C03's surprise wall moves to the tempting right lane, as proposed in PR #35. The learned left route remains open. This fixes the specific "trap in front of the central block" problem in the data; a real playtest is still required.
- C08 replaces the narrow ambush bumper with a pop-up wall across the direct entry. Its ramp is wider and the left entry remains open. Full human-model result: **PASS**, touch 80%, casual 71%, tolerance 57%, trap consequence 86%. Its 3★ target is now three strokes, in line with the modeled human route.
- C02, C03, C05 and C06 star targets are aligned to the two-stroke modeled human route. This is reward calibration, not a claim that the map design is finished.

The four adjusted holes each passed a full human-model rerun (4/4); C08 passed a separate full human-model and full course-solver rerun. C01, C04, C07, C09 and C10 were unchanged from the 5/5 passing candidate run. These are segmented checks, not a fresh end-to-end human playtest of all ten.

## 29 September: screenshot-driven redesign

The player's screenshots exposed failures missed by authored `baitPath`: C03's old wall appeared in front of the central block; C08's old bumper sat below the ramp flight; C04/C07/C10 had thin triangular wall caps with no meaningful bank; C05 was cluttered; C06's surprise sat away from the natural direct shot; and C09's old gate could actually help a hole-in-one. The two real mini-golf references use shaped borders and ramps to define deliberate routes. The following changes respond to those observations:

- **C04:** replaced the skinny cap with a sloped bank in the middle turn. A two-shot sequence sinks with the bank and misses without it; the first shot still has a broad alternative route.
- **C05:** removed three redundant bars and adjusted the bumper. The wall trap remains consequential; the modeled human route is two shots.
- **C06:** removed the extra upper bar and placed the hidden bumper on the tempting direct line toward the right bumper. It now changes that shot instead of waiting for a player to attack the left bumper head-on.
- **C07:** removed all three spikes. A curved bank now changes an actual opening shot by more than 60 px, while leaving a recoverable route.
- **C09:** removed a fixed bumper that made the ramp flight unpredictable, reduced the ramp's boost and moved the surprise to a vertical gate at the landing lane. A concrete shortcut shot sinks with the gate disabled and fails with it active. The full human model finds a forgiving two-shot route (touch 92%). A broad one-shot mastery line remains and needs human judgment.
- **C10:** removed the wall-end spikes and replaced the late bumper with a floor drop in the apparently clever left-bank route. The direct bank shot at 40° and full power sinks with the drop disabled, but activates the floor and resets the ball with it enabled. The full course solver now finds no hole-in-one; the three-star target is three strokes, matching the full human model (touch 96%, casual 88%). A different route remains physically reachable.

Those are level-data changes, with behavioral checks for C04, C07, C09 and C10. They do not establish that first-time players will notice the bait or enjoy the recovery.

Verification after iteration: full human-model C01–C08 passed in the chapter run; C09 and C10 were then changed and each passed a separate full human-model rerun. The full course solver found C01–C08 clear; targeted solver reruns found C09 and C10 clear after their final changes. Typecheck, production build, Grassland behavior contracts, geometry, persistent-trap clearance and mechanic integrity passed. The latest exact combination has not yet had a single end-to-end chapter run. Human playtesting remains the release gate.

## Per-hole product gate

| Hole | Current evidence | Product question before acceptance |
| --- | --- | --- |
| 01 | Tutorial and trap model PASS; broad one-shot route | Is the first surprise readable and fun without obscuring the pull-back lesson? |
| 02 | Trap model 56%; objective adjusted to two strokes | Do the two long walls create a deliberate bank or just a generic S corridor? |
| 03 | Right-lane trap now affects its declared bait; model trap 72% | Does the player actually choose the tempting right lane, and is the left recovery obvious after betrayal? |
| 04 | The replacement slope enables a successful bank shot; solver remains clear | Does the bank read visually as a useful shot on a normal screen? |
| 05 | Three bars removed; bumper route and pop wall still matter | Is the step up from 04 now comfortable, and does the rebound feel intentional? |
| 06 | Direct-right bait now hits the ambush; redundant bar removed | Is the surprise fair after one attempt? |
| 07 | Three caps removed; the new curve alters a real shot | Does this bank make the route more interesting in play? |
| 08 | Narrow bumper was a BLOCKER; new gate and wider ramp model PASS | Play on touch: is the left entry discoverable, with a satisfying ramp shot? |
| 09 | A replacement gate blocks a real shortcut; the fixed bumper is gone | Does the ramp landing read clearly, and is the remaining one-shot mastery route too broad? |
| 10 | Floor drop denies the direct one-shot bank; spikes gone | Does that failure provoke a satisfying retry, rather than feel arbitrary? |

## Acceptance rule for the next level pass

For every solid object, name the angle, rebound, route choice or recovery it creates. Remove it if that answer is only visual. For every trap, record the tempting shot, the actual consequence, the learned response and a viable recovery. Inspect the scene at normal desktop and touch sizes, then play the hole without knowing its `designPath` or `baitPath`. A solver result and authored polyline alone cannot approve a hole.

The menu's visual language still needs a dedicated design pass. Navigation is the only menu change in this branch. Do not promote this branch to `dev` as a completed Grasslands chapter before human playtesting and visual review. C03 still has reachable one-stroke bank shots and needs the owner's renewed judgment on the revised right-lane bait. C09 retains a one-stroke mastery line; a solver pass does not decide whether it is too easy.
