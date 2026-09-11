import type { LevelDefinition } from "../../types";
import { base, path, pt, r } from "./authoring";

/** Beta block 1: each hole asks a different question and the mastery curve rises deliberately. */

// C01 is deliberate onboarding, not a normal puzzle. Keep the shot obvious and forgiving;
// the first real course-design question starts at C02.
const c1=base("classic",1,pt(270,800),pt(270,176),1,2,"wall");
c1.onboarding=true;
delete c1.primaryMechanic;
path(c1);

// Alternating shelves create a broad S-route. The gaps are generous enough for touch,
// but the player must now read the course instead of firing directly at the cup.
const c2=base("classic",2,pt(420,836),pt(110,166),2,3,"wall");
c2.walls=[r(28,620,330,24),r(182,380,330,24)];
path(c2,pt(430,548),pt(132,500),pt(132,318),pt(110,166));

// Route-choice lesson: a central island blocks the obvious line and leaves two equally
// readable lanes. It stays simple, but the first attempt now contains an actual decision.
const c3=base("classic",3,pt(270,836),pt(270,166),2,3,"wall");
c3.walls=[r(205,405,130,220)];
path(c3,pt(132,670),pt(132,322),pt(270,166));

// First proper geometry step. Keep the alternating read, but widen both gates and shorten the
// centre fin versus RC7 so the jump comes from planning two shots rather than touch precision.
const c4=base("classic",4,pt(92,836),pt(430,156),2,3,"wall");
c4.walls=[r(28,588,294,26),r(216,346,296,26),r(344,474,26,92)];
path(c4,pt(424,692),pt(424,526),pt(154,466),pt(154,276),pt(430,156));

// First bumper lesson: the lower shelf blocks the direct diagonal and the right guard kills the outer double-bank HIO, while the intended bumper setup stays open.
const c5=base("classic",5,pt(116,836),pt(422,166),2,3,"bumper");
c5.walls=[r(210,548,24,164),r(326,320,24,174),r(88,300,144,24),r(28,714,248,24),r(470,500,24,220)];
c5.bumpers=[{x:390,y:626,r:32}];
path(c5,pt(390,626),pt(426,510),pt(270,420),pt(238,258),pt(422,166));

// Bumper application. RC7's route was mechanically sound but over-sensitive (17% robustness in
// the fast audit). Broader gates and larger targets preserve the two-shot pinball idea while
// making misses cost strokes instead of making the intended line feel like a password.
const c6=base("classic",6,pt(420,836),pt(108,166),2,3,"bumper");
c6.walls=[r(250,568,262,24),r(28,332,224,24),r(28,220,164,24)];
c6.bumpers=[{x:142,y:650,r:54},{x:398,y:432,r:50}];
path(c6,pt(142,650),pt(398,432),pt(304,280),pt(108,166));

// Geometry exam. Solver mastery is genuinely two strokes, so the stars say two.
const c7=base("classic",7,pt(104,840),pt(430,150),2,3,"wall");
c7.walls=[r(28,654,304,24),r(208,458,304,24),r(28,262,294,24)];
path(c7,pt(420,724),pt(420,548),pt(118,402),pt(118,218),pt(430,150));

// Sand introduction without a free HIO: cross the belt, then solve two opposite exits.
const c8=base("classic",8,pt(270,842),pt(112,154),3,4,"sand");
c8.sand=[r(80,566,380,112)];
c8.walls=[r(190,426,322,24),r(28,286,184,24)];
path(c8,pt(126,522),pt(126,388),pt(420,344),pt(420,246),pt(112,154));

// Sand application: commit to the right-side slow pocket, clear the middle shelf, then switch left. The lower shelf and short right fin prevent one-shot wall banks from bypassing the sand decision.
const c9=base("classic",9,pt(424,840),pt(106,154),3,4,"sand");
c9.sand=[r(318,530,160,100)];
c9.walls=[r(28,642,344,24),r(468,650,24,132),r(180,490,260,24),r(278,300,234,24)];
path(c9,pt(420,580),pt(468,450),pt(220,390),pt(220,250),pt(106,154));

// Chapter exam. Keep it as the hardest Classic-1 hole, but slightly enlarge the bumper and the
// first landing window so the audit difficulty comes from combining learned mechanics, not a
// single brittle contact. Chapter 2 is allowed to reset after this exam.
const c10=base("classic",10,pt(104,850),pt(430,136),3,4,"bumper");
c10.walls=[r(28,672,276,24),r(258,474,254,24),r(28,268,276,24),r(354,204,158,24),r(334,650,24,96)];
c10.sand=[r(54,350,164,124)];
c10.bumpers=[{x:404,y:736,r:40}];
path(c10,pt(404,736),pt(404,570),pt(160,520),pt(132,394),pt(386,244),pt(326,184),pt(430,136));

export const CLASSIC_AUTHORED:LevelDefinition[]=[c1,c2,c3,c4,c5,c6,c7,c8,c9,c10];
