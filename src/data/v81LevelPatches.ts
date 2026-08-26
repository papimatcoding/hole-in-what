import type {
  CurveDef,
  FanDef,
  LevelDefinition,
  MovingBumperDef,
  MovingWallDef,
  PortalPairDef,
  RectDef,
  TriangleDef
} from "../types";

const r = (x:number,y:number,w:number,h:number): RectDef => ({ x,y,w,h });
const fan = (x:number,y:number,w:number,h:number,dx:number,dy:number,strength=300): FanDef => ({ x,y,w,h,dx,dy,strength });
const portal = (ax:number,ay:number,bx:number,by:number,radius=28): PortalPairDef => ({ a:{x:ax,y:ay,r:radius}, b:{x:bx,y:by,r:radius} });
const ramp = (x:number,y:number,w:number,h:number,dx:number,dy:number,lift=405,boost=60) => ({x,y,w,h,dx,dy,lift,boost});
const spring = (x:number,y:number,radius=36,power=510) => ({x,y,r:radius,power});
const bump = (x:number,y:number,radius=31) => ({x,y,r:radius});
const movingWall = (x:number,y:number,w:number,h:number,axis:"x"|"y",amplitude:number,speed=1.15,phase=0): MovingWallDef => ({x,y,w,h,axis,amplitude,speed,phase});
const movingBumper = (x:number,y:number,radius:number,axis:"x"|"y",amplitude:number,speed=1.3,phase=0): MovingBumperDef => ({x,y,r:radius,axis,amplitude,speed,phase});
const curve = (x:number,y:number,radius:number,startDeg:number,endDeg:number,thickness=22): CurveDef => ({
  x,y,r:radius,startAngle:startDeg*Math.PI/180,endAngle:endDeg*Math.PI/180,thickness
});
const tri = (ax:number,ay:number,bx:number,by:number,cx:number,cy:number): TriangleDef => ({a:{x:ax,y:ay},b:{x:bx,y:by},c:{x:cx,y:cy}});
const popWall = (x:number,y:number,w:number,h:number,triggerX:number,triggerY:number,triggerRadius=92) => ({x,y,w,h,triggerX,triggerY,triggerRadius});
const popBumper = (x:number,y:number,radius:number,triggerX:number,triggerY:number,triggerRadius=92) => ({x,y,r:radius,triggerX,triggerY,triggerRadius});
const popVoid = (x:number,y:number,w:number,h:number,triggerX:number,triggerY:number,triggerRadius=96) => ({x,y,w,h,triggerX,triggerY,triggerRadius});
const goal = (maxStrokes:number, seconds?:number) => ({maxStrokes,...(seconds!==undefined?{maxTimeMs:Math.round(seconds*1000)}:{})});

const empty = {
  fairways:[], walls:[], triangles:[], curves:[], movingWalls:[], movingBumpers:[],
  sand:[], ice:[], boosters:[], fans:[], winds:[], portals:[], ramps:[], trampolines:[],
  voids:[], bumpers:[], popWalls:[], popBumpers:[], popVoids:[]
};

