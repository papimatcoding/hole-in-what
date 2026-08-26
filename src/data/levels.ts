import type { GameMode, LevelDefinition, TriangleDef } from "../types";

const r = (x:number,y:number,w:number,h:number) => ({ x,y,w,h });
const b = (x:number,y:number,radius:number) => ({ x,y,r:radius });
const t = (ax:number,ay:number,bx:number,by:number,cx:number,cy:number): TriangleDef => ({
  a:{x:ax,y:ay}, b:{x:bx,y:by}, c:{x:cx,y:cy}
});
const boost = (x:number,y:number,w:number,h:number,dx:number,dy:number,power=1) => ({ x,y,w,h,dx,dy,power });
const ramp = (x:number,y:number,w:number,h:number,dx:number,dy:number,lift=450,boostPower=110) => ({ x,y,w,h,dx,dy,lift,boost:boostPower });
const spring = (x:number,y:number,radius:number,power=565) => ({ x,y,r:radius,power });
const popWall = (x:number,y:number,w:number,h:number,triggerX:number,triggerY:number,triggerRadius:number) => ({
  x,y,w,h,triggerX,triggerY,triggerRadius
});
const popBumper = (x:number,y:number,radius:number,triggerX:number,triggerY:number,triggerRadius:number) => ({
  x,y,r:radius,triggerX,triggerY,triggerRadius
});
const popVoid = (x:number,y:number,w:number,h:number,triggerX:number,triggerY:number,triggerRadius:number) => ({
  x,y,w,h,triggerX,triggerY,triggerRadius
});
const goal = (maxStrokes?:number, seconds?:number) => ({
  ...(maxStrokes !== undefined ? { maxStrokes } : {}),
  ...(seconds !== undefined ? { maxTimeMs: Math.round(seconds * 1000) } : {})
});

const FIELD = { left:28, right:512, top:28, bottom:932 };
const corner = (where:"tl"|"tr"|"bl"|"br", size=72): TriangleDef => {
  if (where === "tl") return t(FIELD.left,FIELD.top,FIELD.left+size,FIELD.top,FIELD.left,FIELD.top+size);
  if (where === "tr") return t(FIELD.right,FIELD.top,FIELD.right-size,FIELD.top,FIELD.right,FIELD.top+size);
  if (where === "bl") return t(FIELD.left,FIELD.bottom,FIELD.left+size,FIELD.bottom,FIELD.left,FIELD.bottom-size);
  return t(FIELD.right,FIELD.bottom,FIELD.right-size,FIELD.bottom,FIELD.right,FIELD.bottom-size);
};

