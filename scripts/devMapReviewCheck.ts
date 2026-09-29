import assert from "node:assert/strict";
import { DevMapReviews, validateDevLevel } from "../src/systems/DevMapReviewSystem";
import type { LevelDefinition } from "../src/types";

const entries=new Map<string,string>();
Object.defineProperty(globalThis,"localStorage",{value:{getItem:(key:string)=>entries.get(key)??null,setItem:(key:string,value:string)=>{entries.set(key,value);}}});
const level:LevelDefinition={id:"editor-draft",mode:"classic",group:1,ball:{x:270,y:800},hole:{x:270,y:170},threeStar:{maxStrokes:2},twoStar:{maxStrokes:4},walls:[{x:220,y:430,w:80,h:20}],triangles:[{a:{x:80,y:320},b:{x:160,y:320},c:{x:160,y:400}}],popVoids:[{x:200,y:240,w:100,h:50,triggerX:260,triggerY:410,triggerRadius:55}]};
assert.equal(validateDevLevel(level),true);
const proposal=DevMapReviews.create(level,"Una ruta falsa","Colega","El tiro obvio abre el suelo");
assert.equal(DevMapReviews.import(JSON.stringify(proposal)).title,"Una ruta falsa");
assert.equal(DevMapReviews.list().length,1);
assert.throws(()=>DevMapReviews.import(JSON.stringify(proposal)),/ya importada/);
assert.equal(DevMapReviews.review(proposal.id,"rejected","El activador pisa el muro")?.review.note,"El activador pisa el muro");
assert.equal(DevMapReviews.list()[0]?.review.status,"rejected");
const bad=structuredClone(proposal);bad.id="bad";bad.level.popVoids![0]!.triggerRadius=Number.NaN;
assert.equal(validateDevLevel(bad.level),false);
assert.throws(()=>DevMapReviews.import(JSON.stringify(bad)),/no válida/);
console.log("Dev map proposals: import, duplicate, review and trap validation OK");
