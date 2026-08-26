import type {
  LevelDefinition,
  PortalPairDef,
  RectDef,
  WindDef
} from "../types";

const r = (x:number,y:number,w:number,h:number): RectDef => ({ x,y,w,h });
const wind = (x:number,y:number,w:number,h:number,dx:number,dy:number,strength=155): WindDef => ({
  x,y,w,h,dx,dy,strength
});
const portal = (ax:number,ay:number,bx:number,by:number,radius=28): PortalPairDef => ({
  a:{x:ax,y:ay,r:radius}, b:{x:bx,y:by,r:radius}
});
const goal = (maxStrokes:number, seconds?:number) => ({
  maxStrokes,
  ...(seconds !== undefined ? { maxTimeMs: Math.round(seconds * 1000) } : {})
});

const PATCHES: Record<string, Partial<LevelDefinition>> = {
  // Classic 9/10: la rampa y el trampolín son la solución del cruce, no decoración.
  "classic-09": {
    threeStar:goal(2,13), twoStar:goal(3),
    walls:[r(170,610,24,190),r(350,255,24,145)],
    voids:[r(55,435,430,94)],
    ramps:[{x:310,y:555,w:120,h:84,dx:0,dy:-1,lift:500,boost:135}],
    triangles:[]
  },
  "classic-10": {
    threeStar:goal(3,15), twoStar:goal(4),
    walls:[r(270,575,24,220),r(270,245,24,155)],
    voids:[r(55,425,430,92)],
    trampolines:[{x:165,y:575,r:39,power:625}]
  },

  // Classic 11: introducción limpia al viento. El viento ayuda a tomar la curva derecha.
  "classic-11": {
    threeStar:goal(3,16), twoStar:goal(5),
    walls:[r(145,600,285,24),r(145,360,24,240),r(169,360,215,24)],
    triangles:[], sand:[], ice:[], boosters:[], ramps:[], trampolines:[], voids:[], bumpers:[],
    winds:[wind(305,625,145,150,0.85,-0.25,170)]
  },

  // Classic 12: portal como única conexión entre las dos mitades del campo.
  "classic-12": {
    threeStar:goal(2,14), twoStar:goal(4),
    walls:[r(28,465,484,26),r(240,210,24,165)],
    triangles:[], sand:[], ice:[], boosters:[], winds:[], ramps:[], trampolines:[], voids:[], bumpers:[],
    portals:[portal(135,610,390,350,30)]
  },

  // Classic 13: controlar hielo bajo viento lateral, sin objetos gratuitos.
  "classic-13": {
    threeStar:goal(3,17), twoStar:goal(5),
    walls:[r(210,555,24,240),r(305,265,24,180)],
    ice:[r(235,500,235,145)],
    winds:[wind(235,500,235,145,-0.75,-0.15,125)],
    portals:[], ramps:[], trampolines:[], voids:[], bumpers:[]
  },

  // Classic 14: circuito en S puramente de lectura y rebote.
  "classic-14": {
    threeStar:goal(3,18), twoStar:goal(5),
    walls:[r(105,675,300,24),r(180,505,290,24),r(70,335,300,24)],
    ice:[r(335,700,120,115)],
    winds:[], portals:[], ramps:[], trampolines:[], voids:[], bumpers:[]
  },

  // Classic 15: el boost alimenta la rampa; la rampa salta el vacío.
  "classic-15": {
    threeStar:goal(3,17), twoStar:goal(5),
    walls:[r(245,570,24,245),r(190,325,215,24)],
    boosters:[{x:330,y:650,w:82,h:58,dx:-0.9,dy:-0.45,power:1.1}],
    ramps:[{x:105,y:405,w:102,h:72,dx:0,dy:-1,lift:455,boost:105}],
    voids:[r(70,300,175,72)],
    winds:[], portals:[], trampolines:[], bumpers:[]
  },

  // Classic 16: recorrido largo sin gimmicks, solo paredes y ejecución.
  "classic-16": {
    threeStar:goal(4,20), twoStar:goal(6),
    walls:[r(150,700,320,24),r(55,535,320,24),r(170,365,310,24),r(70,215,280,24)],
    winds:[], portals:[], sand:[], ice:[], boosters:[], ramps:[], trampolines:[], voids:[], bumpers:[], triangles:[]
  },

  // Classic 17: atajo de rampa sobre vacío; la ruta larga queda por los laterales.
  "classic-17": {
    threeStar:goal(3,17), twoStar:goal(5),
    walls:[r(225,590,24,205),r(165,250,24,185),r(189,250,205,24)],
    voids:[r(70,430,400,94)],
    ramps:[{x:325,y:555,w:110,h:84,dx:-0.15,dy:-1,lift:520,boost:130}],
    winds:[], portals:[], trampolines:[], bumpers:[]
  },

  // Classic 18: el trampolín cruza el vacío y aterriza sobre hielo; de ahí sale la segunda decisión.
  "classic-18": {
    threeStar:goal(3,18), twoStar:goal(5),
    walls:[r(275,545,24,205),r(300,245,24,165)],
    voids:[r(55,430,430,88)],
    trampolines:[{x:165,y:575,r:39,power:635}],
    ice:[r(245,245,215,170)],
    winds:[], portals:[], ramps:[], bumpers:[]
  },

  // Classic 19: bumpers dentro de un corredor con viento; ambos modifican la línea prevista.
  "classic-19": {
    threeStar:goal(4,20), twoStar:goal(6),
    walls:[r(250,625,205,24),r(105,475,270,24),r(190,280,235,24)],
    bumpers:[{x:325,y:545,r:31},{x:150,y:370,r:31}],
    winds:[wind(105,455,270,160,-0.35,-0.75,120)],
    portals:[], ramps:[], trampolines:[], voids:[], ice:[], sand:[]
  },

  // Classic 20: final legible. S de paredes + viento útil + portal como atajo de mastery.
  "classic-20": {
    threeStar:goal(4,20), twoStar:goal(6),
    walls:[r(170,700,300,24),r(55,535,315,24),r(190,370,290,24),r(300,185,24,165)],
    winds:[wind(65,555,300,125,0.9,-0.15,145)],
    portals:[portal(115,325,390,235,29)],
    triangles:[], sand:[], ice:[], boosters:[], ramps:[], trampolines:[], voids:[], bumpers:[]
  },

  // HARD 5/6/10: conservar las mecánicas de salto, pero con función inequívoca.
  "troll-05": {
    threeStar:goal(3,16), twoStar:goal(5),
    walls:[r(205,600,24,180)],
    voids:[r(55,430,430,90)],
    ramps:[{x:310,y:555,w:115,h:82,dx:0,dy:-1,lift:505,boost:130}],
    popWalls:[{x:330,y:295,w:120,h:24,triggerX:365,triggerY:455,triggerRadius:98}]
  },
  "troll-06": {
    threeStar:goal(3,17), twoStar:goal(5),
    walls:[r(220,565,24,210)],
    voids:[r(55,425,430,90)],
    trampolines:[{x:345,y:575,r:39,power:635}],
    popBumpers:[{x:165,y:300,r:34,triggerX:235,triggerY:445,triggerRadius:100}]
  },
  "troll-10": {
    threeStar:goal(3,17), twoStar:goal(5),
    walls:[r(220,570,24,205)],
    ramps:[{x:315,y:565,w:105,h:80,dx:-0.45,dy:-1,lift:510,boost:125}],
    voids:[r(145,430,340,88)],
    popBumpers:[{x:160,y:315,r:35,triggerX:225,triggerY:445,triggerRadius:95}]
  },

  // HARD 11: el viento ofrece la ruta rápida, la pared sorpresa obliga a releerla.
  "troll-11": {
    threeStar:goal(4,19), twoStar:goal(6),
    walls:[r(235,600,24,230),r(135,425,245,24),r(135,255,24,170)],
    winds:[wind(260,610,180,125,-0.75,-0.35,150)],
    portals:[],
    popWalls:[{x:300,y:255,w:24,h:170,triggerX:325,triggerY:455,triggerRadius:96}]
  },

  // HARD 12: portal conocido, pero el destino tiene una zona que puede desaparecer.
  "troll-12": {
    threeStar:goal(3,18), twoStar:goal(5),
    walls:[r(28,465,484,26),r(230,235,24,155)],
    portals:[portal(385,610,135,340,30)],
    winds:[], trampolines:[], ramps:[], voids:[],
    popVoids:[{x:275,y:270,w:135,h:78,triggerX:335,triggerY:410,triggerRadius:95}]
  },

  "troll-13": {
    threeStar:goal(4,20), twoStar:goal(6),
    walls:[r(105,650,285,24),r(155,405,265,24)],
    ice:[r(330,665,125,145)],
    winds:[wind(330,650,125,175,-0.65,-0.25,120)],
    portals:[],
    popVoids:[{x:270,y:350,w:135,h:78,triggerX:315,triggerY:500,triggerRadius:100}]
  },

  "troll-14": {
    threeStar:goal(4,19), twoStar:goal(6),
    walls:[r(235,350,24,390)],
    boosters:[{x:335,y:635,w:82,h:58,dx:-0.9,dy:-0.5,power:1.15}],
    winds:[wind(90,445,165,145,0.65,-0.3,110)],
    portals:[],
    popWalls:[{x:95,y:455,w:160,h:24,triggerX:235,triggerY:565,triggerRadius:94}]
  },

  "troll-15": {
    threeStar:goal(4,20), twoStar:goal(6),
    walls:[r(210,595,24,235),r(145,425,245,24),r(145,260,24,165)],
    portals:[portal(370,545,115,330,28)],
    winds:[],
    popBumpers:[{x:355,y:355,r:33,triggerX:305,triggerY:475,triggerRadius:92}]
  },

  "troll-16": {
    threeStar:goal(4,21), twoStar:goal(6),
    voids:[r(55,425,430,90)],
    ramps:[{x:325,y:555,w:105,h:82,dx:-0.2,dy:-1,lift:520,boost:130}],
    walls:[r(220,565,24,210),r(180,250,24,175)],
    winds:[], portals:[],
    popWalls:[{x:204,y:250,w:175,h:24,triggerX:250,triggerY:430,triggerRadius:96}]
  },

  "troll-17": {
    threeStar:goal(4,21), twoStar:goal(6),
    trampolines:[{x:165,y:575,r:39,power:645}],
    voids:[r(55,425,430,90)],
    walls:[r(275,535,24,215),r(300,245,24,155)],
    winds:[], portals:[],
    popVoids:[{x:315,y:250,w:125,h:78,triggerX:355,triggerY:415,triggerRadius:92}]
  },

  "troll-18": {
    threeStar:goal(4,21), twoStar:goal(6),
    walls:[r(255,620,200,24),r(105,470,265,24),r(190,275,235,24)],
    bumpers:[{x:330,y:545,r:31},{x:155,y:355,r:31}],
    winds:[wind(100,455,270,145,0.35,-0.8,120)],
    portals:[],
    popBumpers:[{x:360,y:325,r:34,triggerX:300,triggerY:445,triggerRadius:95}]
  },

  "troll-19": {
    threeStar:goal(4,22), twoStar:goal(6),
    walls:[r(105,645,285,24),r(150,405,270,24)],
    ice:[r(340,665,115,145)],
    portals:[portal(390,555,115,315,28)],
    winds:[], boosters:[],
    popVoids:[{x:280,y:300,w:165,h:80,triggerX:350,triggerY:475,triggerRadius:100}]
  },

  "troll-20": {
    threeStar:goal(5,25), twoStar:goal(7),
    walls:[r(170,700,300,24),r(55,535,315,24),r(190,370,290,24),r(300,185,24,165)],
    winds:[wind(65,555,300,125,0.85,-0.2,150)],
    portals:[portal(120,325,395,235,29)],
    triangles:[], sand:[], ice:[], boosters:[], ramps:[], trampolines:[], voids:[], bumpers:[],
    popWalls:[{x:324,y:185,w:145,h:24,triggerX:390,triggerY:355,triggerRadius:95}],
    popVoids:[{x:225,y:455,w:135,h:76,triggerX:290,triggerY:585,triggerRadius:95}]
  }
};

export function applyV81LevelPatch(level: LevelDefinition): LevelDefinition {
  const patch = PATCHES[level.id];
  if (!patch) return level;
  return { ...level, ...patch };
}
