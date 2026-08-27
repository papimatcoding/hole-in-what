import type { LevelDefinition } from "../../types";
import { base, path, pt, r, trap } from "./authoring";

/** HARD block 1: every first attempt breaks an expectation; every second attempt has a learned answer. */

// 01 — Commit to the obvious right lane and it closes. A second upper gate removes the old free HIO.
const h1=base("troll",1,pt(126,836),pt(420,160),2,3,"wall");
h1.walls=[r(246,382,24,310),r(28,292,280,24)];
h1.popWalls=[{x:286,y:548,w:198,h:24,triggerX:360,triggerY:674,triggerRadius:150}];
path(h1,pt(426,720),pt(426,470),pt(346,340),pt(420,160));trap(h1,"gate-pop");

// 02 — The obvious lower-right lane wakes a bumper; the learned route exits left and finishes on the opposite side.
const h2=base("troll",2,pt(420,840),pt(110,160),2,3,"bumper");
h2.walls=[r(28,612,332,24),r(186,330,326,24)];
h2.popBumpers=[{x:430,y:520,r:44,triggerX:432,triggerY:690,triggerRadius:150}];
path(h2,pt(438,700),pt(154,530),pt(154,406),pt(110,160));trap(h2,"bumper-ambush");

// 03 — False highway: the cup is almost directly above the tee, but committing to that tempting right lane makes the floor disappear ahead of the ball.
// The learned answer is to escape left through the lower opening, climb the safe lane, then cross back above the divider. The trap now changes the route instead of merely animating behind it.
const h3=base("troll",3,pt(420,840),pt(430,150),3,4,"void");
h3.walls=[r(250,330,24,410),r(274,300,238,24)];
h3.popVoids=[{x:300,y:515,w:190,h:195,triggerX:420,triggerY:760,triggerRadius:96}];
path(h3,pt(182,770),pt(182,430),pt(196,250),pt(430,150));trap(h3,"safe-lane-collapse");

// 04 — Two-stage joke: solving the first shutter reveals a second one later in the route.
const h4=base("troll",4,pt(270,848),pt(270,144),3,4,"wall");
h4.walls=[r(28,664,308,24),r(204,420,308,24)];
h4.popWalls=[
  {x:28,y:294,w:310,h:24,triggerX:116,triggerY:492,triggerRadius:116},
  {x:118,y:438,w:24,h:158,triggerX:408,triggerY:552,triggerRadius:108}
];
path(h4,pt(420,730),pt(420,534),pt(158,392),pt(408,250),pt(270,144));trap(h4,"cross-gate");

// 05 — First the entry wakes a bumper, then the narrowed waist forces interaction with the moving crossing, then a final wall guards the cup.
// Blind players should land around three strokes; an elite line may remain, but it must not bypass the moving mechanic.
const h5=base("troll",5,pt(96,848),pt(430,140),3,4,"moving");
h5.walls=[r(28,682,286,24),r(28,520,162,24),r(350,520,162,24),r(190,486,20,92),r(320,486,20,92),r(228,310,284,24)];
h5.movingWalls=[{x:210,y:520,w:110,h:24,axis:"x",amplitude:45,speed:1.2,phase:.4}];
h5.popBumpers=[{x:404,y:610,r:36,triggerX:350,triggerY:720,triggerRadius:152}];
h5.popWalls=[{x:354,y:238,w:104,h:22,triggerX:362,triggerY:292,triggerRadius:92}];
path(h5,pt(408,744),pt(408,610),pt(278,566),pt(170,456),pt(170,356),pt(390,260),pt(430,140));trap(h5,"late-combo");

export const HARD_AUTHORED:LevelDefinition[]=[h1,h2,h3,h4,h5];
