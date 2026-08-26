import type { CourseMechanic, GameMode, LevelDefinition, TrollTrapArchetype, Vec2 } from "../../types";

export const W=24;
export const r=(x:number,y:number,w:number,h:number)=>({x,y,w,h});
export const tri=(ax:number,ay:number,bx:number,by:number,cx:number,cy:number)=>({a:{x:ax,y:ay},b:{x:bx,y:by},c:{x:cx,y:cy}});
export const goal=(strokes:number)=>({maxStrokes:strokes});

export function base(mode:GameMode,index:number,ball:Vec2,hole:Vec2,three:number,two:number,primary:CourseMechanic):LevelDefinition{
  return{
    id:`${mode==="troll"?"troll":"classic"}-${String(index).padStart(2,"0")}`,
    mode,group:Math.ceil(index/10),ball,hole,threeStar:goal(three),twoStar:goal(two),authored:true,primaryMechanic:primary,
    designPath:[ball,hole],fairways:[],walls:[],triangles:[],curves:[],movingWalls:[],movingBumpers:[],sand:[],ice:[],boosters:[],fans:[],winds:[],portals:[],ramps:[],trampolines:[],voids:[],bumpers:[],popWalls:[],popBumpers:[],popVoids:[]
  };
}

export function path(level:LevelDefinition,...points:Vec2[]):LevelDefinition{
  level.designPath=[level.ball,...points,level.hole];
  return level;
}

export function trap(level:LevelDefinition,archetype:TrollTrapArchetype):LevelDefinition{
  level.trollArchetype=archetype;
  return level;
}

export const pt=(x:number,y:number):Vec2=>({x,y});