const classic: LevelDefinition[] = [
  // G1 — fundamentos. Cada hoyo añade una sola idea.
  { id:"classic-01", mode:"classic", group:1, ball:{x:270,y:820}, hole:{x:270,y:155},
    threeStar:goal(1), twoStar:goal(2),
    fairways:[r(210,105,120,760)] },

  { id:"classic-02", mode:"classic", group:1, ball:{x:110,y:825}, hole:{x:420,y:160},
    threeStar:goal(2), twoStar:goal(3),
    fairways:[r(70,690,390,150),r(355,135,105,565)],
    walls:[r(248,350,24,430)] },

  { id:"classic-03", mode:"classic", group:1, ball:{x:425,y:825}, hole:{x:115,y:155},
    threeStar:goal(2), twoStar:goal(3),
    fairways:[r(370,490,100,350),r(75,130,395,115)],
    walls:[r(105,485,315,24)] },

  { id:"classic-04", mode:"classic", group:1, ball:{x:105,y:825}, hole:{x:410,y:165},
    threeStar:goal(2), twoStar:goal(3),
    fairways:[r(70,730,360,110),r(340,145,110,600)],
    walls:[r(245,355,24,405),r(269,355,150,24)],
    triangles:[corner("br",82)] },

  { id:"classic-05", mode:"classic", group:1, ball:{x:420,y:825}, hole:{x:105,y:160},
    threeStar:goal(2), twoStar:goal(4),
    fairways:[r(365,500,105,340),r(70,135,400,110)],
    walls:[r(105,480,275,24)],
    bumpers:[b(420,525,31)] },

  // G2 — superficies y profundidad, introducidas una a una.
  { id:"classic-06", mode:"classic", group:2, ball:{x:115,y:825}, hole:{x:405,y:150},
    threeStar:goal(2), twoStar:goal(4),
    fairways:[r(70,700,380,140),r(350,130,105,590),r(75,130,285,105)],
    walls:[r(242,315,24,410)],
    sand:[r(285,520,150,165)] },

  { id:"classic-07", mode:"classic", group:2, ball:{x:425,y:825}, hole:{x:115,y:165},
    threeStar:goal(2), twoStar:goal(4),
    fairways:[r(365,470,105,370),r(75,140,390,110)],
    walls:[r(105,455,305,24)],
    ice:[r(365,505,105,185)],
    triangles:[corner("tr",76)] },

  { id:"classic-08", mode:"classic", group:2, ball:{x:110,y:825}, hole:{x:425,y:155},
    threeStar:goal(2,13), twoStar:goal(4),
    fairways:[r(70,700,390,140),r(350,130,105,590)],
    walls:[r(235,335,24,365)],
    boosters:[boost(345,590,82,58,0.05,-1,1.05)],
    triangles:[corner("br",78)] },

  { id:"classic-09", mode:"classic", group:2, ball:{x:105,y:825}, hole:{x:400,y:160},
    threeStar:goal(2,13), twoStar:goal(3),
    fairways:[r(65,690,390,145),r(325,125,115,455)],
    voids:[r(55,435,430,92)],
    ramps:[ramp(315,555,115,84,0,-1,490,130)],
    walls:[r(180,610,24,170)],
    triangles:[corner("tr",68)] },

  { id:"classic-10", mode:"classic", group:2, ball:{x:420,y:825}, hole:{x:110,y:160},
    threeStar:goal(3,15), twoStar:goal(4),
    fairways:[r(350,700,120,140),r(90,545,290,115),r(70,125,120,330)],
    voids:[r(55,425,430,90)],
    trampolines:[spring(165,575,38,610)],
    walls:[r(275,565,24,210),r(275,265,24,140)] },

  // G3 — corredores. Dos ideas como máximo y cada objeto abre o cierra una ruta.
  { id:"classic-11", mode:"classic", group:3, ball:{x:400,y:825}, hole:{x:105,y:165},
    threeStar:goal(3), twoStar:goal(5),
    fairways:[r(365,615,105,225),r(155,545,315,95),r(145,330,105,235),r(75,135,330,110)],
    walls:[r(145,540,275,24),r(145,335,24,205),r(169,335,210,24)],
    triangles:[corner("bl",74),corner("tr",78)] },

  { id:"classic-12", mode:"classic", group:3, ball:{x:110,y:825}, hole:{x:425,y:150},
    threeStar:goal(3,16), twoStar:goal(5),
    fairways:[r(70,690,390,145),r(305,525,130,165),r(335,125,110,335)],
    voids:[r(145,445,330,88)],
    ramps:[ramp(305,555,115,82,0,-1,490,135)],
    walls:[r(115,535,170,24),r(315,270,24,175)] },

  { id:"classic-13", mode:"classic", group:3, ball:{x:425,y:825}, hole:{x:115,y:150},
    threeStar:goal(3,17), twoStar:goal(5),
    fairways:[r(355,690,115,150),r(300,535,140,130),r(75,130,120,315)],
    voids:[r(55,430,430,86)],
    trampolines:[spring(345,575,38,620)],
    walls:[r(220,565,24,210),r(255,250,24,165)] },

  { id:"classic-14", mode:"classic", group:3, ball:{x:115,y:825}, hole:{x:405,y:165},
    threeStar:goal(3,17), twoStar:goal(5),
    fairways:[r(70,700,390,140),r(345,475,110,245),r(90,385,365,110),r(75,140,355,110)],
    walls:[r(105,650,285,24),r(150,405,270,24)],
    ice:[r(345,665,110,150),r(85,385,155,110)],
    triangles:[corner("tl",82),corner("br",82)] },

  { id:"classic-15", mode:"classic", group:3, ball:{x:415,y:825}, hole:{x:115,y:150},
    threeStar:goal(3,16), twoStar:goal(5),
    fairways:[r(345,680,115,160),r(105,565,320,105),r(90,350,130,215),r(75,125,120,225)],
    walls:[r(245,515,24,300),r(195,330,205,24)],
    boosters:[boost(330,650,82,58,-0.9,-0.45,1.10)],
    ramps:[ramp(105,405,100,72,0,-1,445,95)],
    voids:[r(75,300,165,70)] },

  // G4 — recorridos largos y atajos. Ya se espera dominio de lo anterior.
  { id:"classic-16", mode:"classic", group:4, ball:{x:105,y:830}, hole:{x:425,y:145},
    threeStar:goal(4), twoStar:goal(6),
    fairways:[r(70,745,355,95),r(340,555,115,210),r(105,475,350,100),r(75,270,120,225),r(75,125,380,105)],
    walls:[r(105,700,290,24),r(195,510,260,24),r(105,310,275,24)],
    triangles:[corner("br",78),corner("tl",70)] },

  { id:"classic-17", mode:"classic", group:4, ball:{x:425,y:825}, hole:{x:115,y:160},
    threeStar:goal(3,17), twoStar:goal(5),
    fairways:[r(355,680,115,160),r(320,535,125,145),r(75,125,120,330)],
    voids:[r(55,430,430,92)],
    ramps:[ramp(330,555,105,82,-0.18,-1,515,125)],
    walls:[r(220,570,24,205),r(170,255,24,180),r(194,255,190,24)] },

  { id:"classic-18", mode:"classic", group:4, ball:{x:115,y:825}, hole:{x:420,y:150},
    threeStar:goal(3,18), twoStar:goal(5),
    fairways:[r(70,690,390,150),r(100,545,150,150),r(250,250,205,170),r(350,125,105,135)],
    voids:[r(55,430,430,86)],
    trampolines:[spring(165,575,38,625)],
    ice:[r(250,250,205,170)],
    walls:[r(275,535,24,215),r(300,245,24,155)] },

  { id:"classic-19", mode:"classic", group:4, ball:{x:420,y:820}, hole:{x:110,y:150},
    threeStar:goal(4), twoStar:goal(6),
    fairways:[r(350,685,120,155),r(210,545,245,105),r(85,360,260,105),r(75,125,115,250)],
    walls:[r(250,625,205,24),r(105,475,270,24),r(190,280,235,24)],
    bumpers:[b(325,545,31),b(150,370,31)],
    triangles:[corner("tr",88),corner("bl",88)] },

  { id:"classic-20", mode:"classic", group:4, ball:{x:105,y:835}, hole:{x:430,y:140},
    threeStar:goal(4,20), twoStar:goal(6),
    fairways:[r(70,740,365,105),r(330,570,115,180),r(185,485,170,100),r(75,315,300,105),r(340,125,105,210)],
    walls:[r(145,690,250,24),r(185,525,170,24),r(105,355,260,24),r(330,205,24,150)],
    voids:[r(210,560,120,78)],
    ramps:[ramp(335,620,95,72,-0.45,-1,510,125)],
    ice:[r(345,405,95,125)],
    triangles:[corner("tl",76),corner("br",84)] }
];

