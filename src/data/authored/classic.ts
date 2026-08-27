import type { LevelDefinition } from "../../types";
import { base, path, pt, r } from "./authoring";

/**
 * Beta block 1: authored in a strict learning curve.
 * New mechanics are deliberately spaced out; every hole asks a different strategic question.
 */

// 01 — Learn the drag. Comfortable HIO, almost no geometry.
const c1=base("classic",1,pt(150,828),pt(390,176),1,2,"wall");
path(c1,pt(270,505));

// 02 — First bank. Direct line is awkward; the clean mastery line uses the side wall.
const c2=base("classic",2,pt(104,824),pt(424,176),1,2,"wall");
c2.walls=[r(238,380,26,286)];
path(c2,pt(452,610),pt(452,360),pt(424,176));

// 03 — First route choice. Central island creates two readable sides; natural solution is 2 strokes.
const c3=base("classic",3,pt(270,836),pt(270,158),2,3,"wall");
c3.walls=[r(184,390,172,190)];
path(c3,pt(128,650),pt(128,318),pt(270,158));

// 04 — Setup shot. You cannot simply chase the cup; the first stroke must create the second angle.
const c4=base("classic",4,pt(92,836),pt(430,156),2,3,"wall");
c4.walls=[r(28,588,324,26),r(188,346,324,26),r(330,462,26,126)];
path(c4,pt(428,690),pt(428,520),pt(150,468),pt(150,274),pt(430,156));

// 05 — Bumper introduction. The bumper is the fast route around the elbow, not decoration.
const c5=base("classic",5,pt(116,836),pt(422,166),2,3,"bumper");
c5.walls=[r(28,520,250,24),r(302,306,210,24),r(278,306,24,238)];
c5.bumpers=[{x:300,y:558,r:34}];
path(c5,pt(300,690),pt(300,558),pt(424,448),pt(422,166));

// 06 — Apply bumper knowledge differently: choose which bumper creates the better exit angle.
const c6=base("classic",6,pt(420,836),pt(108,166),2,3,"bumper");
c6.walls=[r(248,564,264,24),r(28,332,250,24)];
c6.bumpers=[{x:192,y:612,r:32},{x:350,y:420,r:32}];
path(c6,pt(192,612),pt(350,420),pt(108,166));

// 07 — Geometry exam. No new mechanic: three wide decisions, increasing precision without surprise.
const c7=base("classic",7,pt(104,840),pt(430,150),3,4,"wall");
c7.walls=[r(28,654,304,24),r(208,458,304,24),r(28,262,294,24)];
path(c7,pt(420,724),pt(420,548),pt(118,402),pt(118,218),pt(430,150));

// 08 — Sand introduction. The strip catches overpowered shots and teaches controlled placement.
const c8=base("classic",8,pt(270,842),pt(416,154),3,4,"sand");
c8.sand=[r(74,516,392,144)];
c8.walls=[r(28,368,330,24),r(358,368,24,134)];
path(c8,pt(330,676),pt(348,570),pt(420,430),pt(416,154));

// 09 — Sand becomes a route decision: short risky route through sand vs longer dry bank route.
const c9=base("classic",9,pt(424,840),pt(106,154),3,4,"sand");
c9.sand=[r(300,430,176,178)];
c9.walls=[r(28,608,250,24),r(278,318,234,24),r(190,318,24,174)];
path(c9,pt(192,708),pt(182,538),pt(182,388),pt(106,154));

// 10 — Chapter exam. Combines geometry, one meaningful bumper and sand without adding a new rule.
const c10=base("classic",10,pt(104,850),pt(430,136),3,4,"bumper");
c10.walls=[r(28,672,286,24),r(250,474,262,24),r(28,268,286,24)];
c10.sand=[r(54,350,164,124)];
c10.bumpers=[{x:404,y:570,r:34}];
path(c10,pt(404,736),pt(404,570),pt(160,520),pt(132,394),pt(386,226),pt(430,136));

export const CLASSIC_AUTHORED:LevelDefinition[]=[c1,c2,c3,c4,c5,c6,c7,c8,c9,c10];
