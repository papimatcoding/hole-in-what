import Phaser from "phaser";
import { pointerToDesign, setupDesignCamera, sharpenSceneText } from "../config/display";
import { cosmeticById, type CosmeticDefinition } from "../data/cosmetics";
import { AudioFeedback, type FeedbackSound } from "../systems/AudioFeedback";
import { CommunityDrafts } from "../systems/CommunityDraftSystem";
import { CommunityMaps, type CommunityComment, type CommunityMapDetail, type CommunityReportCategory } from "../systems/CommunityMapsSystem";
import { drawBall } from "../systems/CosmeticRenderer";
import { drawCourse, drawDynamicCourse } from "../systems/CourseRenderer";
import { GOLF_PHYSICS, GolfSimulation, type SimulationEvent } from "../systems/GolfSimulation";
import { LiveOps } from "../systems/LiveOpsSystem";
import { SaveSystem } from "../systems/SaveSystem";
import { resolveShotPull, SHOT_GRAB_RADIUS } from "../systems/ShotInputSystem";
import type { LevelDefinition } from "../types";

interface TrailParticle{x:number;y:number;life:number;maxLife:number;size:number;}
const BALL_R=GOLF_PHYSICS.ballRadius;
const AIR_VISUAL_SCALE=.18;

export class CommunityPlayScene extends Phaser.Scene{
  private mapId:string|null=null;
  private draftId:string|null=null;
  private detail:CommunityMapDetail|null=null;
  private level!:LevelDefinition;
  private sim!:GolfSimulation;
  private course!:Phaser.GameObjects.Graphics;
  private dynamic!:Phaser.GameObjects.Graphics;
  private aim!:Phaser.GameObjects.Graphics;
  private trailView!:Phaser.GameObjects.Graphics;
  private shadowView!:Phaser.GameObjects.Graphics;
  private ballView!:Phaser.GameObjects.Container;
  private strokeText!:Phaser.GameObjects.Text;
  private timeText!:Phaser.GameObjects.Text;
  private ballCosmetic!:CosmeticDefinition;
  private trailCosmetic!:CosmeticDefinition;
  private dragPointer:Phaser.Input.Pointer|null=null;
  private strokes=0;
  private startedAt=0;
  private done=false;
  private voidAnimating=false;
  private trail:TrailParticle[]=[];
  private trailClock=0;
  private soundCooldown=new Map<FeedbackSound,number>();
  private overlayPanel:Phaser.GameObjects.Container|null=null;

  constructor(){super("community-play");}
  init(data:{mapId?:string;draftId?:string}):void{this.mapId=data.mapId??null;this.draftId=data.draftId??null;}

  create():void{
    setupDesignCamera(this);this.cameras.main.setBackgroundColor("#0b0f14");
    this.add.text(270,480,"CARGANDO MAPA…",{fontFamily:"system-ui",fontSize:"14px",fontStyle:"bold",color:"#a8bac6"}).setOrigin(.5).setName("loading");
    this.events.once("shutdown",()=>LiveOps.setContext(null));sharpenSceneText(this);void this.loadSource();
  }

  update(time:number,deltaMs:number):void{
    if(!this.detail||this.done)return;
    this.timeText.setText(`${((performance.now()-this.startedAt)/1000).toFixed(1)} s`);
    if(this.voidAnimating){this.updateBallView();drawDynamicCourse(this.dynamic,this.level,time/1000);return;}
    const dt=Math.min(deltaMs/1000,.033);if(this.sim.state.moving)this.consume(this.sim.step(dt));
    this.updateTrail(dt);this.updateBallView();drawCourse(this.course,this.level,this.sim.state);drawDynamicCourse(this.dynamic,this.level,time/1000);
  }

  private async loadSource():Promise<void>{
    if(this.draftId){
      const draft=CommunityDrafts.get(this.draftId);if(!draft){this.failLoad("BORRADOR NO ENCONTRADO");return;}
      this.detail={id:"draft",title:draft.name,description:"Playtest de borrador",creator:"TU BORRADOR",createdAt:draft.updatedAt,ratingCount:0,stars:null,plays:0,uniquePlayers:0,recentRuns:0,recentPlayers:0,playingNow:0,trendScore:0,isMine:true,featured:false,mapKind:"single",holeCount:1,level:draft.level,canRate:false};
    }else if(this.mapId){
      this.detail=await CommunityMaps.get(this.mapId);if(!this.detail){this.failLoad("NO SE PUDO CARGAR");return;}LiveOps.setContext(`community:${this.mapId}`);void LiveOps.heartbeat(`community:${this.mapId}`);
    }else{this.failLoad("MAPA NO VÁLIDO");return;}
    this.level=this.detail.level;this.children.getByName("loading")?.destroy();this.setupPlay();
  }
  private failLoad(message:string):void{const loading=this.children.getByName("loading") as Phaser.GameObjects.Text|null;loading?.setText(message);}

