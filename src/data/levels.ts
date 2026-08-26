import type { GameMode, LevelDefinition } from "../types";

const r = (x:number,y:number,w:number,h:number) => ({ x,y,w,h });
const b = (x:number,y:number,radius:number) => ({ x,y,r:radius });
const t = (ax:number,ay:number,bx:number,by:number,cx:number,cy:number) => ({
  a:{x:ax,y:ay}, b:{x:bx,y:by}, c:{x:cx,y:cy}
});
const boost = (x:number,y:number,w:number,h:number,dx:number,dy:number,power=1) => ({ x,y,w,h,dx,dy,power });
const popWall = (x:number,y:number,w:number,h:number,triggerX:number,triggerY:number,triggerRadius:number) => ({
  x,y,w,h,triggerX,triggerY,triggerRadius
});
const popBumper = (x:number,y:number,radius:number,triggerX:number,triggerY:number,triggerRadius:number) => ({
  x,y,r:radius,triggerX,triggerY,triggerRadius
});

const classic: LevelDefinition[] = [
  { id:"classic-01", mode:"classic", group:1, ball:{x:270,y:820}, hole:{x:270,y:135}, threeStars:1, twoStars:2 },

  { id:"classic-02", mode:"classic", group:1, ball:{x:105,y:830}, hole:{x:430,y:155}, threeStars:1, twoStars:2,
    walls:[r(245,410,20,335)] },

  { id:"classic-03", mode:"classic", group:1, ball:{x:430,y:830}, hole:{x:120,y:160}, threeStars:1, twoStars:2,
    walls:[r(165,495,270,20)] },

  { id:"classic-04", mode:"classic", group:1, ball:{x:100,y:815}, hole:{x:425,y:165}, threeStars:1, twoStars:2,
    triangles:[t(215,610,330,510,330,700)] },

  { id:"classic-05", mode:"classic", group:1, ball:{x:420,y:820}, hole:{x:110,y:150}, threeStars:1, twoStars:2,
    bumpers:[b(330,610,34),b(215,375,31)] },

  { id:"classic-06", mode:"classic", group:2, ball:{x:120,y:830}, hole:{x:400,y:135}, threeStars:1, twoStars:3,
    walls:[r(225,250,20,430)], sand:[r(285,510,160,175)] },

  { id:"classic-07", mode:"classic", group:2, ball:{x:425,y:810}, hole:{x:120,y:175}, threeStars:1, twoStars:3,
    ice:[r(215,515,220,150)], triangles:[t(170,315,300,315,170,455)] },

  { id:"classic-08", mode:"classic", group:2, ball:{x:110,y:830}, hole:{x:430,y:160}, threeStars:2, twoStars:3,
    walls:[r(175,545,235,20),r(130,315,235,20)] },

  { id:"classic-09", mode:"classic", group:2, ball:{x:430,y:825}, hole:{x:100,y:145}, threeStars:2, twoStars:3,
    walls:[r(255,270,20,410)], boosters:[boost(325,620,90,55,-0.75,-0.65,1.05)] },

  { id:"classic-10", mode:"classic", group:2, ball:{x:120,y:820}, hole:{x:420,y:145}, threeStars:2, twoStars:3,
    triangles:[t(195,620,315,535,315,700),t(345,330,455,260,455,420)], bumpers:[b(150,390,29)] },

  { id:"classic-11", mode:"classic", group:3, ball:{x:400,y:830}, hole:{x:100,y:160}, threeStars:2, twoStars:3,
    walls:[r(165,565,250,20),r(165,330,20,235),r(300,250,20,215)] },

  { id:"classic-12", mode:"classic", group:3, ball:{x:110,y:815}, hole:{x:430,y:145}, threeStars:2, twoStars:3,
    ice:[r(120,555,300,125)], bumpers:[b(270,470,36)], walls:[r(330,250,20,175)] },

  { id:"classic-13", mode:"classic", group:3, ball:{x:430,y:820}, hole:{x:120,y:140}, threeStars:2, twoStars:4,
    walls:[r(335,610,20,215),r(180,390,20,275),r(335,205,20,205)] },

  { id:"classic-14", mode:"classic", group:3, ball:{x:120,y:830}, hole:{x:405,y:170}, threeStars:2, twoStars:4,
    sand:[r(190,475,185,165)], triangles:[t(150,310,270,245,270,385),t(325,720,445,645,445,790)] },

  { id:"classic-15", mode:"classic", group:3, ball:{x:415,y:830}, hole:{x:115,y:140}, threeStars:2, twoStars:4,
    walls:[r(245,350,20,400)], boosters:[boost(330,650,75,55,-0.85,-0.52,1.2)], bumpers:[b(150,565,30)] },

  { id:"classic-16", mode:"classic", group:4, ball:{x:100,y:830}, hole:{x:430,y:130}, threeStars:2, twoStars:4,
    walls:[r(120,650,245,20),r(205,470,225,20),r(110,290,240,20)] },

  { id:"classic-17", mode:"classic", group:4, ball:{x:430,y:830}, hole:{x:120,y:160}, threeStars:2, twoStars:4,
    triangles:[t(145,565,270,470,270,660),t(270,470,395,565,270,660)], bumpers:[b(405,330,30)] },

  { id:"classic-18", mode:"classic", group:4, ball:{x:120,y:830}, hole:{x:420,y:145}, threeStars:2, twoStars:4,
    ice:[r(115,650,300,105)], sand:[r(285,310,145,125)], walls:[r(205,430,20,220)] },

  { id:"classic-19", mode:"classic", group:4, ball:{x:420,y:820}, hole:{x:110,y:145}, threeStars:2, twoStars:4,
    bumpers:[b(360,650,31),b(215,505,34),b(355,310,31)], triangles:[t(105,370,175,300,175,440)] },

  { id:"classic-20", mode:"classic", group:4, ball:{x:100,y:840}, hole:{x:435,y:120}, threeStars:3, twoStars:5,
    walls:[r(170,610,20,240),r(335,410,20,300),r(170,245,20,210)],
    triangles:[t(190,610,285,535,285,690),t(355,410,445,340,445,480)],
    ice:[r(205,710,115,95)], sand:[r(205,300,115,105)], boosters:[boost(370,565,65,50,0,-1,1.05)], bumpers:[b(275,470,29)] }
];

