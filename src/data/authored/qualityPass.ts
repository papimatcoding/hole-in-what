import type { LevelDefinition, Vec2 } from "../../types";

const r=(x:number,y:number,w:number,h:number)=>({x,y,w,h});
const p=(x:number,y:number):Vec2=>({x,y});
const route=(l:LevelDefinition,...pts:Vec2[]):void=>{l.designPath=[l.ball,...pts,l.hole];};
const stars=(l:LevelDefinition,three:number,two=three+1):void=>{l.threeStar={maxStrokes:three};l.twoStar={maxStrokes:two};};

/**
 * Second authored playtest pass. These edits are deliberately individual: each protects a
 * different strategic beat instead of applying one generic anti-HIO gate to every hole.
 */
export function applyQualityPass(level:LevelDefinition):LevelDefinition{
  const l=JSON.parse(JSON.stringify(level)) as LevelDefinition;

  // 04: first real placement hole — bottom deflector, then opposite-side approach.
  if(l.id==="classic-04"){
    l.hole=p(410,175);l.walls=[r(245,455,24,280),r(245,455,155,24),r(28,285,310,24)];
    l.triangles=[{a:p(245,455),b:p(305,455),c:p(245,515)}];
    route(l,p(415,690),p(415,405),p(360,335),p(410,225));
  }
  // 05: two islands create a left/right decision rather than a bank-shot lottery.
  if(l.id==="classic-05"){
    l.ball=p(270,820);l.hole=p(125,175);
    l.walls=[r(205,575,130,24),r(205,465,24,134),r(305,350,150,24),r(431,350,24,135)];
    l.triangles=[{a:p(205,465),b:p(265,465),c:p(205,525)}];
    route(l,p(390,650),p(390,500),p(270,420),p(190,320),p(125,225));
  }
  // 06 keeps its risky HIO, but 3★ is a controlled two-shot route; the shortcut is narrow.
  if(l.id==="classic-06"){
    l.walls=[r(345,455,24,245),r(170,430,175,24),r(90,285,240,24),r(345,300,167,24)];
    route(l,p(295,675),p(145,515),p(360,390),p(360,255),p(125,220));
  }
  // 07 keeps bumper mastery; add a top pocket so a lucky first rebound cannot finish everything.
  if(l.id==="classic-07"){
    l.walls=[r(28,520,305,24),r(28,330,195,24),r(275,275,237,24)];
    l.bumpers=[{x:397,y:602,r:34}];route(l,p(397,602),p(400,445),p(225,365),p(250,250),p(420,220));
  }
  // 08: asymmetric split that rejoins at a narrow top approach.
  if(l.id==="classic-08"){
    l.walls=[r(205,530,165,24),r(205,420,24,134),r(300,355,212,24),r(28,285,245,24)];
    l.triangles=[{a:p(370,530),b:p(310,530),c:p(370,470)}];
    route(l,p(410,610),p(160,500),p(275,395),p(285,330),p(105,225));
  }
  // 13: bumper is the fast lane; avoiding it means an extra setup around the centre fin.
  if(l.id==="classic-13"){
    l.walls=[r(250,555,24,135),r(300,390,212,24),r(28,300,215,24)];
    l.triangles=[{a:p(145,620),b:p(285,620),c:p(145,480)}];l.bumpers=[{x:330,y:510,r:34}];
    route(l,p(220,640),p(330,510),p(230,420),p(230,340),p(410,230));
  }
  // 15: unmistakable full-width ice crossing, followed by an opposite-side exit.
  if(l.id==="classic-15"){
    l.ball=p(270,820);l.hole=p(110,170);l.ice=[r(28,455,484,155)];
    l.walls=[r(28,385,315,24),r(315,270,197,24)];
    route(l,p(390,650),p(390,520),p(390,420),p(445,340),p(110,220));
  }

  // 23: fan carries toward a side bay, after which the cup must be attacked from the opposite side.
  if(l.id==="classic-23"){
    l.walls=[r(150,645,170,24),r(220,495,160,24),r(335,350,177,24),r(28,290,270,24)];
    l.fans=[{x:330,y:650,w:125,h:100,dx:-1,dy:0,strength:285},{x:75,y:375,w:140,h:100,dx:1,dy:0,strength:270}];
    route(l,p(400,710),p(165,575),p(350,455),p(175,350),p(410,220));
  }
  // 24: rebound lane around a central T; fan only matters on the aggressive exit.
  if(l.id==="classic-24"){
    l.walls=[r(245,585,24,155),r(245,585,155,24),r(28,355,245,24),r(345,285,167,24)];
    l.bumpers=[{x:185,y:500,r:35}];l.fans=[{x:285,y:420,w:155,h:105,dx:-1,dy:0,strength:275}];
    route(l,p(330,675),p(185,500),p(330,445),p(300,330),p(115,225));
  }
  // 25: curve is a roundabout around the centre island; direct line ends on the island.
  if(l.id==="classic-25"){
    l.walls=[r(225,455,135,100),r(28,325,210,24),r(330,270,182,24)];
    l.curves=[{x:205,y:515,r:125,startAngle:Math.PI*1.55,endAngle:Math.PI*2.08,thickness:24}];
    route(l,p(130,625),p(145,520),p(255,410),p(390,340),p(420,235));
  }
  // 26: opposite-handed curve around an L-shaped island; not a mirror of 25.
  if(l.id==="classic-26"){
    l.walls=[r(270,565,190,24),r(270,405,24,184),r(28,315,205,24)];
    l.curves=[{x:315,y:430,r:112,startAngle:Math.PI*.52,endAngle:Math.PI*1.05,thickness:24}];
    route(l,p(350,675),p(190,550),p(180,420),p(315,335),p(105,225));
  }
  // 27: keep the clever curve HIO as a mastery secret; 3★ expects two strokes.
  if(l.id==="classic-27")stars(l,2,3);
  // 28: fan pushes through a crescent-shaped decision before the final dogleg.
  if(l.id==="classic-28"){
    l.walls=[r(28,610,190,24),r(300,500,212,24),r(28,300,250,24)];
    l.fans=[{x:260,y:620,w:175,h:110,dx:-1,dy:0,strength:305}];
    l.curves=[{x:215,y:470,r:105,startAngle:Math.PI*.08,endAngle:Math.PI*.62,thickness:24}];
    route(l,p(175,675),p(320,550),p(180,455),p(380,370),p(120,225));
  }
  // 31: moving gate is a timing checkpoint between two offset shelves.
  if(l.id==="classic-31"){
    l.walls=[r(28,620,235,24),r(300,450,212,24),r(28,285,215,24)];
    l.movingWalls=[{x:245,y:495,w:24,h:125,axis:"x",amplitude:82,speed:1.02,phase:.2}];
    route(l,p(390,690),p(165,550),p(350,420),p(145,330),p(420,225));
  }
  if(l.id==="classic-34")stars(l,3,4);
  // 37: ramp crosses a horizontal moat; landing side determines the second shot.
  if(l.id==="classic-37"){
    l.ball=p(110,820);l.hole=p(420,180);l.voids=[r(28,475,484,145)];
    l.ramps=[{x:120,y:640,w:105,h:72,dx:1,dy:-.86,lift:350,boost:40}];l.walls=[r(300,330,212,24)];
    route(l,p(175,650),p(285,455),p(385,360),p(420,230));
  }
  // 38: narrow diagonal ramp HIO is legitimate mastery; normal mastery par is two.
  if(l.id==="classic-38")stars(l,2,3);
  // 39: trampoline is a central island jump, geometrically unrelated to 37's horizontal moat.
  if(l.id==="classic-39"){
    l.ball=p(420,820);l.hole=p(105,175);l.voids=[r(255,520,230,115),r(70,365,230,115)];
    l.trampolines=[{x:350,y:675,r:39,power:435}];l.walls=[r(28,610,170,24),r(330,300,182,24)];
    route(l,p(350,675),p(210,500),p(340,410),p(180,315),p(105,225));stars(l,2,3);
  }

  // HARD 01 and 03: no broad HIO after the first surprise; second placement must matter.
  if(l.id==="troll-01"){
    l.walls=[r(75,360,24,260),r(441,360,24,260),r(28,285,310,24),r(335,245,177,24)];
    l.popWalls=[{x:180,y:430,w:180,h:22,triggerX:270,triggerY:625,triggerRadius:110}];
    route(l,p(390,650),p(390,420),p(345,330),p(390,285),p(270,220));
  }
  if(l.id==="troll-03"){
    l.walls=[r(258,355,24,330),r(28,300,160,24),r(352,300,160,24),r(300,245,212,24),r(28,225,210,24)];
    l.popVoids=[{x:68,y:415,w:145,h:90,triggerX:150,triggerY:610,triggerRadius:124}];
    route(l,p(400,635),p(400,390),p(155,330),p(270,275),p(270,210));
  }
  // 13's HIO is a very thin learned line that uses both ice and trap; reward it.
  if(l.id==="troll-13")stars(l,2,3);
  if(l.id==="troll-14"){
    l.ice=[r(285,600,170,100),r(95,390,170,100)];l.walls=[r(28,560,210,24),r(302,330,210,24),r(28,250,300,24)];
    l.popWalls=[{x:280,y:455,w:120,h:22,triggerX:195,triggerY:515,triggerRadius:105}];
    route(l,p(390,665),p(185,515),p(360,390),p(360,285),p(405,220));
  }
  if(l.id==="troll-15")stars(l,3,4);
  if(l.id==="troll-16"){
    l.boosters=[{x:145,y:620,w:110,h:72,dx:1,dy:-.4,power:1.03}];
    l.walls=[r(28,565,135,24),r(380,420,132,24),r(28,300,315,24)];
    l.popWalls=[{x:305,y:365,w:22,h:120,triggerX:350,triggerY:525,triggerRadius:110}];
    route(l,p(185,665),p(355,530),p(355,350),p(355,270),p(420,220));
  }
  if(l.id==="troll-17")stars(l,2,3);
  if(l.id==="troll-18")stars(l,3,4);
  if(l.id==="troll-19"){
    l.boosters=[{x:95,y:615,w:115,h:72,dx:0,dy:-1,power:1.06}];
    l.walls=[r(250,600,262,24),r(28,420,220,24),r(290,285,222,24),r(28,260,215,24)];
    l.popBumpers=[{x:355,y:385,r:34,triggerX:190,triggerY:525,triggerRadius:112}];
    route(l,p(180,685),p(180,525),p(360,390),p(360,250),p(120,215));
  }
  if(l.id==="troll-20")stars(l,3,4);

  // 21–25: curve chapter uses different enclosures instead of five open diagonals.
  if(l.id==="troll-21"){
    l.walls=[r(28,540,130,24),r(360,285,152,24),r(305,395,207,24)];
    l.curves=[{x:250,y:515,r:120,startAngle:Math.PI*.55,endAngle:Math.PI*1.02,thickness:24}];
    l.popBumpers=[{x:385,y:350,r:31,triggerX:275,triggerY:490,triggerRadius:108}];route(l,p(155,610),p(275,490),p(300,370),p(420,235));
  }
  if(l.id==="troll-22"){
    l.walls=[r(250,500,190,24),r(250,500,24,165),r(28,300,215,24),r(325,255,187,24)];
    l.curves=[{x:220,y:520,r:105,startAngle:Math.PI*.05,endAngle:Math.PI*.58,thickness:24}];
    l.popWalls=[{x:155,y:365,w:120,h:22,triggerX:190,triggerY:515,triggerRadius:108}];route(l,p(340,665),p(185,520),p(330,410),p(330,300),p(110,220));
  }
  if(l.id==="troll-23"){
    l.curves=[{x:355,y:570,r:88,startAngle:Math.PI*.55,endAngle:Math.PI,thickness:24},{x:190,y:350,r:88,startAngle:Math.PI*1.55,endAngle:Math.PI*2,thickness:24}];
    l.walls=[r(28,485,180,24),r(332,300,180,24),r(225,395,90,90)];
    l.popVoids=[{x:315,y:470,w:125,h:70,triggerX:390,triggerY:615,triggerRadius:112}];route(l,p(390,685),p(390,525),p(165,420),p(165,280),p(415,220));
  }
  if(l.id==="troll-24"){
    l.walls=[r(28,605,175,24),r(337,420,175,24),r(28,285,210,24),r(250,350,24,155)];
    l.curves=[{x:300,y:555,r:105,startAngle:Math.PI*.45,endAngle:Math.PI*.95,thickness:24}];
    l.popWalls=[{x:205,y:360,w:22,h:125,triggerX:320,triggerY:520,triggerRadius:108}];route(l,p(155,675),p(330,520),p(170,430),p(310,325),p(120,220));
  }
  if(l.id==="troll-25"){
    l.curves=[{x:170,y:520,r:92,startAngle:0,endAngle:Math.PI*.5,thickness:24},{x:365,y:370,r:92,startAngle:Math.PI*.5,endAngle:Math.PI,thickness:24}];
    l.walls=[r(28,630,220,24),r(292,300,220,24),r(245,430,24,140)];
    l.popBumpers=[{x:365,y:410,r:31,triggerX:175,triggerY:550,triggerRadius:106}];l.popWalls=[{x:110,y:300,w:120,h:22,triggerX:350,triggerY:400,triggerRadius:95}];route(l,p(395,690),p(170,550),p(350,430),p(145,285),p(420,220));
  }

  // Portal/timing/jump chapters: adjust stars only where solver finds a complex 2-shot line;
  // broad HIO bypasses remain intentionally flagged for the next playtest pass.
  if(l.id==="troll-29")stars(l,3,4);
  if(l.id==="troll-32")stars(l,3,4);
  if(l.id==="troll-34")stars(l,3,4);
  return l;
}
