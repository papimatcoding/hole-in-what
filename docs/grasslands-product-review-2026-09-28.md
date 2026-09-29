# Grassland 01–10 · product review

Updated 29 September 2026 after the owner's mobile screenshots of holes 04, 06, 07, 09 and 10. The screenshots showed floating shapes, repetitive straight bars and traps that sometimes changed no plausible shot. This is an iterative beta chapter, pending direct playtesting and visual approval by the owner.

| Hole | Intended turn and surprise | Evidence and open judgment |
| --- | --- | --- |
| 01–03 | Gesture lesson, S route, deceptive right lane | Earlier chapter tests pass; judge whether the right lane in 03 is actually chosen by new players. |
| 04 | A shallow triangular bank grows out of the lower wall's corner. | A two-shot bank sequence sinks with the triangle and fails without it; visual readability on a phone needs review. |
| 05 | One bumper rebound and a wall surprise, with redundant bars removed. | Check the difficulty step after 04 with a fresh player. |
| 06 | The apparent left-bumper route closes with a gate continuing the lower barrier. | A first shot triggers the gate and changes the ball's resting place by over 150 px. Full human model: two-stroke route, touch 62%, casual 61%, trap consequence 71%. Check the first-time response in play. |
| 07 | The curved bank joins the upper wall and bends a plausible shot; the late gate joins the lower wall. | That shot touches the curve and changes its end by over 60 px. Check whether a player sees the angle. |
| 08 | A wide ramp entry and a surprise across the apparent direct route. | Previous touch and casual model pass; playtest its left entry. |
| 09 | A short hidden extension of the upper wall denies an otherwise successful one-shot ramp shortcut. | Full human model: two-stroke route, touch 92%, casual 68%; the trap's modeled consequence is 29%, so confirm its bait in play. |
| 10 | A gate continues the lower wall; a floor pocket joins the upper wall and drops a tempting one-shot landing. | The same shot sinks without the floor drop, but resets with it. Check whether the retry feels fair. |

The chapter contract compares real simulated shots with and without selected geometry or traps, and checks exact joins. The geometry and persistent-trap clearance checks report no overlaps or blocked states. These simulations do not prove that a newcomer understands the bait, sees a useful bank, or enjoys repeating the level. A normal-sized phone playtest remains the acceptance step.

## Editor and patch inbox

The map workshop is preserved on `feature/map-workshop` and removed from the public game scene bundle and menu. This branch is in a **public GitHub repository**, so it does not grant restricted access to collaborators. A separate private repository or authenticated service is needed before inviting selected reviewers and accepting their submissions. The patch notes are localized in Spanish and English; the inbox shows recent entries and lets the player delete individual messages locally.

## Next playtest questions

For every wall or shape: what shot angle, route choice or recovery does it enable? For every surprise: what tempting line does it alter, what does the player learn, and can they recover? Inspect 04, 06, 07, 09 and 10 on a normal phone, including the activated trap state. Record unclear shapes and unfair retries before accepting the chapter as final.
