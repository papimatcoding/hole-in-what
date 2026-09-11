import type { LevelDefinition } from "../../types";
import { base, path, pt, r, tri } from "./authoring";

/**
 * Classic chapter 2.
 *
 * Chapter 1 ends on C10 as an exam. C11 intentionally resets the mental load to teach a new
 * surface, but it must not reset all the way back to tutorial difficulty. Chapter 2 keeps broad
 * corridors while varying silhouette so new mechanics do not all arrive inside the same box grammar.
 */

// 11 — First ice lesson. The original rectangular doglegs played well but Audit 3.0 correctly
// grouped C11–C14 into the same visual family. Keep both shelves and turn their fins into diagonal
// wedges: same readable transfer, more distinctive rebounds and no cosmetic-only geometry.
const c11=base("classic",11,pt(110,840),pt(420,160),2,3,"ice");
c11.ice=[r(92,474,356,52)];
c11.walls=[r(28,650,338,24),r(176,350,336,24)];
c11.triangles=[
  tri(342,530,366,530,366,650),
  tri(176,374,200,374,176,468)
];
path(c11,pt(426,716),pt(426,586),pt(126,506),pt(126,300),pt(420,160));

// 12 — Ice application. Mirror the idea without mirroring the exact shape: the lower gate opens
// through a sloped left wedge while the upper gate uses the opposite diagonal. Ice remains the
// stopping-distance lesson; geometry now contributes a different visual rhythm from C11.
const c12=base("classic",12,pt(420,842),pt(110,154),2,3,"ice");
c12.ice=[r(48,554,110,96),r(382,444,108,72)];
c12.walls=[r(174,666,338,24),r(28,322,338,24)];
c12.triangles=[
  tri(174,548,198,548,174,666),
  tri(342,346,366,346,366,440)
];
path(c12,pt(126,722),pt(126,586),pt(420,500),pt(420,378),pt(110,154));

// 13 — Booster application. Open dogleg corridors by roughly one ball diameter instead of
// weakening the booster: the pad creates the first placement and recovery stays generous.
const c13=base("classic",13,pt(100,842),pt(420,160),3,4,"booster");
c13.boosters=[{x:76,y:620,w:312,h:138,dx:.62,dy:-1,power:.86}];
c13.walls=[
  r(28,520,340,24),r(344,400,24,120),
  r(170,292,342,24),r(170,316,24,88)
];
path(c13,pt(224,700),pt(408,574),pt(408,454),pt(146,370),pt(146,248),pt(420,160));

// 14 — Booster route choice, rebuilt around lateral speed instead of another upward runway.
// The large pad slings the first placement across the foot of a central monolith into the right
// lane. Players can reject the pad and crawl around the left side, but that route is longer.
const c14=base("classic",14,pt(110,842),pt(420,160),2,3,"booster");
c14.walls=[r(184,418,172,282),r(28,286,242,24)];
c14.boosters=[{x:112,y:700,w:252,h:102,dx:1,dy:-.08,power:.9}];
path(c14,pt(250,754),pt(430,690),pt(426,390),pt(314,242),pt(420,160));

// 15 — Portal introduction. A tall central spine separates start and cup into two sides. The
// portal HIO is intentional mastery: it teaches preserved travel direction in one memorable shot.
const c15=base("classic",15,pt(420,842),pt(80,160),1,2,"portal");
c15.walls=[r(244,300,42,410)];
c15.portals=[{a:{x:430,y:620,r:30},b:{x:120,y:360,r:30}}];
path(c15,pt(430,620),pt(120,360),pt(80,160));

// 16 — Portal angle application. Two broad shelves create an S-shaped grass fallback. The lower
// right shelf seals the direct spawn→portal line, forcing placement before attacking portal A.
const c16=base("classic",16,pt(420,842),pt(420,160),3,4,"portal");
c16.walls=[r(138,500,374,24),r(138,650,24,160),r(28,300,320,24),r(320,730,192,24)];
c16.portals=[{a:{x:350,y:650,r:30},b:{x:200,y:400,r:30}}];
path(c16,pt(250,790),pt(350,650),pt(200,400),pt(380,260),pt(420,160));

export const CLASSIC_BLOCK_2:LevelDefinition[]=[c11,c12,c13,c14,c15,c16];