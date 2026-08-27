import type { LevelDefinition } from "../../types";
import { base, path, pt, r } from "./authoring";

/** Beta block 1: each hole asks a different question and the mastery curve rises deliberately. */

const c1=base("classic",1,pt(150,828),pt(390,176),1,2,"wall");
path(c1,pt(270,505));

const c2=base("classic",2,pt(104,824),pt(424,176),1,2,"wall");
c2.walls=[r(238,380,26,286)];
path(c2,pt(452,610),pt(452,360),pt(424,176));

// Wider island makes the HIO a real trick shot rather than the default answer.
const c3=base("classic",3,pt(270,836),pt(296,158),2,3,"wall");
c3.walls=[r(170,370,200,230)];
path(c3,pt(126,650),pt(126,310),pt(296,158));

const c4=base("classic",4,pt(92,836),pt(430,156),2,3,"wall");
c4.walls=[r(28,588,324,26),r(188,346,324,26),r(330,462,26,126)];
path(c4,pt(428,690),pt(428,520),pt(150,468),pt(150,274),pt(430,156));

// First bumper lesson: there is always a safe route around the two separated shelves.
// The bumper is the faster line, never a mandatory pinched gate.
const c5=base("classic",5,pt(270,836),pt(422,166),2,3,"bumper");
c5.walls=[r(76,520,178,24),r(310,306,202,24)];
c5.bumpers=[{x:300,y:590,r:34}];
path(c5,pt(300,700),pt(300,590),pt(424,448),pt(422,166));

// Same mechanic, different question: choose the rebound that leaves the useful second angle.
const c6=base("classic",6,pt(420,836),pt(108,166),2,3,"bumper");
c6.walls=[r(248,564,264,24),r(28,332,250,24)];
c6.bumpers=[{x:330,y:650,r:34},{x:188,y:432,r:32}];
path(c6,pt(330,650),pt(188,432),pt(108,166));

// Geometry exam. Solver mastery is genuinely two strokes, so the stars say two.
const c7=base("classic",7,pt(104,840),pt(430,150),2,3,"wall");
c7.walls=[r(28,654,304,24),r(208,458,304,24),r(28,262,294,24)];
path(c7,pt(420,724),pt(420,548),pt(118,402),pt(118,218),pt(430,150));

// Sand tutorial: drive through the slowing strip, then turn back across the top instead of shooting straight through it.
const c8=base("classic",8,pt(270,842),pt(112,154),2,3,"sand");
c8.sand=[r(74,516,392,144)];
c8.walls=[r(28,368,330,24),r(358,368,24,134)];
path(c8,pt(330,676),pt(348,570),pt(420,430),pt(420,286),pt(112,154));

// Sand application: the short central line is slowed and screened; the dry route is longer but controllable.
const c9=base("classic",9,pt(424,840),pt(106,154),3,4,"sand");
c9.sand=[r(300,430,176,178)];
c9.walls=[r(28,608,250,24),r(278,318,234,24),r(190,318,24,174),r(250,438,24,112)];
path(c9,pt(400,694),pt(300,566),pt(182,516),pt(182,388),pt(106,154));

// Chapter exam: bumper shortcut, sand placement and a final reverse gate. No new rule.
const c10=base("classic",10,pt(104,850),pt(430,136),3,4,"bumper");
c10.walls=[r(28,672,286,24),r(250,474,262,24),r(28,268,286,24),r(350,204,162,24)];
c10.sand=[r(54,350,164,124)];
c10.bumpers=[{x:404,y:570,r:34}];
path(c10,pt(404,736),pt(404,570),pt(160,520),pt(132,394),pt(386,244),pt(326,184),pt(430,136));

export const CLASSIC_AUTHORED:LevelDefinition[]=[c1,c2,c3,c4,c5,c6,c7,c8,c9,c10];
