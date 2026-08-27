import type { LevelDefinition } from "../../types";
import { base, path, pt, r } from "./authoring";

/**
 * Campaign reboot. Every hole is authored as its own puzzle; there is deliberately no
 * procedural fallback. Difficulty is curated in small batches and verified by the solver.
 */
const c1=base("classic",1,pt(145,820),pt(388,188),1,2,"wall");
path(c1,pt(270,500));

const c2=base("classic",2,pt(118,824),pt(414,176),2,3,"wall");
c2.walls=[r(210,500,302,26)];
path(c2,pt(145,610),pt(455,455));

const c3=base("classic",3,pt(270,830),pt(270,158),2,3,"wall");
c3.walls=[r(194,390,152,184)];
path(c3,pt(150,650),pt(150,320),pt(270,158));

const c4=base("classic",4,pt(96,834),pt(430,150),3,4,"wall");
c4.walls=[r(28,608,310,26),r(176,360,336,26)];
path(c4,pt(410,690),pt(430,520),pt(130,455),pt(118,285));

const c5=base("classic",5,pt(270,838),pt(270,154),2,4,"bumper");
c5.walls=[r(156,344,26,294),r(358,344,26,294)];
c5.bumpers=[{x:270,y:486,r:38}];
path(c5,pt(270,670),pt(270,486),pt(270,280));

const c6=base("classic",6,pt(104,834),pt(408,166),3,5,"wall");
c6.walls=[r(82,566,310,24),r(220,324,292,24),r(366,410,24,112)];
path(c6,pt(438,680),pt(438,520),pt(176,470),pt(170,250));

const c7=base("classic",7,pt(270,842),pt(270,148),2,4,"sand");
c7.sand=[r(178,390,184,286)];
c7.walls=[r(28,330,216,24),r(296,330,216,24)];
path(c7,pt(270,700),pt(270,390),pt(270,270));

const c8=base("classic",8,pt(430,834),pt(108,158),3,5,"ice");
c8.ice=[r(60,458,420,136)];
c8.walls=[r(28,398,278,24),r(220,620,292,24)];
path(c8,pt(150,690),pt(140,540),pt(418,430),pt(420,300));

const c9=base("classic",9,pt(102,836),pt(430,158),3,5,"moving");
c9.walls=[r(28,646,254,22),r(260,324,252,22)];
c9.movingWalls=[{x:172,y:482,w:196,h:24,axis:"x",amplitude:108,speed:1.08,phase:.35}];
path(c9,pt(420,700),pt(420,550),pt(112,430),pt(110,270));

const c10=base("classic",10,pt(270,850),pt(270,132),4,6,"bumper");
c10.walls=[r(28,666,318,24),r(194,438,318,24),r(28,252,300,24)];
c10.bumpers=[{x:416,y:558,r:34},{x:126,y:342,r:34}];
path(c10,pt(418,730),pt(416,558),pt(130,505),pt(126,342),pt(390,220));

export const CLASSIC_AUTHORED:LevelDefinition[]=[c1,c2,c3,c4,c5,c6,c7,c8,c9,c10];
