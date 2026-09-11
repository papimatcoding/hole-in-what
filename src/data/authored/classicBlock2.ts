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

// 14 — Booster route choice. A central monolith creates two route families; the left booster is
// the fast commitment and the right side is the slower all-grass recovery. A broad upper shoulder
// catches the old booster-assisted HIO and turns exit speed into a placement question instead of
// rewarding one full-power swipe. Nothing here relies on a narrow gap.
const c14=base("classic",14,pt(110,842),pt(420,160),3,4,"booster");
c14.walls=[r(184,426,172,266),r(28,300,256,24)];
c14.boosters=[{x:52,y:514,w:104,h:214,dx:.08,dy:-1,power:.82}];
path(c14,pt(108,666),pt(112,380),pt(322,350),pt(360,244),pt(420,160));

// 15 — Portal introduction. The central spine makes displacement useful without hiding either
// endpoint. The first portal now sits slightly outside the start line: entering it naturally sends
// the ball out of the upper-left portal in a visibly preserved direction that is deliberately NOT
// aimed at the cup. The player sees what the portal did, then gets one simple finishing putt.
const c15=base("classic",15,pt(420,842),pt(80,160),2,3,"portal");
c15.walls=[r(244,268,42,426)];
c15.portals=[{a:{x:452,y:620,r:30},b:{x:126,y:356,r:30}}];
path(c15,pt(452,620),pt(126,356),pt(190,242),pt(80,160));

// 16 — Portal angle lesson. The long divider leaves a generous left fallback corridor, but a
// visible lower pillar breaks the old full-power outer-bank HIO. Mastery first sets up in the lower
// room, then approaches the portal from the left so its preserved vector exits upper-left toward
// the cup. The fallback stays possible, just intentionally longer than understanding the portal.
const c16=base("classic",16,pt(420,842),pt(420,160),3,4,"portal");
c16.walls=[r(166,490,346,24),r(52,520,24,210)];
c16.portals=[{a:{x:320,y:620,r:30},b:{x:150,y:356,r:30}}];
path(c16,pt(160,760),pt(320,620),pt(150,356),pt(318,238),pt(420,160));

export const CLASSIC_BLOCK_2:LevelDefinition[]=[c11,c12,c13,c14,c15,c16];
