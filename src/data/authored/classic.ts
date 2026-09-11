import type { LevelDefinition } from "../../types";
import { base, path, pt, r, tri } from "./authoring";

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
// readable lanes. Full human-model says the reliable mastery route is two strokes even though
// a narrow one-shot exists, so stars follow the human route instead of the solver record.
const c3=base("classic",3,pt(270,836),pt(270,166),2,3,"wall");
c3.walls=[r(205,405,130,220)];
path(c3,pt(132,670),pt(132,322),pt(270,166));

// First proper geometry step. Replace the old rectangular right fin with a diagonal wedge:
// it preserves the broad two-stage question while giving the hole a recognisable angled silhouette.
const c4=base("classic",4,pt(92,836),pt(430,156),3,4,"wall");
c4.walls=[r(28,588,324,26),r(188,346,324,26)];
c4.triangles=[tri(330,462,356,462,356,588)];
path(c4,pt(428,690),pt(428,520),pt(150,468),pt(150,274),pt(430,156));

// First bumper lesson. Audit 3.0 found two visually fake passages. Close them explicitly rather
// than leaving slits narrower than the ball, while keeping the intended bumper lane untouched.
const c5=base("classic",5,pt(116,836),pt(422,166),2,3,"bumper");
c5.walls=[r(210,548,24,166),r(326,320,24,160),r(88,300,130,24),r(28,714,220,24),r(482,500,30,200),r(220,790,168,24)];
c5.bumpers=[{x:390,y:626,r:48}];
path(c5,pt(390,626),pt(426,510),pt(270,420),pt(238,258),pt(422,166));

// Bumper application. RC7's route was mechanically sound but over-sensitive. The island-like
// layout is one of Audit 3.0's strongest KEEP references and deliberately stays unchanged.
const c6=base("classic",6,pt(420,836),pt(108,166),2,3,"bumper");
c6.walls=[r(250,568,262,24),r(28,332,224,24),r(28,220,164,24)];
c6.bumpers=[{x:142,y:650,r:54},{x:398,y:432,r:50}];
path(c6,pt(142,650),pt(398,432),pt(304,280),pt(108,166));

// Geometry exam. Keep the three broad shelves but chamfer every inner tip. The route remains
// readable while rebounds stop feeling like another set of identical rectangular ledges.
const c7=base("classic",7,pt(104,840),pt(430,150),2,3,"wall");
c7.walls=[r(28,654,250,24),r(262,458,250,24),r(28,262,240,24)];
c7.triangles=[
  tri(278,654,332,678,278,678),
  tri(208,458,262,458,262,482),
  tri(268,262,322,286,268,286)
];
path(c7,pt(420,724),pt(420,548),pt(118,402),pt(118,218),pt(430,150));

// Sand introduction without a free HIO: cross the belt, then solve two opposite exits.
const c8=base("classic",8,pt(270,842),pt(112,154),3,4,"sand");
c8.sand=[r(80,566,380,112)];
c8.walls=[r(190,426,322,24),r(28,286,184,24)];
path(c8,pt(126,522),pt(126,388),pt(420,344),pt(420,246),pt(112,154));

// Sand application. Close the useless 20px right-edge slit flagged by Audit 3.0. Full human-model
// consistently needs three strokes, so the star goal follows that route rather than the two-shot solver line.
const c9=base("classic",9,pt(424,840),pt(106,154),3,4,"sand");
c9.sand=[r(318,530,160,100)];
c9.walls=[r(28,642,344,24),r(468,650,44,132),r(180,490,260,24),r(278,300,234,24)];
path(c9,pt(420,580),pt(468,450),pt(220,390),pt(220,250),pt(106,154));

// Chapter exam. Remove three fake micro-passages without changing the intended three-stroke route:
// the lower shelf now meets the vertical fin, the bumper has a readable ball-width lane, and the
// anti-cheese floor guard closes cleanly against the bottom boundary.
const c10=base("classic",10,pt(104,850),pt(430,136),3,4,"bumper");
c10.walls=[r(28,672,298,24),r(250,474,262,24),r(28,268,286,24),r(350,204,162,24),r(326,650,24,104),r(160,884,160,48)];
c10.sand=[r(54,350,164,124)];
c10.bumpers=[{x:420,y:736,r:34}];
path(c10,pt(420,736),pt(404,570),pt(160,520),pt(132,394),pt(386,244),pt(326,184),pt(430,136));

export const CLASSIC_AUTHORED:LevelDefinition[]=[c1,c2,c3,c4,c5,c6,c7,c8,c9,c10];