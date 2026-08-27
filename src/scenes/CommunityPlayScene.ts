import Phaser from "phaser";
import { pointerToDesign, setupDesignCamera, sharpenSceneText } from "../config/display";
import { CommunityMaps, type CommunityMapDetail } from "../systems/CommunityMapsSystem";
import { drawCourse, drawDynamicCourse } from "../systems/CourseRenderer";
import { GOLF_PHYSICS, GolfSimulation, powerFromPhysicalPull, type SimulationEvent } from "../systems/GolfSimulation";

export class CommunityPlayScene extends Phaser.Scene{
  private mapId="";
  private detail:CommunityMapDetail|null=null;
  private sim:GolfSimulation|null=null;
  private course!:Phaser.GameObjects.Graphics;
  private dynamic!:Phaser.GameObjects.Graphics;
  private aim!:Phaser.GameObjects.Graphics;
  private ball!:Phaser.GameObjects.Arc;
  private drag=false;
  private strokes=0;
  private startedAt=0;
  private done=false;

  constructor(){super("community-play");}
  init(data:{mapId:string}):void{this.mapId=data.mapId;}

  create():void{
    setupDesignCamera(this);this.cameras.main.setBackgroundColor("#0b0f14");
    this.add.text(38,42,"‹",{fontFamily:"system-ui",fontSize:"34px",color:"#eef4f8"}).setDepth(30).setInteractive({useHandCursor:true}).on("pointerup",()=>this.scene.start("community-maps"));
    this.add.text(270,72,"CARGANDO MAPA…",{fontFamily:"system-ui",fontSize:"14px",fontStyle:"bold",color:"#a8bac6"}).setOrigin(.5).setName("loading");
    sharpenSceneText(this);void this.load();
  }

  update(time:number,delta:number):void{
    if(!this.sim||this.done)return;
    if(this.sim.state.moving)this.consume(this.sim.step(Math.min(.033,delta/1000)));
    const b=this.sim.state.ball;this.ball.setPosition(b.x,b.y-Math.max(0,b.z)*.18);
    drawCourse(this.course,this.detail!.level,this.sim.state);drawDynamicCourse(this.dynamic,this.detail!.level,time/1000);
  }

