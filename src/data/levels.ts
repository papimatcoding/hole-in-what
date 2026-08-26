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
  // G1 — lectura de trayectoria y rebotes limpios.
  { id:"classic-01", mode:"classic", group:1, ball:{x:270,y:820}, hole:{x:270,y:155},
    threeStar:goal(1), twoStar:goal(2) },

  { id:"classic-02", mode:"classic", group:1, ball:{x:115,y:825}, hole:{x:415,y:160},
    threeStar:goal(2), twoStar:goal(3),
    walls:[r(245,385,22,390)] },

  { id:"classic-03", mode:"classic", group:1, ball:{x:420,y:825}, hole:{x:115,y:155},
    threeStar:goal(2), twoStar:goal(3),
    walls:[r(115,480,300,22)] },

  { id:"classic-04", mode:"classic", group:1, ball:{x:105,y:820}, hole:{x:410,y:170},
    threeStar:goal(2), twoStar:goal(3),
    walls:[r(255,345,22,385)], triangles:[corner("tl",78),corner("br",82)] },

  { id:"classic-05", mode:"classic", group:1, ball:{x:420,y:820}, hole:{x:110,y:160},
    threeStar:goal(2), twoStar:goal(3),
    walls:[r(190,470,260,22)], bumpers:[b(150,570,32)] },

  // G2 — superficies y primeras mecánicas de impulso/profundidad.
  { id:"classic-06", mode:"classic", group:2, ball:{x:120,y:825}, hole:{x:405,y:150},
    threeStar:goal(2), twoStar:goal(4),
    walls:[r(245,310,22,420)], sand:[r(285,500,155,170)] },

  { id:"classic-07", mode:"classic", group:2, ball:{x:425,y:825}, hole:{x:115,y:165},
    threeStar:goal(2), twoStar:goal(4),
    walls:[r(120,455,295,22)], ice:[r(305,505,150,180)], triangles:[corner("tr",76)] },

  { id:"classic-08", mode:"classic", group:2, ball:{x:110,y:825}, hole:{x:425,y:155},
    threeStar:goal(2,12), twoStar:goal(4),
    walls:[r(235,345,22,420)], boosters:[boost(335,590,85,58,0.25,-1,1.05)], triangles:[corner("br",76)] },

  { id:"classic-09", mode:"classic", group:2, ball:{x:105,y:825}, hole:{x:395,y:160},
    threeStar:goal(2,11), twoStar:goal(3),
    voids:[r(55,440,430,92)], ramps:[ramp(325,575,105,82,0,-1,475,125)], triangles:[corner("tr",68)] },

  { id:"classic-10", mode:"classic", group:2, ball:{x:420,y:825}, hole:{x:110,y:160},
    threeStar:goal(2,12), twoStar:goal(3),
    voids:[r(55,430,430,88)], trampolines:[spring(155,585,37,590)], walls:[r(275,585,22,190)] },

  // G3 — combinar sin saturar: una ruta principal y una decisión clara.
  { id:"classic-11", mode:"classic", group:3, ball:{x:400,y:825}, hole:{x:105,y:165},
    threeStar:goal(2), twoStar:goal(4),
    walls:[r(170,545,245,22),r(170,330,22,215)], triangles:[corner("bl",76),corner("tr",76)] },

  { id:"classic-12", mode:"classic", group:3, ball:{x:110,y:820}, hole:{x:425,y:150},
    threeStar:goal(2,10.5), twoStar:goal(4),
    voids:[r(185,455,270,82)], ramps:[ramp(105,575,105,78,0.65,-1,465,135)], walls:[r(315,280,22,170)] },

  { id:"classic-13", mode:"classic", group:3, ball:{x:425,y:820}, hole:{x:115,y:150},
    threeStar:goal(2), twoStar:goal(4),
    walls:[r(330,590,22,235),r(180,360,22,285)], trampolines:[spring(265,520,34,575)] },

  { id:"classic-14", mode:"classic", group:3, ball:{x:120,y:825}, hole:{x:405,y:165},
    threeStar:goal(2,13), twoStar:goal(4),
    ice:[r(125,575,300,120)], walls:[r(255,315,22,230)], triangles:[corner("tl",88),corner("br",88)] },

  { id:"classic-15", mode:"classic", group:3, ball:{x:415,y:825}, hole:{x:115,y:150},
    threeStar:goal(2,11), twoStar:goal(4),
    walls:[r(250,355,22,390)], boosters:[boost(330,645,78,58,-0.9,-0.45,1.12)], ramps:[ramp(125,390,90,70,0,-1,430,90)] },

  // G4 — retos finales con rutas legibles y huecos intencionados.
  { id:"classic-16", mode:"classic", group:4, ball:{x:105,y:830}, hole:{x:425,y:145},
    threeStar:goal(3), twoStar:goal(5),
    walls:[r(115,650,250,22),r(205,455,225,22),r(110,270,240,22)], triangles:[corner("br",72)] },

  { id:"classic-17", mode:"classic", group:4, ball:{x:425,y:825}, hole:{x:115,y:160},
    threeStar:goal(2,12), twoStar:goal(4),
    voids:[r(105,445,320,92)], ramps:[ramp(335,570,90,76,-0.2,-1,500,120)], walls:[r(170,280,22,145)] },

  { id:"classic-18", mode:"classic", group:4, ball:{x:115,y:825}, hole:{x:420,y:150},
    threeStar:goal(2,11), twoStar:goal(4),
    ice:[r(105,620,315,110)], voids:[r(200,365,275,78)], trampolines:[spring(365,515,35,605)] },

  { id:"classic-19", mode:"classic", group:4, ball:{x:420,y:820}, hole:{x:110,y:150},
    threeStar:goal(2), twoStar:goal(4),
    walls:[r(235,390,22,320)], bumpers:[b(360,610,32),b(160,335,32)], triangles:[corner("tr",92),corner("bl",92)] },

  { id:"classic-20", mode:"classic", group:4, ball:{x:105,y:835}, hole:{x:430,y:140},
    threeStar:goal(3,15), twoStar:goal(5),
    walls:[r(175,600,22,245),r(335,340,22,285)], voids:[r(197,505,138,78)],
    ramps:[ramp(365,635,82,70,-0.4,-1,500,130)], triangles:[corner("tl",80),corner("br",88)] }
];

