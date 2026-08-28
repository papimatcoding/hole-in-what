import type { LevelDefinition } from "../../types";
import { base, path, pt, r } from "./authoring";

/**
 * Block 2 authoring lab.
 *
 * These holes are candidates until Full Audit 2.1 plus manual beta touch/desktop playtesting
 * accept them. Block 1 lives in classic.ts.
 */

// 11 — First ice lesson. A single crossable ice band teaches that the same power carries much
// farther on ice, while grass on every side guarantees a natural braking zone. The surface is
// deliberately a band rather than a lake so a bad horizontal/random shot cannot roll on ice for
// most of the field and hit the simulation timeout.
const c11=base("classic",11,pt(110,840),pt(420,160),2,3,"ice");
c11.ice=[r(224,596,244,84)];
c11.walls=[r(28,390,360,24)];
path(c11,pt(400,640),pt(420,470),pt(420,340),pt(420,160));

// 12 — Ice application. Two short staggered bands turn stopping distance into a repeated setup
// decision without creating one giant low-friction lake. The grass gap between them gives imperfect
// shots somewhere to settle and makes the second ice contact a deliberate application of C11.
const c12=base("classic",12,pt(420,842),pt(110,154),2,3,"ice");
c12.walls=[r(220,330,292,24),r(196,330,24,180)];
c12.ice=[r(258,642,196,78),r(92,506,188,76)];
path(c12,pt(140,620),pt(150,470),pt(160,300),pt(110,154));

// 13 — First booster lesson. Entering the pad on a useful line turns acceleration into a
// shortcut through the right-side opening. The second pass deliberately widens the pad/opening
// and softens boost power so touch players get more usable lines instead of one narrow angle.
const c13=base("classic",13,pt(100,842),pt(420,160),2,3,"booster");
c13.boosters=[{x:82,y:610,w:300,h:140,dx:.55,dy:-1,power:.72}];
c13.walls=[r(28,472,286,24),r(406,286,106,24)];
path(c13,pt(220,700),pt(392,530),pt(410,390),pt(350,240),pt(420,160));

export const CLASSIC_BLOCK_2:LevelDefinition[]=[c11,c12,c13];
