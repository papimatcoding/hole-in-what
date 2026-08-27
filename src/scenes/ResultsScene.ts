import Phaser from "phaser";
import { BETA_TESTING } from "../config/beta";
import { isDesktopUI, setupDesignCamera, sharpenSceneText, uiFontSize } from "../config/display";
import { cosmeticById } from "../data/cosmetics";
import { levelsForMode } from "../data/campaign";
import { AudioFeedback } from "../systems/AudioFeedback";
import { BetaFeedbackSystem, type BetaFeedbackCategory } from "../systems/BetaFeedbackSystem";
import { BetaTelemetry } from "../systems/BetaTelemetrySystem";
import { SaveSystem } from "../systems/SaveSystem";
import { formatRequirement, requirementMet } from "../systems/StarScoring";
import type { ResultsSceneData } from "../types";

type QuickKey="fun"|"originality"|"difficulty";

export class ResultsScene extends Phaser.Scene{
  private resultData!:ResultsSceneData;
  private surveyPanel:Phaser.GameObjects.Container|null=null;
  private feedbackPanel:Phaser.GameObjects.Container|null=null;
  private leaderboardPanel:Phaser.GameObjects.Container|null=null;
  private quick={fun:0,originality:0,difficulty:0};
  private surveyBug=false;
  private surveySurprise=false;
  private surveySubmitting=false;
  private runUpload:Promise<void>|null=null;

  constructor(){super("results");}
  init(data:ResultsSceneData):void{this.resultData=data;}