const troll: LevelDefinition[] = [
  { id:"troll-01", mode:"troll", group:1, ball:{x:270,y:820}, hole:{x:270,y:135}, threeStars:1, twoStars:2,
    popWalls:[popWall(170,445,200,20,270,575,88)] },

  { id:"troll-02", mode:"troll", group:1, ball:{x:420,y:825}, hole:{x:120,y:140}, threeStars:1, twoStars:2,
    walls:[r(300,255,20,430)], popBumpers:[popBumper(130,520,34,205,660,105)] },

  { id:"troll-03", mode:"troll", group:1, ball:{x:110,y:825}, hole:{x:430,y:135}, threeStars:1, twoStars:2,
    walls:[r(190,215,20,505)], popWalls:[popWall(350,405,20,185,320,530,90)] },

  { id:"troll-04", mode:"troll", group:1, ball:{x:420,y:820}, hole:{x:110,y:150}, threeStars:1, twoStars:2,
    triangles:[t(260,535,350,450,350,620)], popWalls:[popWall(145,345,180,20,245,500,95)] },

  { id:"troll-05", mode:"troll", group:1, ball:{x:115,y:825}, hole:{x:425,y:140}, threeStars:1, twoStars:2,
    triangles:[t(190,565,300,485,300,645)], popBumpers:[popBumper(385,640,31,325,710,95)] },

  { id:"troll-06", mode:"troll", group:2, ball:{x:425,y:825}, hole:{x:115,y:140}, threeStars:1, twoStars:3,
    walls:[r(325,250,20,505)], sand:[r(145,510,145,150)], popWalls:[popWall(190,475,150,20,295,570,90)] },

  { id:"troll-07", mode:"troll", group:2, ball:{x:115,y:825}, hole:{x:425,y:140}, threeStars:1, twoStars:3,
    ice:[r(130,610,285,110)], walls:[r(180,210,20,360)], popBumpers:[popBumper(275,620,33,215,715,90)] },

  { id:"troll-08", mode:"troll", group:2, ball:{x:425,y:825}, hole:{x:115,y:140}, threeStars:2, twoStars:3,
    triangles:[t(195,540,310,455,310,625)], popWalls:[popWall(325,465,20,235,330,655,100)], bumpers:[b(395,350,30)] },

  { id:"troll-09", mode:"troll", group:2, ball:{x:115,y:825}, hole:{x:425,y:140}, threeStars:2, twoStars:3,
    boosters:[boost(130,665,85,52,0.8,-0.6,1.15)], sand:[r(235,560,130,150)], popWalls:[popWall(150,405,240,20,290,570,110)] },

  { id:"troll-10", mode:"troll", group:2, ball:{x:105,y:835}, hole:{x:435,y:125}, threeStars:2, twoStars:4,
    walls:[r(175,180,20,590),r(340,235,20,520)], sand:[r(215,575,105,140)], bumpers:[b(275,350,31)],
    popWalls:[popWall(205,470,135,20,275,610,95)], popBumpers:[popBumper(410,300,28,380,430,88)] },

  { id:"troll-11", mode:"troll", group:3, ball:{x:100,y:830}, hole:{x:430,y:155}, threeStars:2, twoStars:3,
    triangles:[t(180,560,300,480,300,650)], popWalls:[popWall(335,300,20,220,330,515,92)] },

  { id:"troll-12", mode:"troll", group:3, ball:{x:430,y:820}, hole:{x:105,y:150}, threeStars:2, twoStars:3,
    ice:[r(145,585,280,125)], bumpers:[b(365,390,31)], popBumpers:[popBumper(170,475,34,235,575,96)] },

  { id:"troll-13", mode:"troll", group:3, ball:{x:110,y:830}, hole:{x:420,y:145}, threeStars:2, twoStars:4,
    sand:[r(170,455,195,165)], walls:[r(320,245,20,205)], popWalls:[popWall(155,335,210,20,260,520,100)] },

  { id:"troll-14", mode:"troll", group:3, ball:{x:420,y:830}, hole:{x:120,y:150}, threeStars:2, twoStars:4,
    boosters:[boost(340,650,75,52,-0.8,-0.6,1.15)], walls:[r(235,350,20,380)], popWalls:[popWall(115,470,150,20,240,580,92)] },

  { id:"troll-15", mode:"troll", group:3, ball:{x:115,y:830}, hole:{x:425,y:145}, threeStars:2, twoStars:4,
    triangles:[t(180,610,300,520,300,700),t(335,360,450,285,450,435)],
    popBumpers:[popBumper(370,615,31,305,700,88),popBumper(150,350,29,210,470,88)] },

  { id:"troll-16", mode:"troll", group:4, ball:{x:430,y:830}, hole:{x:110,y:145}, threeStars:2, twoStars:4,
    walls:[r(335,590,20,235),r(180,385,20,270)], popWalls:[popWall(200,300,185,20,275,455,95)] },

  { id:"troll-17", mode:"troll", group:4, ball:{x:110,y:830}, hole:{x:430,y:145}, threeStars:2, twoStars:4,
    ice:[r(115,650,300,110)], triangles:[t(235,450,345,370,345,535)], popWalls:[popWall(355,235,20,165,360,405,82)] },

  { id:"troll-18", mode:"troll", group:4, ball:{x:420,y:820}, hole:{x:120,y:145}, threeStars:2, twoStars:4,
    bumpers:[b(365,660,31),b(230,515,34)], popWalls:[popWall(130,355,230,20,250,515,100)], triangles:[t(355,300,445,235,445,370)] },

  { id:"troll-19", mode:"troll", group:4, ball:{x:110,y:830}, hole:{x:430,y:135}, threeStars:2, twoStars:4,
    boosters:[boost(125,665,90,55,0.72,-0.7,1.2)], walls:[r(250,420,20,310)], popBumpers:[popBumper(390,430,34,335,545,95)] },

  { id:"troll-20", mode:"troll", group:4, ball:{x:105,y:840}, hole:{x:435,y:120}, threeStars:3, twoStars:5,
    walls:[r(170,610,20,240),r(340,410,20,300)], triangles:[t(190,610,285,535,285,690),t(360,410,450,340,450,480)],
    ice:[r(205,710,115,95)], sand:[r(205,300,115,105)], boosters:[boost(370,565,65,50,0,-1,1.05)], bumpers:[b(275,470,29)],
    popWalls:[popWall(190,375,150,20,280,500,92)], popBumpers:[popBumper(410,250,28,385,365,82)] }
];

export const LEVELS: LevelDefinition[] = [...classic, ...troll];

export function levelsForMode(mode: GameMode): LevelDefinition[] {
  return LEVELS.filter((level) => level.mode === mode);
}
