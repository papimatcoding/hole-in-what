import Phaser from "phaser";
import { pointerToDesign, setupDesignCamera, sharpenSceneText } from "../config/display";
import { cosmeticById, type CosmeticDefinition } from "../data/cosmetics";
import { levelFor } from "../data/campaign";
import { AudioFeedback, type FeedbackSound } from "../systems/AudioFeedback";
import { drawBall } from "../systems/CosmeticRenderer";
import {
  GOLF_PHYSICS,
  GolfSimulation,
  powerFromPhysicalPull,
  type SimulationEvent,
  type SimulationEventKind
} from "../systems/GolfSimulation";
import { MECHANIC_TUTORIALS, markMechanicSeen, unseenMechanics, type MechanicId } from "../systems/MechanicTutorialSystem";
import { SaveSystem } from "../systems/SaveSystem";
import { formatRequirement, starsForRun } from "../systems/StarScoring";
import type {
  BoosterDef,
  CurveDef,
  FanDef,
  GameSceneData,
  LevelDefinition,
  MovingBumperDef,
  MovingWallDef,
  RectDef,
  TrampolineDef,
  TriangleDef
} from "../types";

interface TrailParticle {
  x:number; y:number; vx:number; vy:number; life:number; maxLife:number; size:number; phase:number;
}

const FIELD=GOLF_PHYSICS.field;
const BALL_R=GOLF_PHYSICS.ballRadius;
const HOLE_R=GOLF_PHYSICS.holeRadius;
const AIR_VISUAL_SCALE=.18;
const TUTORIAL_KEY="troll-golf-control-onboarding-v1";

export class GameplayScene extends Phaser.Scene {
  private mode:GameSceneData["mode"]="classic";
  private levelIndex=0;
  private level!:LevelDefinition;
  private sim!:GolfSimulation;
  private course!:Phaser.GameObjects.Graphics;
  private dynamic!:Phaser.GameObjects.Graphics;
  private aim!:Phaser.GameObjects.Graphics;
  private trailView!:Phaser.GameObjects.Graphics;
  private shadowView!:Phaser.GameObjects.Graphics;
  private ballView!:Phaser.GameObjects.Container;
  private ballGraphic!:Phaser.GameObjects.Graphics;
  private strokeText!:Phaser.GameObjects.Text;
  private timeText!:Phaser.GameObjects.Text;
  private ballCosmetic!:CosmeticDefinition;
  private trailCosmetic!:CosmeticDefinition;
  private holeCosmetic!:CosmeticDefinition;
  private dragPointer:Phaser.Input.Pointer|null=null;
  private strokes=0;
  private startedAt=0;
  private sinking=false;
  private voidAnimating=false;
  private tutorialQueue:MechanicId[]=[];
  private tutorialCard:Phaser.GameObjects.Container|null=null;
  private controlHint:Phaser.GameObjects.Container|null=null;
  private trailParticles:TrailParticle[]=[];
  private trailAccumulator=0;
  private soundCooldown=new Map<FeedbackSound,number>();

  constructor(){super("game");}

  init(data:GameSceneData):void{
    this.mode=data.mode;
    this.levelIndex=data.levelIndex;
    this.level=levelFor(this.mode,this.levelIndex);
    this.sim=new GolfSimulation(this.level);
  }

