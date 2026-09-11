import type { LevelDefinition } from "../../types";
import { base, path, pt, r } from "./authoring";

/**
 * Classic chapter 2.
 *
 * Chapter 1 ends on C10 as an exam. C11 intentionally resets the mental load to teach a new
 * surface, but it must not reset all the way back to tutorial difficulty. Chapter-2 geometry uses
 * broad doglegs rather than narrow gaps: the goal is to require placement without taxing touch
 * precision, and specifically to stop wall-bank HIOs from bypassing the new mechanics.
 */

// 11 — First ice lesson. Alternating L-gates require a real setup before the cup while leaving
// large, readable corridors. Ice occupies the transfer between both gates without touching their
// collision geometry, so the player learns extra carry and then gets grass for the final approach.
const c11=base("classic",11,pt(110,840),pt(420,160),2,3,"ice");
c11.ice=[r(92,474,356,52)];
c11.walls=[
  r(28,650,338,24),r(342,530,24,120),
  r(176,350,336,24),r(176,374,24,94)
];
path(c11,pt(426,716),pt(426,586),pt(126,506),pt(126,300),pt(420,160));

// 12 — Ice application. The lower ice strip now occupies the only broad approach through the
// first dogleg, so the mastery route cannot simply route around the mechanic. A second patch on
// the opposite side reinforces stopping-distance planning without turning the whole field to ice.
const c12=base("classic",12,pt(420,842),pt(110,154),2,3,"ice");
c12.ice=[r(48,554,110,96),r(382,444,108,72)];
c12.walls=[
  r(174,666,338,24),r(174,548,24,118),
  r(28,322,338,24),r(342,346,24,94)
];
path(c12,pt(126,722),pt(126,586),pt(420,500),pt(420,378),pt(110,154));

// 13 — Booster application. The new reserved HUD boundary reduced the execution window without
// changing the actual idea of the hole. Open both dogleg corridors by roughly one ball diameter
// instead of weakening the booster: the pad still creates the first placement, but recovery and
// the follow-up shot are no longer a narrow mobile-only precision check.
const c13=base("classic",13,pt(100,842),pt(420,160),3,4,"booster");
c13.boosters=[{x:76,y:620,w:312,h:138,dx:.62,dy:-1,power:.86}];
c13.walls=[
  r(28,520,340,24),r(344,400,24,120),
  r(170,292,342,24),r(170,316,24,88)
];
path(c13,pt(224,700),pt(408,574),pt(408,454),pt(146,370),pt(146,248),pt(420,160));

export const CLASSIC_BLOCK_2:LevelDefinition[]=[c11,c12,c13];