  private setupPlay():void{
    const equipped=SaveSystem.cosmetics().equipped;this.ballCosmetic=cosmeticById(equipped.ball)??cosmeticById("ball-classic")!;this.trailCosmetic=cosmeticById(equipped.trail)??cosmeticById("trail-none")!;
    this.sim=new GolfSimulation(this.level);this.course=this.add.graphics().setDepth(0);this.dynamic=this.add.graphics().setDepth(5);this.trailView=this.add.graphics().setDepth(6);this.shadowView=this.add.graphics().setDepth(7);this.aim=this.add.graphics().setDepth(25);
    const ballGraphic=this.add.graphics();drawBall(ballGraphic,this.ballCosmetic,0,0,BALL_R);const b=this.sim.state.ball;this.ballView=this.add.container(b.x,b.y,[ballGraphic]).setDepth(10);
    this.createHud();this.startedAt=performance.now();this.strokes=0;this.done=false;this.voidAnimating=false;this.trail=[];this.soundCooldown.clear();
    drawCourse(this.course,this.level,this.sim.state);drawDynamicCourse(this.dynamic,this.level,0);this.updateBallView();
    this.input.on("pointerdown",(p:Phaser.Input.Pointer)=>this.pointerDown(p));this.input.on("pointermove",(p:Phaser.Input.Pointer)=>this.pointerMove(p));this.input.on("pointerup",(p:Phaser.Input.Pointer)=>this.pointerUp(p));sharpenSceneText(this);
  }

  private createHud():void{
    const back=this.add.rectangle(48,48,56,50,0x111922,.94).setStrokeStyle(1,0x3b4f5e).setDepth(30).setInteractive({useHandCursor:true});this.add.text(48,46,"‹",{fontFamily:"system-ui",fontSize:"31px",fontStyle:"bold",color:"#eef4f8"}).setOrigin(.5).setDepth(31);back.on("pointerup",()=>this.goBack());
    this.add.text(270,42,this.detail!.title,{fontFamily:"system-ui",fontSize:"15px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5).setDepth(20);
    this.add.text(270,66,`por ${this.detail!.creator}${this.draftId?" · PLAYTEST":""}`,{fontFamily:"system-ui",fontSize:"9px",fontStyle:"bold",color:this.draftId?"#d8ba75":"#8395a2"}).setOrigin(.5).setDepth(20);
    this.strokeText=this.add.text(42,92,"Golpes 0",{fontFamily:"system-ui",fontSize:"14px",fontStyle:"bold",color:"#f5f7fa"}).setDepth(20);this.timeText=this.add.text(498,92,"0.0 s",{fontFamily:"system-ui",fontSize:"14px",color:"#f5f7fa"}).setOrigin(1,0).setDepth(20);
    if(this.mapId){this.smallButton(450,136,112,"⚑ REPORTAR",()=>this.openReport());this.smallButton(322,136,126,"COMENTARIOS",()=>{void this.openComments();});}
  }
  private smallButton(x:number,y:number,w:number,label:string,action:()=>void):void{const bg=this.add.rectangle(x,y,w,44,0x15212a,.95).setStrokeStyle(1,0x3d5362).setDepth(30).setInteractive({useHandCursor:true}),t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:"8px",fontStyle:"bold",color:"#cfe0e9"}).setOrigin(.5).setDepth(31);bg.on("pointerdown",()=>{bg.setScale(.98);t.setScale(.98);}).on("pointerout",()=>{bg.setScale(1);t.setScale(1);}).on("pointerup",()=>{bg.setScale(1);t.setScale(1);action();});}

