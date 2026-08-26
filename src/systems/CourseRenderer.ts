import Phaser from "phaser";
import { GOLF_PHYSICS, type GolfSimulationState } from "./GolfSimulation";
import type { BoosterDef, CurveDef, FanDef, LevelDefinition, MovingBumperDef, MovingWallDef, RectDef, TrampolineDef, TriangleDef } from "../types";

const FIELD=GOLF_PHYSICS.field;
const HOLE_R=GOLF_PHYSICS.holeRadius;

const easeOutBack=(q:number):number=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(q-1,3)+c1*Math.pow(q-1,2);};

function animatedRect(r:RectDef,anim:number,back:boolean):RectDef{
  const q=back?easeOutBack(anim):Phaser.Math.Clamp(anim,0,1);
  if(r.w>=r.h)return{x:r.x,y:r.y+r.h*(1-q)/2,w:r.w,h:r.h*q};
  return{x:r.x+r.w*(1-q)/2,y:r.y,w:r.w*q,h:r.h};
}

function wall(g:Phaser.GameObjects.Graphics,r:RectDef,alpha=1):void{
  g.fillStyle(0x16212a,.3*alpha);g.fillRoundedRect(r.x+3,r.y+5,r.w,r.h,6);
  g.fillStyle(0x344657,alpha);g.fillRoundedRect(r.x,r.y,r.w,r.h,5);
  g.fillStyle(0x7890a2,.7*alpha);
  if(r.w>=r.h)g.fillRect(r.x+4,r.y+3,Math.max(0,r.w-8),Math.min(5,r.h/3));
  else g.fillRect(r.x+3,r.y+4,Math.min(5,r.w/3),Math.max(0,r.h-8));
}
function triangle(g:Phaser.GameObjects.Graphics,t:TriangleDef):void{
  g.fillStyle(0x344657,1);g.fillTriangle(t.a.x,t.a.y,t.b.x,t.b.y,t.c.x,t.c.y);
  g.lineStyle(2,0x8aa0b0,.65);g.beginPath();g.moveTo(t.a.x,t.a.y);g.lineTo(t.b.x,t.b.y);g.lineTo(t.c.x,t.c.y);g.closePath();g.strokePath();
}
function bumper(g:Phaser.GameObjects.Graphics,x:number,y:number,r:number):void{
  g.fillStyle(0x2d1b0d,.28);g.fillCircle(x+2,y+5,r*1.06);g.fillStyle(0xe5a347,1);g.fillCircle(x,y,r);
  g.lineStyle(3,0xffd78a,.72);g.strokeCircle(x,y,r*.8);g.fillStyle(0x5b3818,1);g.fillCircle(x,y,r*.42);
}
function zone(g:Phaser.GameObjects.Graphics,r:RectDef,fill:number,line:number):void{
  g.fillStyle(fill,.86);g.fillRoundedRect(r.x,r.y,r.w,r.h,15);g.lineStyle(2,line,.35);g.strokeRoundedRect(r.x+1,r.y+1,r.w-2,r.h-2,14);
}
function voidZone(g:Phaser.GameObjects.Graphics,r:RectDef,alpha:number):void{
  if(r.w<2||r.h<2)return;g.fillStyle(0x03080d,.92*alpha);g.fillRoundedRect(r.x,r.y,r.w,r.h,Math.min(16,r.w/4,r.h/4));
  g.lineStyle(2,0x3a5365,.7*alpha);g.strokeRoundedRect(r.x+2,r.y+2,Math.max(1,r.w-4),Math.max(1,r.h-4),12);
}
function arrow(g:Phaser.GameObjects.Graphics,r:{x:number;y:number;w:number;h:number;dx:number;dy:number},color:number):void{
  const cx=r.x+r.w/2,cy=r.y+r.h/2,len=Math.hypot(r.dx,r.dy)||1,dx=r.dx/len,dy=r.dy/len,px=-dy,py=dx;
  g.fillStyle(color,.88);g.fillTriangle(cx+dx*18,cy+dy*18,cx-dx*12+px*10,cy-dy*12+py*10,cx-dx*12-px*10,cy-dy*12-py*10);
}
function booster(g:Phaser.GameObjects.Graphics,b:BoosterDef):void{g.fillStyle(0x3e8b61,.96);g.fillRoundedRect(b.x,b.y,b.w,b.h,9);arrow(g,b,0xe8fff0);}
function ramp(g:Phaser.GameObjects.Graphics,r:BoosterDef):void{g.fillStyle(0x698da0,1);g.fillRoundedRect(r.x,r.y,r.w,r.h,9);arrow(g,r,0xf4fbff);}
function trampoline(g:Phaser.GameObjects.Graphics,t:TrampolineDef):void{
  g.fillStyle(0x1f5063,1);g.fillCircle(t.x,t.y,t.r);g.lineStyle(5,0x8de4f1,.95);g.strokeCircle(t.x,t.y,t.r*.78);g.lineStyle(2,0xe9feff,.72);g.strokeCircle(t.x,t.y,t.r*.46);
}
function curve(g:Phaser.GameObjects.Graphics,c:CurveDef):void{
  const t=c.thickness??22;g.lineStyle(t,0x344657,1);g.beginPath();g.arc(c.x,c.y,c.r,c.startAngle,c.endAngle,false);g.strokePath();
  g.lineStyle(2,0xa6bbc8,.5);g.beginPath();g.arc(c.x,c.y,c.r-t*.28,c.startAngle,c.endAngle,false);g.strokePath();
}
function fan(g:Phaser.GameObjects.Graphics,f:FanDef,seconds:number):void{
  const len=Math.hypot(f.dx,f.dy)||1,dx=f.dx/len,dy=f.dy/len,cx=f.x+f.w/2,cy=f.y+f.h/2;
  g.lineStyle(2,0xe8f7ee,.18);
  for(let i=-2;i<=2;i+=1){const px=-dy*i*18,py=dx*i*18,q=((seconds*.6+i*.17)%1)-.5;g.beginPath();g.moveTo(cx+px+dx*q*80,cy+py+dy*q*80);g.lineTo(cx+px+dx*(q*80+22),cy+py+dy*(q*80+22));g.strokePath();}
  g.fillStyle(0x435965,.95);g.fillCircle(cx-dx*45,cy-dy*45,18);g.lineStyle(2,0xb7cad6,.7);g.strokeCircle(cx-dx*45,cy-dy*45,18);
}
function portal(g:Phaser.GameObjects.Graphics,x:number,y:number,r:number,color:number,phase:number):void{
  g.fillStyle(0x071019,.45);g.fillCircle(x+2,y+4,r+4);g.lineStyle(4,color,.78);g.strokeCircle(x,y,r);g.lineStyle(1.5,0xf4fbff,.23);g.strokeCircle(x,y,r-7);
  for(let i=0;i<6;i+=1){const a=phase*1.8+i*Math.PI/3;g.fillStyle(color,.42);g.fillCircle(x+Math.cos(a)*(r+6),y+Math.sin(a)*(r+6),2);}
}
function movingWallRect(w:MovingWallDef,t:number):RectDef{const q=Math.sin(t*(w.speed??1.15)+(w.phase??0))*w.amplitude;return{x:w.x+(w.axis==="x"?q:0),y:w.y+(w.axis==="y"?q:0),w:w.w,h:w.h};}
function movingBumperPoint(b:MovingBumperDef,t:number):{x:number;y:number}{const q=Math.sin(t*(b.speed??1.3)+(b.phase??0))*b.amplitude;return{x:b.x+(b.axis==="x"?q:0),y:b.y+(b.axis==="y"?q:0)};}

