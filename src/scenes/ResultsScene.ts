import Phaser from "phaser";
import { BETA_TESTING } from "../config/beta";
import { setupDesignCamera, sharpenSceneText } from "../config/display";
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

    this.add.text(498,54,`◈ ${reward.totalCoins}   ◆ ${reward.totalGems}`,{fontFamily:"system-ui, sans-serif",fontSize:"15px",fontStyle:"bold",color:"#d9e4ee"}).setOrigin(1,.5);
    const stars="★".repeat(this.resultData.stars)+"☆".repeat(3-this.resultData.stars);
    this.add.text(270,176,stars,{fontFamily:"system-ui, sans-serif",fontSize:"56px",color:"#f1d07a"}).setOrigin(.5);
    this.add.text(270,254,`${this.resultData.strokes} ${this.resultData.strokes===1?"golpe":"golpes"}`,{fontFamily:"system-ui, sans-serif",fontSize:"28px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    this.add.text(270,294,`${(this.resultData.timeMs/1000).toFixed(1)} s`,{fontFamily:"system-ui, sans-serif",fontSize:"18px",color:"#9eabb9"}).setOrigin(.5);

    const notices:string[]=[];if(newStars)notices.push(previous.stars===0?"NUEVAS ESTRELLAS":"NUEVA ESTRELLA");if(newStrokeRecord)notices.push("RÉCORD DE GOLPES");if(newTimeRecord)notices.push("RÉCORD DE TIEMPO");
    if(notices.length){const notice=this.add.text(270,338,notices.join(" · "),{fontFamily:"system-ui",fontSize:"12px",fontStyle:"bold",color:"#dfe9ef"}).setOrigin(.5).setAlpha(0);this.tweens.add({targets:notice,alpha:1,y:334,duration:220});if(newStars)AudioFeedback.play("star");}

    const metThree=requirementMet(level.threeStar,this.resultData.strokes),metTwo=requirementMet(level.twoStar,this.resultData.strokes);
    this.add.rectangle(270,420,400,112,0x121a21).setStrokeStyle(1,0x2d3a47);
    this.add.text(108,398,`${metThree?"✓":"·"}  ★★★   ${formatRequirement(level.threeStar)}`,{fontFamily:"system-ui",fontSize:"14px",fontStyle:"bold",color:metThree?"#f1d07a":"#82909b"}).setOrigin(0,.5);
    this.add.text(108,438,`${metTwo?"✓":"·"}  ★★     ${formatRequirement(level.twoStar)}`,{fontFamily:"system-ui",fontSize:"13px",color:metTwo?"#c5d0da":"#7b8791"}).setOrigin(0,.5);
    const target=this.resultData.stars>=3?null:this.resultData.stars===2?level.threeStar.maxStrokes:level.twoStar.maxStrokes;
    this.add.text(270,494,target==null?"Ruta de maestría conseguida":`Te ${Math.max(1,this.resultData.strokes-target)===1?"faltó 1 golpe":`faltaron ${Math.max(1,this.resultData.strokes-target)} golpes`} para ${this.resultData.stars===2?"★★★":"★★"}`,{fontFamily:"system-ui",fontSize:"14px",fontStyle:"bold",color:target==null?"#f1d07a":"#c9d3db"}).setOrigin(.5);

    let infoY=530;if(reward.coinsEarned>0){this.add.text(270,infoY,`+${reward.coinsEarned} ◈`,{fontFamily:"system-ui",fontSize:"13px",fontStyle:"bold",color:"#e4d29d"}).setOrigin(.5);infoY+=25;}
    if(reward.newlyUnlockedCosmetics.length){const names=reward.newlyUnlockedCosmetics.map(id=>cosmeticById(id)?.name).filter((x):x is string=>Boolean(x));this.add.text(270,infoY,`DESBLOQUEADO · ${names.join(" · ")}`,{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:"#f1d07a",wordWrap:{width:430},align:"center"}).setOrigin(.5);}

    const canPrev=this.resultData.levelIndex>0,canNext=this.resultData.levelIndex<levels.length-1&&(BETA_TESTING||SaveSystem.isLevelUnlocked(this.resultData.mode,this.resultData.levelIndex+1));
    const retry=()=>this.scene.start("game",{mode:this.resultData.mode,levelIndex:this.resultData.levelIndex}),prev=()=>this.scene.start("game",{mode:this.resultData.mode,levelIndex:this.resultData.levelIndex-1}),next=()=>this.scene.start("game",{mode:this.resultData.mode,levelIndex:this.resultData.levelIndex+1});
    if(this.resultData.stars<3){this.makeButton("REINTENTAR",620,retry,true);if(canNext)this.makeButton("SIGUIENTE",696,next,false);}else{if(canNext)this.makeButton("SIGUIENTE",620,next,true);this.makeButton("REINTENTAR",696,retry,false);}
    if(BETA_TESTING){this.nav(126,768,"‹ ANTERIOR",canPrev,prev);this.add.text(270,768,`${this.resultData.mode==="troll"?"H":"C"} ${String(this.resultData.levelIndex+1).padStart(2,"0")} / ${String(levels.length).padStart(2,"0")}`,{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:"#8193a1"}).setOrigin(.5);this.nav(414,768,"SIGUIENTE ›",canNext,next);}
    this.smallAction(270,812,"NIVELES",()=>this.scene.start("level-select",{mode:this.resultData.mode,page:Math.floor(this.resultData.levelIndex/10)}),150,0x172129,"#c8d3dc");
    if(BETA_TESTING){this.smallAction(175,858,"🏆 RANKING",()=>{void this.openLeaderboard();},166,0x211f1a,"#e5d293");this.smallAction(365,858,"⚑ REPORTAR",()=>this.openFeedback(),166,0x17242d,"#a9d1e5");}
    sharpenSceneText(this);
    if(BETA_TESTING&&!BetaTelemetry.levelSurveyDone(this.resultData.levelId))this.time.delayedCall(280,()=>this.openSurvey());
  }

  private makeButton(label:string,y:number,action:()=>void,primary:boolean):void{
    const rest=primary?0x253847:0x172129,hover=primary?0x345064:0x22303b,bg=this.add.rectangle(270,y,350,66,rest).setStrokeStyle(2,primary?0x7598af:0x405363).setInteractive({useHandCursor:true}),t=this.add.text(270,y,label,{fontFamily:"system-ui",fontSize:"17px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5);
    bg.on("pointerover",()=>bg.setFillStyle(hover));bg.on("pointerdown",()=>{bg.setScale(.985);t.setScale(.985);});bg.on("pointerout",()=>{bg.setFillStyle(rest).setScale(1);t.setScale(1);});bg.on("pointerup",()=>{bg.setFillStyle(rest).setScale(1);t.setScale(1);action();});
  }
  private nav(x:number,y:number,label:string,enabled:boolean,action:()=>void):void{
    const bg=this.add.rectangle(x,y,130,42,enabled?0x151f27:0x0f151a).setStrokeStyle(1,enabled?0x354958:0x222c33),t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:enabled?"#b8cfdd":"#46525b"}).setOrigin(.5);if(!enabled)return;bg.setInteractive({useHandCursor:true}).on("pointerdown",()=>bg.setScale(.98)).on("pointerout",()=>bg.setScale(1)).on("pointerup",()=>{bg.setScale(1);action();});
  }
  private smallAction(x:number,y:number,label:string,action:()=>void,w:number,fill:number,color:string):void{
    const bg=this.add.rectangle(x,y,w,42,fill).setStrokeStyle(1,0x3a4c59).setInteractive({useHandCursor:true}),t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:"12px",fontStyle:"bold",color}).setOrigin(.5);bg.on("pointerdown",()=>{bg.setScale(.98);t.setScale(.98);}).on("pointerout",()=>{bg.setScale(1);t.setScale(1);}).on("pointerup",()=>{bg.setScale(1);t.setScale(1);action();});
  }

  private openSurvey():void{
    if(this.surveyPanel)return;this.quick={fun:0,originality:0,difficulty:0};this.surveyBug=false;this.surveySurprise=false;this.surveySubmitting=false;
    const hard=this.resultData.mode==="troll",children:Phaser.GameObjects.GameObject[]=[];
    children.push(this.add.rectangle(270,480,540,960,0x05080b,.64).setInteractive());
    children.push(this.add.rectangle(270,480,458,hard?360:326,0x111a22,.99).setStrokeStyle(2,0x405668));
    const top=hard?326:344;children.push(this.add.text(270,top,"¿QUÉ TAL ESTE HOYO?",{fontFamily:"system-ui",fontSize:"17px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5));
    children.push(this.add.text(270,top+27,"3 toques · se envía solo",{fontFamily:"system-ui",fontSize:"10px",color:"#8193a0"}).setOrigin(.5));
    this.segmentRow(children,"DIVERSIÓN",top+72,["1","2","3","4","5"],[1,2,3,4,5],"fun");
    this.segmentRow(children,"ORIGINAL",top+126,["REPETIDO","NORMAL","NUEVO"],[1,3,5],"originality");
    this.segmentRow(children,"DIFICULTAD",top+180,["FÁCIL","JUSTA","DURA"],[1,3,5],"difficulty");
    const chipY=top+232;const bug=this.chip(children,hard?160:205,chipY,"⚠ BUG",()=>{this.surveyBug=!this.surveyBug;bug.setFillStyle(this.surveyBug?0x5a342f:0x17242d);});
    if(hard){const troll=this.chip(children,330,chipY,"😈 ME PILLÓ",()=>{this.surveySurprise=!this.surveySurprise;troll.setFillStyle(this.surveySurprise?0x4c3f65:0x17242d);});}
    children.push(this.add.text(hard?430:335,chipY,"SALTAR",{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:"#718491"}).setOrigin(.5).setInteractive({useHandCursor:true}).on("pointerup",()=>this.closeSurvey()));
    this.surveyPanel=this.add.container(0,0,children).setDepth(300).setAlpha(0);this.tweens.add({targets:this.surveyPanel,alpha:1,duration:90});
  }

  private segmentRow(children:Phaser.GameObjects.GameObject[],label:string,y:number,labels:string[],values:number[],key:QuickKey):void{
    children.push(this.add.text(66,y,label,{fontFamily:"system-ui",fontSize:"10px",fontStyle:"bold",color:"#c9d5de"}).setOrigin(0,.5));
    const start=labels.length===5?260:250,spacing=labels.length===5?40:72;
    labels.forEach((label,i)=>{const x=start+i*spacing,w=labels.length===5?32:64,bg=this.add.rectangle(x,y,w,34,0x17242d).setStrokeStyle(1,0x405767).setInteractive({useHandCursor:true});const t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:labels.length===5?"10px":"8px",fontStyle:"bold",color:"#dfe8ee"}).setOrigin(.5);children.push(bg,t);bg.on("pointerup",()=>{this.quick[key]=values[i]!;for(const obj of children)if(obj instanceof Phaser.GameObjects.Rectangle&&Math.abs(obj.y-y)<1&&obj.width<=70)obj.setFillStyle(obj===bg?0x45677a:0x17242d);this.queueSurveySubmit();});});
  }
  private chip(children:Phaser.GameObjects.GameObject[],x:number,y:number,label:string,action:()=>void):Phaser.GameObjects.Rectangle{const bg=this.add.rectangle(x,y,112,38,0x17242d).setStrokeStyle(1,0x3b5060).setInteractive({useHandCursor:true});const t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:"9px",fontStyle:"bold",color:"#b9c9d4"}).setOrigin(.5);children.push(bg,t);bg.on("pointerup",action);return bg;}
  private queueSurveySubmit():void{if(!this.quick.fun||!this.quick.originality||!this.quick.difficulty||this.surveySubmitting)return;this.surveySubmitting=true;this.time.delayedCall(450,()=>{if(this.surveyPanel)void this.submitSurvey();});}
  private async submitSurvey():Promise<void>{const ok=await BetaTelemetry.submitLevelFeedback({levelId:this.resultData.levelId,mode:this.resultData.mode,fun:this.quick.fun,originality:this.quick.originality,difficulty:this.quick.difficulty,surprise:this.resultData.mode==="troll"?(this.surveySurprise?5:3):null,tags:this.surveyBug?["bug"]:[],comment:""});this.closeSurvey();this.toast(ok?"✓ FEEDBACK ENVIADO":"NO SE PUDO ENVIAR",ok);if(ok&&this.allCurrentLevelsCompleted()&&!BetaTelemetry.gameSurveyDone())this.time.delayedCall(350,()=>{void this.openGameSurvey();});}
  private closeSurvey():void{this.surveyPanel?.destroy(true);this.surveyPanel=null;this.surveySubmitting=false;}

  private openFeedback():void{
    if(this.feedbackPanel)return;const children:Phaser.GameObjects.GameObject[]=[];children.push(this.add.rectangle(270,480,540,960,0x05080b,.82).setInteractive(),this.add.rectangle(270,480,430,430,0x111a22,.99).setStrokeStyle(2,0x405668),this.add.text(270,304,"REPORTE RÁPIDO",{fontFamily:"system-ui",fontSize:"17px",fontStyle:"bold",color:"#f5f7fa"}).setOrigin(.5),this.add.text(270,334,"1 toque. Nota sólo si eliges OTRO.",{fontFamily:"system-ui",fontSize:"10px",color:"#8da0ad"}).setOrigin(.5));
    const choices:[string,BetaFeedbackCategory][]=[["BUG","bug"],["MUY FÁCIL","too-easy"],["MUY DIFÍCIL","too-hard"],["REPETITIVO","repetitive"],["OBJETO SOBRA","object"],["OTRO","other"]];
    choices.forEach(([label,category],i)=>{const x=170+(i%2)*200,y=392+Math.floor(i/2)*68,bg=this.add.rectangle(x,y,170,50,0x1a2731).setStrokeStyle(1,0x496173).setInteractive({useHandCursor:true});const t=this.add.text(x,y,label,{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:"#dfe9ef"}).setOrigin(.5);children.push(bg,t);bg.on("pointerup",()=>{void this.saveFeedback(category);});});
    children.push(this.add.text(270,632,"CERRAR",{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:"#8596a4"}).setOrigin(.5).setInteractive({useHandCursor:true}).on("pointerup",()=>this.closeFeedback()));this.feedbackPanel=this.add.container(0,0,children).setDepth(220);
  }
  private async saveFeedback(category:BetaFeedbackCategory):Promise<void>{
    const note=category==="other"?(window.prompt("Cuéntanos qué pasó","")??""):"";
    BetaFeedbackSystem.add({levelId:this.resultData.levelId,mode:this.resultData.mode,levelIndex:this.resultData.levelIndex,strokes:this.resultData.strokes,timeMs:this.resultData.timeMs},category,note);
    this.closeFeedback();
    const sent=await BetaTelemetry.submitReport({levelId:this.resultData.levelId,mode:this.resultData.mode,category,note,strokes:this.resultData.strokes,timeMs:this.resultData.timeMs});
    this.toast(sent?"✓ REPORTE ENVIADO":"✓ GUARDADO LOCAL · SIN RED",true);
  }
  private closeFeedback():void{this.feedbackPanel?.destroy(true);this.feedbackPanel=null;}

  private async openLeaderboard():Promise<void>{
    if(this.leaderboardPanel)return;const children:Phaser.GameObjects.GameObject[]=[];children.push(this.add.rectangle(270,480,540,960,0x05080b,.86).setInteractive(),this.add.rectangle(270,480,438,650,0x111a22,.99).setStrokeStyle(2,0x526878));
    children.push(this.add.text(270,192,`🏆 ${this.resultData.levelId.toUpperCase()}`,{fontFamily:"system-ui",fontSize:"18px",fontStyle:"bold",color:"#f1d07a"}).setOrigin(.5));const loading=this.add.text(270,480,"CARGANDO…",{fontFamily:"system-ui",fontSize:"12px",color:"#91a2af"}).setOrigin(.5);children.push(loading,this.add.text(270,776,"CERRAR",{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:"#8295a3"}).setOrigin(.5).setInteractive({useHandCursor:true}).on("pointerup",()=>this.closeLeaderboard()));this.leaderboardPanel=this.add.container(0,0,children).setDepth(320);
    await this.runUpload;const entries=await BetaTelemetry.leaderboard(this.resultData.levelId);if(!this.leaderboardPanel)return;loading.destroy();if(!entries.length){this.leaderboardPanel.add(this.add.text(270,470,"AÚN NO HAY MARCAS",{fontFamily:"system-ui",fontSize:"13px",fontStyle:"bold",color:"#91a2af"}).setOrigin(.5));return;}
    entries.slice(0,10).forEach((e,i)=>{const y=270+i*43,color=e.isYou?"#f1d07a":"#dce5eb";this.leaderboardPanel!.add(this.add.text(72,y,`${e.rank}. ${e.name}${e.isYou?" · TÚ":""}`,{fontFamily:"system-ui",fontSize:"11px",fontStyle:e.isYou?"bold":"normal",color}).setOrigin(0,.5));this.leaderboardPanel!.add(this.add.text(468,y,`${e.strokes} golpes · ${(e.timeMs/1000).toFixed(1)}s`,{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color}).setOrigin(1,.5));});
  }
  private closeLeaderboard():void{this.leaderboardPanel?.destroy(true);this.leaderboardPanel=null;}

  private allCurrentLevelsCompleted():boolean{return[...levelsForMode("classic"),...levelsForMode("troll")].every(level=>SaveSystem.record(level.id).completed);}
  private async openGameSurvey():Promise<void>{
    const rating=(label:string):number=>{const n=Number(window.prompt(`${label} (1–5)`,"4"));return Number.isInteger(n)&&n>=1&&n<=5?n:4;};
    await BetaTelemetry.submitGameFeedback({overallFun:rating("Diversión general"),controls:rating("Controles / game feel"),variety:rating("Variedad"),difficultyCurve:rating("Curva de dificultad"),hardMode:rating("Modo HARD"),wouldKeepPlaying:window.confirm("¿Jugarías otro bloque de 10 hoyos?"),favouriteLevel:window.prompt("Nivel favorito (opcional)","")??"",worstLevel:window.prompt("Peor nivel (opcional)","")??"",ideas:window.prompt("Ideas / cambios (opcional)","")??""});
  }
  private toast(message:string,ok:boolean):void{const t=this.add.text(270,166,message,{fontFamily:"system-ui",fontSize:"11px",fontStyle:"bold",color:ok?"#d9efde":"#f0c1b7",backgroundColor:ok?"#14231a":"#2b1715",padding:{x:12,y:7}}).setOrigin(.5).setDepth(350);this.tweens.add({targets:t,alpha:0,delay:700,duration:180,onComplete:()=>t.destroy()});}
}