  private pointerDown(pointer:Phaser.Input.Pointer):void{
    AudioFeedback.unlock();if(this.overlayPanel||this.done||this.voidAnimating||this.sim.isAirborne())return;
    const speed=Math.hypot(this.sim.state.ball.vx,this.sim.state.ball.vy);if(this.sim.state.moving&&speed<GOLF_PHYSICS.stopSpeed*1.6){this.sim.state.ball.vx=0;this.sim.state.ball.vy=0;this.sim.state.moving=false;}
    if(this.sim.state.moving)return;const p=pointerToDesign(this,pointer),b=this.sim.state.ball;if(Phaser.Math.Distance.Between(p.x,p.y,b.x,b.y)<=SHOT_GRAB_RADIUS){this.dragPointer=pointer;this.drawAim(p.x,p.y);}
  }
  private pointerMove(pointer:Phaser.Input.Pointer):void{if(!this.dragPointer||this.done||this.sim.state.moving)return;const p=pointerToDesign(this,pointer);this.drawAim(p.x,p.y);}
  private pointerUp(pointer:Phaser.Input.Pointer):void{
    if(!this.dragPointer||this.done||this.sim.state.moving)return;const p=pointerToDesign(this,pointer),b=this.sim.state.ball,pull=resolveShotPull(b,p);this.dragPointer=null;this.aim.clear();if(pull.length<12)return;
    if(!this.sim.launch(Math.atan2(pull.dy,pull.dx),pull.power))return;this.strokes++;this.strokeText.setText(`Golpes ${this.strokes}`);AudioFeedback.play("shot",.65+pull.power*.45);this.impact(b.x,b.y,0xcbe8ff,18,.35);
  }
  private drawAim(x:number,y:number):void{const b=this.sim.state.ball,pullData=resolveShotPull(b,{x,y});if(pullData.length<.001){this.aim.clear();return;}const pull=Math.min(pullData.length,GOLF_PHYSICS.maxPull/GOLF_PHYSICS.dragGain);this.aim.clear();this.aim.lineStyle(4,0x8bc5ff,.92);this.aim.beginPath();this.aim.moveTo(b.x,b.y);this.aim.lineTo(b.x-pullData.unitX*pull,b.y-pullData.unitY*pull);this.aim.strokePath();this.aim.fillStyle(0xedf7ff,.72);const reach=68+pullData.power*108;for(let i=1;i<=8;i++){const q=i/8;this.aim.fillCircle(b.x+pullData.unitX*reach*q,b.y+pullData.unitY*reach*q,3.4-q*1.5);}}

  private consume(events:SimulationEvent[]):void{for(const e of events){if(e.kind==="wall-hit")this.feedback(e,"wall",0xb7cad8,18,.00055);else if(e.kind==="bumper-hit")this.feedback(e,"bumper",0xffcf78,27,.00115);else if(e.kind==="surface-sand")this.playSound("sand",120);else if(e.kind==="surface-ice")this.playSound("ice",120);else if(e.kind==="portal")this.feedback(e,"portal",0xaecbff,31,.00075);else if(e.kind==="curve-hit")this.feedback(e,"wall",0x9fb9c8,20,.0006);else if(e.kind==="moving-hit")this.feedback(e,"bumper",0xbdd7e5,25,.0009);else if(e.kind==="ramp"||e.kind==="trampoline")this.feedback(e,"jump",0xd9f5ff,25,.00065);else if(e.kind==="landing")this.feedback(e,"land",0xeaf8ff,22,.0004);else if(e.kind==="void"){this.feedback(e,"void",0x5a7182,34,.00145);this.startVoidReset();}else if(e.kind==="trap-wall"||e.kind==="trap-bumper"||e.kind==="trap-void")this.feedback(e,"trap",0xf0b869,36,.00165);else if(e.kind==="hole-lip")this.feedback(e,"lip",0xf1e7b7,22,.0005);else if(e.kind==="hole"){this.playSound("hole",0);this.finish();}}}
  private feedback(e:SimulationEvent,sound:FeedbackSound,color:number,radius:number,shake:number):void{this.playSound(sound,sound==="wall"?65:95);this.impact(e.x,e.y,color,radius,.62);this.cameras.main.shake(32,shake);}
  private playSound(sound:FeedbackSound,cooldownMs:number):void{const now=performance.now(),until=this.soundCooldown.get(sound)??0;if(now<until)return;AudioFeedback.play(sound);if(cooldownMs>0)this.soundCooldown.set(sound,now+cooldownMs);}
  private impact(x:number,y:number,color:number,radius:number,alpha:number):void{const ring=this.add.circle(x,y,Math.max(5,radius*.42),0xffffff,0).setStrokeStyle(2,color,alpha).setDepth(13);this.tweens.add({targets:ring,scale:2.1,alpha:0,duration:220,ease:"Cubic.easeOut",onComplete:()=>ring.destroy()});}
  private startVoidReset():void{if(this.voidAnimating)return;this.voidAnimating=true;this.dragPointer=null;this.aim.clear();this.tweens.add({targets:this.ballView,alpha:0,scale:.12,y:this.ballView.y+10,duration:245,ease:"Cubic.easeIn",onComplete:()=>{this.sim.resetAfterVoid();const b=this.sim.state.ball;this.ballView.setPosition(b.x,b.y).setScale(1).setAlpha(1);this.time.delayedCall(110,()=>{this.voidAnimating=false;this.updateBallView();});}});}