  create():void{
    setupDesignCamera(this);this.cameras.main.setBackgroundColor("#0b0f14");
    const levels=levelsForMode(this.resultData.mode),level=levels[this.resultData.levelIndex]!,previous=SaveSystem.record(this.resultData.levelId);
    const newStrokeRecord=previous.bestStrokes===null||this.resultData.strokes<previous.bestStrokes;
    const newTimeRecord=previous.bestTimeMs===null||this.resultData.timeMs<previous.bestTimeMs;
    const newStars=this.resultData.stars>previous.stars;
    const reward=SaveSystem.submit(this.resultData.levelId,this.resultData.stars,this.resultData.strokes,this.resultData.timeMs);
    if(BETA_TESTING)this.runUpload=BetaTelemetry.submitRun({levelId:this.resultData.levelId,mode:this.resultData.mode,strokes:this.resultData.strokes,timeMs:this.resultData.timeMs,stars:this.resultData.stars,trapsTriggered:this.resultData.trapsTriggered??[],mechanicsUsed:this.resultData.mechanicsUsed??[],voids:this.resultData.voids??0});

    this.add.text(498,54,`◈ ${reward.totalCoins}   ◆ ${reward.totalGems}`,{fontFamily:"system-ui, sans-serif",fontSize:uiFontSize(15,1),fontStyle:"bold",color:"#d9e4ee"}).setOrigin(1,.5);
    const stars="★".repeat(this.resultData.stars)+"☆".repeat(3-this.resultData.stars);
    this.add.text(270,176,stars,{fontFamily:"system-ui, sans-serif",fontSize:"56px",color:"#f1d07a"}).setOrigin(.5);
    this.add.text(270,254,`${this.resultData.strokes} ${this.resultData.strokes===1?"golpe":"golpes"}`,{fontFamily:"system-ui, sans-serif",fontSize:"28px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.text(270,294,`${(this.resultData.timeMs/1000).toFixed(1)} s`,{fontFamily:"system-ui, sans-serif",fontSize:"18px",color:"#9eabb9"}).setOrigin(.5);

    const notices:string[]=[];if(newStars)notices.push(previous.stars===0?"NUEVAS ESTRELLAS":"NUEVA ESTRELLA");if(newStrokeRecord)notices.push("RÉCORD DE GOLPES");if(newTimeRecord)notices.push("RÉCORD DE TIEMPO");
    if(notices.length){const notice=this.add.text(270,338,notices.join(" · "),{fontFamily:"system-ui",fontSize:uiFontSize(12),fontStyle:"bold",color:"#dfe9ef"}).setOrigin(.5).setAlpha(0);this.tweens.add({targets:notice,alpha:1,y:334,duration:220});if(newStars)AudioFeedback.play("star");}

    const metThree=requirementMet(level.threeStar,this.resultData.strokes),metTwo=requirementMet(level.twoStar,this.resultData.strokes);
    this.add.rectangle(270,420,400,112,0x121a21).setStrokeStyle(1,0x2d3a47);
    this.add.text(108,398,`${metThree?"✓":"·"}  ★★★   ${formatRequirement(level.threeStar)}`,{fontFamily:"system-ui",fontSize:uiFontSize(14,1),fontStyle:"bold",color:metThree?"#f1d07a":"#82909b"}).setOrigin(0,.5);
    this.add.text(108,438,`${metTwo?"✓":"·"}  ★★     ${formatRequirement(level.twoStar)}`,{fontFamily:"system-ui",fontSize:uiFontSize(13,1),color:metTwo?"#c5d0da":"#7b8791"}).setOrigin(0,.5);
    const target=this.resultData.stars>=3?null:this.resultData.stars===2?level.threeStar.maxStrokes:level.twoStar.maxStrokes;
    this.add.text(270,494,target==null?"Ruta de maestría conseguida":`Te ${Math.max(1,this.resultData.strokes-target)===1?"faltó 1 golpe":`faltaron ${Math.max(1,this.resultData.strokes-target)} golpes`} para ${this.resultData.stars===2?"★★★":"★★"}`,{fontFamily:"system-ui",fontSize:uiFontSize(14,1),fontStyle:"bold",color:target==null?"#f1d07a":"#c9d3db"}).setOrigin(.5);

    let infoY=530;if(reward.coinsEarned>0){this.add.text(270,infoY,`+${reward.coinsEarned} ◈`,{fontFamily:"system-ui",fontSize:uiFontSize(13,1),fontStyle:"bold",color:"#e4d29d"}).setOrigin(.5);infoY+=25;}
    if(reward.newlyUnlockedCosmetics.length){const names=reward.newlyUnlockedCosmetics.map(id=>cosmeticById(id)?.name).filter((x):x is string=>Boolean(x));this.add.text(270,infoY,`DESBLOQUEADO · ${names.join(" · ")}`,{fontFamily:"system-ui",fontSize:uiFontSize(11),fontStyle:"bold",color:"#f1d07a",wordWrap:{width:430},align:"center"}).setOrigin(.5);}

    const canPrev=this.resultData.levelIndex>0,canNext=this.resultData.levelIndex<levels.length-1&&(BETA_TESTING||SaveSystem.isLevelUnlocked(this.resultData.mode,this.resultData.levelIndex+1));
    const retry=()=>this.scene.start("game",{mode:this.resultData.mode,levelIndex:this.resultData.levelIndex}),prev=()=>this.scene.start("game",{mode:this.resultData.mode,levelIndex:this.resultData.levelIndex-1}),next=()=>this.scene.start("game",{mode:this.resultData.mode,levelIndex:this.resultData.levelIndex+1});
    if(this.resultData.stars<3){this.makeButton("REINTENTAR",620,retry,true);if(canNext)this.makeButton("SIGUIENTE",696,next,false);}else{if(canNext)this.makeButton("SIGUIENTE",620,next,true);this.makeButton("REINTENTAR",696,retry,false);}
    if(BETA_TESTING){this.nav(126,768,"‹ ANTERIOR",canPrev,prev);this.add.text(270,768,`${this.resultData.mode==="troll"?"H":"C"} ${String(this.resultData.levelIndex+1).padStart(2,"0")} / ${String(levels.length).padStart(2,"0")}`,{fontFamily:"system-ui",fontSize:uiFontSize(11),fontStyle:"bold",color:"#8193a1"}).setOrigin(.5);this.nav(414,768,"SIGUIENTE ›",canNext,next);}
    this.smallAction(270,812,"NIVELES",()=>this.scene.start("level-select",{mode:this.resultData.mode,page:Math.floor(this.resultData.levelIndex/10)}),160,0x172129,"#c8d3dc");
    if(BETA_TESTING){this.smallAction(175,858,"🏆 RANKING",()=>{void this.openLeaderboard();},174,0x211f1a,"#e5d293");this.smallAction(365,858,"⚑ REPORTAR",()=>this.openFeedback(),174,0x17242d,"#a9d1e5");}
    sharpenSceneText(this);
    if(BETA_TESTING&&!BetaTelemetry.levelSurveyDone(this.resultData.levelId))this.time.delayedCall(180,()=>this.openSurvey());
  }

  private makeButton(label:string,y:number,action:()=>void,primary:boolean):void{
    const rest=primary?0x253847:0x172129,hover=primary?0x345064:0x22303b,bg=this.add.rectangle(270,y,350,66,rest).setStrokeStyle(2,primary?0x7598af:0x405363).setInteractive({useHandCursor:true}),t=this.add.text(270,y,label,{fontFamily:"system-ui",fontSize:uiFontSize(17,1),fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    bg.on("pointerover",()=>bg.setFillStyle(hover));bg.on("pointerdown",()=>{bg.setScale(.985);t.setScale(.985);});bg.on("pointerout",()=>{bg.setFillStyle(rest).setScale(1);t.setScale(1);});bg.on("pointerup",()=>{bg.setFillStyle(rest).setScale(1);t.setScale(1);action();});
  }
  private nav(x:number,y:number,label:string,enabled:boolean,action:()=>void):void{
    const bg=this.add.rectangle(x,y,136,48,enabled?0x151f27:0x0f151a).setStrokeStyle(1,enabled?0x354958:0x222c33),t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:uiFontSize(11),fontStyle:"bold",color:enabled?"#b8cfdd":"#46525b"}).setOrigin(.5);if(!enabled)return;bg.setInteractive({useHandCursor:true}).on("pointerdown",()=>bg.setScale(.98)).on("pointerout",()=>bg.setScale(1)).on("pointerup",()=>{bg.setScale(1);action();});
  }
  private smallAction(x:number,y:number,label:string,action:()=>void,w:number,fill:number,color:string):void{
    const bg=this.add.rectangle(x,y,w,48,fill).setStrokeStyle(1,0x3a4c59).setInteractive({useHandCursor:true}),t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:uiFontSize(12),fontStyle:"bold",color}).setOrigin(.5);bg.on("pointerdown",()=>{bg.setScale(.98);t.setScale(.98);}).on("pointerout",()=>{bg.setScale(1);t.setScale(1);}).on("pointerup",()=>{bg.setScale(1);t.setScale(1);action();});
  }

