import Phaser from "phaser";
import { BETA_TESTING } from "../config/beta";
import { pointerToDesign, setupDesignCamera, sharpenSceneText } from "../config/display";
import { cosmeticById, type CosmeticDefinition } from "../data/cosmetics";
import { levelFor, levelsForMode } from "../data/campaign";
import { AudioFeedback, type FeedbackSound } from "../systems/AudioFeedback";
import { openBetaReport } from "../systems/BetaReportOverlay";
import { BetaTelemetry } from "../systems/BetaTelemetrySystem";
import { drawBall } from "../systems/CosmeticRenderer";
import { drawCourse, drawDynamicCourse } from "../systems/CourseRenderer";
import {
  GOLF_PHYSICS,
  GolfSimulation,
  type SimulationEvent
} from "../systems/GolfSimulation";
import { MECHANIC_TUTORIALS, markMechanicSeen, unseenMechanics, type MechanicId } from "../systems/MechanicTutorialSystem";
import { SaveSystem } from "../systems/SaveSystem";
import { resolveShotPull, SHOT_GRAB_RADIUS } from "../systems/ShotInputSystem";
import { formatRequirement, starsForRun } from "../systems/StarScoring";
import type { GameSceneData, LevelDefinition } from "../types";

interface TrailParticle { x:number;y:number;life:number;maxLife:number;size:number; }