const troll: LevelDefinition[] = [
  // G1 — trampas únicas, fáciles de leer tras verlas una vez.
  { id:"troll-01", mode:"troll", group:1, ball:{x:270,y:820}, hole:{x:270,y:155},
    threeStar:goal(2), twoStar:goal(3),
    popWalls:[popWall(165,445,210,22,270,575,90)] },

  { id:"troll-02", mode:"troll", group:1, ball:{x:420,y:825}, hole:{x:120,y:155},
    threeStar:goal(2), twoStar:goal(3),
    walls:[r(300,300,22,390)], popBumpers:[popBumper(145,505,34,210,615,105)] },

  { id:"troll-03", mode:"troll", group:1, ball:{x:110,y:825}, hole:{x:425,y:160},
    threeStar:goal(2), twoStar:goal(3),
    walls:[r(185,380,22,350)], triangles:[corner("tr",80)], popWalls:[popWall(335,330,22,190,315,535,92)] },

  { id:"troll-04", mode:"troll", group:1, ball:{x:420,y:820}, hole:{x:110,y:160},
    threeStar:goal(2), twoStar:goal(3),
    triangles:[corner("bl",95),corner("tr",78)], popVoids:[popVoid(205,470,180,80,300,590,105)] },

  { id:"troll-05", mode:"troll", group:1, ball:{x:115,y:825}, hole:{x:420,y:155},
    threeStar:goal(2,12), twoStar:goal(4),
    voids:[r(60,435,420,82)], ramps:[ramp(320,570,100,76,0,-1,480,120)], popWalls:[popWall(345,255,22,155,375,445,95)] },

  // G2 — trampas combinadas con superficies, sin dobles cebos innecesarios.
  { id:"troll-06", mode:"troll", group:2, ball:{x:425,y:825}, hole:{x:115,y:155},
    threeStar:goal(2,12), twoStar:goal(4),
    voids:[r(55,430,430,85)], trampolines:[spring(165,585,36,600)], popBumpers:[popBumper(135,315,34,165,470,100)] },

  { id:"troll-07", mode:"troll", group:2, ball:{x:115,y:825}, hole:{x:425,y:155},
    threeStar:goal(2), twoStar:goal(4),
    ice:[r(125,575,290,125)], walls:[r(175,300,22,220)], popWalls:[popWall(330,350,22,205,315,575,100)] },

  { id:"troll-08", mode:"troll", group:2, ball:{x:425,y:825}, hole:{x:115,y:160},
    threeStar:goal(2,11), twoStar:goal(4),
    boosters:[boost(320,625,90,60,-0.8,-0.65,1.12)], walls:[r(220,315,22,260)], popVoids:[popVoid(105,395,170,82,220,535,105)] },

  { id:"troll-09", mode:"troll", group:2, ball:{x:110,y:825}, hole:{x:425,y:150},
    threeStar:goal(2), twoStar:goal(4),
    walls:[r(245,430,22,330)], triangles:[corner("tl",86)], popWalls:[popWall(270,300,160,22,320,470,95)] },

  { id:"troll-10", mode:"troll", group:2, ball:{x:420,y:825}, hole:{x:110,y:150},
    threeStar:goal(2,13), twoStar:goal(4),
    ramps:[ramp(325,585,95,76,-0.55,-1,470,120)], voids:[r(160,445,320,82)], popBumpers:[popBumper(145,315,35,205,455,95)] },

  // G3 — exige recordar el troll y ejecutar una ruta alternativa limpia.
  { id:"troll-11", mode:"troll", group:3, ball:{x:105,y:825}, hole:{x:430,y:160},
    threeStar:goal(2,12), twoStar:goal(4),
    walls:[r(245,540,22,250)], triangles:[corner("tr",92)], popWalls:[popWall(335,300,22,230,325,545,92)] },

  { id:"troll-12", mode:"troll", group:3, ball:{x:425,y:820}, hole:{x:110,y:155},
    threeStar:goal(2,12), twoStar:goal(4),
    voids:[r(55,420,430,82)], trampolines:[spring(365,575,36,610)], popVoids:[popVoid(245,255,160,72,330,420,95)] },

  { id:"troll-13", mode:"troll", group:3, ball:{x:110,y:825}, hole:{x:425,y:150},
    threeStar:goal(2), twoStar:goal(4),
    ice:[r(115,590,300,118)], walls:[r(315,305,22,210)], popVoids:[popVoid(180,395,185,80,255,545,100)] },

  { id:"troll-14", mode:"troll", group:3, ball:{x:420,y:825}, hole:{x:115,y:155},
    threeStar:goal(2,11), twoStar:goal(4),
    boosters:[boost(335,635,82,58,-0.9,-0.5,1.15)], walls:[r(235,345,22,390)], popWalls:[popWall(105,450,155,22,235,565,92)] },

  { id:"troll-15", mode:"troll", group:3, ball:{x:115,y:825}, hole:{x:425,y:155},
    threeStar:goal(3,14), twoStar:goal(5),
    walls:[r(185,565,240,22)], triangles:[corner("tl",88),corner("br",88)],
    popBumpers:[popBumper(365,405,32,320,525,90)] },

  // G4 — combinaciones finales, cada una con un solo momento troll principal.
  { id:"troll-16", mode:"troll", group:4, ball:{x:425,y:825}, hole:{x:110,y:150},
    threeStar:goal(3,14), twoStar:goal(5),
    voids:[r(100,445,330,82)], ramps:[ramp(335,575,92,75,-0.2,-1,505,125)], popWalls:[popWall(165,285,22,170,190,455,95)] },

  { id:"troll-17", mode:"troll", group:4, ball:{x:110,y:825}, hole:{x:425,y:150},
    threeStar:goal(2,12), twoStar:goal(5),
    trampolines:[spring(170,590,36,620)], voids:[r(55,430,430,82)], popVoids:[popVoid(335,260,130,78,355,425,90)] },

  { id:"troll-18", mode:"troll", group:4, ball:{x:420,y:820}, hole:{x:115,y:155},
    threeStar:goal(3), twoStar:goal(5),
    walls:[r(255,520,22,300)], triangles:[corner("tr",95),corner("bl",95)], popBumpers:[popBumper(175,350,35,230,470,95)] },

  { id:"troll-19", mode:"troll", group:4, ball:{x:110,y:825}, hole:{x:425,y:145},
    threeStar:goal(3,13), twoStar:goal(5),
    ice:[r(115,630,300,105)], boosters:[boost(320,490,90,58,0.75,-0.7,1.12)], popVoids:[popVoid(275,300,170,78,350,470,100)] },

  { id:"troll-20", mode:"troll", group:4, ball:{x:105,y:835}, hole:{x:430,y:140},
    threeStar:goal(3,15), twoStar:goal(5),
    walls:[r(175,600,22,245),r(335,340,22,285)], triangles:[corner("tl",82),corner("br",90)],
    ramps:[ramp(365,635,82,70,-0.45,-1,510,130)], voids:[r(197,505,138,78)],
    popVoids:[popVoid(285,245,160,72,360,385,92)], popWalls:[popWall(120,420,130,22,230,545,95)] }
];

export const LEVELS: LevelDefinition[] = [...classic, ...troll];

export function levelsForMode(mode: GameMode): LevelDefinition[] {
  return LEVELS.filter((level) => level.mode === mode);
}
