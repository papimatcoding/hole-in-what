import type { LevelDefinition } from "../../types";
import { base, path, pt, r, tri } from "./authoring";

/**
 * GRASSLAND · 01–10
 *
 * First chapter vocabulary is intentionally small:
 * geometry, bumpers and ramps. Every hole contains one readable troll beat.
 * Later chapters own surfaces, speed pads, portals and other mechanic families.
 */

// 01 — Gesture tutorial + identity reveal. The obvious first shot wakes a wall.
const c1=base("classic",1,pt(270,800),pt(270,176),2,3,"wall");
c1.onboarding=true;delete c1.primaryMechanic;c1.trollArchetype="gate-pop";
c1.popWalls=[{...r(180,650,180,24),triggerX:270,triggerY:800,triggerRadius:100}];
path(c1,pt(112,724),pt(112,500),pt(270,176));

// 02 — Broad S geometry. A late bumper punishes blindly following the obvious right lane.
const c2=base("classic",2,pt(420,836),pt(110,166),2,3,"wall");
c2.trollArchetype="bumper-ambush";
c2.walls=[r(28,620,330,24),r(182,380,330,24)];
c2.popBumpers=[{x:402,y:516,r:38,triggerX:420,triggerY:684,triggerRadius:118}];
path(c2,pt(430,548),pt(132,500),pt(132,318),pt(110,166));

// 03 — Route choice. The tempting right lane closes; the learned left route stays generous.
const c3=base("classic",3,pt(270,836),pt(270,166),2,3,"wall");
c3.trollArchetype="safe-lane-collapse";
c3.walls=[r(205,405,130,220)];
c3.popWalls=[{...r(342,560,148,22),triggerX:348,triggerY:706,triggerRadius:112}];
path(c3,pt(132,670),pt(132,322),pt(270,166));

// 04 — Angled geometry. A shortcut around the upper wedge grows a bumper after commitment.
const c4=base("classic",4,pt(92,836),pt(430,156),3,4,"wall");
c4.trollArchetype="bumper-ambush";
c4.walls=[r(28,588,324,26),r(188,346,324,26)];
c4.triangles=[tri(330,462,356,462,356,588)];
c4.popBumpers=[{x:390,y:310,r:35,triggerX:396,triggerY:438,triggerRadius:96}];
path(c4,pt(428,690),pt(428,520),pt(150,468),pt(150,274),pt(430,156));

// 05 — First bumper lesson. The bumper is useful; the troll wall makes its easiest rebound imperfect.
const c5=base("classic",5,pt(116,836),pt(422,166),2,3,"bumper");
c5.trollArchetype="rebound-punish";
c5.walls=[r(210,548,24,166),r(326,320,24,160),r(88,300,130,24),r(28,714,220,24),r(482,500,30,200),r(220,790,168,24)];
c5.bumpers=[{x:390,y:626,r:48}];
c5.popWalls=[{...r(350,486,120,22),triggerX:390,triggerY:626,triggerRadius:84}];
path(c5,pt(390,626),pt(426,510),pt(270,420),pt(238,258),pt(422,166));

// 06 — Two-bumper application. The second rebound can wake a smaller ambush bumper.
const c6=base("classic",6,pt(420,836),pt(108,166),2,3,"bumper");
c6.trollArchetype="bumper-ambush";
c6.walls=[r(250,568,262,24),r(28,332,224,24),r(28,220,164,24)];
c6.bumpers=[{x:142,y:650,r:54},{x:398,y:432,r:50}];
c6.popBumpers=[{x:292,y:300,r:32,triggerX:398,triggerY:432,triggerRadius:86}];
path(c6,pt(142,650),pt(398,432),pt(304,280),pt(108,166));

// 07 — Grassland geometry exam. Chamfers stay readable; the central line is not as safe as it looks.
const c7=base("classic",7,pt(104,840),pt(430,150),3,4,"wall");
c7.trollArchetype="cross-gate";
c7.walls=[r(28,654,250,24),r(262,458,250,24),r(28,262,240,24)];
c7.triangles=[
  tri(278,654,332,678,278,678),
  tri(208,458,262,458,262,482),
  tri(268,262,322,286,268,286)
];
c7.popWalls=[{...r(218,374,128,22),triggerX:342,triggerY:524,triggerRadius:104}];
path(c7,pt(420,724),pt(420,548),pt(118,402),pt(118,218),pt(430,150));

// 08 — Ramp introduction. Missing the jump is recoverable; trusting the centre line is the troll.
const c8=base("classic",8,pt(270,842),pt(270,154),3,4,"ramp");
c8.trollArchetype="bumper-ambush";
c8.walls=[r(28,456,484,28),r(28,278,180,24),r(332,278,180,24)];
c8.ramps=[{x:215,y:568,w:110,h:82,dx:0,dy:-1,lift:345,boost:34}];
c8.popBumpers=[{x:270,y:346,r:36,triggerX:270,triggerY:520,triggerRadius:100}];
path(c8,pt(270,610),pt(270,392),pt(270,230),pt(270,154));

// 09 — Ramp application. Launch diagonally into the upper-right lane; a shortcut gate appears late.
const c9=base("classic",9,pt(106,842),pt(424,154),3,4,"ramp");
c9.trollArchetype="gate-pop";
c9.walls=[r(28,500,300,26),r(362,500,150,26),r(28,300,260,24)];
c9.ramps=[{x:126,y:596,w:118,h:82,dx:.68,dy:-1,lift:330,boost:40}];
c9.bumpers=[{x:398,y:420,r:42}];
c9.popWalls=[{...r(330,262,150,22),triggerX:392,triggerY:388,triggerRadius:94}];
path(c9,pt(184,630),pt(354,448),pt(398,420),pt(350,250),pt(424,154));

// 10 — Chapter exam. Geometry, bumper and ramp in one route, then one final troll correction.
const c10=base("classic",10,pt(104,850),pt(430,136),4,5,"ramp");
c10.trollArchetype="late-combo";
c10.walls=[r(28,690,250,24),r(300,526,212,24),r(28,344,250,24),r(336,216,176,24)];
c10.triangles=[tri(278,690,326,714,278,714),tri(278,344,326,368,278,368)];
c10.ramps=[{x:344,y:600,w:108,h:78,dx:-.35,dy:-1,lift:320,boost:34}];
c10.bumpers=[{x:142,y:440,r:46}];
c10.popWalls=[{...r(300,286,146,22),triggerX:142,triggerY:440,triggerRadius:92}];
c10.popBumpers=[{x:400,y:190,r:30,triggerX:352,triggerY:258,triggerRadius:82}];
path(c10,pt(392,640),pt(270,500),pt(142,440),pt(150,300),pt(352,258),pt(430,136));

export const CLASSIC_AUTHORED:LevelDefinition[]=[c1,c2,c3,c4,c5,c6,c7,c8,c9,c10];
