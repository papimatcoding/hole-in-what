import type { CourseMechanic, LevelDefinition, Vec2 } from "../../types";
import { base, path, pt, r, tri, W } from "./authoring";

function make(index:number,ball:Vec2,hole:Vec2,three:number,two:number,primary:CourseMechanic,route:Vec2[],build:(l:LevelDefinition)=>void):LevelDefinition{
  const l=base("classic",index,ball,hole,three,two,primary);build(l);return path(l,...route);
}

export const CLASSIC_AUTHORED:LevelDefinition[]=[
  // 01–03 · Immediate satisfaction: straight, diagonal, simple bank HIO.
  make(1,pt(270,820),pt(270,180),1,2,"wall",[],()=>{}),
  make(2,pt(120,820),pt(405,190),1,2,"wall",[],()=>{}),
  make(3,pt(115,820),pt(405,185),1,2,"wall",[pt(455,555),pt(455,330)],l=>{l.walls=[r(28,465,310,W)];}),

  // 04–06 · Two-shot thinking, three genuinely different silhouettes.
  make(4,pt(105,820),pt(420,180),2,3,"wall",[pt(410,690),pt(410,330)],l=>{
    l.walls=[r(245,390,W,335),r(245,390,145,W)];l.triangles=[tri(245,390,305,390,245,450)];
  }),
  make(5,pt(270,820),pt(115,175),2,3,"wall",[pt(405,650),pt(405,445),pt(205,340)],l=>{
    l.walls=[r(215,520,110,W),r(215,610,110,W),r(215,520,W,114),r(301,520,W,114),r(105,315,220,W)];
  }),
  make(6,pt(420,820),pt(125,180),2,3,"wall",[pt(295,675),pt(145,515),pt(145,300)],l=>{
    l.walls=[r(345,455,W,245),r(170,430,175,W),r(90,285,240,W)];
    l.triangles=[tri(345,455,287,455,345,513),tri(170,430,228,430,170,372)];
  }),

  // 07 · Bumper: optional aggressive line versus safe placement.
  make(7,pt(105,820),pt(420,180),2,3,"bumper",[pt(395,610),pt(395,445),pt(265,355),pt(420,250)],l=>{
    l.walls=[r(28,520,305,W),r(28,330,195,W)];l.bumpers=[{x:397,y:602,r:34}];
  }),
  // 08 · Split-lane choice around an offset island.
  make(8,pt(420,820),pt(105,180),2,3,"wall",[pt(410,560),pt(185,445),pt(120,275)],l=>{
    l.walls=[r(215,500,155,W),r(215,500,W,145),r(28,315,190,W)];
  }),
  // 09 · Central rebound can shorten the route but is not mandatory.
  make(9,pt(270,820),pt(270,170),2,3,"bumper",[pt(270,590),pt(350,435),pt(270,250)],l=>{
    l.walls=[r(28,500,150,W),r(362,500,150,W),r(28,300,205,W),r(307,300,205,W)];l.bumpers=[{x:270,y:515,r:36}];
  }),
  // 10 · Chapter exam: three alternating decisions, no direct HIO.
  make(10,pt(110,820),pt(425,165),3,4,"wall",[pt(430,700),pt(105,555),pt(430,405),pt(130,270),pt(425,215)],l=>{
    l.walls=[r(28,655,330,W),r(182,500,330,W),r(28,345,330,W),r(190,220,322,W)];
  }),

  // 11 · Sand is a real slowdown band, followed by a placement shot.
  make(11,pt(105,820),pt(430,180),2,3,"sand",[pt(255,690),pt(255,515),pt(255,395),pt(430,245)],l=>{
    l.sand=[r(60,440,420,230)];l.walls=[r(330,340,182,W)];
  }),
  // 12 · Keyhole: enter centrally, exit sideways.
  make(12,pt(270,820),pt(110,180),2,3,"wall",[pt(270,610),pt(395,475),pt(395,320),pt(110,235)],l=>{
    l.walls=[r(28,535,190,W),r(322,535,190,W),r(258,285,W,205),r(145,285,137,W)];
  }),
  // 13 · Triangular pinball read.
  make(13,pt(125,820),pt(410,175),2,3,"bumper",[pt(210,620),pt(275,485),pt(350,335),pt(410,235)],l=>{
    l.triangles=[tri(145,620,285,620,145,480),tri(395,350,255,350,395,490)];l.bumpers=[{x:275,y:485,r:32}];
  }),
  // 14 · Staircase; each shot wants a different landing side.
  make(14,pt(420,820),pt(120,175),3,4,"wall",[pt(115,565),pt(430,475),pt(430,335),pt(120,220)],l=>{
    l.walls=[r(28,610,180,W),r(210,420,302,W),r(28,255,250,W)];l.triangles=[tri(210,420,270,420,210,480)];
  }),
  // 15 · Ice chute: the whole centre channel is mechanically active and visually obvious.
  make(15,pt(270,820),pt(110,170),2,3,"ice",[pt(270,665),pt(270,495),pt(175,365),pt(110,235)],l=>{
    l.walls=[r(145,420,W,230),r(371,420,W,230),r(245,300,267,W)];l.ice=[r(169,445,202,180)];
  }),

  // 16 · Horseshoe: use the outside before cutting back in.
  make(16,pt(405,820),pt(300,470),3,4,"wall",[pt(145,710),pt(120,420),pt(300,365),pt(300,470)],l=>{
    l.walls=[r(210,530,302,W),r(210,330,W,224),r(210,330,210,W)];
  }),
  // 17 · Sand S: two braking zones change both power decisions.
  make(17,pt(115,820),pt(420,180),3,4,"sand",[pt(390,690),pt(390,535),pt(150,420),pt(150,275),pt(420,225)],l=>{
    l.sand=[r(285,600,185,105),r(70,350,185,105)];l.walls=[r(28,535,285,W),r(227,300,285,W)];
  }),
  // 18 · Ice exit: glide through a lane, then brake yourself with geometry.
  make(18,pt(420,820),pt(115,175),3,4,"ice",[pt(210,680),pt(210,510),pt(410,390),pt(115,240)],l=>{
    l.ice=[r(105,585,230,95)];l.walls=[r(28,540,185,W),r(305,445,207,W),r(28,280,265,W)];
  }),
  // 19 · Booster intro: accelerator points into a bank, not directly at cup.
  make(19,pt(115,820),pt(410,180),2,3,"booster",[pt(190,670),pt(365,540),pt(365,340),pt(410,235)],l=>{
    l.walls=[r(28,590,150,W),r(382,400,130,W),r(215,310,190,W)];
    l.boosters=[{x:155,y:620,w:105,h:72,dx:1,dy:-.45,power:1.05}];
  }),
  // 20 · Surface chapter exam: one dry route, one faster risky ice line.
  make(20,pt(420,820),pt(105,175),3,4,"ice",[pt(125,690),pt(125,520),pt(390,405),pt(390,270),pt(105,220)],l=>{
    l.walls=[r(220,630,292,W),r(28,465,300,W),r(215,300,297,W)];l.ice=[r(55,500,155,105)];l.sand=[r(350,330,120,105)];
  }),

  // 21 · Fan intro: crosswind across a broad, readable lane.
  make(21,pt(120,820),pt(420,180),2,3,"fan",[pt(260,670),pt(300,515),pt(380,350),pt(420,235)],l=>{
    l.walls=[r(28,570,175,W),r(337,395,175,W)];l.fans=[{x:175,y:500,w:190,h:140,dx:1,dy:0,strength:275}];
  }),
  // 22 · Wind or wall-bank: player chooses compensation style.
  make(22,pt(420,820),pt(115,175),3,4,"fan",[pt(180,690),pt(180,520),pt(390,390),pt(115,230)],l=>{
    l.walls=[r(28,610,160,W),r(245,455,267,W),r(28,280,220,W)];l.fans=[{x:245,y:575,w:205,h:115,dx:-1,dy:-.12,strength:300}];
  }),
  // 23 · Offset islands force two different fan corrections.
  make(23,pt(110,820),pt(410,175),3,4,"fan",[pt(395,700),pt(180,560),pt(350,420),pt(150,300),pt(410,220)],l=>{
    l.walls=[r(160,635,160,W),r(220,495,160,W),r(160,355,160,W)];
    l.fans=[{x:330,y:650,w:125,h:100,dx:-1,dy:0,strength:285},{x:85,y:365,w:125,h:100,dx:1,dy:0,strength:260}];
  }),
  // 24 · Bumper + fan: deliberately chain two known forces.
  make(24,pt(405,820),pt(115,180),3,4,"bumper",[pt(330,650),pt(190,520),pt(310,390),pt(115,235)],l=>{
    l.walls=[r(28,590,175,W),r(337,470,175,W),r(28,300,230,W)];l.bumpers=[{x:190,y:520,r:34}];l.fans=[{x:250,y:340,w:160,h:110,dx:-1,dy:0,strength:255}];
  }),
  // 25 · Curve intro: round a quarter-circle rather than fighting a square corner.
  make(25,pt(120,820),pt(420,185),3,4,"curve",[pt(130,590),pt(265,470),pt(390,350),pt(420,245)],l=>{
    l.walls=[r(28,515,145,W),r(355,285,157,W)];l.curves=[{x:250,y:500,r:118,startAngle:Math.PI*.55,endAngle:Math.PI*1.02,thickness:24}];
  }),
  // 26 · Curve bank around a central block.
  make(26,pt(420,820),pt(105,175),3,4,"curve",[pt(340,655),pt(185,520),pt(125,385),pt(105,230)],l=>{
    l.walls=[r(245,500,185,W),r(245,500,W,165)];l.curves=[{x:220,y:500,r:105,startAngle:Math.PI*.05,endAngle:Math.PI*.55,thickness:24}];
  }),
  // 27 · Double-bend, distinct from the single-corner tutorials.
  make(27,pt(105,820),pt(420,175),3,4,"curve",[pt(365,680),pt(365,520),pt(175,410),pt(175,275),pt(420,225)],l=>{
    l.curves=[{x:350,y:570,r:92,startAngle:Math.PI*.55,endAngle:Math.PI,thickness:24},{x:190,y:350,r:92,startAngle:Math.PI*1.55,endAngle:Math.PI*2,thickness:24}];
    l.walls=[r(28,470,180,W),r(332,300,180,W)];
  }),
  // 28 · Fan into a curve: speed control matters more than raw accuracy.
  make(28,pt(415,820),pt(120,180),3,4,"fan",[pt(250,665),pt(180,520),pt(330,390),pt(120,235)],l=>{
    l.fans=[{x:275,y:615,w:155,h:105,dx:-1,dy:0,strength:310}];l.curves=[{x:235,y:470,r:112,startAngle:Math.PI*.15,endAngle:Math.PI*.72,thickness:24}];l.walls=[r(305,300,207,W)];
  }),
  // 29 · Portal intro: barrier makes transport meaningful, exit still needs a shot.
  make(29,pt(110,820),pt(420,180),2,3,"portal",[pt(180,635),pt(180,505),pt(350,365),pt(420,235)],l=>{
    l.walls=[r(28,545,484,W),r(285,300,227,W)];l.portals=[{a:{x:175,y:620,r:30},b:{x:350,y:450,r:30}}];
  }),
  // 30 · Portal chapter exam: choose safe dogleg or harder transport shortcut.
  make(30,pt(420,820),pt(105,175),4,5,"portal",[pt(395,640),pt(155,510),pt(360,380),pt(105,225)],l=>{
    l.walls=[r(28,585,260,W),r(252,430,260,W),r(28,275,260,W)];l.portals=[{a:{x:420,y:540,r:28},b:{x:110,y:385,r:28}}];l.bumpers=[{x:345,y:330,r:31}];
  }),

  // 31 · Moving wall intro: broad gate, readable timing.
  make(31,pt(120,820),pt(420,180),3,4,"moving",[pt(270,650),pt(270,500),pt(390,350),pt(420,235)],l=>{
    l.walls=[r(28,590,165,W),r(347,590,165,W),r(28,315,220,W)];l.movingWalls=[{x:245,y:475,w:24,h:105,axis:"x",amplitude:72,speed:.92,phase:.2}];
  }),
  // 32 · Moving bumper patrols the only aggressive lane.
  make(32,pt(420,820),pt(110,180),3,4,"moving",[pt(170,680),pt(170,520),pt(365,390),pt(110,235)],l=>{
    l.walls=[r(235,600,277,W),r(28,430,220,W),r(260,275,252,W)];l.movingBumpers=[{x:300,y:500,r:32,axis:"y",amplitude:68,speed:1.05,phase:.8}];
  }),
  // 33 · Timing switchback, no special shortcut.
  make(33,pt(105,820),pt(420,175),4,5,"moving",[pt(405,690),pt(135,540),pt(400,395),pt(140,270),pt(420,220)],l=>{
    l.walls=[r(28,640,280,W),r(232,495,280,W),r(28,350,280,W)];l.movingWalls=[{x:330,y:590,w:110,h:24,axis:"y",amplitude:58,speed:1.1,phase:.4}];
  }),
  // 34 · Fan plus moving gate rewards waiting for a window.
  make(34,pt(410,820),pt(120,180),4,5,"moving",[pt(170,680),pt(170,525),pt(360,405),pt(120,235)],l=>{
    l.fans=[{x:260,y:625,w:175,h:110,dx:-1,dy:0,strength:285}];l.movingWalls=[{x:245,y:465,w:24,h:120,axis:"x",amplitude:82,speed:.95,phase:1.1}];l.walls=[r(28,300,245,W)];
  }),
  // 35 · Void intro: safe route bends around it; risky skim is shorter.
  make(35,pt(115,820),pt(420,180),3,4,"void",[pt(390,690),pt(390,515),pt(165,390),pt(165,275),pt(420,225)],l=>{
    l.voids=[r(175,470,190,120)];l.walls=[r(28,610,210,W),r(302,310,210,W)];
  }),
  // 36 · Two void islands create a diagonal threading puzzle.
  make(36,pt(420,820),pt(105,175),4,5,"void",[pt(150,680),pt(360,520),pt(145,365),pt(105,225)],l=>{
    l.voids=[r(85,565,175,95),r(280,365,175,95)];l.walls=[r(28,285,225,W)];
  }),
  // 37 · Ramp intro: the void genuinely blocks the intended route.
  make(37,pt(110,820),pt(420,180),3,4,"ramp",[pt(165,650),pt(270,500),pt(385,350),pt(420,235)],l=>{
    l.voids=[r(175,485,190,125)];l.ramps=[{x:125,y:625,w:105,h:72,dx:1,dy:-.85,lift:345,boost:38}];l.walls=[r(340,300,172,W)];
  }),
  // 38 · Ramp landing: jumping is easy; landing on the correct side is the puzzle.
  make(38,pt(420,820),pt(110,175),4,5,"ramp",[pt(360,665),pt(240,510),pt(120,370),pt(110,225)],l=>{
    l.voids=[r(185,515,210,125)];l.ramps=[{x:330,y:640,w:100,h:70,dx:-1,dy:-.7,lift:360,boost:42}];l.walls=[r(28,410,205,W),r(290,300,222,W)];
  }),
  // 39 · Trampoline intro: vertical pop crosses a compact void, then geometry resumes.
  make(39,pt(120,820),pt(415,180),3,4,"trampoline",[pt(195,665),pt(280,505),pt(385,345),pt(415,235)],l=>{
    l.voids=[r(195,500,175,130)];l.trampolines=[{x:190,y:660,r:38,power:430}];l.walls=[r(28,405,170,W),r(340,285,172,W)];
  }),
  // 40 · Finale: timing + wind + portal + void, but each element serves a different beat.
  make(40,pt(420,820),pt(110,170),4,5,"portal",[pt(355,680),pt(165,555),pt(370,420),pt(170,305),pt(110,220)],l=>{
    l.walls=[r(28,620,215,W),r(297,455,215,W),r(28,285,215,W)];
    l.voids=[r(205,520,120,90)];l.fans=[{x:320,y:650,w:145,h:105,dx:-1,dy:0,strength:285}];
    l.portals=[{a:{x:410,y:405,r:28},b:{x:150,y:330,r:28}}];l.movingBumpers=[{x:265,y:455,r:30,axis:"x",amplitude:62,speed:1.05,phase:.4}];
  })
];