  create():void{
    setupDesignCamera(this);
    this.cameras.main.setBackgroundColor("#0b0f14");
    this.strokes=0;this.sinking=false;this.voidAnimating=false;this.startedAt=performance.now();
    this.trailParticles=[];this.trailAccumulator=0;this.soundCooldown.clear();

    const equipped=SaveSystem.cosmetics().equipped;
    this.ballCosmetic=cosmeticById(equipped.ball)??cosmeticById("ball-classic")!;
    this.trailCosmetic=cosmeticById(equipped.trail)??cosmeticById("trail-none")!;
    this.holeCosmetic=cosmeticById(equipped.holeEffect)??cosmeticById("hole-default")!;

    this.course=this.add.graphics().setDepth(0);
    this.dynamic=this.add.graphics().setDepth(5);
    this.trailView=this.add.graphics().setDepth(6);
    this.shadowView=this.add.graphics().setDepth(7);
    this.aim=this.add.graphics().setDepth(15);
    this.ballGraphic=this.add.graphics();
    drawBall(this.ballGraphic,this.ballCosmetic,0,0,BALL_R);
    this.ballView=this.add.container(this.sim.state.ball.x,this.sim.state.ball.y,[this.ballGraphic]).setDepth(10);

    this.createHud();
    this.input.on("pointerdown",(p:Phaser.Input.Pointer)=>this.onPointerDown(p));
    this.input.on("pointermove",(p:Phaser.Input.Pointer)=>this.onPointerMove(p));
    this.input.on("pointerup",(p:Phaser.Input.Pointer)=>this.onPointerUp(p));

    this.drawCourse();this.drawDynamic(0);this.updateBallRender();
    this.tutorialQueue=unseenMechanics(this.level);
    if(this.tutorialQueue.length>0)this.showNextMechanicTutorial();
    else this.maybeShowControlHint();
    sharpenSceneText(this);
  }

  update(time:number,deltaMs:number):void{
    if(this.sinking)return;
    const now=performance.now();
    this.timeText.setText(`${((now-this.startedAt)/1000).toFixed(1)} s`);
    for(const [sound,until] of this.soundCooldown)if(until<=now)this.soundCooldown.delete(sound);
    if(this.tutorialCard||this.voidAnimating){this.drawDynamic(time/1000);return;}

    const dt=Math.min(deltaMs/1000,.033);
    if(this.sim.state.moving){
      const events=this.sim.step(dt);
      this.consumeSimulationEvents(events);
    }
    this.updateTrail(dt);
    this.updateBallRender();
    this.drawCourse();
    this.drawDynamic(time/1000);
  }

  private createHud():void{
    this.add.rectangle(270,69,306,52,0x0a0f14,.80).setStrokeStyle(1,0x26323d,.82).setDepth(18);
    this.strokeText=this.add.text(42,42,"Golpes 0",{fontFamily:"system-ui, sans-serif",fontSize:"15px",fontStyle:"bold",color:"#f5f7fa"}).setDepth(20);
    this.timeText=this.add.text(498,42,"0.0 s",{fontFamily:"system-ui, sans-serif",fontSize:"15px",color:"#f5f7fa"}).setOrigin(1,0).setDepth(20);
    this.add.text(270,58,`★★★  ${formatRequirement(this.level.threeStar)}`,{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:"#f0d37e"}).setOrigin(.5).setDepth(20);
    this.add.text(270,80,`★★  ${formatRequirement(this.level.twoStar)}`,{fontFamily:"system-ui, sans-serif",fontSize:"11px",color:"#b9c5cf"}).setOrigin(.5).setDepth(20);
    this.add.text(42,84,"‹",{fontFamily:"system-ui, sans-serif",fontSize:"36px",color:"#f5f7fa"}).setDepth(20).setInteractive({useHandCursor:true})
      .on("pointerup",()=>this.scene.start("level-select",{mode:this.mode,page:Math.floor(this.levelIndex/10)}));
  }

  private onPointerDown(pointer:Phaser.Input.Pointer):void{
    AudioFeedback.unlock();
    if(this.tutorialCard||this.sim.state.moving||this.sinking||this.voidAnimating||this.sim.isAirborne())return;
    const p=pointerToDesign(this,pointer),b=this.sim.state.ball;
    if(Phaser.Math.Distance.Between(p.x,p.y,b.x,b.y)<=62){this.dragPointer=pointer;this.drawAim(p.x,p.y);}
  }

  private onPointerMove(pointer:Phaser.Input.Pointer):void{
    if(!this.dragPointer||this.sim.state.moving||this.sinking)return;
    const p=pointerToDesign(this,pointer);this.drawAim(p.x,p.y);
  }

