import type { LevelDefinition } from "../../types";
import { base, path, pt, r } from "./authoring";

/** New authored campaign: every hole has its own silhouette and strategic question. */
const c1=base("classic",1,pt(145,820),pt(388,188),1,2,"wall");
path(c1,pt(270,500));

// First bank-shot puzzle. A very precise HIO is a legitimate mastery line.
const c2=base("classic",2,pt(118,824),pt(414,176),2,3,"wall");
c2.walls=[r(210,500,302,26)];
path(c2,pt(145,610),pt(455,455));

// Island: choose which side to commit to.
const c3=base("classic",3,pt(270,830),pt(270,158),2,3,"wall");
c3.walls=[r(194,390,152,184)];
path(c3,pt(150,650),pt(150,320),pt(270,158));

// First real setup hole: alternating gates are intentionally tighter than 02/03.
const c4=base("classic",4,pt(96,834),pt(430,150),3,4,"wall");
c4.walls=[r(28,608,358,26),r(128,360,384,26),r(322,470,24,82)];
path(c4,pt(430,690),pt(430,548),pt(102,470),pt(102,285),pt(430,150));

// Bumper gate: the sides remain physically passable, but the clean 2-stroke line uses the bumper.
const c5=base("classic",5,pt(150,836),pt(390,158),2,4,"bumper");
c5.walls=[r(28,500,130,24),r(382,500,130,24),r(326,278,24,132)];
c5.bumpers=[{x:270,y:512,r:32}];
path(c5,pt(252,650),pt(270,512),pt(390,410),pt(390,158));

// Vertical weave: different reading from the horizontal gates of 04.
const c6=base("classic",6,pt(104,834),pt(408,166),3,5,"wall");
c6.walls=[r(188,548,24,244),r(342,310,24,224),r(76,402,178,24)];
path(c6,pt(430,720),pt(430,570),pt(286,520),pt(286,360),pt(408,166));

// Sand lesson: the first shot is about where the sand leaves you, not raw power.
const c7=base("classic",7,pt(270,842),pt(430,148),2,4,"sand");
c7.sand=[r(166,434,208,286)];
c7.walls=[r(28,340,350,24)];
path(c7,pt(320,650),pt(350,455),pt(430,315),pt(430,148));

// Two ice lanes force a switchback instead of one full-power diagonal.
const c8=base("classic",8,pt(430,834),pt(108,158),3,5,"ice");
c8.ice=[r(304,620,168,112),r(68,334,166,112)];
c8.walls=[r(252,520,24,250),r(268,246,24,222),r(28,500,166,24)];
path(c8,pt(390,660),pt(390,540),pt(210,482),pt(150,390),pt(108,158));

// Timing gate. 3★ allows a setup stroke because the 2-shot solver line is very tight.
const c9=base("classic",9,pt(102,836),pt(430,158),3,5,"moving");
c9.walls=[r(28,646,254,22),r(260,324,252,22)];
c9.movingWalls=[{x:172,y:482,w:196,h:24,axis:"x",amplitude:108,speed:1.08,phase:.35}];
path(c9,pt(420,700),pt(420,550),pt(112,430),pt(110,270));

// Chapter exam: two purposeful bumper decisions; optimum is 2 but mastery target is 3.
const c10=base("classic",10,pt(270,850),pt(270,132),3,5,"bumper");
c10.walls=[r(28,666,318,24),r(194,438,318,24),r(28,252,300,24)];
c10.bumpers=[{x:416,y:558,r:34},{x:126,y:342,r:34}];
path(c10,pt(418,730),pt(416,558),pt(130,505),pt(126,342),pt(390,220));

export const CLASSIC_AUTHORED:LevelDefinition[]=[c1,c2,c3,c4,c5,c6,c7,c8,c9,c10];