  private openSurvey():void{
    if(this.surveyPanel)return;this.quick={fun:0,originality:0,difficulty:0};this.surveyBug=false;this.surveySurprise=false;this.surveySubmitting=false;
    const hard=this.resultData.mode==="troll",desktop=isDesktopUI(),children:Phaser.GameObjects.GameObject[]=[];
    children.push(this.add.rectangle(270,480,540,960,0x05080b,.72).setInteractive());
    children.push(this.add.rectangle(270,480,468,desktop?488:466,0x111a22,.99).setStrokeStyle(2,0x405668));
    const top=desktop?266:276;
    children.push(this.add.text(270,top,"¿QUÉ TAL ESTE HOYO?",{fontFamily:"system-ui",fontSize:uiFontSize(17,2),fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5));
    children.push(this.add.text(270,top+31,"3 respuestas rápidas · pulsa ENVIAR al terminar",{fontFamily:"system-ui",fontSize:uiFontSize(10,2),color:"#91a4b1"}).setOrigin(.5));
    this.segmentRow(children,"DIVERSIÓN",top+88,["1","2","3","4","5"],[1,2,3,4,5],"fun");
    this.segmentRow(children,"ORIGINAL",top+153,["REPETIDO","NORMAL","NUEVO"],[1,3,5],"originality");
    this.segmentRow(children,"DIFICULTAD",top+218,["FÁCIL","JUSTA","DURA"],[1,3,5],"difficulty");
    const chipY=top+282;
    if(hard){const bug=this.chip(children,190,chipY,"⚠ BUG",()=>{this.surveyBug=!this.surveyBug;bug.setFillStyle(this.surveyBug?0x5a342f:0x17242d);});const troll=this.chip(children,350,chipY,"😈 ME PILLÓ",()=>{this.surveySurprise=!this.surveySurprise;troll.setFillStyle(this.surveySurprise?0x4c3f65:0x17242d);});}
    else{const bug=this.chip(children,270,chipY,"⚠ BUG",()=>{this.surveyBug=!this.surveyBug;bug.setFillStyle(this.surveyBug?0x5a342f:0x17242d);});}
    const actionY=top+348;this.surveyAction(children,190,actionY,"SALTAR",()=>this.closeSurvey(),false);this.surveyAction(children,350,actionY,"ENVIAR",()=>{void this.submitSurvey();},true);
    this.surveyPanel=this.add.container(0,0,children).setDepth(300).setAlpha(0);this.tweens.add({targets:this.surveyPanel,alpha:1,duration:90});
  }

  private segmentRow(children:Phaser.GameObjects.GameObject[],label:string,y:number,labels:string[],values:number[],key:QuickKey):void{
    children.push(this.add.text(62,y,label,{fontFamily:"system-ui",fontSize:uiFontSize(10,2),fontStyle:"bold",color:"#c9d5de"}).setOrigin(0,.5));
    const start=labels.length===5?262:246,spacing=labels.length===5?44:82;
    labels.forEach((label,i)=>{const x=start+i*spacing,w=labels.length===5?40:74,bg=this.add.rectangle(x,y,w,44,0x17242d).setStrokeStyle(1,0x405767).setInteractive({useHandCursor:true});const t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:labels.length===5?uiFontSize(11,1):uiFontSize(8,2),fontStyle:"bold",color:"#dfe8ee"}).setOrigin(.5);children.push(bg,t);const choose=()=>{this.quick[key]=values[i]!;for(const obj of children)if(obj instanceof Phaser.GameObjects.Rectangle&&Math.abs(obj.y-y)<1&&obj.width<=80)obj.setFillStyle(obj===bg?0x45677a:0x17242d);};bg.on("pointerdown",()=>{bg.setScale(.97);t.setScale(.97);}).on("pointerout",()=>{bg.setScale(1);t.setScale(1);}).on("pointerup",()=>{bg.setScale(1);t.setScale(1);choose();});});
  }
  private chip(children:Phaser.GameObjects.GameObject[],x:number,y:number,label:string,action:()=>void):Phaser.GameObjects.Rectangle{const bg=this.add.rectangle(x,y,140,46,0x17242d).setStrokeStyle(1,0x3b5060).setInteractive({useHandCursor:true});const t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:uiFontSize(9,2),fontStyle:"bold",color:"#b9c9d4"}).setOrigin(.5);children.push(bg,t);bg.on("pointerdown",()=>{bg.setScale(.97);t.setScale(.97);}).on("pointerout",()=>{bg.setScale(1);t.setScale(1);}).on("pointerup",()=>{bg.setScale(1);t.setScale(1);action();});return bg;}
  private surveyAction(children:Phaser.GameObjects.GameObject[],x:number,y:number,label:string,action:()=>void,primary:boolean):void{const rest=primary?0x29485a:0x141d24,hover=primary?0x37657b:0x202c35,bg=this.add.rectangle(x,y,140,50,rest).setStrokeStyle(2,primary?0x6f9bb1:0x354652).setInteractive({useHandCursor:true}),t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:uiFontSize(11,2),fontStyle:"bold",color:primary?"#eef7fb":"#9fb1bd"}).setOrigin(.5);children.push(bg,t);bg.on("pointerover",()=>bg.setFillStyle(hover)).on("pointerdown",()=>{bg.setScale(.97);t.setScale(.97);}).on("pointerout",()=>{bg.setFillStyle(rest).setScale(1);t.setScale(1);}).on("pointerup",()=>{bg.setFillStyle(rest).setScale(1);t.setScale(1);action();});}
  private async submitSurvey():Promise<void>{
    if(this.surveySubmitting)return;
    if(!this.quick.fun||!this.quick.originality||!this.quick.difficulty){this.toast("RESPONDE LAS 3 PREGUNTAS",false);return;}
    this.surveySubmitting=true;
    const ok=await BetaTelemetry.submitLevelFeedback({levelId:this.resultData.levelId,mode:this.resultData.mode,fun:this.quick.fun,originality:this.quick.originality,difficulty:this.quick.difficulty,surprise:this.resultData.mode==="troll"?(this.surveySurprise?5:3):null,tags:this.surveyBug?["bug"]:[],comment:""});
    this.closeSurvey();this.toast(ok?"✓ FEEDBACK ENVIADO":"NO SE PUDO ENVIAR",ok);if(ok&&this.allCurrentLevelsCompleted()&&!BetaTelemetry.gameSurveyDone())this.time.delayedCall(350,()=>this.openGameSurvey());
  }
  private closeSurvey():void{this.surveyPanel?.destroy(true);this.surveyPanel=null;this.surveySubmitting=false;}

  private openFeedback():void{
    if(this.feedbackPanel)return;const children:Phaser.GameObjects.GameObject[]=[];children.push(this.add.rectangle(270,480,540,960,0x05080b,.82).setInteractive(),this.add.rectangle(270,480,430,450,0x111a22,.99).setStrokeStyle(2,0x405668),this.add.text(270,292,"REPORTE RÁPIDO",{fontFamily:"system-ui",fontSize:uiFontSize(17,2),fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5),this.add.text(270,324,"1 toque. Nota sólo si eliges OTRO.",{fontFamily:"system-ui",fontSize:uiFontSize(10,2),color:"#8da0ad"}).setOrigin(.5));
    const choices:[string,BetaFeedbackCategory][]=[["BUG","bug"],["MUY FÁCIL","too-easy"],["MUY DIFÍCIL","too-hard"],["REPETITIVO","repetitive"],["OBJETO SOBRA","object"],["OTRO","other"]];
    choices.forEach(([label,category],i)=>{const x=170+(i%2)*200,y=386+Math.floor(i/2)*68,bg=this.add.rectangle(x,y,178,54,0x1a2731).setStrokeStyle(1,0x496173).setInteractive({useHandCursor:true});const t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:uiFontSize(11,2),fontStyle:"bold",color:"#dfe9ef"}).setOrigin(.5);children.push(bg,t);bg.on("pointerdown",()=>{bg.setScale(.98);t.setScale(.98);}).on("pointerout",()=>{bg.setScale(1);t.setScale(1);}).on("pointerup",()=>{bg.setScale(1);t.setScale(1);void this.saveFeedback(category);});});
    this.feedbackCloseButton(children,270,626,"CERRAR",()=>this.closeFeedback());this.feedbackPanel=this.add.container(0,0,children).setDepth(220);
  }
  private async saveFeedback(category:BetaFeedbackCategory):Promise<void>{
    const note=category==="other"?(window.prompt("Cuéntanos qué pasó","")??""):"";
    BetaFeedbackSystem.add({levelId:this.resultData.levelId,mode:this.resultData.mode,levelIndex:this.resultData.levelIndex,strokes:this.resultData.strokes,timeMs:this.resultData.timeMs},category,note);
    this.closeFeedback();
    const sent=await BetaTelemetry.submitReport({levelId:this.resultData.levelId,mode:this.resultData.mode,category,note,strokes:this.resultData.strokes,timeMs:this.resultData.timeMs});
    this.toast(sent?"✓ REPORTE ENVIADO":"✓ GUARDADO LOCAL · SIN RED",true);
  }
  private closeFeedback():void{this.feedbackPanel?.destroy(true);this.feedbackPanel=null;}
  private feedbackCloseButton(children:Phaser.GameObjects.GameObject[],x:number,y:number,label:string,action:()=>void):void{const bg=this.add.rectangle(x,y,180,48,0x141d24).setStrokeStyle(1,0x354652).setInteractive({useHandCursor:true}),t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:uiFontSize(11,2),fontStyle:"bold",color:"#94a5b1"}).setOrigin(.5);children.push(bg,t);bg.on("pointerdown",()=>{bg.setScale(.98);t.setScale(.98);}).on("pointerout",()=>{bg.setScale(1);t.setScale(1);}).on("pointerup",()=>{bg.setScale(1);t.setScale(1);action();});}

  private async openLeaderboard():Promise<void>{
    if(this.leaderboardPanel)return;const children:Phaser.GameObjects.GameObject[]=[];children.push(this.add.rectangle(270,480,540,960,0x05080b,.86).setInteractive(),this.add.rectangle(270,480,438,650,0x111a22,.99).setStrokeStyle(2,0x526878));
    children.push(this.add.text(270,192,`🏆 ${this.resultData.levelId.toUpperCase()}`,{fontFamily:"system-ui",fontSize:uiFontSize(18,1),fontStyle:"bold",color:"#f1d07a"}).setOrigin(.5));const loading=this.add.text(270,480,"CARGANDO…",{fontFamily:"system-ui",fontSize:uiFontSize(12,2),color:"#91a2af"}).setOrigin(.5);children.push(loading);this.feedbackCloseButton(children,270,776,"CERRAR",()=>this.closeLeaderboard());this.leaderboardPanel=this.add.container(0,0,children).setDepth(320);
    await this.runUpload;const entries=await BetaTelemetry.leaderboard(this.resultData.levelId);if(!this.leaderboardPanel)return;loading.destroy();if(!entries.length){this.leaderboardPanel.add(this.add.text(270,470,"AÚN NO HAY MARCAS",{fontFamily:"system-ui",fontSize:uiFontSize(13,2),fontStyle:"bold",color:"#91a2af"}).setOrigin(.5));return;}
    entries.slice(0,10).forEach((e,i)=>{const y=270+i*43,color=e.isYou?"#f1d07a":"#dce5eb";this.leaderboardPanel!.add(this.add.text(72,y,`${e.rank}. ${e.name}${e.isYou?" · TÚ":""}`,{fontFamily:"system-ui",fontSize:uiFontSize(11,1),fontStyle:e.isYou?"bold":"normal",color}).setOrigin(0,.5));this.leaderboardPanel!.add(this.add.text(468,y,`${e.strokes} golpes · ${(e.timeMs/1000).toFixed(1)}s`,{fontFamily:"system-ui",fontSize:uiFontSize(11,1),fontStyle:"bold",color}).setOrigin(1,.5));});
  }
  private closeLeaderboard():void{this.leaderboardPanel?.destroy(true);this.leaderboardPanel=null;}

  private allCurrentLevelsCompleted():boolean{return[...levelsForMode("classic"),...levelsForMode("troll")].every(level=>SaveSystem.record(level.id).completed);}
  private openGameSurvey():void{this.scene.start("global-survey");}
  private toast(message:string,ok:boolean):void{const t=this.add.text(270,166,message,{fontFamily:"system-ui",fontSize:uiFontSize(11,2),fontStyle:"bold",color:ok?"#d9efde":"#f0c1b7",backgroundColor:ok?"#14231a":"#2b1715",padding:{x:12,y:7}}).setOrigin(.5).setDepth(350);this.tweens.add({targets:t,alpha:0,delay:800,duration:180,onComplete:()=>t.destroy()});}
}
