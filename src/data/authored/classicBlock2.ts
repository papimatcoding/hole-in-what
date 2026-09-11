import type { LevelDefinition } from "../../types";
import { base, path, pt, r } from "./authoring";

/**
 * Classic chapter 2.
 *
 * Chapter 1 ends on C10 as an exam. C11 intentionally resets the mental load to teach a new
 * surface, but it must not reset all the way back to tutorial difficulty. Every chapter-2 hole
 * therefore keeps a forgiving learned route while removing the broad one-shot solutions that
 * made the old C11-C13 collapse the campaign curve.
 */

// 11 — First ice lesson. Two generous alternating gates make this a real two-step hole instead
// of a broad HIO. The wide ice band sits between both decisions: players learn the longer carry,
// then get a large grass landing area before the final approach. This is a chapter reset, not C02.
const c11=base("classic",11,pt(110,840),pt(420,160),2,3,"ice");
c11.ice=[r(118,520,318,104)];
c11.walls=[r(220,676,292,24),r(28,360,354,24)];
path(c11,pt(154,650),pt(170,548),pt(414,458),pt(420,160));

// 12 — Ice application. The player repeats the stopping-distance lesson through two separated
// bands and opposite exits. Both gaps are intentionally broad: difficulty comes from planning
// where the ball stops, not from threading a tiny mobile-input corridor.
const c12=base("classic",12,pt(420,842),pt(110,154),2,3,"ice");
c12.walls=[r(28,646,330,24),r(184,350,328,24)];
c12.ice=[r(300,532,172,86),r(76,404,190,82)];
path(c12,pt(420,566),pt(132,500),pt(132,302),pt(110,154));

// 13 — First booster application. The pad gives a strong, readable launch toward the right lane,
// but the upper reverse gate prevents a free HIO. The mastery question is now "use the speed,
// then place the follow-up" instead of "touch the booster and win".
const c13=base("classic",13,pt(100,842),pt(420,160),2,3,"booster");
c13.boosters=[{x:76,y:620,w:312,h:138,dx:.62,dy:-1,power:.86}];
c13.walls=[r(28,494,328,24),r(238,302,274,24)];
path(c13,pt(220,694),pt(414,556),pt(414,446),pt(166,386),pt(160,250),pt(420,160));

export const CLASSIC_BLOCK_2:LevelDefinition[]=[c11,c12,c13];
