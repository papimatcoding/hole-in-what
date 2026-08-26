import { buildCampaignCourse } from "../src/data/procedural/auditedCampaign";
import { sanitizeCourse } from "../src/data/procedural/courseUtils";
import type { CourseMechanic, LevelDefinition } from "../src/types";

function mechanicCount(level:LevelDefinition,mechanic:CourseMechanic):number {
  switch(mechanic){
    case "wall": return (level.walls?.length??0)+(level.triangles?.length??0)+(level.curves?.length??0);
    case "bumper": return (level.bumpers?.length??0)+(level.popBumpers?.length??0)+(level.movingBumpers?.length??0);
    case "sand": return level.sand?.length??0;
    case "ice": return level.ice?.length??0;
    case "booster": return level.boosters?.length??0;
    case "fan": return (level.fans?.length??0)+(level.winds?.length??0);
    case "portal": return level.portals?.length??0;
    case "curve": return level.curves?.length??0;
    case "moving": return (level.movingWalls?.length??0)+(level.movingBumpers?.length??0);
    case "void": return (level.voids?.length??0)+(level.popVoids?.length??0);
    case "ramp": return level.ramps?.length??0;
    case "trampoline": return level.trampolines?.length??0;
  }
}

const missing:string[]=[];
for(const mode of ["classic","troll"] as const){
  for(let index=1;index<=40;index+=1){
    const level=sanitizeCourse(buildCampaignCourse(mode,index));
    if(!level.authored||!level.primaryMechanic||level.primaryMechanic==="wall")continue;
    const count=mechanicCount(level,level.primaryMechanic);
    if(count===0)missing.push(`${level.id}: ${level.primaryMechanic}`);
  }
}

if(missing.length){
  console.error(`Missing authored primary mechanics after sanitization:\n${missing.join("\n")}`);
  process.exitCode=1;
}else{
  console.log("PASS all authored primary mechanics survive sanitization");
}
