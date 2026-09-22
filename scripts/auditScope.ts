import type { LevelDefinition } from "../src/types";

const ids=new Set((process.env.AUDIT_LEVEL_IDS??"").split(",").map(x=>x.trim()).filter(Boolean));

export function scopeLevels(levels:LevelDefinition[]):LevelDefinition[]{
  if(ids.size===0)return levels;
  return levels.filter(level=>ids.has(level.id));
}

export function auditScopeLabel():string{
  return ids.size?[...ids].join(", "):"full campaign";
}