  private updateBallView():void{const b=this.sim.state.ball,height=Math.max(0,b.z),lift=height*AIR_VISUAL_SCALE,scale=1+Math.min(.13,height/1700);this.ballView.setPosition(b.x,b.y-lift).setScale(scale).setDepth(height>1?12:10);this.shadowView.clear();const s=Phaser.Math.Clamp(1-height/900,.52,1),a=Phaser.Math.Clamp(.24-height/2600,.07,.24);this.shadowView.fillStyle(0x07100b,a);this.shadowView.fillEllipse(b.x+2,b.y+5,28*s,12*s);}
  private updateTrail(dt:number):void{for(let i=this.trail.length-1;i>=0;i--){const p=this.trail[i]!;p.life-=dt;if(p.life<=0)this.trail.splice(i,1);}if(this.sim.state.moving&&this.trailCosmetic.id!=="trail-none"&&Math.hypot(this.sim.state.ball.vx,this.sim.state.ball.vy)>70){this.trailClock+=dt;const interval=this.trailCosmetic.id==="trail-sparks"?.024:.034;while(this.trailClock>=interval){this.trailClock-=interval;const b=this.sim.state.ball,maxLife=this.trailCosmetic.id==="trail-petals"?.58:.42;this.trail.push({x:b.x,y:b.y-b.z*AIR_VISUAL_SCALE,life:maxLife,maxLife,size:Phaser.Math.FloatBetween(2.5,5)});if(this.trail.length>70)this.trail.shift();}}else this.trailClock=0;this.trailView.clear();const secondary=this.trailCosmetic.secondary??this.trailCosmetic.primary;for(let i=0;i<this.trail.length;i++){const p=this.trail[i]!,life=p.life/p.maxLife,color=i%2?secondary:this.trailCosmetic.primary;this.trailView.fillStyle(color,life*.46);this.trailView.fillCircle(p.x,p.y,p.size*(.5+life*.5));}}

