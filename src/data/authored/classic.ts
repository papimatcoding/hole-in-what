import type { LevelDefinition } from "../../types";
import { base, path, pt, r, tri } from "./authoring";

/**
 * GRASSLAND · 01–10
 *
 * First chapter vocabulary is intentionally small:
 * geometry, bumpers and ramps. Every hole contains one readable troll beat.
 * Later chapters own surfaces, speed pads, portals and other mechanic families.
 */
const bait=(level:LevelDefinition,...points:{x:number;y:number}[]):void=>{level.baitPath=[level.ball,...points,level.hole];};

// 01 — Gesture tutorial + identity reveal. The obvious first shot wakes a wall.
const c1=base("classic",1,pt(270,800),pt(270,176),2,3,"wall");
c1.onboarding=true;delete c1.primaryMechanic;c1.trollArchetype="gate-pop";
c1.popWalls=[{...r(180,650,180,24),triggerX:270,triggerY:800,triggerRadius:100}];
path(c1,pt(112,724),pt(112,500),pt(270,176));
bait(c1);

// 02 — Broad S geometry. A late bumper punishes blindly following the obvious right lane.
const c2=base("classic",2,pt(420,836),pt(110,166),2,3,"wall");
c2.trollArchetype="bumper-ambush";
c2.walls=[r(28,620,330,24),r(182,380,330,24)];
c2.popBumpers=[{x:402,y:516,r:38,triggerX:420,triggerY:684,triggerRadius:118}];
path(c2,pt(430,548),pt(132,500),pt(132,318),pt(110,166));
bait(c2,pt(420,684),pt(402,516));

// 03 — Route choice. The tempting right lane closes; the learned left route stays generous.
const c3=base("classic",3,pt(270,836),pt(270,166),2,3,"wall");
c3.trollArchetype="safe-lane-collapse";
c3.walls=[r(205,405,130,220)];
c3.popWalls=[{...r(335,540,177,22),triggerX:402,triggerY:700,triggerRadius:105}];
path(c3,pt(132,670),pt(132,322),pt(270,166));
bait(c3,pt(402,700),pt(402,540),pt(402,322));

// 04 — A sloped bank grows out of the lower wall's right corner.
const c4=base("classic",4,pt(92,836),pt(430,156),2,3,"wall");
c4.trollArchetype="bumper-ambush";
c4.walls=[r(28,588,324,26),r(188,346,324,26)];
c4.triangles=[tri(310,588,400,540,400,588)];
c4.popBumpers=[{x:390,y:696,r:36,triggerX:230,triggerY:780,triggerRadius:116}];
path(c4,pt(428,690),pt(428,520),pt(150,468),pt(150,274),pt(430,156));
bait(c4,pt(230,780),pt(390,696),pt(430,520));

// 05 — One readable rebound and one surprise; remove the extra bars around the opening.
const c5=base("classic",5,pt(116,836),pt(422,166),2,3,"bumper");
c5.trollArchetype="rebound-punish";
c5.walls=[r(210,548,24,166),r(326,320,24,160),r(28,714,220,24)];
c5.bumpers=[{x:385,y:605,r:42}];
c5.popWalls=[{...r(234,680,174,22),triggerX:220,triggerY:770,triggerRadius:110}];
path(c5,pt(390,626),pt(426,510),pt(270,420),pt(238,258),pt(422,166));
bait(c5,pt(220,770),pt(340,680),pt(390,626));

// 06 — The apparent route to the left bumper closes with a wall joined to the lower barrier.
const c6=base("classic",6,pt(420,836),pt(108,166),2,3,"bumper");
c6.trollArchetype="bumper-ambush";
c6.walls=[r(250,568,262,24),r(28,332,224,24)];
c6.bumpers=[{x:142,y:650,r:45},{x:398,y:432,r:50}];
c6.popWalls=[{...r(250,592,24,120),triggerX:350,triggerY:760,triggerRadius:75}];
path(c6,pt(142,650),pt(398,432),pt(304,280),pt(108,166));
bait(c6,pt(350,760),pt(250,710),pt(142,650));

// 07 — A curved bank continues the upper wall and bends toward the lower turn without sealing it.
const c7=base("classic",7,pt(104,840),pt(430,150),2,3,"wall");
c7.trollArchetype="cross-gate";
c7.walls=[r(28,654,250,24),r(262,458,250,24),r(28,262,240,24)];
c7.triangles=[];
c7.curves=[{x:270,y:560,r:78,startAngle:-Math.PI/2,endAngle:.5,thickness:24}];
c7.popWalls=[{...r(278,678,24,105),triggerX:210,triggerY:790,triggerRadius:105}];
path(c7,pt(420,724),pt(420,548),pt(118,402),pt(118,218),pt(430,150));
bait(c7,pt(210,790),pt(290,730),pt(420,548));

// 08 — Ramp introduction. The direct line closes; a wider left entry teaches the banked approach.
const c8=base("classic",8,pt(270,842),pt(270,154),3,4,"ramp");
c8.trollArchetype="gate-pop";
c8.walls=[r(28,456,390,28),r(28,278,180,24),r(332,278,180,24)];
c8.ramps=[{x:195,y:568,w:140,h:82,dx:0,dy:-1,lift:345,boost:34}];
c8.popWalls=[{...r(250,700,130,22),triggerX:270,triggerY:790,triggerRadius:82}];
path(c8,pt(230,704),pt(230,610),pt(230,392),pt(270,230),pt(270,154));
bait(c8,pt(270,700),pt(270,610),pt(270,392));

// 09 — Ramp application. The upper wall extends across the tempting landing line.
const c9=base("classic",9,pt(106,842),pt(424,154),2,3,"ramp");
c9.trollArchetype="gate-pop";
c9.walls=[r(28,500,300,26),r(362,500,150,26),r(28,300,260,24)];
c9.ramps=[{x:126,y:596,w:118,h:82,dx:.68,dy:-1,lift:225,boost:20}];
c9.bumpers=[];
c9.popWalls=[{...r(288,300,45,24),triggerX:305,triggerY:390,triggerRadius:105}];
path(c9,pt(184,630),pt(354,448),pt(398,420),pt(350,250),pt(424,154));
bait(c9,pt(184,630),pt(305,390),pt(340,300),pt(424,154));

// 10 — Chapter exam. The final safe-looking landing pocket drops away and forces a retry.
const c10=base("classic",10,pt(104,850),pt(430,136),3,4,"ramp");
c10.trollArchetype="late-combo";
c10.walls=[r(28,690,250,24),r(300,526,212,24),r(28,344,250,24),r(336,216,176,24)];
c10.triangles=[];
c10.ramps=[{x:344,y:600,w:108,h:78,dx:-.35,dy:-1,lift:320,boost:34}];
c10.bumpers=[{x:142,y:440,r:46}];
c10.popWalls=[{...r(278,690,158,24),triggerX:210,triggerY:790,triggerRadius:120}];
c10.popVoids=[{...r(70,216,150,128),triggerX:208,triggerY:432,triggerRadius:100}];
path(c10,pt(392,640),pt(270,500),pt(142,440),pt(150,300),pt(352,258),pt(430,136));
bait(c10,pt(210,790),pt(360,690),pt(270,500),pt(142,440),pt(150,220));

export const CLASSIC_AUTHORED:LevelDefinition[]=[c1,c2,c3,c4,c5,c6,c7,c8,c9,c10];