  private async load():Promise<void>{
    this.detail=await CommunityMaps.get(this.mapId);
    const loading=this.children.getByName("loading") as Phaser.GameObjects.Text|null;
    if(!this.detail){loading?.setText("NO SE PUDO CARGAR");return;}
    loading?.destroy();
    this.add.text(270,46,this.detail.title,{fontFamily:"system-ui",fontSize:"16px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.text(270,72,`por ${this.detail.creator}`,{fontFamily:"system-ui",fontSize:"10px",color:"#8798a5"}).setOrigin(.5);
    this.course=this.add.graphics().setDepth(0);this.dynamic=this.add.graphics().setDepth(4);this.aim=this.add.graphics().setDepth(18);
    this.sim=new GolfSimulation(this.detail.level);const b=this.sim.state.ball;
    this.ball=this.add.circle(b.x,b.y,GOLF_PHYSICS.ballRadius,0xf5f7fa).setStrokeStyle(2,0xaec7d6).setDepth(12);
    this.startedAt=performance.now();this.strokes=0;this.done=false;
    drawCourse(this.course,this.detail.level,this.sim.state);drawDynamicCourse(this.dynamic,this.detail.level,0);
    this.input.on("pointerdown",(p:Phaser.Input.Pointer)=>this.down(p));this.input.on("pointermove",(p:Phaser.Input.Pointer)=>this.move(p));this.input.on("pointerup",(p:Phaser.Input.Pointer)=>this.up(p));
  }

  private down(pointer:Phaser.Input.Pointer):void{
    if(!this.sim||this.done||this.sim.state.moving||this.sim.isAirborne())return;const p=pointerToDesign(this,pointer),b=this.sim.state.ball;
    if(Phaser.Math.Distance.Between(p.x,p.y,b.x,b.y)<=62){this.drag=true;this.drawAim(p.x,p.y);}
  }
  private move(pointer:Phaser.Input.Pointer):void{if(!this.drag||!this.sim)return;const p=pointerToDesign(this,pointer);this.drawAim(p.x,p.y);}
  private up(pointer:Phaser.Input.Pointer):void{
    if(!this.drag||!this.sim)return;this.drag=false;const p=pointerToDesign(this,pointer),b=this.sim.state.ball,dx=b.x-p.x,dy=b.y-p.y,len=Math.hypot(dx,dy);this.aim.clear();if(len<12)return;
    if(this.sim.launch(Math.atan2(dy,dx),powerFromPhysicalPull(len)))this.strokes++;
  }
  private drawAim(x:number,y:number):void{
    if(!this.sim)return;const b=this.sim.state.ball,dx=b.x-x,dy=b.y-y,len=Math.hypot(dx,dy)||1,nx=dx/len,ny=dy/len,pull=Math.min(len,GOLF_PHYSICS.maxPull/GOLF_PHYSICS.dragGain);
    this.aim.clear();this.aim.lineStyle(4,0x8bc5ff,.9);this.aim.lineBetween(b.x,b.y,b.x-nx*pull,b.y-ny*pull);this.aim.fillStyle(0xedf7ff,.7);for(let i=1;i<=7;i++)this.aim.fillCircle(b.x+nx*(65+powerFromPhysicalPull(len)*105)*(i/7),b.y+ny*(65+powerFromPhysicalPull(len)*105)*(i/7),2.5);
  }

  private consume(events:SimulationEvent[]):void{
    if(!this.sim)return;
    for(const e of events){
      if(e.kind==="void"){this.time.delayedCall(220,()=>{this.sim?.resetAfterVoid();const b=this.sim!.state.ball;this.ball.setPosition(b.x,b.y);});}
      if(e.kind==="hole")this.finish();
    }
  }

  private finish():void{
    if(this.done||!this.detail)return;this.done=true;this.drag=false;this.aim.clear();const timeMs=Math.round(performance.now()-this.startedAt);void CommunityMaps.submitRun(this.mapId,this.strokes,timeMs,true);
    this.tweens.add({targets:this.ball,scale:.05,alpha:0,duration:260,onComplete:()=>this.showResult(timeMs)});
  }

  private showResult(timeMs:number):void{
    if(!this.detail)return;
    this.add.rectangle(270,480,540,960,0x05080b,.74).setDepth(40).setInteractive();
    this.add.rectangle(270,480,438,this.detail.canRate?470:330,0x111a22,.99).setStrokeStyle(2,0x405668).setDepth(41);
    this.add.text(270,330,"HOYO COMPLETADO",{fontFamily:"system-ui",fontSize:"20px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5).setDepth(42);
    this.add.text(270,370,`${this.strokes} golpes · ${(timeMs/1000).toFixed(1)}s`,{fontFamily:"system-ui",fontSize:"14px",color:"#b7c5ce"}).setOrigin(.5).setDepth(42);
    if(this.detail.isMine){this.add.text(270,430,"Es tu mapa · tus votos no cuentan",{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:"#d9c77f"}).setOrigin(.5).setDepth(42);this.resultButtons(540);return;}
    if(!this.detail.canRate){this.add.text(270,430,"Ya has valorado este mapa",{fontFamily:"system-ui",fontSize:"11px",color:"#8da0ad"}).setOrigin(.5).setDepth(42);this.resultButtons(540);return;}
    this.add.text(270,414,"VALORACIÓN RÁPIDA",{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:"#8da0ad"}).setOrigin(.5).setDepth(42);
    const values={fun:0,originality:0,difficulty:0};
    this.quickRow("DIVERSIÓN",454,"fun",values);this.quickRow("ORIGINAL",510,"originality",values);this.quickRow("DIFICULTAD",566,"difficulty",values);
    this.add.text(270,626,"Se envía al elegir las 3",{fontFamily:"system-ui",fontSize:"10px",color:"#6f818e"}).setOrigin(.5).setDepth(42);
    this.resultButtons(690);
  }

  private quickRow(label:string,y:number,key:"fun"|"originality"|"difficulty",values:{fun:number;originality:number;difficulty:number}):void{
    this.add.text(78,y,label,{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:"#c6d2da"}).setOrigin(0,.5).setDepth(42);
    for(let i=1;i<=5;i++){const x=278+(i-1)*42,c=this.add.circle(x,y,15,0x17242d).setStrokeStyle(1,0x496173).setDepth(42).setInteractive({useHandCursor:true});this.add.text(x,y,String(i),{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:"#e5edf2"}).setOrigin(.5).setDepth(43);c.on("pointerup",()=>{values[key]=i;c.setFillStyle(0x496e82);if(values.fun&&values.originality&&values.difficulty)void this.submitRating(values);});}
  }

  private async submitRating(values:{fun:number;originality:number;difficulty:number}):Promise<void>{
    if(!this.detail?.canRate)return;this.detail.canRate=false;const result=await CommunityMaps.rate(this.mapId,values);
    const t=this.add.text(270,646,result.ok?"✓ GRACIAS":"NO SE PUDO ENVIAR",{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:result.ok?"#d8efdc":"#f0c0b6"}).setOrigin(.5).setDepth(50);this.tweens.add({targets:t,alpha:0,delay:900,duration:250});
  }
  private resultButtons(y:number):void{
    const retry=this.add.text(190,y,"REINTENTAR",{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:"#dce6ec"}).setOrigin(.5).setDepth(45).setInteractive({useHandCursor:true});retry.on("pointerup",()=>this.scene.restart({mapId:this.mapId}));
    const back=this.add.text(350,y,"COMMUNITY",{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:"#91b8ce"}).setOrigin(.5).setDepth(45).setInteractive({useHandCursor:true});back.on("pointerup",()=>this.scene.start("community-maps"));
  }
}
