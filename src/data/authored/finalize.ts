import type { LevelDefinition } from "../../types";

/** Tiny authored-only corrections discovered by integrity checks. These are explicit geometry
 * edits, never procedural generation. Keep this file small; fold stable values back into source
 * courses after the current campaign review. */
export function finalizeAuthored(level:LevelDefinition):LevelDefinition{
  const l=JSON.parse(JSON.stringify(level)) as LevelDefinition;
  if(l.id==="classic-21")l.fans=[{x:205,y:500,w:155,h:130,dx:1,dy:0,strength:275}];
  if(l.id==="classic-40"&&l.portals?.[0])l.portals[0].b={x:150,y:350,r:28};
  if(l.id==="troll-20")l.fans=[{x:345,y:605,w:125,h:105,dx:-1,dy:0,strength:295}];
  if(l.id==="troll-40"&&l.portals?.[0])l.portals[0].b={x:150,y:315,r:28};
  return l;
}
