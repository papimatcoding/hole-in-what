import type { LevelDefinition, Vec2 } from "../../types";

const r=(x:number,y:number,w:number,h:number)=>({x,y,w,h});
const p=(x:number,y:number):Vec2=>({x,y});
const setPath=(l:LevelDefinition,...points:Vec2[]):void=>{l.designPath=[l.ball,...points,l.hole];};
const setStars=(l:LevelDefinition,three:number,two=three+1):void=>{l.threeStar={maxStrokes:three};l.twoStar={maxStrokes:two};};

/**
 * Explicit authored curation discovered by solver/integrity/originality review.
 * Nothing here is random. These are level-specific design edits while the 80-hole authored
 * campaign is being playtested; stable geometry can later be folded back into source files.
 */
export function finalizeAuthored(level:LevelDefinition):LevelDefinition{
  const l=JSON.parse(JSON.stringify(level)) as LevelDefinition;

  // --- CLASSIC 04–15: only the opening trio should offer broad, effortless HIOs. ---
  if(l.id==="classic-04"){
    l.walls=[r(245,390,24,335),r(245,390,145,24),r(300,280,212,24)];
    setPath(l,p(410,690),p(410,360),p(245,330),p(245,245));
  }
  if(l.id==="classic-05"){
    l.walls=[r(215,520,110,24),r(215,610,110,24),r(215,520,24,114),r(301,520,24,114),r(28,345,300,24)];
    setPath(l,p(405,655),p(405,435),p(355,315),p(150,270));
  }
  if(l.id==="classic-08"){
    l.walls=[r(215,500,155,24),r(215,500,24,145),r(28,315,190,24),r(310,365,202,24)];
    l.triangles=[{a:p(215,500),b:p(275,500),c:p(215,440)}];
    setPath(l,p(410,590),p(165,455),p(275,330),p(105,245));
  }
  if(l.id==="classic-09"){
    l.walls=[r(28,500,150,24),r(362,500,150,24),r(28,300,205,24),r(307,300,205,24),r(230,390,80,24)];
    l.bumpers=[{x:350,y:445,r:36}];
    setPath(l,p(270,570),p(350,445),p(205,355),p(270,235));
  }
  if(l.id==="classic-11"){
    l.sand=[r(60,440,420,230)];l.walls=[r(330,340,182,24),r(28,385,250,24)];
    setPath(l,p(260,690),p(300,535),p(410,420),p(430,250));
  }
  if(l.id==="classic-12"){
    l.walls=[r(28,535,190,24),r(322,535,190,24),r(258,285,24,205),r(28,360,250,24)];
    setPath(l,p(270,600),p(395,470),p(395,330),p(305,250),p(110,225));
  }
  if(l.id==="classic-13"){
    l.triangles=[{a:p(145,620),b:p(285,620),c:p(145,480)},{a:p(395,350),b:p(255,350),c:p(395,490)}];
    l.walls=[r(300,405,212,24)];l.bumpers=[{x:270,y:500,r:34}];
    setPath(l,p(215,620),p(270,500),p(210,405),p(330,300),p(410,230));
  }
  if(l.id==="classic-15"){
    l.walls=[r(145,420,24,230),r(371,420,24,230),r(28,300,300,24)];
    l.ice=[r(169,445,202,180)];
    setPath(l,p(270,665),p(270,500),p(405,370),p(405,260),p(110,220));
  }

  // --- CLASSIC 21+: advanced holes must not collapse into broad single-shot diagonals. ---
  if(l.id==="classic-21")l.fans=[{x:205,y:500,w:155,h:130,dx:1,dy:0,strength:275}];
  if(l.id==="classic-23"){
    l.walls=[r(160,635,160,24),r(220,495,160,24),r(160,355,160,24),r(330,405,24,205)];
    l.fans=[{x:330,y:650,w:125,h:100,dx:-1,dy:0,strength:285},{x:85,y:365,w:125,h:100,dx:1,dy:0,strength:260}];
    setPath(l,p(395,700),p(180,565),p(305,455),p(125,330),p(410,220));
  }
  if(l.id==="classic-24"){
    l.walls=[r(28,590,175,24),r(337,470,175,24),r(28,300,230,24),r(250,410,24,215)];
    l.bumpers=[{x:185,y:520,r:35}];l.fans=[{x:300,y:330,w:145,h:105,dx:-1,dy:0,strength:270}];
    setPath(l,p(330,655),p(185,520),p(315,390),p(115,235));
  }
  if(l.id==="classic-25"){
    l.walls=[r(28,515,145,24),r(355,285,157,24),r(285,395,227,24)];
    l.curves=[{x:250,y:500,r:118,startAngle:Math.PI*.55,endAngle:Math.PI*1.02,thickness:24}];
    setPath(l,p(130,590),p(250,475),p(285,365),p(420,245));
  }
  if(l.id==="classic-26"){
    l.walls=[r(245,500,185,24),r(245,500,24,165),r(28,360,255,24)];
    l.curves=[{x:220,y:500,r:105,startAngle:Math.PI*.05,endAngle:Math.PI*.55,thickness:24}];
    setPath(l,p(340,655),p(185,520),p(330,410),p(330,310),p(105,225));
  }
  if(l.id==="classic-27"){
    l.curves=[{x:350,y:570,r:92,startAngle:Math.PI*.55,endAngle:Math.PI,thickness:24},{x:190,y:350,r:92,startAngle:Math.PI*1.55,endAngle:Math.PI*2,thickness:24}];
    l.walls=[r(28,470,180,24),r(332,300,180,24),r(230,410,82,82)];
    setPath(l,p(365,680),p(365,520),p(170,420),p(170,285),p(420,225));
  }
  if(l.id==="classic-28"){
    l.fans=[{x:275,y:615,w:155,h:105,dx:-1,dy:0,strength:310}];
    l.curves=[{x:235,y:470,r:112,startAngle:Math.PI*.15,endAngle:Math.PI*.72,thickness:24}];
    l.walls=[r(305,300,207,24),r(28,420,220,24)];
    setPath(l,p(250,665),p(335,535),p(280,410),p(350,300),p(120,225));
  }
  if(l.id==="classic-30")setStars(l,3,4); // solver's 2-shot line is razor-thin (~6%), so keep it as mastery.
  if(l.id==="classic-31"){
    l.walls=[r(28,590,165,24),r(347,590,165,24),r(28,315,220,24),r(215,405,297,24)];
    l.movingWalls=[{x:245,y:475,w:24,h:105,axis:"x",amplitude:72,speed:.92,phase:.2}];
    setPath(l,p(270,650),p(270,520),p(170,455),p(390,350),p(420,235));
  }
  if(l.id==="classic-33")setStars(l,3,4);
  if(l.id==="classic-34"){
    l.walls=[r(28,620,250,24),r(280,455,232,24),r(28,285,230,24)];
    l.fans=[{x:320,y:630,w:150,h:105,dx:-1,dy:0,strength:285}];
    l.movingWalls=[{x:240,y:495,w:24,h:115,axis:"x",amplitude:80,speed:.98,phase:1.1}];
    setPath(l,p(150,680),p(360,555),p(150,420),p(360,330),p(120,225));
  }
  if(l.id==="classic-36")setStars(l,3,4);
  if(l.id==="classic-37"){
    l.voids=[r(28,475,405,145)];l.ramps=[{x:115,y:635,w:105,h:72,dx:1,dy:-.82,lift:350,boost:40}];
    l.walls=[r(433,475,79,145),r(325,300,187,24)];
    setPath(l,p(170,650),p(300,455),p(390,350),p(420,230));
  }
  if(l.id==="classic-38"){
    l.voids=[r(175,515,220,125)];l.ramps=[{x:330,y:640,w:100,h:70,dx:-1,dy:-.72,lift:360,boost:42}];
    l.walls=[r(28,405,205,24),r(290,290,222,24),r(28,335,300,24)];setStars(l,3,4);
    setPath(l,p(355,665),p(240,500),p(410,390),p(410,280),p(110,220));
  }
  if(l.id==="classic-39"){
    l.voids=[r(40,485,460,140)];l.trampolines=[{x:190,y:660,r:39,power:435}];
    l.walls=[r(28,405,175,24),r(337,285,175,24)];
    setPath(l,p(190,660),p(290,465),p(385,345),p(415,230));
  }
  if(l.id==="classic-40"){
    l.walls=[r(28,620,215,24),r(297,455,215,24),r(28,285,215,24),r(250,365,24,115)];
    l.voids=[r(205,520,120,90)];l.fans=[{x:320,y:650,w:145,h:105,dx:-1,dy:0,strength:285}];
    l.portals=[{a:{x:410,y:405,r:28},b:{x:150,y:350,r:28}}];l.movingBumpers=[{x:365,y:300,r:30,axis:"x",amplitude:62,speed:1.05,phase:.4}];
    setStars(l,4,5);setPath(l,p(355,680),p(165,555),p(410,405),p(150,350),p(365,280),p(110,220));
  }

  // --- HARD opening block: the surprise must matter after discovery, not just decorate the route. ---
  if(l.id==="troll-01"){
    l.walls=[r(75,360,24,260),r(441,360,24,260),r(28,285,285,24)];
    l.popWalls=[{x:180,y:430,w:180,h:22,triggerX:270,triggerY:625,triggerRadius:110}];
    setPath(l,p(390,650),p(390,420),p(350,330),p(270,230));
  }
  if(l.id==="troll-03"){
    l.walls=[r(258,355,24,330),r(28,300,160,24),r(352,300,160,24),r(300,245,212,24)];
    l.popVoids=[{x:68,y:415,w:145,h:90,triggerX:150,triggerY:610,triggerRadius:124}];
    setPath(l,p(400,635),p(400,390),p(155,330),p(250,270),p(270,210));
  }
  if(l.id==="troll-04"){
    l.popBumpers=[{x:315,y:390,r:34,triggerX:235,triggerY:545,triggerRadius:132}];
    setPath(l,p(385,660),p(205,545),p(315,390),p(330,250),p(390,205));
  }
  if(l.id==="troll-07")setStars(l,2,3); // HIO exists but is ~11% robust and engages bumper+trap.
  if(l.id==="troll-09"){
    l.walls=[r(28,590,155,24),r(355,455,157,24),r(28,295,220,24),r(275,350,237,24)];
    l.movingBumpers=[{x:255,y:520,r:31,axis:"x",amplitude:88,speed:1.08,phase:.4}];
    l.popVoids=[{x:315,y:430,w:135,h:75,triggerX:150,triggerY:540,triggerRadius:115}];
    setPath(l,p(145,680),p(145,535),p(355,490),p(120,405),p(120,230));
  }

  // --- HARD originality fixes identified by structural audit. ---
  if(l.id==="troll-13"){
    l.ice=[r(160,560,220,115)];l.walls=[r(28,505,170,24),r(342,410,170,24),r(28,285,235,24)];
    l.popBumpers=[{x:355,y:405,r:34,triggerX:260,triggerY:545,triggerRadius:112}];
    setPath(l,p(270,665),p(270,535),p(355,405),p(145,330),p(115,225));
  }
  if(l.id==="troll-20")l.fans=[{x:345,y:605,w:125,h:105,dx:-1,dy:0,strength:295}];
  if(l.id==="troll-29"){
    l.walls=[r(28,610,210,24),r(302,465,210,24),r(28,320,210,24)];
    l.portals=[{a:{x:405,y:565,r:28},b:{x:150,y:420,r:28}}];
    l.popVoids=[{x:295,y:355,w:125,h:68,triggerX:150,triggerY:420,triggerRadius:94}];
    setPath(l,p(405,660),p(405,565),p(150,420),p(390,300),p(120,225));
  }
  if(l.id==="troll-30"){
    l.walls=[r(235,620,277,24),r(28,470,220,24),r(285,320,227,24)];
    l.portals=[{a:{x:120,y:545,r:28},b:{x:390,y:395,r:28}}];
    l.popWalls=[{x:160,y:365,w:120,h:22,triggerX:390,triggerY:395,triggerRadius:94}];
    l.popBumpers=[{x:145,y:270,r:30,triggerX:210,triggerY:360,triggerRadius:90}];
    setPath(l,p(150,665),p(120,545),p(390,395),p(180,330),p(420,215));
  }
  if(l.id==="troll-34"){
    l.walls=[r(28,635,195,24),r(317,500,195,24),r(28,335,245,24)];
    l.movingWalls=[{x:245,y:455,w:24,h:115,axis:"y",amplitude:62,speed:1.08,phase:.4}];
    l.popVoids=[{x:320,y:410,w:125,h:70,triggerX:150,triggerY:540,triggerRadius:105}];
    setPath(l,p(150,685),p(150,535),p(365,435),p(120,300),p(425,220));
  }
  if(l.id==="troll-40"){
    l.portals=[{a:{x:405,y:455,r:28},b:{x:150,y:315,r:28}}];
    l.popWalls=[{x:310,y:270,w:22,h:110,triggerX:150,triggerY:315,triggerRadius:92}];
    setPath(l,p(405,700),p(160,565),p(405,455),p(150,315),p(365,235),p(425,205));
  }

  return l;
}