  private finish():void{
    if(this.done)return;this.done=true;this.dragPointer=null;this.aim.clear();const timeMs=Math.round(performance.now()-this.startedAt);if(this.draftId)CommunityDrafts.markPlaytested(this.draftId);else if(this.mapId)void CommunityMaps.submitRun(this.mapId,this.strokes,timeMs,true);
    this.tweens.add({targets:this.ballView,scale:.05,alpha:0,duration:320,ease:"Cubic.easeOut",onComplete:()=>this.showResult(timeMs)});
  }
  private showResult(timeMs:number):void{
    const children:Phaser.GameObjects.GameObject[]=[];children.push(this.add.rectangle(270,480,540,960,0x05080b,.78).setInteractive(),this.add.rectangle(270,480,440,this.draftId?390:560,0x111a22,.99).setStrokeStyle(2,0x405668));
    children.push(this.add.text(270,300,this.draftId?"✓ PLAYTEST SUPERADO":"HOYO COMPLETADO",{fontFamily:"system-ui",fontSize:"20px",fontStyle:"bold",color:this.draftId?"#9bd8b4":"#f5f7fa"}).setOrigin(.5),this.add.text(270,344,`${this.strokes} golpes · ${(timeMs/1000).toFixed(1)} s`,{fontFamily:"system-ui",fontSize:"14px",color:"#b7c5ce"}).setOrigin(.5));
    if(this.draftId){children.push(this.panelButton(270,440,320,"VOLVER A PUBLICAR",()=>this.scene.start("community-publish"),true),this.panelButton(270,506,320,"REINTENTAR",()=>this.scene.restart({draftId:this.draftId}),false));}
    else{
      const ratingY=420;if(this.detail!.isMine)children.push(this.add.text(270,ratingY,"Es tu mapa · no puedes valorarlo",{fontFamily:"system-ui",fontSize:"11px",color:"#d4bd78"}).setOrigin(.5));else if(this.detail!.canRate){children.push(this.add.text(270,ratingY,"VALORA ESTE MAPA",{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:"#9baeba"}).setOrigin(.5));for(let i=1;i<=5;i++){const star=this.add.text(166+(i-1)*52,468,"☆",{fontFamily:"system-ui",fontSize:"35px",fontStyle:"bold",color:"#f0d27e"}).setOrigin(.5).setInteractive({useHandCursor:true});star.on("pointerup",()=>{void this.rate(i);});children.push(star);}}else children.push(this.add.text(270,ratingY,"Ya has valorado este mapa",{fontFamily:"system-ui",fontSize:"11px",color:"#8da0ad"}).setOrigin(.5));
      children.push(this.panelButton(270,550,320,"REINTENTAR",()=>this.scene.restart({mapId:this.mapId}),true),this.panelButton(180,616,150,"COMENTARIOS",()=>{this.closeOverlay();void this.openComments();},false),this.panelButton(360,616,150,"⚑ REPORTAR",()=>{this.closeOverlay();this.openReport();},false),this.panelButton(270,680,320,"VOLVER A COMMUNITY",()=>this.scene.start("community-maps"),false));
    }
    this.overlayPanel=this.add.container(0,0,children).setDepth(200);sharpenSceneText(this);
  }
  private async rate(stars:number):Promise<void>{if(!this.mapId||!this.detail?.canRate)return;this.detail.canRate=false;const result=await CommunityMaps.rate(this.mapId,stars);this.toast(result.ok?`✓ ${stars}★ ENVIADAS`:"NO SE PUDO VALORAR",result.ok);}

