import type { CourseMechanic, LevelDefinition, TrollTrapArchetype, Vec2 } from "../../types";
import { base, path, pt, r, tri, trap, W } from "./authoring";

function make(index:number,ball:Vec2,hole:Vec2,three:number,two:number,primary:CourseMechanic,archetype:TrollTrapArchetype,route:Vec2[],build:(l:LevelDefinition)=>void):LevelDefinition{
  const l=trap(base("troll",index,ball,hole,three,two,primary),archetype);build(l);return path(l,...route);
}

export const HARD_AUTHORED:LevelDefinition[]=[
  // 01–05 · Teach the language of trolling using only readable geometry.
  make(1,pt(270,820),pt(270,170),2,3,"wall","gate-pop",[pt(390,650),pt(390,420),pt(270,230)],l=>{
    l.walls=[r(75,360,W,260),r(441,360,W,260)];l.popWalls=[{x:180,y:430,w:180,h:22,triggerX:270,triggerY:625,triggerRadius:110}];
  }),
  make(2,pt(110,820),pt(415,175),2,3,"bumper","bumper-ambush",[pt(420,570),pt(420,390),pt(415,235)],l=>{
    l.walls=[r(28,480,300,W),r(28,300,165,W)];l.popBumpers=[{x:395,y:500,r:34,triggerX:360,triggerY:640,triggerRadius:116}];
  }),
  make(3,pt(270,820),pt(270,170),2,3,"wall","safe-lane-collapse",[pt(400,635),pt(400,390),pt(155,330),pt(270,210)],l=>{
    l.walls=[r(258,355,W,330),r(28,300,160,W),r(352,300,160,W)];l.popVoids=[{x:68,y:415,w:145,h:90,triggerX:150,triggerY:610,triggerRadius:124}];
  }),
  make(4,pt(125,820),pt(390,175),3,4,"bumper","rebound-punish",[pt(385,660),pt(205,535),pt(315,390),pt(330,250),pt(390,205)],l=>{
    l.walls=[r(28,610,250,W),r(300,500,212,W)];l.triangles=[tri(155,440,255,440,155,340),tri(380,315,280,315,380,415)];
    l.popBumpers=[{x:350,y:255,r:33,triggerX:315,triggerY:410,triggerRadius:118}];
  }),
  make(5,pt(420,820),pt(110,170),3,4,"moving","late-combo",[pt(265,665),pt(270,520),pt(405,390),pt(110,220)],l=>{
    l.walls=[r(28,610,160,W),r(350,610,162,W),r(28,300,220,W)];l.movingWalls=[{x:245,y:475,w:24,h:110,axis:"x",amplitude:70,speed:1.02,phase:.6}];
    l.popWalls=[{x:235,y:330,w:150,h:22,triggerX:270,triggerY:455,triggerRadius:108}];l.popBumpers=[{x:125,y:255,r:30,triggerX:235,triggerY:330,triggerRadius:94}];
  }),

  // 06–10 · Longer reads: traps happen after a meaningful first placement.
  make(6,pt(115,820),pt(405,180),3,4,"wall","cross-gate",[pt(420,680),pt(160,530),pt(365,390),pt(405,235)],l=>{
    l.walls=[r(28,630,300,W),r(212,470,300,W),r(28,300,235,W)];l.popWalls=[{x:320,y:390,w:22,h:130,triggerX:185,triggerY:530,triggerRadius:110}];
  }),
  make(7,pt(420,820),pt(110,175),3,4,"bumper","bumper-ambush",[pt(150,675),pt(355,525),pt(145,380),pt(110,230)],l=>{
    l.walls=[r(235,620,277,W),r(28,455,220,W),r(275,290,237,W)];l.bumpers=[{x:355,y:525,r:31}];l.popBumpers=[{x:145,y:380,r:32,triggerX:310,triggerY:500,triggerRadius:105}];
  }),
  make(8,pt(110,820),pt(420,175),3,4,"wall","floor-drop",[pt(400,675),pt(400,505),pt(160,390),pt(160,270),pt(420,220)],l=>{
    l.walls=[r(28,600,215,W),r(297,450,215,W),r(28,285,215,W)];l.popVoids=[{x:315,y:470,w:115,h:70,triggerX:395,triggerY:620,triggerRadius:112}];
  }),
  make(9,pt(410,820),pt(120,175),3,4,"moving","safe-lane-collapse",[pt(145,680),pt(145,535),pt(365,410),pt(120,230)],l=>{
    l.movingBumpers=[{x:260,y:535,r:31,axis:"x",amplitude:88,speed:1.08,phase:.4}];l.walls=[r(28,590,155,W),r(355,455,157,W),r(28,295,220,W)];
    l.popVoids=[{x:315,y:430,w:135,h:75,triggerX:150,triggerY:540,triggerRadius:115}];
  }),
  make(10,pt(120,820),pt(415,170),3,4,"bumper","late-combo",[pt(400,690),pt(150,555),pt(390,420),pt(150,285),pt(415,215)],l=>{
    l.walls=[r(28,645,290,W),r(222,500,290,W),r(28,355,290,W),r(222,225,290,W)];l.bumpers=[{x:385,y:425,r:30}];
    l.popWalls=[{x:105,y:375,w:135,h:22,triggerX:165,triggerY:545,triggerRadius:105}];l.popBumpers=[{x:370,y:260,r:29,triggerX:185,triggerY:365,triggerRadius:95}];
  }),

  // 11–15 · Surfaces join the troll vocabulary.
  make(11,pt(415,820),pt(110,180),3,4,"sand","gate-pop",[pt(160,675),pt(160,520),pt(360,400),pt(110,235)],l=>{
    l.sand=[r(65,570,220,105)];l.walls=[r(275,545,237,W),r(28,350,200,W)];l.popWalls=[{x:255,y:405,w:22,h:125,triggerX:170,triggerY:525,triggerRadius:108}];
  }),
  make(12,pt(110,820),pt(420,175),3,4,"sand","safe-lane-collapse",[pt(385,690),pt(385,525),pt(150,395),pt(420,225)],l=>{
    l.sand=[r(300,605,170,115),r(70,350,170,115)];l.walls=[r(28,540,235,W),r(277,300,235,W)];l.popVoids=[{x:305,y:475,w:120,h:65,triggerX:365,triggerY:610,triggerRadius:108}];
  }),
  make(13,pt(420,820),pt(115,175),3,4,"ice","rebound-punish",[pt(160,675),pt(160,520),pt(370,390),pt(115,225)],l=>{
    l.ice=[r(80,570,200,105)];l.walls=[r(260,545,252,W),r(28,310,220,W)];l.popBumpers=[{x:365,y:390,r:34,triggerX:180,triggerY:520,triggerRadius:115}];
  }),
  make(14,pt(115,820),pt(405,180),3,4,"ice","cross-gate",[pt(390,665),pt(185,515),pt(360,390),pt(405,235)],l=>{
    l.ice=[r(285,600,170,100),r(95,390,170,100)];l.walls=[r(28,560,210,W),r(302,330,210,W)];l.popWalls=[{x:280,y:455,w:120,h:22,triggerX:195,triggerY:515,triggerRadius:105}];
  }),
  make(15,pt(405,820),pt(120,175),4,5,"sand","late-combo",[pt(140,690),pt(360,550),pt(160,410),pt(350,285),pt(120,220)],l=>{
    l.sand=[r(280,595,180,105),r(75,365,180,105)];l.walls=[r(28,625,180,W),r(332,485,180,W),r(28,300,215,W)];
    l.popWalls=[{x:235,y:450,w:120,h:22,triggerX:355,triggerY:550,triggerRadius:108}];l.popBumpers=[{x:345,y:285,r:30,triggerX:175,triggerY:410,triggerRadius:95}];
  }),

  // 16–20 · Force control: booster and fans make trap recovery matter.
  make(16,pt(110,820),pt(420,175),3,4,"booster","gate-pop",[pt(185,665),pt(355,530),pt(355,350),pt(420,230)],l=>{
    l.boosters=[{x:145,y:620,w:110,h:72,dx:1,dy:-.4,power:1.03}];l.walls=[r(28,565,135,W),r(380,420,132,W)];l.popWalls=[{x:305,y:365,w:22,h:120,triggerX:350,triggerY:525,triggerRadius:110}];
  }),
  make(17,pt(420,820),pt(105,175),3,4,"fan","floor-drop",[pt(160,675),pt(160,520),pt(370,395),pt(105,230)],l=>{
    l.fans=[{x:260,y:610,w:180,h:110,dx:-1,dy:0,strength:300}];l.walls=[r(28,565,180,W),r(332,320,180,W)];l.popVoids=[{x:295,y:440,w:135,h:70,triggerX:175,triggerY:520,triggerRadius:112}];
  }),
  make(18,pt(115,820),pt(415,180),4,5,"fan","bumper-ambush",[pt(395,700),pt(180,545),pt(350,405),pt(145,290),pt(415,225)],l=>{
    l.fans=[{x:310,y:645,w:155,h:105,dx:-1,dy:0,strength:285},{x:65,y:365,w:155,h:105,dx:1,dy:0,strength:270}];l.walls=[r(28,590,210,W),r(302,445,210,W),r(28,300,210,W)];
    l.popBumpers=[{x:345,y:405,r:32,triggerX:185,triggerY:545,triggerRadius:108}];
  }),
  make(19,pt(410,820),pt(120,170),4,5,"booster","rebound-punish",[pt(180,685),pt(180,525),pt(360,390),pt(120,225)],l=>{
    l.boosters=[{x:95,y:615,w:115,h:72,dx:0,dy:-1,power:1.06}];l.walls=[r(250,600,262,W),r(28,420,220,W),r(290,285,222,W)];
    l.popBumpers=[{x:355,y:385,r:34,triggerX:190,triggerY:525,triggerRadius:112}];
  }),
  make(20,pt(105,820),pt(425,170),4,5,"fan","late-combo",[pt(420,690),pt(135,550),pt(395,405),pt(140,275),pt(425,215)],l=>{
    l.walls=[r(28,640,305,W),r(207,495,305,W),r(28,350,305,W)];l.fans=[{x:330,y:605,w:140,h:105,dx:-1,dy:0,strength:295}];
    l.popWalls=[{x:330,y:445,w:22,h:110,triggerX:145,triggerY:550,triggerRadius:110}];l.popVoids=[{x:100,y:285,w:110,h:65,triggerX:385,triggerY:400,triggerRadius:98}];
  }),

  // 21–25 · Curves change what a deceptive “safe bank” looks like.
  make(21,pt(120,820),pt(420,180),4,5,"curve","rebound-punish",[pt(155,610),pt(275,490),pt(390,350),pt(420,235)],l=>{
    l.curves=[{x:250,y:515,r:120,startAngle:Math.PI*.55,endAngle:Math.PI*1.02,thickness:24}];l.walls=[r(28,540,130,W),r(360,285,152,W)];l.popBumpers=[{x:385,y:350,r:31,triggerX:275,triggerY:490,triggerRadius:108}];
  }),
  make(22,pt(420,820),pt(110,175),4,5,"curve","cross-gate",[pt(340,665),pt(175,520),pt(130,385),pt(110,230)],l=>{
    l.curves=[{x:220,y:520,r:105,startAngle:Math.PI*.05,endAngle:Math.PI*.58,thickness:24}];l.walls=[r(250,500,190,W),r(28,300,215,W)];l.popWalls=[{x:155,y:365,w:120,h:22,triggerX:190,triggerY:515,triggerRadius:108}];
  }),
  make(23,pt(110,820),pt(415,175),4,5,"curve","safe-lane-collapse",[pt(390,685),pt(390,525),pt(160,410),pt(160,280),pt(415,225)],l=>{
    l.curves=[{x:355,y:570,r:88,startAngle:Math.PI*.55,endAngle:Math.PI,thickness:24},{x:190,y:350,r:88,startAngle:Math.PI*1.55,endAngle:Math.PI*2,thickness:24}];
    l.popVoids=[{x:315,y:470,w:125,h:70,triggerX:390,triggerY:615,triggerRadius:112}];
  }),
  make(24,pt(410,820),pt(120,180),4,5,"curve","gate-pop",[pt(155,675),pt(330,520),pt(150,390),pt(120,235)],l=>{
    l.curves=[{x:300,y:555,r:105,startAngle:Math.PI*.45,endAngle:Math.PI*.95,thickness:24}];l.walls=[r(28,605,175,W),r(337,420,175,W),r(28,285,210,W)];
    l.popWalls=[{x:205,y:360,w:22,h:125,triggerX:320,triggerY:520,triggerRadius:108}];
  }),
  make(25,pt(115,820),pt(420,175),4,5,"curve","late-combo",[pt(395,690),pt(170,550),pt(365,410),pt(145,280),pt(420,220)],l=>{
    l.curves=[{x:170,y:520,r:92,startAngle:0,endAngle:Math.PI*.5,thickness:24},{x:365,y:370,r:92,startAngle:Math.PI*.5,endAngle:Math.PI,thickness:24}];
    l.walls=[r(28,630,220,W),r(292,300,220,W)];l.popBumpers=[{x:365,y:410,r:31,triggerX:175,triggerY:550,triggerRadius:106}];l.popWalls=[{x:110,y:300,w:120,h:22,triggerX:350,triggerY:400,triggerRadius:95}];
  }),

  // 26–30 · Portals create believable false shortcuts.
  make(26,pt(110,820),pt(420,180),3,4,"portal","gate-pop",[pt(175,625),pt(350,450),pt(420,235)],l=>{
    l.walls=[r(28,550,484,W),r(290,300,222,W)];l.portals=[{a:{x:175,y:620,r:30},b:{x:350,y:445,r:30}}];l.popWalls=[{x:330,y:340,w:22,h:120,triggerX:350,triggerY:445,triggerRadius:92}];
  }),
  make(27,pt(420,820),pt(105,175),4,5,"portal","floor-drop",[pt(385,640),pt(150,500),pt(365,350),pt(105,225)],l=>{
    l.walls=[r(28,580,260,W),r(252,430,260,W),r(28,280,260,W)];l.portals=[{a:{x:420,y:530,r:28},b:{x:110,y:385,r:28}}];
    l.popVoids=[{x:300,y:320,w:120,h:68,triggerX:115,triggerY:385,triggerRadius:92}];
  }),
  make(28,pt(115,820),pt(415,175),4,5,"portal","bumper-ambush",[pt(190,660),pt(365,515),pt(155,375),pt(415,225)],l=>{
    l.walls=[r(28,600,175,W),r(337,455,175,W),r(28,300,210,W)];l.portals=[{a:{x:190,y:555,r:28},b:{x:355,y:405,r:28}}];l.popBumpers=[{x:150,y:350,r:32,triggerX:355,triggerY:405,triggerRadius:94}];
  }),
  make(29,pt(410,820),pt(120,180),4,5,"portal","safe-lane-collapse",[pt(160,675),pt(160,530),pt(365,395),pt(120,235)],l=>{
    l.walls=[r(245,610,267,W),r(28,450,220,W),r(280,285,232,W)];l.portals=[{a:{x:125,y:535,r:28},b:{x:365,y:410,r:28}}];l.popVoids=[{x:285,y:360,w:130,h:70,triggerX:365,triggerY:410,triggerRadius:92}];
  }),
  make(30,pt(110,820),pt(420,170),4,5,"portal","late-combo",[pt(395,690),pt(145,555),pt(390,415),pt(145,280),pt(420,215)],l=>{
    l.walls=[r(28,640,285,W),r(227,495,285,W),r(28,350,285,W)];l.portals=[{a:{x:410,y:590,r:28},b:{x:140,y:445,r:28}}];
    l.popWalls=[{x:315,y:395,w:22,h:120,triggerX:145,triggerY:445,triggerRadius:92}];l.popBumpers=[{x:145,y:280,r:30,triggerX:360,triggerY:390,triggerRadius:92}];
  }),

  // 31–35 · Timing and voids: discovery alone is no longer enough; execution matters.
  make(31,pt(420,820),pt(110,175),4,5,"moving","cross-gate",[pt(155,680),pt(360,535),pt(145,390),pt(110,230)],l=>{
    l.walls=[r(28,620,180,W),r(332,455,180,W),r(28,290,220,W)];l.movingWalls=[{x:245,y:500,w:24,h:115,axis:"x",amplitude:82,speed:1.1,phase:.3}];l.popWalls=[{x:115,y:350,w:120,h:22,triggerX:355,triggerY:535,triggerRadius:105}];
  }),
  make(32,pt(115,820),pt(415,180),4,5,"moving","bumper-ambush",[pt(395,680),pt(165,525),pt(365,390),pt(415,235)],l=>{
    l.movingBumpers=[{x:280,y:550,r:32,axis:"y",amplitude:78,speed:1.15,phase:.8}];l.walls=[r(28,610,200,W),r(312,425,200,W),r(28,285,235,W)];
    l.popBumpers=[{x:360,y:385,r:31,triggerX:175,triggerY:525,triggerRadius:108}];
  }),
  make(33,pt(410,820),pt(120,175),4,5,"void","floor-drop",[pt(160,690),pt(365,535),pt(145,390),pt(120,230)],l=>{
    l.voids=[r(285,580,145,92),r(85,365,145,92)];l.walls=[r(28,610,185,W),r(327,455,185,W)];l.popVoids=[{x:300,y:445,w:120,h:68,triggerX:360,triggerY:535,triggerRadius:110}];
  }),
  make(34,pt(105,820),pt(425,175),4,5,"moving","safe-lane-collapse",[pt(410,690),pt(145,545),pt(390,400),pt(145,275),pt(425,220)],l=>{
    l.walls=[r(28,640,300,W),r(212,495,300,W),r(28,350,300,W)];l.movingWalls=[{x:330,y:590,w:105,h:24,axis:"y",amplitude:65,speed:1.08,phase:.4}];
    l.popVoids=[{x:90,y:350,w:130,h:68,triggerX:390,triggerY:400,triggerRadius:100}];
  }),
  make(35,pt(420,820),pt(110,170),5,6,"void","late-combo",[pt(150,690),pt(365,555),pt(145,420),pt(360,285),pt(110,215)],l=>{
    l.voids=[r(230,590,150,90),r(85,390,150,90)];l.movingBumpers=[{x:355,y:520,r:30,axis:"x",amplitude:62,speed:1.05,phase:.9}];l.walls=[r(28,620,165,W),r(347,315,165,W)];
    l.popWalls=[{x:290,y:380,w:22,h:110,triggerX:150,triggerY:420,triggerRadius:100}];l.popBumpers=[{x:350,y:280,r:29,triggerX:305,triggerY:380,triggerRadius:90}];
  }),

  // 36–40 · Jump mastery. Traps target landings rather than simply appearing in front of the ball.
  make(36,pt(110,820),pt(420,175),4,5,"ramp","gate-pop",[pt(165,660),pt(280,500),pt(385,350),pt(420,230)],l=>{
    l.voids=[r(180,490,200,125)];l.ramps=[{x:125,y:630,w:105,h:72,dx:1,dy:-.82,lift:350,boost:40}];l.walls=[r(345,300,167,W)];l.popWalls=[{x:330,y:365,w:22,h:110,triggerX:300,triggerY:470,triggerRadius:100}];
  }),
  make(37,pt(420,820),pt(110,175),4,5,"ramp","rebound-punish",[pt(355,665),pt(240,505),pt(130,365),pt(110,225)],l=>{
    l.voids=[r(190,510,205,125)];l.ramps=[{x:330,y:640,w:100,h:70,dx:-1,dy:-.72,lift:360,boost:42}];l.walls=[r(28,405,205,W),r(290,290,222,W)];l.popBumpers=[{x:135,y:365,r:32,triggerX:250,triggerY:500,triggerRadius:100}];
  }),
  make(38,pt(120,820),pt(415,175),4,5,"trampoline","floor-drop",[pt(190,665),pt(285,500),pt(385,345),pt(415,230)],l=>{
    l.voids=[r(195,500,180,135)];l.trampolines=[{x:190,y:660,r:39,power:435}];l.walls=[r(28,400,175,W),r(337,285,175,W)];l.popVoids=[{x:335,y:340,w:110,h:65,triggerX:300,triggerY:480,triggerRadius:98}];
  }),
  make(39,pt(410,820),pt(120,170),5,6,"trampoline","cross-gate",[pt(350,685),pt(185,555),pt(360,415),pt(145,285),pt(120,215)],l=>{
    l.voids=[r(205,565,175,110)];l.trampolines=[{x:350,y:680,r:38,power:440}];l.movingWalls=[{x:240,y:450,w:24,h:110,axis:"x",amplitude:72,speed:1.12,phase:.5}];l.walls=[r(28,330,200,W)];
    l.popWalls=[{x:300,y:375,w:120,h:22,triggerX:355,triggerY:415,triggerRadius:95}];
  }),
  make(40,pt(110,820),pt(425,165),5,6,"portal","late-combo",[pt(405,700),pt(160,565),pt(385,425),pt(155,290),pt(425,210)],l=>{
    l.walls=[r(28,650,290,W),r(222,505,290,W),r(28,360,290,W)];l.voids=[r(230,535,130,85)];
    l.fans=[{x:330,y:650,w:145,h:105,dx:-1,dy:0,strength:300}];l.portals=[{a:{x:405,y:455,r:28},b:{x:150,y:325,r:28}}];
    l.movingBumpers=[{x:275,y:500,r:30,axis:"x",amplitude:65,speed:1.1,phase:.6}];
    l.popWalls=[{x:310,y:315,w:22,h:105,triggerX:150,triggerY:325,triggerRadius:92}];l.popBumpers=[{x:380,y:235,r:29,triggerX:330,triggerY:310,triggerRadius:88}];
  })
];