const troll: LevelDefinition[] = [
  // G1 — una sorpresa clara por hoyo. Descubrir y corregir.
  { id:"troll-01", mode:"troll", group:1, ball:{x:270,y:820}, hole:{x:270,y:155},
    threeStar:goal(2), twoStar:goal(3),
    fairways:[r(205,125,130,720)],
    popWalls:[popWall(165,445,210,24,270,575,90)] },

  { id:"troll-02", mode:"troll", group:1, ball:{x:420,y:825}, hole:{x:120,y:155},
    threeStar:goal(2), twoStar:goal(4),
    fairways:[r(350,665,120,175),r(80,505,390,105),r(75,130,115,390)],
    walls:[r(300,305,24,380)],
    popBumpers:[popBumper(175,505,34,235,615,105)] },

  { id:"troll-03", mode:"troll", group:1, ball:{x:110,y:825}, hole:{x:425,y:160},
    threeStar:goal(3), twoStar:goal(4),
    fairways:[r(70,700,390,140),r(345,130,110,580)],
    walls:[r(185,390,24,340),r(300,300,24,180)],
    popWalls:[popWall(325,535,130,24,320,625,92)] },

  { id:"troll-04", mode:"troll", group:1, ball:{x:420,y:820}, hole:{x:110,y:160},
    threeStar:goal(2,14), twoStar:goal(4),
    fairways:[r(350,630,120,210),r(75,500,395,110),r(75,135,115,375)],
    walls:[r(250,515,24,205)],
    triangles:[corner("bl",88),corner("tr",74)],
    popVoids:[popVoid(120,395,175,82,245,540,105)] },

  { id:"troll-05", mode:"troll", group:1, ball:{x:115,y:825}, hole:{x:420,y:155},
    threeStar:goal(3,16), twoStar:goal(5),
    fairways:[r(70,690,390,150),r(305,535,135,155),r(345,125,100,325)],
    voids:[r(55,430,430,88)],
    ramps:[ramp(305,555,115,82,0,-1,495,130)],
    popWalls:[popWall(330,295,120,24,365,455,98)] },

  // G2 — la trampa altera una mecánica que ya conoces.
  { id:"troll-06", mode:"troll", group:2, ball:{x:425,y:825}, hole:{x:115,y:155},
    threeStar:goal(3,17), twoStar:goal(5),
    fairways:[r(350,690,120,150),r(285,540,155,150),r(75,125,115,330)],
    voids:[r(55,425,430,88)],
    trampolines:[spring(345,575,38,625)],
    walls:[r(220,565,24,205)],
    popBumpers:[popBumper(165,300,34,235,445,100)] },

  { id:"troll-07", mode:"troll", group:2, ball:{x:115,y:825}, hole:{x:425,y:155},
    threeStar:goal(3), twoStar:goal(5),
    fairways:[r(70,690,390,150),r(345,485,110,225),r(95,385,360,105),r(345,125,110,270)],
    walls:[r(105,650,285,24),r(150,405,270,24)],
    ice:[r(345,665,110,145)],
    popWalls:[popWall(325,270,130,24,365,430,98)] },

  { id:"troll-08", mode:"troll", group:2, ball:{x:425,y:825}, hole:{x:115,y:160},
    threeStar:goal(3,16), twoStar:goal(5),
    fairways:[r(350,685,120,155),r(190,555,260,105),r(75,135,120,410)],
    walls:[r(225,325,24,250)],
    boosters:[boost(325,625,90,60,-0.85,-0.55,1.10)],
    popVoids:[popVoid(105,395,170,82,220,535,105)] },

  { id:"troll-09", mode:"troll", group:2, ball:{x:110,y:825}, hole:{x:425,y:150},
    threeStar:goal(3), twoStar:goal(5),
    fairways:[r(70,720,360,120),r(340,515,115,225),r(125,405,330,110),r(95,220,110,205),r(95,125,355,105)],
    walls:[r(240,585,24,245),r(130,405,250,24),r(130,245,24,160)],
    popWalls:[popWall(300,245,24,170,320,445,95)] },

  { id:"troll-10", mode:"troll", group:2, ball:{x:420,y:825}, hole:{x:110,y:150},
    threeStar:goal(3,17), twoStar:goal(5),
    fairways:[r(350,685,120,155),r(300,540,140,150),r(75,125,120,330)],
    ramps:[ramp(315,565,105,80,-0.45,-1,500,125)],
    voids:[r(145,430,340,86)],
    walls:[r(220,570,24,205)],
    popBumpers:[popBumper(160,315,35,225,445,95)] },

  // G3 — rutas alternativas. Tras conocer el troll toca ejecutar.
  { id:"troll-11", mode:"troll", group:3, ball:{x:105,y:825}, hole:{x:430,y:160},
    threeStar:goal(4,18), twoStar:goal(6),
    fairways:[r(70,725,365,115),r(335,535,120,210),r(135,425,320,105),r(95,230,110,205),r(95,125,355,105)],
    walls:[r(235,590,24,240),r(135,425,245,24),r(135,255,24,170)],
    popWalls:[popWall(300,255,24,170,325,455,96)] },

  { id:"troll-12", mode:"troll", group:3, ball:{x:425,y:820}, hole:{x:110,y:155},
    threeStar:goal(3,18), twoStar:goal(5),
    fairways:[r(350,690,120,145),r(290,540,150,150),r(75,125,120,330)],
    voids:[r(55,425,430,86)],
    trampolines:[spring(345,575,38,630)],
    walls:[r(220,565,24,210)],
    popVoids:[popVoid(255,255,165,75,330,415,98)] },

  { id:"troll-13", mode:"troll", group:3, ball:{x:110,y:825}, hole:{x:425,y:150},
    threeStar:goal(3,18), twoStar:goal(5),
    fairways:[r(70,690,390,150),r(340,485,115,225),r(105,365,350,105),r(340,125,115,250)],
    walls:[r(105,645,285,24),r(155,385,265,24)],
    ice:[r(340,665,115,145),r(105,365,165,105)],
    popVoids:[popVoid(270,350,135,78,315,500,100)] },

  { id:"troll-14", mode:"troll", group:3, ball:{x:420,y:825}, hole:{x:115,y:155},
    threeStar:goal(3,17), twoStar:goal(5),
    fairways:[r(350,680,120,160),r(190,555,260,105),r(75,135,120,410)],
    walls:[r(235,350,24,390)],
    boosters:[boost(335,635,82,58,-0.9,-0.5,1.15)],
    popWalls:[popWall(95,455,160,24,235,565,94)] },

  { id:"troll-15", mode:"troll", group:3, ball:{x:115,y:825}, hole:{x:425,y:155},
    threeStar:goal(4,20), twoStar:goal(6),
    fairways:[r(70,715,350,125),r(335,535,120,200),r(145,425,310,105),r(95,235,110,200),r(95,125,355,105)],
    walls:[r(210,595,24,235),r(145,425,245,24),r(145,260,24,165)],
    triangles:[corner("tl",82),corner("br",82)],
    popBumpers:[popBumper(355,355,33,305,475,92)] },

  // G4 — finales. Trampa + ejecución avanzada, pero sin ruido gratuito.
  { id:"troll-16", mode:"troll", group:4, ball:{x:425,y:825}, hole:{x:110,y:150},
    threeStar:goal(4,20), twoStar:goal(6),
    fairways:[r(350,690,120,150),r(315,535,125,155),r(75,125,120,330)],
    voids:[r(55,425,430,88)],
    ramps:[ramp(325,555,105,82,-0.2,-1,515,130)],
    walls:[r(220,565,24,210),r(180,250,24,175)],
    popWalls:[popWall(204,250,175,24,250,430,96)] },

  { id:"troll-17", mode:"troll", group:4, ball:{x:110,y:825}, hole:{x:425,y:150},
    threeStar:goal(4,21), twoStar:goal(6),
    fairways:[r(70,690,390,150),r(95,535,160,155),r(275,250,180,165),r(350,125,105,135)],
    trampolines:[spring(165,575,38,635)],
    voids:[r(55,425,430,88)],
    walls:[r(275,535,24,215),r(300,245,24,155)],
    popVoids:[popVoid(315,250,125,78,355,415,92)] },

  { id:"troll-18", mode:"troll", group:4, ball:{x:420,y:820}, hole:{x:115,y:155},
    threeStar:goal(4), twoStar:goal(6),
    fairways:[r(350,690,120,145),r(215,545,240,105),r(85,355,270,105),r(75,125,120,240)],
    walls:[r(255,620,200,24),r(105,470,265,24),r(190,275,235,24)],
    bumpers:[b(330,545,31),b(155,355,31)],
    triangles:[corner("tr",92),corner("bl",92)],
    popBumpers:[popBumper(360,325,34,300,445,95)] },

  { id:"troll-19", mode:"troll", group:4, ball:{x:110,y:825}, hole:{x:425,y:145},
    threeStar:goal(4,21), twoStar:goal(6),
    fairways:[r(70,690,390,150),r(340,500,115,210),r(145,385,310,105),r(340,125,115,270)],
    walls:[r(105,645,285,24),r(150,405,270,24)],
    ice:[r(340,665,115,145)],
    boosters:[boost(335,515,85,58,0.05,-1,1.12)],
    popVoids:[popVoid(280,300,165,80,350,475,100)] },

  { id:"troll-20", mode:"troll", group:4, ball:{x:105,y:835}, hole:{x:430,y:140},
    threeStar:goal(5,24), twoStar:goal(7),
    fairways:[r(70,745,365,100),r(330,580,115,175),r(185,485,170,105),r(75,315,300,105),r(340,125,105,210)],
    walls:[r(145,695,250,24),r(185,525,170,24),r(105,355,260,24),r(330,205,24,150)],
    voids:[r(210,560,120,78)],
    ramps:[ramp(335,620,95,72,-0.45,-1,520,130)],
    triangles:[corner("tl",78),corner("br",86)],
    popVoids:[popVoid(270,270,160,78,350,420,95)],
    popWalls:[popWall(105,455,145,24,225,555,96)] }
];

export const LEVELS: LevelDefinition[] = [...classic, ...troll];

export function levelsForMode(mode: GameMode): LevelDefinition[] {
  return LEVELS.filter((level) => level.mode === mode);
}
