import type { LevelDefinition } from "../../types";
import { base, path, pt, r } from "./authoring";

/**
 * Block 2 authoring lab.
 *
 * These holes are candidates until fast/full Audit 2.1 plus manual touch/desktop playtesting
 * accept them. Block 1 remains untouched in classic.ts.
 */

// 11 — First ice lesson. The lower ice runway makes ordinary grass power overshoot the useful
// setup area. The shelf blocks the direct diagonal, so the readable answer is to arrive softly
// at the broad right opening and finish from above it. The cup moved right after the first audit
// because the old opposite-side finish accidentally created a broad bank HIO and poor touch margin.
const c11=base("classic",11,pt(110,840),pt(420,160),2,3,"ice");
c11.ice=[r(70,560,400,150)];
c11.walls=[r(28,390,360,24)];
path(c11,pt(400,640),pt(420,470),pt(420,340),pt(420,160));

// 12 — Ice application through a broad setup shot. The L-shaped upper barrier kills the direct
// diagonal without creating a narrow gate: the player crosses the large ice lake toward the open
// left landing area, deliberately controls where the ball stops, then finishes from that setup.
// A slower grass-heavy route around the lower/left edge remains available for recovery.
const c12=base("classic",12,pt(420,842),pt(110,154),2,3,"ice");
c12.walls=[r(220,330,292,24),r(220,330,24,180)];
c12.ice=[r(80,540,400,180)];
path(c12,pt(140,620),pt(150,470),pt(160,300),pt(110,154));

// 13 — First booster lesson. Entering the pad on a useful line turns acceleration into a
// shortcut through the right-side opening. The second pass deliberately widens the pad/opening
// and softens boost power so touch players get more usable lines instead of one narrow angle.
const c13=base("classic",13,pt(100,842),pt(420,160),2,3,"booster");
c13.boosters=[{x:82,y:610,w:300,h:140,dx:.55,dy:-1,power:.72}];
c13.walls=[r(28,472,286,24),r(406,286,106,24)];
path(c13,pt(220,700),pt(392,530),pt(410,390),pt(350,240),pt(420,160));

export const CLASSIC_BLOCK_2:LevelDefinition[]=[c11,c12,c13];