  private async openComments():Promise<void>{
    if(!this.mapId||this.overlayPanel)return;const children:Phaser.GameObjects.GameObject[]=[];children.push(this.add.rectangle(270,480,540,960,0x05080b,.86).setInteractive(),this.add.rectangle(270,480,456,720,0x111a22,.99).setStrokeStyle(2,0x405668),this.add.text(270,158,"COMENTARIOS",{fontFamily:"system-ui",fontSize:"18px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5));const loading=this.add.text(270,460,"CARGANDO…",{fontFamily:"system-ui",fontSize:"11px",color:"#8da0ad"}).setOrigin(.5);children.push(loading,this.panelButton(270,770,320,"ESCRIBIR / EDITAR EL MÍO",()=>{void this.openCommentEditor();},true),this.panelButton(270,832,220,"CERRAR",()=>this.closeOverlay(),false));this.overlayPanel=this.add.container(0,0,children).setDepth(220);
    const comments=await CommunityMaps.comments(this.mapId);if(!this.overlayPanel)return;loading.destroy();if(!comments.length){this.overlayPanel.add(this.add.text(270,430,"AÚN NO HAY COMENTARIOS",{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:"#8799a6"}).setOrigin(.5));return;}comments.slice(0,8).forEach((comment,i)=>this.commentRow(comment,226+i*64));
  }
  private commentRow(comment:CommunityComment,y:number):void{if(!this.overlayPanel)return;this.overlayPanel.add(this.add.text(68,y,`${comment.name}${comment.isMine?" · TÚ":""}`,{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:comment.isMine?"#e2c87e":"#a7bbc7"}).setOrigin(0,.5));this.overlayPanel.add(this.add.text(68,y+22,comment.body,{fontFamily:"system-ui",fontSize:"10px",color:"#d8e1e6",wordWrap:{width:400}}).setOrigin(0,.5));}
  private async openCommentEditor():Promise<void>{
    if(!this.mapId)return;
    const comments=await CommunityMaps.comments(this.mapId),mine=comments.find(comment=>comment.isMine)?.body??"";
    this.closeOverlay();const children:Phaser.GameObjects.GameObject[]=[];
    children.push(this.add.rectangle(270,480,540,960,0x05080b,.88).setInteractive(),this.add.rectangle(270,470,440,500,0x111a22,.99).setStrokeStyle(2,0x405668),this.add.text(270,286,mine?"EDITAR COMENTARIO":"ESCRIBIR COMENTARIO",{fontFamily:"system-ui",fontSize:"18px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5),this.add.text(270,322,"Máximo 500 caracteres",{fontFamily:"system-ui",fontSize:"10px",color:"#8397a4"}).setOrigin(.5));
    const area=document.createElement("textarea");area.maxLength=500;area.value=mine;area.placeholder="Escribe tu comentario…";area.spellcheck=true;
    Object.assign(area.style,{width:"350px",height:"150px",boxSizing:"border-box",resize:"none",border:"2px solid #587286",borderRadius:"9px",background:"#0c141a",color:"#eef5f8",font:"500 16px system-ui",padding:"12px 14px",outline:"none",lineHeight:"1.4"});
    children.push(this.add.dom(270,430,area),this.panelButton(270,558,320,"GUARDAR COMENTARIO",()=>{void this.saveComment(area);},true),this.panelButton(270,624,220,"CANCELAR",()=>{this.closeOverlay();void this.openComments();},false));
    this.overlayPanel=this.add.container(0,0,children).setDepth(240);this.time.delayedCall(50,()=>area.focus());
  }
  private async saveComment(area:HTMLTextAreaElement):Promise<void>{
    if(!this.mapId)return;const message=area.value.trim();if(!message){this.toast("ESCRIBE UN COMENTARIO",false);return;}
    const result=await CommunityMaps.comment(this.mapId,message);this.closeOverlay();this.toast(result.ok?"✓ COMENTARIO GUARDADO":"NO SE PUDO GUARDAR",result.ok);this.time.delayedCall(200,()=>{void this.openComments();});
  }

  private openReport():void{
    if(!this.mapId||this.overlayPanel)return;const children:Phaser.GameObjects.GameObject[]=[];children.push(this.add.rectangle(270,480,540,960,0x05080b,.86).setInteractive(),this.add.rectangle(270,480,438,510,0x111a22,.99).setStrokeStyle(2,0x405668),this.add.text(270,286,"REPORTAR MAPA",{fontFamily:"system-ui",fontSize:"18px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5),this.add.text(270,318,"Esto no afecta a la valoración por estrellas",{fontFamily:"system-ui",fontSize:"10px",color:"#8397a4"}).setOrigin(.5));
    const options:[string,CommunityReportCategory][]=[["BUG","bug"],["IMPOSIBLE","impossible"],["INAPROPIADO","inappropriate"],["SPAM","spam"],["OTRO","other"]];options.forEach(([label,category],i)=>{const y=376+i*58;children.push(this.panelButton(270,y,320,label,()=>{void this.sendReport(category);},category==="bug"||category==="impossible"));});children.push(this.panelButton(270,690,220,"CERRAR",()=>this.closeOverlay(),false));this.overlayPanel=this.add.container(0,0,children).setDepth(220);
  }
  private async sendReport(category:CommunityReportCategory):Promise<void>{if(!this.mapId)return;const note=(category==="bug"||category==="impossible"||category==="other")?(window.prompt("Detalle opcional","")??""):"";const result=await CommunityMaps.report(this.mapId,category,note);this.closeOverlay();this.toast(result.ok?"✓ REPORTE ENVIADO":"NO SE PUDO REPORTAR",result.ok);}

  private panelButton(x:number,y:number,w:number,label:string,action:()=>void,primary=false):Phaser.GameObjects.Container{const rest=primary?0x294454:0x17232c,bg=this.add.rectangle(x,y,w,54,rest).setStrokeStyle(2,primary?0x78a9c2:0x3c5060).setInteractive({useHandCursor:true}),t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:"#e6eef3"}).setOrigin(.5);bg.on("pointerdown",()=>{bg.setScale(.98);t.setScale(.98);}).on("pointerout",()=>{bg.setScale(1);t.setScale(1);}).on("pointerup",()=>{bg.setScale(1);t.setScale(1);action();});return this.add.container(0,0,[bg,t]);}
  private closeOverlay():void{this.overlayPanel?.destroy(true);this.overlayPanel=null;}
  private goBack():void{if(this.draftId)this.scene.start("community-publish");else this.scene.start("community-maps");}
  private toast(message:string,ok:boolean):void{const t=this.add.text(270,174,message,{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:ok?"#d9efde":"#f0c1b7",backgroundColor:ok?"#14231a":"#2b1715",padding:{x:12,y:7}}).setOrigin(.5).setDepth(350);this.tweens.add({targets:t,alpha:0,delay:900,duration:180,onComplete:()=>t.destroy()});}
}
