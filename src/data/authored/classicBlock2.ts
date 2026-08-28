import type { LevelDefinition } from "../../types";
import { base, path, pt, r } from "./authoring";

/**
 * Block 2 authoring lab.
 *
 * These holes are candidates until fast/full Audit 2.1 plus manual touch/desktop playtesting
 * accept them. Block 1 remains untouched in classic.ts.
 */

// 11 — First ice lesson. The lower ice runway makes ordinary grass power overshoot the useful
// setup area. The shelf removes the direct line: learn to arrive softly at the right opening,
// then finish across the top field.
const c11=base("classic",11,pt(110,840),pt(130,160),2,3,"ice");
c11.ice=[r(70,560,400,150)];
c11.walls=[r(28,390,360,24)];
path(c11,pt(410,640),pt(420,470),pt(420,340),pt(130,160));

// 12 — Ice application as a route decision. The central island creates two real families:
// a long grass route on the left and a shorter ice lane on the right. Mastery should exploit
// the ice without turning the power window into a precision test.
const c12=base("classic",12,pt(270,842),pt(270,154),2,3,"ice");
c12.walls=[r(190,340,160,350),r(28,520,86,24)];
c12.ice=[r(362,350,116,354)];
path(c12,pt(418,730),pt(420,300),pt(270,154));

// 13 — First booster lesson. Entering the pad on a useful line turns the acceleration into a
// shortcut through the right-side opening. A bad entry hits ordinary geometry and remains
// recoverable instead of becoming a fail-state.
const c13=base("classic",13,pt(100,842),pt(420,160),2,3,"booster");
c13.boosters=[{x:96,y:624,w:272,h:116,dx:.62,dy:-1,power:.82}];
c13.walls=[r(28,472,312,24),r(392,300,120,24)];
path(c13,pt(218,700),pt(402,520),pt(408,392),pt(350,250),pt(420,160));

export const CLASSIC_BLOCK_2:LevelDefinition[]=[c11,c12,c13];