  private onPointerUp(pointer:Phaser.Input.Pointer):void{
    if(!this.dragPointer||this.sim.state.moving||this.sinking)return;
    const p=pointerToDesign(this,pointer),b=this.sim.state.ball;
    const dx=b.x-p.x,dy=b.y-p.y,len=Math.hypot(dx,dy);
    this.dragPointer=null;this.aim.clear();
    if(len<12)return;
    const angle=Math.atan2(dy,dx),power=powerFromPhysicalPull(len);
    if(!this.sim.launch(angle,power))return;
    this.strokes+=1;this.strokeText.setText(`Golpes ${this.strokes}`);
    this.hideControlHint();
    try{localStorage.setItem(TUTORIAL_KEY,"1");}catch{/* optional */}
    AudioFeedback.play("shot",.65+power*.45);
    this.playImpactFx(b.x,b.y,0xcbe8ff,14+power*8,.35);
  }

  private drawAim(pointerX:number,pointerY:number):void{
    const b=this.sim.state.ball;let dx=b.x-pointerX,dy=b.y-pointerY;const len=Math.hypot(dx,dy)||1;
    const power=powerFromPhysicalPull(len),visualPull=Math.min(len,GOLF_PHYSICS.maxPull/GOLF_PHYSICS.dragGain);dx/=len;dy/=len;
    this.aim.clear();
    this.aim.lineStyle(4,0x8bc5ff,.92);this.aim.beginPath();this.aim.moveTo(b.x,b.y);this.aim.lineTo(b.x-dx*visualPull,b.y-dy*visualPull);this.aim.strokePath();
    this.aim.fillStyle(0xedf7ff,.72);
    const reach=70+power*105;
    for(let i=1;i<=8;i+=1){const q=i/8;this.aim.fillCircle(b.x+dx*reach*q,b.y+dy*reach*q,3.4-q*1.5);}
  }

  private consumeSimulationEvents(events:SimulationEvent[]):void{
    for(const event of events){
      switch(event.kind){
        case "wall-hit":this.feedback(event,"wall",0xb7cad8,18,.00055);break;
        case "bumper-hit":this.feedback(event,"bumper",0xffcf78,27,.00115);break;
        case "surface-sand":this.playSound("sand",1,120);break;
        case "surface-ice":this.playSound("ice",1,120);break;
        case "portal":this.feedback(event,"portal",0xaecbff,31,.00075);break;
        case "curve-hit":this.feedback(event,"wall",0x9fb9c8,20,.0006);break;
        case "moving-hit":this.feedback(event,"bumper",0xbdd7e5,25,.0009);break;
        case "ramp":case "trampoline":this.feedback(event,"jump",0xd9f5ff,25,.00065);break;
        case "landing":this.feedback(event,"land",0xeaf8ff,22,.00045);break;
        case "void":this.feedback(event,"void",0x5a7182,34,.00145);this.startVoidReset();break;
        case "trap-wall":case "trap-bumper":case "trap-void":this.feedback(event,"trap",0xf0b869,36,.00165);break;
        case "hole-lip":this.feedback(event,"lip",0xf1e7b7,22,.0005);break;
        case "hole":this.playSound("hole",1,0);this.finishHole();break;
        default:break;
      }
    }
  }

  private feedback(event:SimulationEvent,sound:FeedbackSound,color:number,radius:number,shake:number):void{
    this.playSound(sound,1,sound==="wall"?65:95);this.playImpactFx(event.x,event.y,color,radius,.62);if(shake>0)this.cameras.main.shake(32,shake);
  }

  private playSound(sound:FeedbackSound,intensity:number,cooldownMs:number):void{
    const now=performance.now(),until=this.soundCooldown.get(sound)??0;if(now<until)return;
    AudioFeedback.play(sound,intensity);if(cooldownMs>0)this.soundCooldown.set(sound,now+cooldownMs);
  }

  private playImpactFx(x:number,y:number,color:number,radius:number,alpha:number):void{
    const ring=this.add.circle(x,y,Math.max(5,radius*.42),0xffffff,0).setStrokeStyle(2,color,alpha).setDepth(13);
    this.tweens.add({targets:ring,scale:2.1,alpha:0,duration:220,ease:"Cubic.easeOut",onComplete:()=>ring.destroy()});
  }