function hole(g:Phaser.GameObjects.Graphics,level:LevelDefinition):void{
  const x=level.hole.x,y=level.hole.y;g.fillStyle(0x0b1014,.3);g.fillEllipse(x+3,y+6,HOLE_R*2.3,HOLE_R*1.35);g.fillStyle(0x101519,1);g.fillCircle(x,y,HOLE_R);
  g.lineStyle(2,0xcfe2d0,.38);g.strokeCircle(x,y,HOLE_R+2);g.lineStyle(3,0xf3f3f3,1);g.beginPath();g.moveTo(x,y);g.lineTo(x,y-58);g.strokePath();g.fillStyle(0xf2f2f2,1);g.fillTriangle(x,y-58,x+30,y-46,x,y-34);
}

export function drawCourse(g:Phaser.GameObjects.Graphics,level:LevelDefinition,state:GolfSimulationState):void{
  g.clear();g.fillStyle(0x000000,.32);g.fillRoundedRect(FIELD.x+4,FIELD.y+8,FIELD.w,FIELD.h,24);g.fillStyle(0x67b965,1);g.fillRoundedRect(FIELD.x,FIELD.y,FIELD.w,FIELD.h,22);g.lineStyle(3,0xa4d79c,.28);g.strokeRoundedRect(FIELD.x,FIELD.y,FIELD.w,FIELD.h,22);
  g.fillStyle(0xffffff,.035);for(let i=0;i<12;i+=2)g.fillRect(FIELD.x+i*FIELD.w/12,FIELD.y+2,FIELD.w/12,FIELD.h-4);
  for(const x of level.voids??[])voidZone(g,x,1);
  for(let i=0;i<(level.popVoids??[]).length;i+=1){const rt=state.popVoids[i];if(rt?.active)voidZone(g,animatedRect(level.popVoids![i]!,rt.anim,false),Math.min(1,rt.anim*1.25));}
  for(const x of level.ice??[])zone(g,x,0xa7ddea,0xe8fbff);for(const x of level.sand??[])zone(g,x,0xd9bd79,0xf0dca6);for(const x of level.boosters??[])booster(g,x);for(const x of level.ramps??[])ramp(g,x);for(const x of level.trampolines??[])trampoline(g,x);
  for(const x of level.walls??[])wall(g,x);for(const x of level.triangles??[])triangle(g,x);
  for(let i=0;i<(level.popWalls??[]).length;i+=1){const rt=state.popWalls[i];if(rt?.active)wall(g,animatedRect(level.popWalls![i]!,rt.anim,true),Math.min(1,rt.anim*1.5));}
  for(const x of level.bumpers??[])bumper(g,x.x,x.y,x.r);for(let i=0;i<(level.popBumpers??[]).length;i+=1){const rt=state.popBumpers[i],def=level.popBumpers![i];if(rt?.active&&def)bumper(g,def.x,def.y,def.r*easeOutBack(rt.anim));}
  hole(g,level);
}

export function drawDynamicCourse(g:Phaser.GameObjects.Graphics,level:LevelDefinition,seconds:number):void{
  g.clear();for(const f of [...(level.fans??[]),...(level.winds??[])])fan(g,f,seconds);
  for(const pair of level.portals??[]){portal(g,pair.a.x,pair.a.y,pair.a.r??28,0x82cbff,seconds);portal(g,pair.b.x,pair.b.y,pair.b.r??28,0xc39dff,-seconds);}
  for(const c of level.curves??[])curve(g,c);for(const w of level.movingWalls??[])wall(g,movingWallRect(w,seconds));for(const b of level.movingBumpers??[]){const p=movingBumperPoint(b,seconds);bumper(g,p.x,p.y,b.r);}
}
