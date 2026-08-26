import type { CourseMechanic, GameMode, LevelDefinition, TrollTrapArchetype, Vec2 } from "../types";

const W=24;
const r=(x:number,y:number,w:number,h:number)=>({x,y,w,h});
const tri=(a:Vec2,b:Vec2,c:Vec2)=>({a,b,c});
const goal=(strokes:number)=>({maxStrokes:strokes});

function base(mode:GameMode,index:number,ball:Vec2,hole:Vec2,three:number,two:number,primary:CourseMechanic):LevelDefinition{
  return{
    id:`${mode==="troll"?"troll":"classic"}-${String(index).padStart(2,"0")}`,
    mode,group:Math.ceil(index/10),ball,hole,threeStar:goal(three),twoStar:goal(two),authored:true,primaryMechanic:primary,
    designPath:[ball,hole],fairways:[],walls:[],triangles:[],curves:[],movingWalls:[],movingBumpers:[],sand:[],ice:[],boosters:[],fans:[],winds:[],portals:[],ramps:[],trampolines:[],voids:[],bumpers:[],popWalls:[],popBumpers:[],popVoids:[]
  };
}
function path(level:LevelDefinition,...points:Vec2[]):LevelDefinition{level.designPath=[level.ball,...points,level.hole];return level;}
function trap(level:LevelDefinition,archetype:TrollTrapArchetype):LevelDefinition{level.trollArchetype=archetype;return level;}

// 01–03: open HIO fundamentals. Each asks for a different read: straight, diagonal, bank.
function c01():LevelDefinition{return base("classic",1,{x:270,y:820},{x:270,y:180},1,2,"wall");}
function c02():LevelDefinition{return base("classic",2,{x:135,y:820},{x:395,y:190},1,2,"wall");}
function c03():LevelDefinition{const l=base("classic",3,{x:120,y:820},{x:405,y:185},1,2,"wall");l.walls=[r(28,480,302,W)];return path(l,{x:448,y:545},{x:448,y:350});}

// 04–06: forgiving two-shot geometry. Difficulty comes from choosing a route, not tiny gaps.
function c04():LevelDefinition{const l=base("classic",4,{x:105,y:820},{x:420,y:180},2,3,"wall");l.walls=[r(248,370,W,360),r(248,370,142,W)];l.triangles=[tri({x:248,y:370},{x:306,y:370},{x:248,y:428})];return path(l,{x:420,y:690},{x:420,y:320});}
function c05():LevelDefinition{
  const l=base("classic",5,{x:270,y:820},{x:270,y:170},2,3,"wall");
  l.walls=[r(210,445,120,W),r(210,565,120,W),r(210,445,W,144),r(306,445,W,144)];
  return path(l,{x:390,y:625},{x:390,y:385});
}
function c06():LevelDefinition{const l=base("classic",6,{x:410,y:820},{x:135,y:185},2,3,"wall");l.walls=[r(345,440,W,260),r(185,420,160,W)];l.triangles=[tri({x:345,y:440},{x:285,y:440},{x:345,y:500}),tri({x:185,y:420},{x:245,y:420},{x:185,y:360})];return path(l,{x:270,y:700},{x:120,y:500},{x:120,y:300});}

// 07: first special mechanic. Bumper is useful but not compulsory.
function c07():LevelDefinition{const l=base("classic",7,{x:110,y:820},{x:420,y:180},2,3,"bumper");l.walls=[r(28,500,300,W),r(28,315,180,W)];l.bumpers=[{x:394,y:585,r:34}];return path(l,{x:394,y:585},{x:400,y:430},{x:410,y:260});}

// 08–10: geometry mastery. 10 is intentionally the hardest hole of chapter one.
function c08():LevelDefinition{
  const l=base("classic",8,{x:420,y:820},{x:110,y:180},2,3,"wall");
  l.walls=[r(28,575,280,W),r(220,345,292,W)];
  return path(l,{x:410,y:525},{x:120,y:405},{x:120,y:250});
}
function c09():LevelDefinition{
  const l=base("classic",9,{x:270,y:820},{x:270,y:170},2,3,"bumper");
  l.walls=[r(28,470,150,W),r(362,470,150,W),r(28,300,182,W),r(330,300,182,W)];
  l.bumpers=[{x:270,y:500,r:36}];
  return path(l,{x:270,y:500},{x:220,y:390},{x:270,y:250});
}
function c10():LevelDefinition{
  const l=base("classic",10,{x:115,y:820},{x:420,y:165},3,4,"wall");
  l.walls=[r(28,650,315,W),r(200,485,312,W),r(28,320,315,W)];
  return path(l,{x:425,y:705},{x:115,y:540},{x:425,y:375},{x:420,y:235});
}

