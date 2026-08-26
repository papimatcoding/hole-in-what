import type { GameMode, LevelDefinition } from "../types";

const classic: LevelDefinition[] = [
  { id:"classic-01", mode:"classic", group:1, ball:{x:270,y:820}, hole:{x:270,y:135}, threeStars:1, twoStars:2 },
  { id:"classic-02", mode:"classic", group:1, ball:{x:120,y:820}, hole:{x:420,y:140}, threeStars:1, twoStars:2,
    walls:[{x:245,y:285,w:20,h:365}] },
  { id:"classic-03", mode:"classic", group:1, ball:{x:420,y:820}, hole:{x:120,y:140}, threeStars:1, twoStars:2,
    bumpers:[{x:370,y:650,r:32}], walls:[{x:290,y:270,w:20,h:410}] },
  { id:"classic-04", mode:"classic", group:1, ball:{x:110,y:825}, hole:{x:430,y:135}, threeStars:1, twoStars:2,
    walls:[{x:190,y:220,w:20,h:500},{x:190,y:220,w:185,h:20}] },
  { id:"classic-05", mode:"classic", group:1, ball:{x:270,y:825}, hole:{x:270,y:135}, threeStars:1, twoStars:2,
    walls:[{x:105,y:300,w:175,h:20},{x:260,y:520,w:175,h:20}], bumpers:[{x:140,y:665,r:30}] },
  { id:"classic-06", mode:"classic", group:2, ball:{x:110,y:825}, hole:{x:430,y:135}, threeStars:1, twoStars:2,
    walls:[{x:215,y:245,w:20,h:425}], sand:[{x:285,y:525,w:160,h:175}] },
  { id:"classic-07", mode:"classic", group:2, ball:{x:425,y:825}, hole:{x:115,y:140}, threeStars:1, twoStars:2,
    walls:[{x:325,y:250,w:20,h:505}], bumpers:[{x:405,y:680,r:29}] },
  { id:"classic-08", mode:"classic", group:2, ball:{x:115,y:825}, hole:{x:425,y:140}, threeStars:1, twoStars:3,
    walls:[{x:200,y:190,w:20,h:315},{x:330,y:435,w:20,h:310}], bumpers:[{x:275,y:590,r:31}] },
  { id:"classic-09", mode:"classic", group:2, ball:{x:425,y:825}, hole:{x:115,y:140}, threeStars:2, twoStars:3,
    sand:[{x:145,y:470,w:250,h:150}], walls:[{x:235,y:225,w:20,h:220},{x:305,y:600,w:20,h:190}] },
  { id:"classic-10", mode:"classic", group:2, ball:{x:105,y:835}, hole:{x:435,y:125}, threeStars:2, twoStars:3,
    walls:[{x:175,y:180,w:20,h:590},{x:340,y:235,w:20,h:520}], sand:[{x:215,y:575,w:105,h:140}], bumpers:[{x:275,y:350,r:31}] }
];

const troll: LevelDefinition[] = [
  { id:"troll-01", mode:"troll", group:1, ball:{x:270,y:820}, hole:{x:270,y:135}, threeStars:1, twoStars:2,
    popWalls:[{x:170,y:445,w:200,h:20,triggerX:270,triggerY:575,triggerRadius:88}] },
  { id:"troll-02", mode:"troll", group:1, ball:{x:420,y:825}, hole:{x:120,y:140}, threeStars:1, twoStars:2,
    walls:[{x:300,y:255,w:20,h:430}], popBumpers:[{x:130,y:520,r:34,triggerX:205,triggerY:660,triggerRadius:105}] },
  { id:"troll-03", mode:"troll", group:1, ball:{x:110,y:825}, hole:{x:430,y:135}, threeStars:1, twoStars:2,
    walls:[{x:190,y:215,w:20,h:505}], popWalls:[{x:350,y:405,w:20,h:185,triggerX:320,triggerY:530,triggerRadius:90}] },
  { id:"troll-04", mode:"troll", group:1, ball:{x:270,y:825}, hole:{x:270,y:135}, threeStars:1, twoStars:2,
    bumpers:[{x:140,y:670,r:30}], popWalls:[{x:355,y:350,w:20,h:175,triggerX:330,triggerY:610,triggerRadius:92}] },
  { id:"troll-05", mode:"troll", group:1, ball:{x:115,y:825}, hole:{x:425,y:140}, threeStars:1, twoStars:2,
    walls:[{x:220,y:170,w:20,h:635}], popBumpers:[{x:385,y:640,r:31,triggerX:325,triggerY:710,triggerRadius:95}] },
  { id:"troll-06", mode:"troll", group:2, ball:{x:425,y:825}, hole:{x:115,y:140}, threeStars:1, twoStars:3,
    walls:[{x:325,y:250,w:20,h:505}], sand:[{x:145,y:510,w:145,h:150}], popWalls:[{x:190,y:475,w:150,h:20,triggerX:295,triggerY:570,triggerRadius:90}] },
  { id:"troll-07", mode:"troll", group:2, ball:{x:115,y:825}, hole:{x:425,y:140}, threeStars:1, twoStars:3,
    walls:[{x:180,y:210,w:20,h:470},{x:345,y:275,w:20,h:530}], popBumpers:[{x:275,y:620,r:33,triggerX:215,triggerY:715,triggerRadius:90}] },
  { id:"troll-08", mode:"troll", group:2, ball:{x:425,y:825}, hole:{x:115,y:140}, threeStars:2, twoStars:3,
    walls:[{x:205,y:235,w:20,h:470}], popWalls:[{x:325,y:465,w:20,h:235,triggerX:330,triggerY:655,triggerRadius:100}], bumpers:[{x:395,y:350,r:30}] },
  { id:"troll-09", mode:"troll", group:2, ball:{x:115,y:825}, hole:{x:425,y:140}, threeStars:2, twoStars:3,
    sand:[{x:235,y:560,w:130,h:150}], popWalls:[{x:150,y:405,w:240,h:20,triggerX:290,triggerY:570,triggerRadius:110}], bumpers:[{x:400,y:700,r:28}] },
  { id:"troll-10", mode:"troll", group:2, ball:{x:105,y:835}, hole:{x:435,y:125}, threeStars:2, twoStars:4,
    walls:[{x:175,y:180,w:20,h:590},{x:340,y:235,w:20,h:520}], sand:[{x:215,y:575,w:105,h:140}], bumpers:[{x:275,y:350,r:31}], popWalls:[{x:205,y:470,w:135,h:20,triggerX:275,triggerY:610,triggerRadius:95}], popBumpers:[{x:410,y:300,r:28,triggerX:380,triggerY:430,triggerRadius:88}] }
];

export const LEVELS: LevelDefinition[] = [...classic, ...troll];

export function levelsForMode(mode: GameMode): LevelDefinition[] {
  return LEVELS.filter((level) => level.mode === mode);
}
