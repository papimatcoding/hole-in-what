import type { LevelDefinition } from "../src/types";

const CERTIFIED_LEVEL_IDS=[
  "classic-01","classic-02","classic-03","classic-04","classic-05",
  "classic-06","classic-07","classic-08","classic-09","classic-10"
] as const;

const requested=(process.env.AUDIT_LEVEL_IDS??"").split(",").map(x=>x.trim()).filter(Boolean);
const ids=new Set(requested.length?requested:CERTIFIED_LEVEL_IDS);

export function scopeLevels(levels:LevelDefinition[]):LevelDefinition[]{
  if(process.env.AUDIT_SCOPE==="full")return levels;
  return levels.filter(level=>ids.has(level.id));
}

export function auditScopeLabel():string{
  return process.env.AUDIT_SCOPE==="full"?"full campaign":[...ids].join(", ");
}