// 11: sand tutorial is a deliberate small breather, but its route is still more involved than early Classic.
function c11():LevelDefinition{
  const l=base("classic",11,{x:105,y:820},{x:430,y:180},2,3,"sand");
  l.sand=[r(180,430,180,150)];
  l.walls=[r(28,620,230,W),r(312,330,200,W)];
  return path(l,{x:350,y:665},{x:260,y:520},{x:160,y:385},{x:430,y:250});
}
function c12():LevelDefinition{const l=base("classic",12,{x:270,y:820},{x:270,y:170},2,3,"wall");l.walls=[r(28,540,190,W),r(322,540,190,W),r(258,285,W,195)];return path(l,{x:270,y:500},{x:150,y:390},{x:150,y:255},{x:270,y:210});}
function c13():LevelDefinition{const l=base("classic",13,{x:130,y:820},{x:405,y:175},2,3,"bumper");l.triangles=[tri({x:145,y:610},{x:285,y:610},{x:145,y:470}),tri({x:395,y:350},{x:255,y:350},{x:395,y:490})];l.bumpers=[{x:270,y:485,r:32}];return path(l,{x:215,y:620},{x:270,y:485},{x:340,y:335},{x:405,y:245});}
function c14():LevelDefinition{const l=base("classic",14,{x:420,y:820},{x:125,y:175},3,4,"wall");l.walls=[r(28,600,180,W),r(208,410,304,W),r(28,250,250,W)];l.triangles=[tri({x:208,y:410},{x:268,y:410},{x:208,y:470})];return path(l,{x:120,y:550},{x:430,y:470},{x:430,y:335},{x:125,y:220});}
function c15():LevelDefinition{
  const l=base("classic",15,{x:270,y:820},{x:110,y:170},2,3,"ice");
  l.walls=[r(150,430,W,215),r(366,430,W,215),r(250,305,262,W)];
  l.ice=[r(174,455,192,165)];
  return path(l,{x:270,y:650},{x:270,y:420},{x:165,y:360},{x:110,y:235});
}

function h01():LevelDefinition{const l=trap(base("troll",1,{x:270,y:820},{x:270,y:170},2,3,"wall"),"gate-pop");l.walls=[r(75,360,W,260),r(441,360,W,260)];l.popWalls=[{x:180,y:430,w:180,h:22,triggerX:270,triggerY:610,triggerRadius:105}];return path(l,{x:390,y:520},{x:390,y:315},{x:270,y:220});}
function h02():LevelDefinition{const l=trap(base("troll",2,{x:115,y:820},{x:410,y:175},2,3,"bumper"),"bumper-ambush");l.walls=[r(28,475,315,W),r(28,300,155,W)];l.popBumpers=[{x:402,y:505,r:34,triggerX:365,triggerY:625,triggerRadius:112}];return path(l,{x:420,y:560},{x:420,y:390},{x:410,y:240});}
function h03():LevelDefinition{
  const l=trap(base("troll",3,{x:270,y:820},{x:270,y:170},3,4,"wall"),"safe-lane-collapse");
  l.walls=[r(258,355,W,330),r(28,305,150,W),r(362,305,150,W),r(285,275,227,W)];
  l.popVoids=[{x:70,y:405,w:135,h:90,triggerX:155,triggerY:610,triggerRadius:120}];
  return path(l,{x:390,y:625},{x:390,y:390},{x:160,y:335},{x:160,y:235},{x:270,y:190});
}
function h04():LevelDefinition{
  const l=trap(base("troll",4,{x:130,y:820},{x:385,y:175},3,4,"bumper"),"rebound-punish");
  l.walls=[r(28,610,250,W)];
  l.triangles=[tri({x:160,y:440},{x:255,y:440},{x:160,y:345}),tri({x:380,y:315},{x:285,y:315},{x:380,y:410})];
  l.popBumpers=[{x:355,y:255,r:33,triggerX:320,triggerY:405,triggerRadius:110}];
  return path(l,{x:380,y:660},{x:210,y:500},{x:315,y:365},{x:330,y:245},{x:385,y:205});
}
function h05():LevelDefinition{const l=trap(base("troll",5,{x:420,y:820},{x:115,y:170},3,4,"moving"),"late-combo");l.walls=[r(28,610,160,W),r(350,610,162,W),r(28,300,220,W)];l.movingWalls=[{x:245,y:480,w:24,h:105,axis:"x",amplitude:70,speed:1.02,phase:.6}];l.popWalls=[{x:235,y:330,w:150,h:22,triggerX:270,triggerY:455,triggerRadius:105}];l.popBumpers=[{x:125,y:255,r:30,triggerX:235,triggerY:330,triggerRadius:92}];return path(l,{x:265,y:660},{x:270,y:520},{x:410,y:390},{x:115,y:220});}

const CLASSIC=[c01(),c02(),c03(),c04(),c05(),c06(),c07(),c08(),c09(),c10(),c11(),c12(),c13(),c14(),c15()];
const HARD=[h01(),h02(),h03(),h04(),h05()];

export function authoredCourse(mode:GameMode,index:number):LevelDefinition|null{
  const source=mode==="classic"?CLASSIC:HARD;
  const level=source[index-1];
  return level?JSON.parse(JSON.stringify(level)) as LevelDefinition:null;
}