  private startVoidReset():void{
    if(this.voidAnimating)return;this.voidAnimating=true;this.dragPointer=null;this.aim.clear();
    this.tweens.add({targets:this.ballView,alpha:0,scale:.12,y:this.ballView.y+10,duration:245,ease:"Cubic.easeIn",onComplete:()=>{
      this.sim.resetAfterVoid();const b=this.sim.state.ball;this.ballView.setPosition(b.x,b.y).setScale(1).setAlpha(1);
      this.time.delayedCall(110,()=>{this.voidAnimating=false;this.updateBallRender();});
    }});
  }

  private finishHole():void{
    if(this.sinking)return;this.sinking=true;this.dragPointer=null;this.aim.clear();this.playHoleEffect();
    const timeMs=Math.round(performance.now()-this.startedAt),stars=starsForRun(this.level,this.strokes,timeMs);
    this.tweens.add({targets:this.ballView,x:this.level.hole.x,y:this.level.hole.y,scale:.06,alpha:0,duration:350,ease:"Cubic.easeOut",onComplete:()=>{
      this.time.delayedCall(90,()=>this.scene.start("results",{mode:this.mode,levelIndex:this.levelIndex,levelId:this.level.id,strokes:this.strokes,timeMs,stars}));
    }});
  }

  private updateBallRender():void{
    const b=this.sim.state.ball,height=Math.max(0,b.z),lift=height*AIR_VISUAL_SCALE,scale=1+Math.min(.13,height/1700);
    this.ballView.setPosition(b.x,b.y-lift).setScale(scale).setDepth(height>1?12:10);
    this.shadowView.clear();const shadowScale=Phaser.Math.Clamp(1-height/900,.52,1),shadowAlpha=Phaser.Math.Clamp(.24-height/2600,.07,.24);
    this.shadowView.fillStyle(0x07100b,shadowAlpha);this.shadowView.fillEllipse(b.x+2,b.y+5,28*shadowScale,12*shadowScale);
  }

