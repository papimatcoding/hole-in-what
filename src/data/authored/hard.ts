import type { LevelDefinition } from "../../types";
import { base, path, pt, r, trap } from "./authoring";

// First troll: the obvious right lane closes. A narrow post-reveal HIO may survive as mastery.
const h1=base("troll",1,pt(126,832),pt(410,154),2,4,"wall");
h1.walls=[r(232,382,24,330)];
h1.popWalls=[{x:322,y:558,w:190,h:24,triggerX:388,triggerY:624,triggerRadius:108}];
path(h1,pt(410,720),pt(408,470),pt(180,310));trap(h1,"gate-pop");

// The ambush itself is the lesson: once the bumper wakes up, a very precise escape line exists.
const h2=base("troll",2,pt(420,832),pt(112,164),2,4,"bumper");
h2.walls=[r(28,596,252,24),r(254,334,258,24)];
h2.bumpers=[{x:280,y:500,r:34}];
h2.popBumpers=[{x:394,y:432,r:36,triggerX:342,triggerY:516,triggerRadius:112}];
path(h2,pt(112,710),pt(112,510),pt(410,420),pt(410,264));trap(h2,"bumper-ambush");

// False safe lane: after crossing under the divider, an upper gate forces a second decision.
const h3=base("troll",3,pt(420,840),pt(116,150),3,5,"void");
h3.walls=[r(246,282,26,430),r(28,490,168,24)];
h3.popVoids=[{x:300,y:500,w:190,h:140,triggerX:388,triggerY:678,triggerRadius:122}];
path(h3,pt(184,760),pt(218,650),pt(218,455),pt(116,360),pt(116,150));trap(h3,"safe-lane-collapse");

// Cross-gate: a second shutter appears later, so solving the first joke is not the whole hole.
const h4=base("troll",4,pt(270,844),pt(270,142),3,5,"wall");
h4.walls=[r(28,650,322,24),r(190,414,322,24)];
h4.popWalls=[
  {x:28,y:294,w:318,h:24,triggerX:118,triggerY:486,triggerRadius:118},
  {x:118,y:438,w:24,h:158,triggerX:414,triggerY:540,triggerRadius:108}
];
path(h4,pt(420,718),pt(420,520),pt(160,390),pt(410,250),pt(270,142));trap(h4,"cross-gate");

// First combined exam. Three clean strokes is genuine mastery; extra strokes remain forgiving.
const h5=base("troll",5,pt(96,842),pt(432,142),3,5,"bumper");
h5.walls=[r(28,676,300,24),r(214,448,298,24),r(28,252,304,24)];
h5.bumpers=[{x:414,y:566,r:34}];
h5.popBumpers=[{x:126,y:342,r:34,triggerX:138,triggerY:492,triggerRadius:112}];
h5.popWalls=[{x:330,y:224,w:182,h:22,triggerX:350,triggerY:326,triggerRadius:96}];
path(h5,pt(414,736),pt(414,566),pt(128,516),pt(126,342),pt(410,210));trap(h5,"late-combo");

export const HARD_AUTHORED:LevelDefinition[]=[h1,h2,h3,h4,h5];
