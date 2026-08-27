import type { LevelDefinition } from "../../types";
import { base, path, pt, r, trap } from "./authoring";

/**
 * HARD block 1: every hole trolls from the first attempt.
 * The surprise escalates, but every trap is deterministic and readable after reveal.
 */

// 01 — The obvious lane closes as you commit to it. Second attempt: use the left bank.
const h1=base("troll",1,pt(126,836),pt(420,160),2,3,"wall");
h1.walls=[r(246,382,24,310)];
h1.popWalls=[{x:286,y:548,w:198,h:24,triggerX:384,triggerY:650,triggerRadius:118}];
path(h1,pt(426,720),pt(426,470),pt(184,310),pt(420,160));trap(h1,"gate-pop");

// 02 — The comfortable landing zone grows teeth. Learn to miss the ambush on purpose.
const h2=base("troll",2,pt(420,840),pt(110,160),2,3,"bumper");
h2.walls=[r(28,612,258,24),r(254,330,258,24)];
h2.popBumpers=[{x:360,y:492,r:38,triggerX:332,triggerY:610,triggerRadius:116}];
path(h2,pt(120,716),pt(120,520),pt(410,410),pt(110,160));trap(h2,"bumper-ambush");

// 03 — The short route literally disappears. The learned route goes around the left shoulder.
const h3=base("troll",3,pt(420,844),pt(112,150),3,4,"void");
h3.walls=[r(246,296,26,408),r(28,486,164,24)];
h3.popVoids=[{x:286,y:500,w:198,h:146,triggerX:390,triggerY:686,triggerRadius:126}];
path(h3,pt(184,760),pt(208,640),pt(208,448),pt(112,334),pt(112,150));trap(h3,"safe-lane-collapse");

// 04 — Two-stage joke: solving the first shutter reveals a second one later in the route.
const h4=base("troll",4,pt(270,848),pt(270,144),3,4,"wall");
h4.walls=[r(28,664,308,24),r(204,420,308,24)];
h4.popWalls=[
  {x:28,y:294,w:310,h:24,triggerX:116,triggerY:492,triggerRadius:116},
  {x:118,y:438,w:24,h:158,triggerX:408,triggerY:552,triggerRadius:108}
];
path(h4,pt(420,730),pt(420,534),pt(158,392),pt(408,250),pt(270,144));trap(h4,"cross-gate");

// 05 — First combined exam. A moving gate telegraphs timing, then a late pop-bumper punishes the obvious finish.
const h5=base("troll",5,pt(96,848),pt(430,140),4,5,"moving");
h5.walls=[r(28,682,286,24),r(228,456,284,24),r(28,250,286,24)];
h5.movingWalls=[{x:310,y:564,w:150,h:24,axis:"x",amplitude:54,speed:1.2,phase:.4}];
h5.popBumpers=[{x:126,y:342,r:36,triggerX:142,triggerY:500,triggerRadius:112}];
h5.popWalls=[{x:360,y:224,w:92,h:22,triggerX:350,triggerY:324,triggerRadius:94}];
path(h5,pt(404,742),pt(398,582),pt(138,514),pt(126,342),pt(404,210),pt(430,140));trap(h5,"late-combo");

export const HARD_AUTHORED:LevelDefinition[]=[h1,h2,h3,h4,h5];