  private updateTrail(dt:number):void{
    for(let i=this.trailParticles.length-1;i>=0;i-=1){const p=this.trailParticles[i]!;p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.life<=0)this.trailParticles.splice(i,1);}
    if(this.sim.state.moving&&this.trailCosmetic.id!=="trail-none"&&Math.hypot(this.sim.state.ball.vx,this.sim.state.ball.vy)>70){
      this.trailAccumulator+=dt;const interval=this.trailCosmetic.id==="trail-sparks"?.022:.032;
      while(this.trailAccumulator>=interval){this.trailAccumulator-=interval;this.spawnTrailParticle();}
    }else this.trailAccumulator=0;
    this.drawTrail();
  }

  private spawnTrailParticle():void{
    const b=this.sim.state.ball,isPetal=this.trailCosmetic.id==="trail-petals",isSpark=this.trailCosmetic.id==="trail-sparks"||this.trailCosmetic.id==="trail-stardust",isAurora=this.trailCosmetic.id==="trail-aurora";
    const maxLife=isPetal?.62:isSpark?.34:isAurora?.58:.50;
    this.trailParticles.push({x:b.x+Phaser.Math.FloatBetween(-3,3),y:b.y-b.z*AIR_VISUAL_SCALE+Phaser.Math.FloatBetween(-3,3),vx:Phaser.Math.FloatBetween(-12,12),vy:isPetal?Phaser.Math.FloatBetween(-6,18):Phaser.Math.FloatBetween(-10,10),life:maxLife,maxLife,size:isSpark?Phaser.Math.FloatBetween(2,4):Phaser.Math.FloatBetween(3,6),phase:Math.random()*Math.PI*2});
    if(this.trailParticles.length>90)this.trailParticles.shift();
  }

  private drawTrail():void{
    this.trailView.clear();const secondary=this.trailCosmetic.secondary??this.trailCosmetic.primary;
    for(let i=0;i<this.trailParticles.length;i+=1){const p=this.trailParticles[i]!,life=Math.max(0,p.life/p.maxLife),color=i%2===0?this.trailCosmetic.primary:secondary;
      if(this.trailCosmetic.id==="trail-petals"){const wave=Math.sin(p.phase+p.life*12)*3;this.trailView.fillStyle(color,life*.72);this.trailView.fillTriangle(p.x-p.size,p.y+wave,p.x+p.size*.8,p.y-p.size*.65+wave,p.x+p.size,p.y+p.size*.55+wave);}
      else if(this.trailCosmetic.id==="trail-sparks"||this.trailCosmetic.id==="trail-stardust"){this.trailView.lineStyle(Math.max(1,p.size*.45),color,life*.85);this.trailView.beginPath();this.trailView.moveTo(p.x-p.vx*.08-4,p.y-p.vy*.08);this.trailView.lineTo(p.x+4,p.y);this.trailView.strokePath();}
      else if(this.trailCosmetic.id==="trail-aurora"){this.trailView.lineStyle(Math.max(2,p.size*.75),color,life*.34);this.trailView.beginPath();this.trailView.moveTo(p.x-8,p.y+Math.sin(p.phase+p.life*10)*4);this.trailView.lineTo(p.x+7,p.y-Math.sin(p.phase+p.life*10)*4);this.trailView.strokePath();}
      else{this.trailView.fillStyle(color,life*.42);this.trailView.fillCircle(p.x,p.y,p.size*(.45+life*.55));}
    }
  }

  private maybeShowControlHint():void{
    if(this.mode!=="classic"||this.levelIndex!==0||this.strokes>0)return;
    try{if(localStorage.getItem(TUTORIAL_KEY)==="1")return;}catch{/* show it */}
    const b=this.sim.state.ball,g=this.add.graphics();
    g.lineStyle(4,0xdceeff,.82);g.beginPath();g.moveTo(b.x,b.y+25);g.lineTo(b.x,b.y+105);g.strokePath();
    g.fillStyle(0xdceeff,.9);g.fillTriangle(b.x,b.y+118,b.x-10,b.y+96,b.x+10,b.y+96);
    const finger=this.add.circle(b.x,b.y+23,13,0xf4f7fa,.88).setStrokeStyle(3,0x7890a2,.8);
    const label=this.add.text(b.x,b.y+146,"ARRASTRA HACIA ATRÁS · SUELTA",{fontFamily:"system-ui, sans-serif",fontSize:"13px",fontStyle:"bold",color:"#eff7fb"}).setOrigin(.5);
    this.controlHint=this.add.container(0,0,[g,finger,label]).setDepth(30).setAlpha(.92);
    this.tweens.add({targets:finger,y:b.y+88,duration:850,yoyo:true,repeat:-1,ease:"Sine.easeInOut"});
  }

  private hideControlHint():void{if(this.controlHint){this.controlHint.destroy(true);this.controlHint=null;}}

  private showNextMechanicTutorial():void{
    const id=this.tutorialQueue[0];if(!id){this.tutorialCard=null;this.startedAt=performance.now();this.maybeShowControlHint();return;}
    const tutorial=MECHANIC_TUTORIALS[id];
    const bg=this.add.rectangle(270,805,442,132,0x101820,.97).setStrokeStyle(1.5,0x405364,.95).setInteractive({useHandCursor:true});
    const icon=this.add.circle(112,805,31,0x1d2b36,1).setStrokeStyle(2,0x7893a5,.65);
    const glyph=this.add.text(112,804,this.mechanicGlyph(id),{fontFamily:"system-ui, sans-serif",fontSize:"20px",fontStyle:"bold",color:"#f0d37e"}).setOrigin(.5);
    const title=this.add.text(160,770,tutorial.title,{fontFamily:"system-ui, sans-serif",fontSize:"15px",fontStyle:"bold",color:"#f5f7fa"});
    const line=this.add.text(160,798,tutorial.hint,{fontFamily:"system-ui, sans-serif",fontSize:"12px",color:"#b9c5cf",wordWrap:{width:294},lineSpacing:2});
    const tap=this.add.text(420,854,"TOCA",{fontFamily:"system-ui, sans-serif",fontSize:"10px",fontStyle:"bold",color:"#758696"}).setOrigin(1,.5);
    this.tutorialCard=this.add.container(0,0,[bg,icon,glyph,title,line,tap]).setDepth(100).setAlpha(0);
    this.tweens.add({targets:this.tutorialCard,alpha:1,y:-8,duration:180,ease:"Cubic.easeOut"});
    bg.on("pointerup",()=>{markMechanicSeen(id);this.tutorialQueue.shift();this.tutorialCard?.destroy(true);this.tutorialCard=null;this.showNextMechanicTutorial();});
  }

  private mechanicGlyph(id:MechanicId):string{
    const glyphs:Record<MechanicId,string>={bumper:"●",sand:"≈",ice:"◇",booster:"➜",ramp:"↗",trampoline:"↥",void:"○",fan:"≋",portal:"◎",curve:"◜",moving:"↔"};return glyphs[id];
  }

  private drawCourse():void{
    const g=this.course;g.clear();g.fillStyle(0x000000,.32);g.fillRoundedRect(FIELD.x+4,FIELD.y+8,FIELD.w,FIELD.h,24);g.fillStyle(0x67b965,1);g.fillRoundedRect(FIELD.x,FIELD.y,FIELD.w,FIELD.h,22);g.lineStyle(3,0xa4d79c,.28);g.strokeRoundedRect(FIELD.x,FIELD.y,FIELD.w,FIELD.h,22);
    g.fillStyle(0xffffff,.035);for(let i=0;i<12;i+=2)g.fillRect(FIELD.x+i*FIELD.w/12,FIELD.y+2,FIELD.w/12,FIELD.h-4);
    for(const v of this.level.voids??[])this.drawVoid(g,v,1);
    for(let i=0;i<(this.level.popVoids??[]).length;i+=1){const rt=this.sim.state.popVoids[i];if(rt?.active)this.drawVoid(g,this.animatedRect(this.level.popVoids![i]!,rt.anim,false),Math.min(1,rt.anim*1.25));}
    for(const x of this.level.ice??[])this.drawZone(g,x,0xa7ddea,0xe8fbff);
    for(const x of this.level.sand??[])this.drawZone(g,x,0xd9bd79,0xf0dca6);
    for(const x of this.level.boosters??[])this.drawBooster(g,x);
    for(const x of this.level.ramps??[])this.drawRamp(g,x);
    for(const x of this.level.trampolines??[])this.drawTrampoline(g,x);
    for(const x of this.level.walls??[])this.drawWall(g,x);
    for(const x of this.level.triangles??[])this.drawTriangle(g,x);
    for(let i=0;i<(this.level.popWalls??[]).length;i+=1){const rt=this.sim.state.popWalls[i];if(rt?.active)this.drawWall(g,this.animatedRect(this.level.popWalls![i]!,rt.anim,true),Math.min(1,rt.anim*1.5));}
    for(const x of this.level.bumpers??[])this.drawBumper(g,x.x,x.y,x.r);
    for(let i=0;i<(this.level.popBumpers??[]).length;i+=1){const rt=this.sim.state.popBumpers[i],def=this.level.popBumpers![i];if(rt?.active&&def)this.drawBumper(g,def.x,def.y,def.r*this.easeOutBack(rt.anim));}
    this.drawHole(g);
  }

  private drawDynamic(seconds:number):void{
    const g=this.dynamic;g.clear();for(const fan of [...(this.level.fans??[]),...(this.level.winds??[])])this.drawFan(g,fan,seconds);
    for(const pair of this.level.portals??[]){this.drawPortal(g,pair.a.x,pair.a.y,pair.a.r??28,0x82cbff,seconds);this.drawPortal(g,pair.b.x,pair.b.y,pair.b.r??28,0xc39dff,-seconds);}
    for(const c of this.level.curves??[])this.drawCurve(g,c);
    for(const wall of this.level.movingWalls??[])this.drawWall(g,this.movingWallRect(wall,seconds));
    for(const bumper of this.level.movingBumpers??[]){const p=this.movingBumperPoint(bumper,seconds);this.drawBumper(g,p.x,p.y,bumper.r);}
  }

  private drawWall(g:Phaser.GameObjects.Graphics,rect:RectDef,alpha=1):void{g.fillStyle(0x16212a,.3*alpha);g.fillRoundedRect(rect.x+3,rect.y+5,rect.w,rect.h,6);g.fillStyle(0x344657,alpha);g.fillRoundedRect(rect.x,rect.y,rect.w,rect.h,5);g.fillStyle(0x7890a2,.7*alpha);if(rect.w>=rect.h)g.fillRect(rect.x+4,rect.y+3,Math.max(0,rect.w-8),Math.min(5,rect.h/3));else g.fillRect(rect.x+3,rect.y+4,Math.min(5,rect.w/3),Math.max(0,rect.h-8));}
  private drawTriangle(g:Phaser.GameObjects.Graphics,t:TriangleDef):void{g.fillStyle(0x344657,1);g.fillTriangle(t.a.x,t.a.y,t.b.x,t.b.y,t.c.x,t.c.y);g.lineStyle(2,0x8aa0b0,.65);g.beginPath();g.moveTo(t.a.x,t.a.y);g.lineTo(t.b.x,t.b.y);g.lineTo(t.c.x,t.c.y);g.closePath();g.strokePath();}
  private drawBumper(g:Phaser.GameObjects.Graphics,x:number,y:number,r:number):void{g.fillStyle(0x2d1b0d,.28);g.fillCircle(x+2,y+5,r*1.06);g.fillStyle(0xe5a347,1);g.fillCircle(x,y,r);g.lineStyle(3,0xffd78a,.72);g.strokeCircle(x,y,r*.8);g.fillStyle(0x5b3818,1);g.fillCircle(x,y,r*.42);}
  private drawZone(g:Phaser.GameObjects.Graphics,r:RectDef,fill:number,line:number):void{g.fillStyle(fill,.86);g.fillRoundedRect(r.x,r.y,r.w,r.h,15);g.lineStyle(2,line,.35);g.strokeRoundedRect(r.x+1,r.y+1,r.w-2,r.h-2,14);}
  private drawVoid(g:Phaser.GameObjects.Graphics,r:RectDef,alpha:number):void{if(r.w<2||r.h<2)return;g.fillStyle(0x03080d,.92*alpha);g.fillRoundedRect(r.x,r.y,r.w,r.h,Math.min(16,r.w/4,r.h/4));g.lineStyle(2,0x3a5365,.7*alpha);g.strokeRoundedRect(r.x+2,r.y+2,Math.max(1,r.w-4),Math.max(1,r.h-4),12);}
  private drawBooster(g:Phaser.GameObjects.Graphics,b:BoosterDef):void{g.fillStyle(0x3e8b61,.96);g.fillRoundedRect(b.x,b.y,b.w,b.h,9);this.drawArrow(g,b,0xe8fff0);}
  private drawRamp(g:Phaser.GameObjects.Graphics,r:BoosterDef):void{g.fillStyle(0x698da0,1);g.fillRoundedRect(r.x,r.y,r.w,r.h,9);this.drawArrow(g,r,0xf4fbff);}
  private drawTrampoline(g:Phaser.GameObjects.Graphics,t:TrampolineDef):void{g.fillStyle(0x1f5063,1);g.fillCircle(t.x,t.y,t.r);g.lineStyle(5,0x8de4f1,.95);g.strokeCircle(t.x,t.y,t.r*.78);g.lineStyle(2,0xe9feff,.72);g.strokeCircle(t.x,t.y,t.r*.46);}
  private drawArrow(g:Phaser.GameObjects.Graphics,r:{x:number;y:number;w:number;h:number;dx:number;dy:number},color:number):void{const cx=r.x+r.w/2,cy=r.y+r.h/2,len=Math.hypot(r.dx,r.dy)||1,dx=r.dx/len,dy=r.dy/len,px=-dy,py=dx;g.fillStyle(color,.88);g.fillTriangle(cx+dx*18,cy+dy*18,cx-dx*12+px*10,cy-dy*12+py*10,cx-dx*12-px*10,cy-dy*12-py*10);}
  private drawFan(g:Phaser.GameObjects.Graphics,f:FanDef,seconds:number):void{const len=Math.hypot(f.dx,f.dy)||1,dx=f.dx/len,dy=f.dy/len,cx=f.x+f.w/2,cy=f.y+f.h/2;g.lineStyle(2,0xe8f7ee,.18);for(let i=-2;i<=2;i+=1){const px=-dy*i*18,py=dx*i*18,q=((seconds*.6+i*.17)%1)-.5;g.beginPath();g.moveTo(cx+px+dx*q*80,cy+py+dy*q*80);g.lineTo(cx+px+dx*(q*80+22),cy+py+dy*(q*80+22));g.strokePath();}g.fillStyle(0x435965,.95);g.fillCircle(cx-dx*45,cy-dy*45,18);g.lineStyle(2,0xb7cad6,.7);g.strokeCircle(cx-dx*45,cy-dy*45,18);}
  private drawPortal(g:Phaser.GameObjects.Graphics,x:number,y:number,r:number,color:number,phase:number):void{g.fillStyle(0x071019,.45);g.fillCircle(x+2,y+4,r+4);g.lineStyle(4,color,.78);g.strokeCircle(x,y,r);g.lineStyle(1.5,0xf4fbff,.23);g.strokeCircle(x,y,r-7);for(let i=0;i<6;i+=1){const a=phase*1.8+i*Math.PI/3;g.fillStyle(color,.42);g.fillCircle(x+Math.cos(a)*(r+6),y+Math.sin(a)*(r+6),2);}}
  private drawCurve(g:Phaser.GameObjects.Graphics,c:CurveDef):void{const t=c.thickness??22;g.lineStyle(t,0x344657,1);g.beginPath();g.arc(c.x,c.y,c.r,c.startAngle,c.endAngle,false);g.strokePath();g.lineStyle(2,0xa6bbc8,.5);g.beginPath();g.arc(c.x,c.y,c.r-t*.28,c.startAngle,c.endAngle,false);g.strokePath();}
  private drawHole(g:Phaser.GameObjects.Graphics):void{const x=this.level.hole.x,y=this.level.hole.y;g.fillStyle(0x0b1014,.3);g.fillEllipse(x+3,y+6,HOLE_R*2.3,HOLE_R*1.35);g.fillStyle(0x101519,1);g.fillCircle(x,y,HOLE_R);g.lineStyle(2,0xcfe2d0,.38);g.strokeCircle(x,y,HOLE_R+2);g.lineStyle(3,0xf3f3f3,1);g.beginPath();g.moveTo(x,y);g.lineTo(x,y-58);g.strokePath();g.fillStyle(0xf2f2f2,1);g.fillTriangle(x,y-58,x+30,y-46,x,y-34);}

  private playHoleEffect():void{const g=this.add.graphics(),fx=this.add.container(this.level.hole.x,this.level.hole.y,[g]).setDepth(14),color=this.holeCosmetic.primary;g.lineStyle(3,color,.82);g.strokeCircle(0,0,19);for(let i=0;i<8;i+=1){const a=i*Math.PI/4;g.fillStyle(this.holeCosmetic.secondary??color,.65);g.fillCircle(Math.cos(a)*28,Math.sin(a)*28,2.5);}fx.setScale(.6);this.tweens.add({targets:fx,scale:2.15,alpha:0,duration:470,ease:"Cubic.easeOut",onComplete:()=>fx.destroy()});}
  private easeOutBack(q:number):number{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(q-1,3)+c1*Math.pow(q-1,2);}
  private animatedRect(r:RectDef,anim:number,back:boolean):RectDef{const q=back?this.easeOutBack(anim):Phaser.Math.Clamp(anim,0,1);if(r.w>=r.h)return{x:r.x,y:r.y+r.h*(1-q)/2,w:r.w,h:r.h*q};return{x:r.x+r.w*(1-q)/2,y:r.y,w:r.w*q,h:r.h};}
  private movingWallRect(w:MovingWallDef,t:number):RectDef{const q=Math.sin(t*(w.speed??1.15)+(w.phase??0))*w.amplitude;return{x:w.x+(w.axis==="x"?q:0),y:w.y+(w.axis==="y"?q:0),w:w.w,h:w.h};}
  private movingBumperPoint(b:MovingBumperDef,t:number):{x:number;y:number}{const q=Math.sin(t*(b.speed??1.3)+(b.phase??0))*b.amplitude;return{x:b.x+(b.axis==="x"?q:0),y:b.y+(b.axis==="y"?q:0)};}
}
