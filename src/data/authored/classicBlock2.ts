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
// large, readable corridors. Ice occupies the middle transfer so the player learns extra carry,
// then lands on grass before making the final approach.
const c11=base("classic",11,pt(110,840),pt(420,160),2,3,"ice");
c11.ice=[r(92,470,356,92)];
c11.walls=[
  r(28,650,338,24),r(342,530,24,120),
  r(176,350,336,24),r(176,350,24,118)
];
path(c11,pt(426,716),pt(426,586),pt(126,506),pt(126,300),pt(420,160));

// 12 — Ice application. The same visual grammar returns with two separated ice contacts and the
// doglegs swapped. The route is longer, but every gate remains wider than the old precision-heavy
// chapter-1 passages; difficulty comes from choosing a useful stopping point.
const c12=base("classic",12,pt(420,842),pt(110,154),2,3,"ice");
c12.ice=[r(286,570,176,82),r(74,390,184,82)];
c12.walls=[
  r(174,666,338,24),r(174,548,24,118),
  r(28,322,338,24),r(342,322,24,118)
];
path(c12,pt(126,722),pt(126,586),pt(420,500),pt(420,378),pt(110,154));

// 13 — Booster application. The pad points naturally toward the first wide exit, but a mirrored
// upper L-gate forces one placement decision after the speed burst. That keeps the booster useful
// without letting a full-power bank solve the whole level automatically.
const c13=base("classic",13,pt(100,842),pt(420,160),2,3,"booster");
c13.boosters=[{x:76,y:620,w:312,h:138,dx:.62,dy:-1,power:.86}];
c13.walls=[
  r(28,520,352,24),r(356,400,24,120),
  r(166,292,346,24),r(166,292,24,112)
];
path(c13,pt(224,700),pt(426,574),pt(426,454),pt(126,370),pt(126,248),pt(420,160));

export const CLASSIC_BLOCK_2:LevelDefinition[]=[c11,c12,c13];