const PATCHES: Record<string, Partial<LevelDefinition>> = {
  // CLASSIC 1–5 · trajectory fundamentals.
  "classic-01": {...empty, ball:{x:270,y:820}, hole:{x:270,y:160}, threeStar:goal(1), twoStar:goal(2)},

  "classic-02": {...empty, ball:{x:105,y:825}, hole:{x:420,y:160}, threeStar:goal(2), twoStar:goal(3),
    walls:[r(245,355,24,425)]},

  "classic-03": {...empty, ball:{x:420,y:825}, hole:{x:105,y:155}, threeStar:goal(2), twoStar:goal(3),
    walls:[r(95,500,300,24),r(395,500,24,210)]},

  "classic-04": {...empty, ball:{x:105,y:825}, hole:{x:410,y:160}, threeStar:goal(2), twoStar:goal(4),
    walls:[r(210,590,260,24),r(210,365,24,225)], triangles:[tri(28,932,115,932,28,845)]},

  "classic-05": {...empty, ball:{x:420,y:825}, hole:{x:105,y:160}, threeStar:goal(2), twoStar:goal(4),
    walls:[r(105,500,285,24)], bumpers:[bump(420,545,32)]},

  // CLASSIC 6–10 · surfaces, fan, curve, portal.
  "classic-06": {...empty, ball:{x:110,y:825}, hole:{x:410,y:155}, threeStar:goal(2), twoStar:goal(4),
    walls:[r(245,350,24,400)], sand:[r(285,540,150,150)]},

  "classic-07": {...empty, ball:{x:420,y:825}, hole:{x:110,y:160}, threeStar:goal(2), twoStar:goal(4),
    walls:[r(105,465,310,24)], ice:[r(325,525,145,190)]},

  "classic-08": {...empty, ball:{x:105,y:825}, hole:{x:420,y:155}, threeStar:goal(2,15), twoStar:goal(4),
    walls:[r(235,335,24,380)], fans:[fan(280,545,170,180,0.9,-0.35,330)]},

  "classic-09": {...empty, ball:{x:420,y:825}, hole:{x:110,y:160}, threeStar:goal(2), twoStar:goal(4),
    walls:[r(270,560,24,225)], curves:[curve(240,365,145,5,100,24)]},

  "classic-10": {...empty, ball:{x:110,y:825}, hole:{x:420,y:160}, threeStar:goal(2,15), twoStar:goal(4),
    walls:[r(28,470,310,24),r(338,470,174,24)], portals:[portal(155,600,385,350,30)]},

  // CLASSIC 11–15 · movement and controlled 3D routes.
  "classic-11": {...empty, ball:{x:420,y:825}, hole:{x:110,y:155}, threeStar:goal(3,18), twoStar:goal(5),
    walls:[r(90,600,315,24),r(125,315,300,24)], movingWalls:[movingWall(255,430,24,150,"x",85,1.05)]},

  "classic-12": {...empty, ball:{x:105,y:825}, hole:{x:420,y:155}, threeStar:goal(3,18), twoStar:goal(5),
    walls:[r(180,600,290,24),r(70,350,300,24)], movingBumpers:[movingBumper(270,485,31,"x",105,1.25)]},

  "classic-13": {...empty, ball:{x:105,y:825}, hole:{x:405,y:155}, threeStar:goal(3,18), twoStar:goal(5),
    walls:[r(70,610,205,24),r(310,295,24,155)], voids:[r(55,445,430,82)], ramps:[ramp(315,555,115,78,0,-1,405,55)]},

  "classic-14": {...empty, ball:{x:420,y:825}, hole:{x:110,y:155}, threeStar:goal(3,19), twoStar:goal(5),
    walls:[r(270,585,24,190),r(270,250,24,150)], voids:[r(55,425,430,86)], trampolines:[spring(165,565,38,505)]},

  "classic-15": {...empty, ball:{x:105,y:825}, hole:{x:420,y:150}, threeStar:goal(3,18), twoStar:goal(5),
    walls:[r(210,625,250,24),r(210,345,24,280)], curves:[curve(335,390,105,95,210,22)], fans:[fan(250,470,180,150,0.8,-0.55,300)]},

  // CLASSIC 16–20 · mastery, but each object still has one job.
  "classic-16": {...empty, ball:{x:420,y:825}, hole:{x:105,y:155}, threeStar:goal(3,19), twoStar:goal(5),
    walls:[r(320,650,24,150),r(145,500,200,24),r(145,300,24,200)], curves:[curve(315,300,145,190,285,22)], portals:[portal(395,580,105,390,29)]},

  "classic-17": {...empty, ball:{x:105,y:825}, hole:{x:420,y:150}, threeStar:goal(4,21), twoStar:goal(6),
    walls:[r(145,690,300,24),r(70,520,290,24),r(180,340,290,24)], movingWalls:[movingWall(340,380,24,120,"y",72,1.2)], bumpers:[bump(130,430,31)]},

  "classic-18": {...empty, ball:{x:420,y:825}, hole:{x:105,y:150}, threeStar:goal(4,21), twoStar:goal(6),
    walls:[r(280,670,24,145),r(100,500,205,24),r(250,320,220,24)], ice:[r(315,520,145,150)], fans:[fan(300,500,165,180,-0.8,-0.25,315)]},

  "classic-19": {...empty, ball:{x:105,y:825}, hole:{x:420,y:145}, threeStar:goal(4,22), twoStar:goal(6),
    walls:[r(165,680,285,24),r(90,500,255,24),r(240,300,220,24)], voids:[r(280,535,160,82)], ramps:[ramp(300,625,105,76,0,-1,410,55)], movingBumpers:[movingBumper(180,405,30,"y",65,1.35)]},

  "classic-20": {...empty, ball:{x:105,y:835}, hole:{x:430,y:140}, threeStar:goal(4,23), twoStar:goal(6),
    walls:[r(155,700,300,24),r(70,540,300,24),r(185,370,285,24),r(315,205,24,165)], curves:[curve(165,370,105,260,360,22)], fans:[fan(330,430,125,150,0,-1,310)], portals:[portal(105,455,405,285,28)]},

  // HARD 1–5 · every hole lies to you once.
  "troll-01": {...empty, ball:{x:270,y:825}, hole:{x:270,y:155}, threeStar:goal(3,18), twoStar:goal(5),
    walls:[r(110,525,150,24),r(280,360,150,24)], popWalls:[popWall(165,445,210,24,270,590,95)]},

  "troll-02": {...empty, ball:{x:420,y:825}, hole:{x:110,y:155}, threeStar:goal(3,19), twoStar:goal(5),
    walls:[r(300,590,24,210),r(120,365,250,24)], bumpers:[bump(390,520,31)], popBumpers:[popBumper(165,505,35,230,610,105)]},

  "troll-03": {...empty, ball:{x:105,y:825}, hole:{x:420,y:155}, threeStar:goal(4,21), twoStar:goal(6),
    walls:[r(185,610,24,210),r(185,410,240,24),r(305,245,24,165)], triangles:[tri(512,28,430,28,512,110)], popWalls:[popWall(330,555,130,24,330,655,95)]},

  "troll-04": {...empty, ball:{x:420,y:825}, hole:{x:105,y:155}, threeStar:goal(4,21), twoStar:goal(6),
    walls:[r(245,610,24,190),r(95,400,280,24)], curves:[curve(355,330,105,90,205,22)], popVoids:[popVoid(285,510,150,78,335,640,100)]},

  "troll-05": {...empty, ball:{x:105,y:825}, hole:{x:420,y:155}, threeStar:goal(4,22), twoStar:goal(6),
    walls:[r(190,665,255,24),r(70,510,270,24),r(265,310,190,24)], movingWalls:[movingWall(330,390,24,120,"y",60,1.05)], popWalls:[popWall(340,205,24,145,370,385,95)]},

  // HARD 6–10 · known mechanics plus a trap.
  "troll-06": {...empty, ball:{x:420,y:825}, hole:{x:105,y:150}, threeStar:goal(4,22), twoStar:goal(6),
    walls:[r(285,660,24,150),r(100,505,210,24),r(245,320,225,24)], sand:[r(315,535,140,110)], fans:[fan(290,525,175,160,-0.8,-0.3,340)], popBumpers:[popBumper(155,390,34,230,500,95)]},

  "troll-07": {...empty, ball:{x:105,y:825}, hole:{x:420,y:150}, threeStar:goal(4,22), twoStar:goal(6),
    walls:[r(165,675,285,24),r(75,500,260,24),r(245,310,215,24)], ice:[r(300,535,155,125)], movingBumpers:[movingBumper(180,410,31,"y",75,1.4)], popWalls:[popWall(335,255,24,150,350,430,95)]},

  "troll-08": {...empty, ball:{x:420,y:825}, hole:{x:105,y:150}, threeStar:goal(4,21), twoStar:goal(6),
    walls:[r(275,650,24,165),r(105,485,195,24),r(225,300,240,24)], fans:[fan(300,500,155,165,-1,-0.15,360)], curves:[curve(175,350,95,265,350,22)], popVoids:[popVoid(90,385,145,72,235,520,100)]},

  "troll-09": {...empty, ball:{x:105,y:825}, hole:{x:420,y:150}, threeStar:goal(4,21), twoStar:goal(6),
    walls:[r(170,680,280,24),r(70,520,260,24),r(235,325,225,24)], portals:[portal(385,590,145,395,29)], popWalls:[popWall(245,470,150,24,330,575,100)]},

  "troll-10": {...empty, ball:{x:420,y:825}, hole:{x:105,y:150}, threeStar:goal(4,22), twoStar:goal(6),
    walls:[r(285,670,24,145),r(95,510,215,24),r(250,315,220,24)], curves:[curve(390,510,90,95,200,22)], movingWalls:[movingWall(180,380,24,120,"x",70,1.2)], popBumpers:[popBumper(135,270,34,215,400,95)]},

  // HARD 11–15 · dynamic timing + 3D traps.
  "troll-11": {...empty, ball:{x:105,y:825}, hole:{x:420,y:145}, threeStar:goal(5,25), twoStar:goal(7),
    walls:[r(155,700,300,24),r(70,535,300,24),r(185,360,285,24)], movingWalls:[movingWall(350,390,24,120,"y",80,1.35),movingWall(150,235,140,24,"x",70,1.0,1.5)], popVoids:[popVoid(285,265,150,72,345,430,95)]},

  "troll-12": {...empty, ball:{x:420,y:825}, hole:{x:105,y:145}, threeStar:goal(5,25), twoStar:goal(7),
    walls:[r(280,665,24,150),r(95,505,210,24),r(245,300,225,24)], movingBumpers:[movingBumper(190,405,32,"y",85,1.45),movingBumper(355,555,30,"x",60,1.15,1.4)], popWalls:[popWall(120,245,160,24,215,385,95)]},

  "troll-13": {...empty, ball:{x:105,y:825}, hole:{x:420,y:145}, threeStar:goal(4,23), twoStar:goal(6),
    walls:[r(90,630,190,24),r(310,285,24,155)], voids:[r(55,440,430,82)], ramps:[ramp(310,550,120,78,0,-1,400,50)], fans:[fan(285,540,165,120,0.6,-0.7,330)], popWalls:[popWall(335,230,120,24,365,385,95)]},

  "troll-14": {...empty, ball:{x:420,y:825}, hole:{x:105,y:145}, threeStar:goal(4,24), twoStar:goal(6),
    walls:[r(275,590,24,190),r(275,245,24,150)], voids:[r(55,425,430,86)], trampolines:[spring(165,565,38,500)], movingWalls:[movingWall(320,335,135,24,"x",55,1.15)], popVoids:[popVoid(90,255,135,70,205,395,95)]},

  "troll-15": {...empty, ball:{x:105,y:825}, hole:{x:420,y:145}, threeStar:goal(5,26), twoStar:goal(7),
    walls:[r(165,695,285,24),r(75,525,255,24),r(225,345,235,24)], curves:[curve(145,350,95,270,360,22)], fans:[fan(300,520,155,150,0.9,-0.25,350)], movingBumpers:[movingBumper(345,435,31,"y",65,1.35)], popWalls:[popWall(245,275,150,24,330,430,95)]},

  // HARD 16–20 · genuinely hard final set: long routes + timing + deception.
  "troll-16": {...empty, ball:{x:420,y:835}, hole:{x:105,y:140}, threeStar:goal(5,27), twoStar:goal(7),
    walls:[r(290,705,24,130),r(100,555,215,24),r(245,395,225,24),r(100,225,205,24)], curves:[curve(395,555,100,90,190,22)], movingWalls:[movingWall(170,450,24,120,"y",75,1.25)], portals:[portal(400,650,130,330,28)], popBumpers:[popBumper(350,285,35,300,410,95)]},

  "troll-17": {...empty, ball:{x:105,y:835}, hole:{x:430,y:140}, threeStar:goal(5,28), twoStar:goal(7),
    walls:[r(155,705,300,24),r(70,545,300,24),r(185,385,285,24),r(315,220,24,165)], fans:[fan(325,555,130,145,-0.9,-0.15,370)], movingWalls:[movingWall(140,430,130,24,"x",65,1.35)], popVoids:[popVoid(280,305,160,72,350,455,100)]},

  "troll-18": {...empty, ball:{x:420,y:835}, hole:{x:105,y:140}, threeStar:goal(5,28), twoStar:goal(7),
    walls:[r(285,700,24,135),r(95,550,215,24),r(245,390,225,24),r(95,230,205,24)], curves:[curve(390,550,95,95,205,22),curve(180,300,90,270,355,22)], movingBumpers:[movingBumper(180,465,31,"y",75,1.5),movingBumper(350,320,31,"x",65,1.2,1.2)], popWalls:[popWall(305,195,145,24,350,355,95)]},

  "troll-19": {...empty, ball:{x:105,y:835}, hole:{x:430,y:140}, threeStar:goal(5,29), twoStar:goal(7),
    walls:[r(155,710,300,24),r(70,555,300,24),r(185,395,285,24),r(315,225,24,170)], ice:[r(330,570,125,120)], fans:[fan(320,555,140,155,0,-1,360)], portals:[portal(115,475,410,315,28)], movingWalls:[movingWall(225,310,120,24,"x",65,1.25)], popBumpers:[popBumper(370,215,34,350,350,95)]},

  "troll-20": {...empty, ball:{x:105,y:840}, hole:{x:435,y:135}, threeStar:goal(6,32), twoStar:goal(8),
    walls:[r(150,720,305,24),r(70,575,300,24),r(190,430,280,24),r(70,285,285,24)], curves:[curve(405,575,95,90,190,22),curve(145,350,90,265,355,22)], fans:[fan(315,585,140,135,-0.9,-0.1,380)], portals:[portal(405,500,120,235,29)], movingWalls:[movingWall(250,500,24,120,"y",70,1.35)], movingBumpers:[movingBumper(330,335,32,"x",70,1.45)], popVoids:[popVoid(245,230,150,72,335,385,100)], popWalls:[popWall(90,180,160,24,180,310,95)]}
};

export function applyV81LevelPatch(level: LevelDefinition): LevelDefinition {
  const patch = PATCHES[level.id];
  return patch ? ({...level,...patch} as LevelDefinition) : level;
}