const BALL_R=GOLF_PHYSICS.ballRadius;
const AIR_VISUAL_SCALE=.18;
const CONTROL_TUTORIAL_KEY="troll-golf-control-onboarding-v1";

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
  private objectiveHud!:Phaser.GameObjects.Container;
  private strokeText!:Phaser.GameObjects.Text;
  private timeText!:Phaser.GameObjects.Text;
  private ballCosmetic!:CosmeticDefinition;
  private trailCosmetic!:CosmeticDefinition;
  private holeCosmetic!:CosmeticDefinition;
  private dragPointer:Phaser.Input.Pointer|null=null;
  private strokes=0;
  private voids=0;
  private startedAt=0;
  private sinking=false;
  private voidAnimating=false;
  private reportOpen=false;
  private tutorialQueue:MechanicId[]=[];
  private tutorialCard:Phaser.GameObjects.Container|null=null;
  private controlHint:Phaser.GameObjects.Container|null=null;
  private trail:TrailParticle[]=[];
  private trailClock=0;
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
    this.strokes=0;this.voids=0;this.startedAt=performance.now();this.sinking=false;this.voidAnimating=false;this.reportOpen=false;this.trail=[];this.trailClock=0;this.soundCooldown.clear();
    if(BETA_TESTING)BetaTelemetry.beginAttempt(this.level.id);

    const equipped=SaveSystem.cosmetics().equipped;
    this.ballCosmetic=cosmeticById(equipped.ball)??cosmeticById("ball-classic")!;
    this.trailCosmetic=cosmeticById(equipped.trail)??cosmeticById("trail-none")!;
    this.holeCosmetic=cosmeticById(equipped.holeEffect)??cosmeticById("hole-default")!;

    this.course=this.add.graphics().setDepth(0);
    this.dynamic=this.add.graphics().setDepth(5);
    this.trailView=this.add.graphics().setDepth(6);
    this.shadowView=this.add.graphics().setDepth(7);
    this.aim=this.add.graphics().setDepth(25);
    const ballGraphic=this.add.graphics();drawBall(ballGraphic,this.ballCosmetic,0,0,BALL_R);
    this.ballView=this.add.container(this.sim.state.ball.x,this.sim.state.ball.y,[ballGraphic]).setDepth(10);

    this.createHud();
    this.input.on("pointerdown",(p:Phaser.Input.Pointer)=>this.pointerDown(p));
    this.input.on("pointermove",(p:Phaser.Input.Pointer)=>this.pointerMove(p));
    this.input.on("pointerup",(p:Phaser.Input.Pointer)=>this.pointerUp(p));
    if(BETA_TESTING){
      this.input.keyboard?.on("keydown-LEFT",()=>this.goRelative(-1));
      this.input.keyboard?.on("keydown-RIGHT",()=>this.goRelative(1));
    }

    drawCourse(this.course,this.level,this.sim.state);drawDynamicCourse(this.dynamic,this.level,0);this.updateBallView();this.updateHudOcclusion();
    // HARD should surprise, not be blocked/spoiled by mechanic tutorial cards.
    this.tutorialQueue=this.mode==="classic"?unseenMechanics(this.level):[];
    if(this.tutorialQueue.length>0)this.showMechanicTutorial();else this.showControlHintIfNeeded();
    sharpenSceneText(this);
  }

  update(time:number,deltaMs:number):void{
    if(this.sinking)return;
    this.timeText.setText(`${((performance.now()-this.startedAt)/1000).toFixed(1)} s`);
    if(this.tutorialCard||this.voidAnimating){this.updateHudOcclusion();drawDynamicCourse(this.dynamic,this.level,time/1000);return;}
    const dt=Math.min(deltaMs/1000,.033);
    if(this.sim.state.moving)this.consume(this.sim.step(dt));
    this.updateTrail(dt);this.updateBallView();this.updateHudOcclusion();drawCourse(this.course,this.level,this.sim.state);drawDynamicCourse(this.dynamic,this.level,time/1000);
  }

  private createHud():void{
    const bg=this.add.rectangle(270,69,310,54,0x0a0f14,.80).setStrokeStyle(1,0x26323d,.82);
    const three=this.add.text(270,58,`★★★  ${formatRequirement(this.level.threeStar)}`,{fontFamily:"system-ui, sans-serif",fontSize:"12px",fontStyle:"bold",color:"#f0d37e"}).setOrigin(.5);
    const two=this.add.text(270,80,`★★  ${formatRequirement(this.level.twoStar)}`,{fontFamily:"system-ui, sans-serif",fontSize:"11px",color:"#bcc7d0"}).setOrigin(.5);
    this.objectiveHud=this.add.container(0,0,[bg,three,two]).setDepth(18);
    this.strokeText=this.add.text(42,42,"Golpes 0",{fontFamily:"system-ui, sans-serif",fontSize:"15px",fontStyle:"bold",color:"#f5f7fa"}).setDepth(20);
    this.timeText=this.add.text(498,42,"0.0 s",{fontFamily:"system-ui, sans-serif",fontSize:"15px",color:"#f5f7fa"}).setOrigin(1,0).setDepth(20);

    const back=this.add.rectangle(43,86,50,44,0x111920,.88).setStrokeStyle(1,0x344754).setDepth(20).setInteractive({useHandCursor:true});
    this.add.text(43,82,"‹",{fontFamily:"system-ui, sans-serif",fontSize:"34px",color:"#f5f7fa"}).setOrigin(.5).setDepth(21);
    back.on("pointerdown",()=>back.setScale(.97)).on("pointerout",()=>back.setScale(1)).on("pointerup",()=>{back.setScale(1);this.scene.start("level-select",{mode:this.mode,page:Math.floor(this.levelIndex/10)});});

    if(BETA_TESTING){
      const levels=levelsForMode(this.mode);
      this.betaLevelButton(442,84,"‹",this.levelIndex>0,()=>this.goRelative(-1));
      this.betaLevelButton(496,84,"›",this.levelIndex<levels.length-1,()=>this.goRelative(1));
      this.add.text(469,113,`${this.mode==="troll"?"H":"C"}${String(this.levelIndex+1).padStart(2,"0")}`,{fontFamily:"system-ui, sans-serif",fontSize:"10px",fontStyle:"bold",color:"#7d91a0"}).setOrigin(.5).setDepth(20);
      const report=this.add.rectangle(62,136,104,40,0x17242d,.94).setStrokeStyle(1,0x557184).setDepth(20).setInteractive({useHandCursor:true});
      const reportText=this.add.text(62,136,"⚑ REPORTAR",{fontFamily:"system-ui, sans-serif",fontSize:"9px",fontStyle:"bold",color:"#afd2e4"}).setOrigin(.5).setDepth(21);
      report.on("pointerdown",()=>{report.setScale(.97);reportText.setScale(.97);}).on("pointerout",()=>{report.setScale(1);reportText.setScale(1);}).on("pointerup",()=>{report.setScale(1);reportText.setScale(1);this.openReport();});
    }
  }

  private betaLevelButton(x:number,y:number,label:string,enabled:boolean,action:()=>void):void{
    const bg=this.add.rectangle(x,y,50,42,enabled?0x16232d:0x10171d,.92).setStrokeStyle(1,enabled?0x496273:0x252f37).setDepth(20);
    const text=this.add.text(x,y-1,label,{fontFamily:"system-ui, sans-serif",fontSize:"21px",fontStyle:"bold",color:enabled?"#dce8ef":"#46535d"}).setOrigin(.5).setDepth(21);
    if(!enabled)return;
    bg.setInteractive({useHandCursor:true}).on("pointerdown",()=>{bg.setScale(.96);text.setScale(.96);}).on("pointerout",()=>{bg.setScale(1);text.setScale(1);}).on("pointerup",()=>{bg.setScale(1);text.setScale(1);action();});
  }

  private openReport():void{
    if(this.reportOpen||this.sinking)return;
    this.reportOpen=true;this.dragPointer=null;this.aim.clear();
    openBetaReport(this,{levelId:this.level.id,mode:this.mode,levelIndex:this.levelIndex,strokes:this.strokes,timeMs:Math.round(performance.now()-this.startedAt)},()=>{this.reportOpen=false;});
  }

  private goRelative(delta:number):void{
    if(!BETA_TESTING)return;
    const levels=levelsForMode(this.mode),next=this.levelIndex+delta;
    if(next<0||next>=levels.length)return;
    this.scene.start("game",{mode:this.mode,levelIndex:next});
  }

  private updateHudOcclusion():void{
    const b=this.sim.state.ball,visualY=b.y-Math.max(0,b.z)*AIR_VISUAL_SCALE;
    const underObjectives=b.x>98&&b.x<442&&visualY<122;
    const targetAlpha=underObjectives?.14:1;
    this.objectiveHud.alpha+=(targetAlpha-this.objectiveHud.alpha)*.24;
    const airborne=this.sim.isAirborne();
    this.ballView.setDepth(underObjectives?24:airborne?12:10);
  }

  private recoverStoppedState():void{
    const b=this.sim.state.ball;
    if(this.sim.state.moving&&!this.sim.isAirborne()&&Math.hypot(b.vx,b.vy)<GOLF_PHYSICS.stopSpeed){b.vx=0;b.vy=0;this.sim.state.moving=false;}
  }

  private pointerDown(pointer:Phaser.Input.Pointer):void{
    AudioFeedback.unlock();this.recoverStoppedState();
    if(this.reportOpen||this.tutorialCard||this.sim.state.moving||this.sinking||this.voidAnimating||this.sim.isAirborne())return;
    const p=pointerToDesign(this,pointer),b=this.sim.state.ball;
    if(Phaser.Math.Distance.Between(p.x,p.y,b.x,b.y)<=SHOT_GRAB_RADIUS){this.dragPointer=pointer;this.drawAim(p.x,p.y);}
  }
  private pointerMove(pointer:Phaser.Input.Pointer):void{if(!this.dragPointer||this.reportOpen||this.sim.state.moving||this.sinking)return;const p=pointerToDesign(this,pointer);this.drawAim(p.x,p.y);}
  private pointerUp(pointer:Phaser.Input.Pointer):void{
    if(!this.dragPointer||this.reportOpen||this.sim.state.moving||this.sinking)return;
    const p=pointerToDesign(this,pointer),b=this.sim.state.ball,pull=resolveShotPull(b,p);this.dragPointer=null;this.aim.clear();
    if(pull.length<12)return;const angle=Math.atan2(pull.dy,pull.dx),power=pull.power;if(!this.sim.launch(angle,power))return;
    this.strokes+=1;this.strokeText.setText(`Golpes ${this.strokes}`);this.hideControlHint();try{localStorage.setItem(CONTROL_TUTORIAL_KEY,"1");}catch{/* optional */}
    AudioFeedback.play("shot",.65+power*.45);this.impact(b.x,b.y,0xcbe8ff,18,.35);
  }
  private drawAim(x:number,y:number):void{
    const b=this.sim.state.ball,pullData=resolveShotPull(b,{x,y});if(pullData.length<.001){this.aim.clear();return;}const pull=Math.min(pullData.length,GOLF_PHYSICS.maxPull/GOLF_PHYSICS.dragGain);
    this.aim.clear();this.aim.lineStyle(4,0x8bc5ff,.92);this.aim.beginPath();this.aim.moveTo(b.x,b.y);this.aim.lineTo(b.x-pullData.unitX*pull,b.y-pullData.unitY*pull);this.aim.strokePath();this.aim.fillStyle(0xedf7ff,.72);
    const reach=68+pullData.power*108;for(let i=1;i<=8;i+=1){const q=i/8;this.aim.fillCircle(b.x+pullData.unitX*reach*q,b.y+pullData.unitY*reach*q,3.4-q*1.5);}
  }

  private consume(events:SimulationEvent[]):void{
    for(const e of events){
      if(e.kind==="wall-hit")this.feedback(e,"wall",0xb7cad8,18,.00055);
      else if(e.kind==="bumper-hit")this.feedback(e,"bumper",0xffcf78,27,.00115);
      else if(e.kind==="surface-sand")this.playFeedbackSound("sand",120);
      else if(e.kind==="surface-ice")this.playFeedbackSound("ice",120);
      else if(e.kind==="portal")this.feedback(e,"portal",0xaecbff,31,.00075);
      else if(e.kind==="curve-hit")this.feedback(e,"wall",0x9fb9c8,20,.0006);
      else if(e.kind==="moving-hit")this.feedback(e,"bumper",0xbdd7e5,25,.0009);
      else if(e.kind==="ramp"||e.kind==="trampoline")this.feedback(e,"jump",0xd9f5ff,25,.00065);
      else if(e.kind==="landing")this.feedback(e,"land",0xeaf8ff,22,.0004);
      else if(e.kind==="void"){this.voids+=1;this.feedback(e,"void",0x5a7182,34,.00145);this.startVoidReset();}
      else if(e.kind==="trap-wall"||e.kind==="trap-bumper"||e.kind==="trap-void")this.feedback(e,"trap",0xf0b869,36,.00165);
      else if(e.kind==="hole-lip")this.feedback(e,"lip",0xf1e7b7,22,.0005);
      else if(e.kind==="hole"){this.playFeedbackSound("hole",0);this.finishHole();}
    }
  }
  private feedback(e:SimulationEvent,sound:FeedbackSound,color:number,radius:number,shake:number):void{this.playFeedbackSound(sound,sound==="wall"?65:95);this.impact(e.x,e.y,color,radius,.62);this.cameras.main.shake(32,shake);}
  private playFeedbackSound(sound:FeedbackSound,cooldownMs:number):void{const now=performance.now(),until=this.soundCooldown.get(sound)??0;if(now<until)return;AudioFeedback.play(sound);if(cooldownMs>0)this.soundCooldown.set(sound,now+cooldownMs);}
  private impact(x:number,y:number,color:number,radius:number,alpha:number):void{const ring=this.add.circle(x,y,Math.max(5,radius*.42),0xffffff,0).setStrokeStyle(2,color,alpha).setDepth(13);this.tweens.add({targets:ring,scale:2.1,alpha:0,duration:220,ease:"Cubic.easeOut",onComplete:()=>ring.destroy()});}

  private startVoidReset():void{
    if(this.voidAnimating)return;this.voidAnimating=true;this.dragPointer=null;this.aim.clear();
    this.tweens.add({targets:this.ballView,alpha:0,scale:.12,y:this.ballView.y+10,duration:245,ease:"Cubic.easeIn",onComplete:()=>{this.sim.resetAfterVoid();const b=this.sim.state.ball;this.ballView.setPosition(b.x,b.y).setScale(1).setAlpha(1);this.time.delayedCall(110,()=>{this.voidAnimating=false;this.updateBallView();this.updateHudOcclusion();});}});
  }
  private finishHole():void{
    if(this.sinking)return;this.sinking=true;this.dragPointer=null;this.aim.clear();this.holeFx();const timeMs=Math.round(performance.now()-this.startedAt),stars=starsForRun(this.level,this.strokes,timeMs);
    const telemetry={trapsTriggered:[...this.sim.state.triggeredTraps],mechanicsUsed:[...this.sim.state.touchedMechanics],voids:this.voids};
    this.tweens.add({targets:this.ballView,x:this.level.hole.x,y:this.level.hole.y,scale:.06,alpha:0,duration:350,ease:"Cubic.easeOut",onComplete:()=>this.time.delayedCall(90,()=>this.scene.start("results",{mode:this.mode,levelIndex:this.levelIndex,levelId:this.level.id,strokes:this.strokes,timeMs,stars,...telemetry}))});
  }

  private updateBallView():void{
    const b=this.sim.state.ball,height=Math.max(0,b.z),lift=height*AIR_VISUAL_SCALE,scale=1+Math.min(.13,height/1700);this.ballView.setPosition(b.x,b.y-lift).setScale(scale).setDepth(height>1?12:10);
    this.shadowView.clear();const s=Phaser.Math.Clamp(1-height/900,.52,1),a=Phaser.Math.Clamp(.24-height/2600,.07,.24);this.shadowView.fillStyle(0x07100b,a);this.shadowView.fillEllipse(b.x+2,b.y+5,28*s,12*s);
  }
  private updateTrail(dt:number):void{
    for(let i=this.trail.length-1;i>=0;i-=1){const p=this.trail[i]!;p.life-=dt;if(p.life<=0)this.trail.splice(i,1);}
    if(this.sim.state.moving&&this.trailCosmetic.id!=="trail-none"&&Math.hypot(this.sim.state.ball.vx,this.sim.state.ball.vy)>70){
      this.trailClock+=dt;
      const interval=this.trailCosmetic.id==="trail-sparks" ? 0.024 : 0.034;
      while(this.trailClock>=interval){
        this.trailClock-=interval;
        const b=this.sim.state.ball;
        const maxLife=this.trailCosmetic.id==="trail-petals" ? 0.58 : 0.42;
        this.trail.push({x:b.x,y:b.y-b.z*AIR_VISUAL_SCALE,life:maxLife,maxLife,size:Phaser.Math.FloatBetween(2.5,5)});
        if(this.trail.length>70)this.trail.shift();
      }
    }else this.trailClock=0;
    this.trailView.clear();const secondary=this.trailCosmetic.secondary??this.trailCosmetic.primary;for(let i=0;i<this.trail.length;i+=1){const p=this.trail[i]!,life=p.life/p.maxLife,color=i%2?secondary:this.trailCosmetic.primary;this.trailView.fillStyle(color,life*.46);this.trailView.fillCircle(p.x,p.y,p.size*(.5+life*.5));}
  }

  private showControlHintIfNeeded():void{
    if(this.mode!=="classic"||this.levelIndex!==0)return;try{if(localStorage.getItem(CONTROL_TUTORIAL_KEY)==="1")return;}catch{/* show */}
    const b=this.sim.state.ball,g=this.add.graphics();g.lineStyle(4,0xdceeff,.82);g.beginPath();g.moveTo(b.x,b.y+24);g.lineTo(b.x,b.y+104);g.strokePath();g.fillStyle(0xdceeff,.9);g.fillTriangle(b.x,b.y+118,b.x-10,b.y+96,b.x+10,b.y+96);
    const finger=this.add.circle(b.x,b.y+22,13,0xf4f7fa,.88).setStrokeStyle(3,0x7890a2,.8),label=this.add.text(b.x,b.y+146,"ARRASTRA HACIA ATRÁS · SUELTA",{fontFamily:"system-ui, sans-serif",fontSize:"13px",fontStyle:"bold",color:"#eff7fb"}).setOrigin(.5);
    this.controlHint=this.add.container(0,0,[g,finger,label]).setDepth(30);this.tweens.add({targets:finger,y:b.y+88,duration:850,yoyo:true,repeat:-1,ease:"Sine.easeInOut"});
  }
  private hideControlHint():void{if(this.controlHint){this.controlHint.destroy(true);this.controlHint=null;}}

  private showMechanicTutorial():void{
    const id=this.tutorialQueue[0];if(!id){this.tutorialCard=null;this.startedAt=performance.now();this.showControlHintIfNeeded();return;}const t=MECHANIC_TUTORIALS[id];
    const bg=this.add.rectangle(270,815,444,126,0x101820,.97).setStrokeStyle(1.5,0x405364,.95).setInteractive({useHandCursor:true}),icon=this.add.circle(112,815,30,0x1d2b36,1).setStrokeStyle(2,0x7893a5,.65),glyph=this.add.text(112,814,this.glyph(id),{fontFamily:"system-ui, sans-serif",fontSize:"20px",fontStyle:"bold",color:"#f0d37e"}).setOrigin(.5),title=this.add.text(158,782,t.title,{fontFamily:"system-ui, sans-serif",fontSize:"15px",fontStyle:"bold",color:"#f5f7fa"}),hint=this.add.text(158,809,t.hint,{fontFamily:"system-ui, sans-serif",fontSize:"12px",color:"#b9c5cf",wordWrap:{width:292},lineSpacing:2}),tap=this.add.text(420,861,"TOCA",{fontFamily:"system-ui, sans-serif",fontSize:"10px",fontStyle:"bold",color:"#758696"}).setOrigin(1,.5);
    this.tutorialCard=this.add.container(0,0,[bg,icon,glyph,title,hint,tap]).setDepth(100).setAlpha(0);this.tweens.add({targets:this.tutorialCard,alpha:1,y:-8,duration:180,ease:"Cubic.easeOut"});bg.on("pointerup",()=>{markMechanicSeen(id);this.tutorialQueue.shift();this.tutorialCard?.destroy(true);this.tutorialCard=null;this.showMechanicTutorial();});
  }
  private glyph(id:MechanicId):string{const map:Record<MechanicId,string>={bumper:"●",sand:"≈",ice:"◇",booster:"➜",ramp:"↗",trampoline:"↥",void:"○",fan:"≋",portal:"◎",curve:"◜",moving:"↔"};return map[id];}

  private holeFx():void{const g=this.add.graphics(),fx=this.add.container(this.level.hole.x,this.level.hole.y,[g]).setDepth(14),color=this.holeCosmetic.primary;g.lineStyle(3,color,.85);g.strokeCircle(0,0,19);for(let i=0;i<8;i+=1){const a=i*Math.PI/4;g.fillStyle(this.holeCosmetic.secondary??color,.7);g.fillCircle(Math.cos(a)*28,Math.sin(a)*28,2.5);}fx.setScale(.6);this.tweens.add({targets:fx,scale:2.15,alpha:0,duration:470,ease:"Cubic.easeOut",onComplete:()=>fx.destroy()});}
}
